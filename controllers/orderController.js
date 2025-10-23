const Cart=require("../models/Cart")
const Order=require("../models/Order")
const placeOrder=async(req,res)=>{
    try{
        const userId=req.user.id
        const cart=await Cart.findOne({user:userId}).populate("items.product")
        if(!cart || cart.items.length===0){
            return res.status(400).json({message:"Cart is empty"})
        }

        let totalAmount=0
        for(const item of cart.items){
            const price=item.product.price
            totalAmount+=price*item.quantity
        }

        const order= new Order({
            user:userId,
            items:cart.items.map((item)=>({
                product:item.product._id,
                quantity:item.quantity,
                price:item.product.price
            })),
            totalAmount,
            paymentStatus:"Pending",
            orderStatus:"Processing"

        })
        await order.save()
        res.status(200).json({message:"Order created successfully",order})
    }
    catch(err){
        console.log("Error in order creatinig",err.message)
        res.status(500).json({message:"Error in order creating"})
    }
}

const getOrders=async(req,res)=>{
    try{
        const userid=req.user.id
        const orders=await Order.findOne({user:userid}).populate("items.product")
        res.status(200).json({message:"Orders Fetched successfully",order:orders})
    }
    catch(err){
        console.log("Error in Fetching orders",err.message)
        res.status(500).json({message:"Error in fetching orders"})
    }
}

const getOrdersForAdmin=async(req,res)=>{
    try{
        const userId=req.user.id
        const orders=await Order.findOne({user:userId}).populate("user", "name email")
        res.status(200).json({message:"Orders fetched for Admin",order:orders})
    }
    catch(err){
        console.log("Error in fetching Orders for admin",err.message)
        res.status(500).json({message:"Error in fetching Orders for admin"})
    }
}

const updateStatus=async(req,res)=>{
    try{
        const {id}=req.params
        const {paymentStatus,orderStatus}=req.body
        const updatedOrder=await Order.findByIdAndUpdate(id,{paymentStatus,orderStatus},{new:true})
        if(!updatedOrder){
            return res.status(400).json({message:"Order status not found to update"})
        }
        res.status(200).json({message:"Order status updated Successfully",order:updatedOrder})
    }
    catch(err){
        console.log("Error in Updating order status",err.message)
        res.status(500).json({message:"Error in Updating order status"})
    }
}

module.exports={placeOrder,getOrders,getOrdersForAdmin,updateStatus}