const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const crypto = require("crypto");
const razorpayInstance= require("../config/razorpay");
const Address = require("../models/Address");
const Notification = require("../models/Notification");
const User = require("../models/User");


const triggerNotification = async (req, order, message, type, actorId, recipientId = null, role = "admin") => {
    try {
        console.log("Triggering notification:", message);
        // 1. Persist to Database
        const newNotif = await Notification.create({
            message,
            orderId: order._id,
            type,
            triggeredBy: actorId,
            recipient: recipientId,
            recipientRole: role
        });

        // Populate 'triggeredBy' before emitting so the frontend gets the name immediately
        const populatedNotif = await newNotif.populate("triggeredBy", "username email");

        // 2. Broadcast via Socket.io
        const io = req.app.get("socketio");
        if (io) {
            if (role === "admin") {
                io.to("admin-room").emit("admin-notification", populatedNotif);
            } else {
                // Emit to a private room named after the User's ID
                io.to(recipientId.toString()).emit("user-notification", populatedNotif);
            }
        }
    } catch (err) {
        console.error("Notification Error:", err.message);
    }
};


// --- INTERNAL HELPER FUNCTION ---
const updateStockAfterOrder = async (orderItems) => {
    for (const item of orderItems) {
        const result = await Product.findOneAndUpdate(
            { _id: item.product, stock: { $gte: item.quantity } }, 
            { $inc: { stock: -item.quantity } },
            { new: true }
        );
        
        if (!result) {
            throw new Error(`Insufficient stock for one of the items.`);
        }
    }
}

const WAREHOUSE_COORDS = { lat: 9.9312, lng: 76.2673 }; // Example: Kochi, Kerala
const BASE_SHIPPING_LOCAL = 50;  // Flat fee up to 10km
const PER_KM_CHARGE = 5;         // Extra per KM after 10km
const STATE_FLAT_RATE = 150;     // Different state but same country
const GLOBAL_FLAT_RATE = 1500;   // International shipping

// --- HELPER: CALCULATE RADIUS (Haversine Formula) ---
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in KM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in KM
};

// orderController.js
const preCheckout = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await Cart.findOne({ user: userId }).populate("items.product");

        if (!cart || cart.items.length === 0) return res.status(400).json({ message: "Cart is empty" });

        // Filter out items that are out of stock
        const validItems = cart.items.filter(item => item.product.stock >= item.quantity);
        const outOfStockCount = cart.items.length - validItems.length;

        if (validItems.length === 0) {
            return res.status(400).json({ message: "All items in your cart are currently out of stock." });
        }

        if (outOfStockCount > 0) {
            // Update the cart in DB to remove out-of-stock items
            cart.items = validItems;
            await cart.save();
            
            return res.status(200).json({ 
                message: "Some items were out of stock and removed. Proceeding with available items.",
                redirect: true 
            });
        }

        res.status(200).json({ message: "Proceed to address selection", redirect: true });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};


const placeOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await Cart.findOne({ user: userId }).populate("items.product");
        const address = await Address.findOne({ user: userId });

        if (!cart || cart.items.length === 0) return res.status(400).json({ message: "Cart is empty" });
        if (!address) return res.status(400).json({ message: "Delivery address missing" });

        // 1. Calculate Product Subtotal
        let subtotal = 0;
        const orderItems = cart.items.map((item) => {
            subtotal += item.product.price * item.quantity;
            return { product: item.product._id, quantity: item.quantity, price: item.product.price };
        });

        // 2. RE-CALCULATE SHIPPING (Security: Backend calculation only)
        const [lng, lat] = address.location.coordinates;
        const distance = calculateDistance(WAREHOUSE_COORDS.lat, WAREHOUSE_COORDS.lng, lat, lng);
        
        let shippingCharge = 0;
        if (address.country !== "India") shippingCharge = GLOBAL_FLAT_RATE;
        else if (address.state !== "Kerala") shippingCharge = STATE_FLAT_RATE;
        else {
            shippingCharge = distance <= 10 ? BASE_SHIPPING_LOCAL : BASE_SHIPPING_LOCAL + (Math.round(distance - 10) * PER_KM_CHARGE);
        }

        const finalAmount = subtotal + shippingCharge;

        // 3. Create Razorpay Order with FINAL TOTAL (Subtotal + Shipping)
        const rzpOrder = await razorpayInstance.orders.create({
            amount: Math.round(finalAmount * 100), // In Paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });

        // 4. Save to DB
        const order = new Order({
            user: userId,
            items: orderItems,
            totalAmount: subtotal,
            shippingCharge, // Make sure your Model has this field!
            finalAmount,    // Make sure your Model has this field!
            orderStatus: "Processing",
            razorpayOrderId: rzpOrder.id,
            paymentStatus: "Pending"
        });

        await order.save();
        await updateStockAfterOrder(orderItems); // Temporary lock
        // Fetch user name for the message
        const user = await User.findById(userId); 
        const orderIdShort = order._id.toString().slice(-6);

        // 1. Notify Admin
        await triggerNotification(req, order, `New Order from ${user.username}: ₹${order.finalAmount}`, "NEW_ORDER", userId, null, "admin");
        
        // 2. Notify Customer
        await triggerNotification(req, order, `Your order #${orderIdShort} has been initiated. Proceed to payment.`, "NEW_ORDER", userId, userId, "customer");
        res.status(200).json({ order, rzpOrder });
    } catch (err) {
        res.status(500).json({ message: "Error initiating order", error: err.message });
    }
};


const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const userId = req.user.id
        // 1. Create the expected signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");
        console.log("Expected Signature:", expectedSignature);
        // 2. Compare signatures
        const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });

        if (expectedSignature === razorpay_signature) {
            order.paymentStatus = "Paid";
            order.orderStatus = "Confirmed";
            await order.save();
            await Cart.findOneAndDelete({ user: req.user.id });

            // Professional Notification
            const user = await User.findById(req.user.id);
            // Admin Notification
            await triggerNotification(req, order, `Payment Confirmed: Order #${orderIdShort} by ${user.username}`, "NEW_ORDER", userId, null, "admin");
            
            // Customer Notification
            await triggerNotification(req, order, `Success! Payment confirmed for order #${orderIdShort}`, "NEW_ORDER", userId, userId, "customer");
            res.status(200).json({ message: "Success", order });
        } else {
            order.paymentStatus = "Failed";
            await order.save();
            const user = await User.findById(req.user.id);
            // Admin Notification
            await triggerNotification(req, order, `ALERT: Payment Failed for ${user.username} (#${orderIdShort})`, "PAYMENT_FAILED", userId, null, "admin");

            // Customer Notification
            await triggerNotification(req, order, `Payment failed for order #${orderIdShort}. Please contact support.`, "PAYMENT_FAILED", userId, userId, "customer");
        }
    } catch (err) {
        res.status(500).json({ message: "Verification Error" });
    }
};

const placeOrderPOD = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await Cart.findOne({ user: userId }).populate("items.product");
        const address = await Address.findOne({ user: userId });

        if (!cart || cart.items.length === 0) return res.status(400).json({ message: "Cart is empty" });
        if (!address) return res.status(400).json({ message: "Delivery address missing" });

        // 1. Calculate Product Subtotal
        let subtotal = 0;
        const orderItems = cart.items.map((item) => {
            subtotal += item.product.price * item.quantity;
            return { product: item.product._id, quantity: item.quantity, price: item.product.price };
        });

        // 2. Re-calculate Shipping (Safety check)
        const [lng, lat] = address.location.coordinates;
        const distance = calculateDistance(WAREHOUSE_COORDS.lat, WAREHOUSE_COORDS.lng, lat, lng);
        
        let shippingCharge = 0;
        if (address.country !== "India") {
            return res.status(400).json({ message: "Pay on Delivery is not available for international orders." });
        } else if (address.state !== "Kerala") {
            shippingCharge = 150;
        } else {
            shippingCharge = distance <= 10 ? 50 : 50 + (Math.round(distance - 10) * 5);
        }

        const finalAmount = subtotal + shippingCharge;

        // 3. Create Order for POD
        const order = new Order({
            user: userId,
            items: orderItems,
            totalAmount: subtotal,
            shippingCharge,
            finalAmount,
            paymentMethod: "POD", // Add this field to your Schema
            paymentStatus: "Pending", // Because cash isn't collected yet
            orderStatus: "Confirmed",
            razorpayOrderId: `pod_${Date.now()}` // Filler ID to satisfy Schema 'required'
        });

        await order.save();

        // 4. Atomic Stock Deduction
        await updateStockAfterOrder(orderItems);
        const user = await User.findById(userId);
        const msg = `New POD Order from ${user.username}: ₹${order.finalAmount}`;
        await triggerNotification(req, order, msg, "NEW_ORDER", userId);

        // 5. Clear Cart
        await Cart.findOneAndDelete({ user: userId });

        res.status(200).json({ message: "Order placed successfully via POD", order });
    } catch (err) {
        res.status(500).json({ message: "Error placing POD order", error: err.message });
    }
};
// Add to orderController.js
const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order || order.paymentStatus === "Paid") return res.status(400).json({ message: "Invalid request" });

        // Restore Stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
        }

        order.orderStatus = "Cancelled";
        await order.save();

        res.status(200).json({ message: "Stock restored" });
    } catch (err) {
        res.status(500).json({ message: "Cancel error" });
    }
};

const getOrders = async (req, res) => {
    try {
        console.log("my orders called");
        const userid = req.user.id;
        const orders = await Order.find({ user: userid })
            .populate({ path: "items.product", select: "name image price" })
            .sort({ createdAt: -1 });
        res.status(200).json({ message: "Orders Fetched successfully", order: orders });
    } catch (err) {
        console.log("Error in Fetching orders", err.message);
        res.status(500).json({ message: "Error in fetching orders" });
    }
};

const getOrdersForAdmin = async (req, res) => {
    try {
        console.log("get orders for admin called");
        const orders = await Order.find({})
            .populate("user", "username email")
            .populate({ path: "items.product", select: "name price image" })
            .sort({ createdAt: -1 });
        res.status(200).json({ message: "Orders fetched for Admin", order: orders });
    } catch (err) {
        console.log("Error in fetching Orders for admin", err.message);
        res.status(500).json({ message: "Error in fetching Orders for admin" });
    }
};



const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderStatus } = req.body;
        const adminId = req.user.id;

        // 1. Find the existing order first to see its current items and status
        const order = await Order.findById(id);
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // 2. 🚀 STOCK RESTORE LOGIC
        // If the order is being changed TO "Cancelled", and it wasn't already cancelled
        if (orderStatus === "Cancelled" && order.orderStatus !== "Cancelled") {
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: item.quantity } // Increase stock back
                });
            }
            console.log(`Stock restored for cancelled order: ${id}`);
        } 
        
        // 3. Prevent restocked items from being deducted again if status changes back
        // (Optional: Logic to handle moving from Cancelled -> Processing if needed)

        // 4. Update the order status in the database
        const updatedOrder = await Order.findByIdAndUpdate(
            id, 
            { orderStatus }, 
            { new: true }
        );
        if (!updatedOrder) {
            return res.status(400).json({ message: "Order status not found to update" });
        }

        // A. Save Notification to Database
        const adminUser = await User.findById(adminId);
        
        const orderIdShort = id.slice(-6);

        // 1. Notify Admins (So other admins see who changed it)
        await triggerNotification(req, updatedOrder, `Admin ${adminUser.username} updated Order #${orderIdShort} to ${orderStatus}`, "ORDER_UPDATE", adminId, null, "admin");

        // 2. Notify Customer (The most important one for the bell icon)
        await triggerNotification(req, updatedOrder, `Your order #${orderIdShort} status has been updated to: ${orderStatus}`, "ORDER_UPDATE", adminId, updatedOrder.user, "customer");

        res.status(200).json({ 
            message: `Order status updated to ${orderStatus} Successfully`, 
            order: updatedOrder 
        });

    } catch (err) {
        console.log("Error in Updating order status", err.message);
        res.status(500).json({ message: "Error in Updating order status" });
    }
};
module.exports = { preCheckout, placeOrder, getOrders, getOrdersForAdmin, updateStatus, verifyPayment ,cancelOrder,placeOrderPOD};