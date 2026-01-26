const Notification = require("../models/Notification");

/**
 * Fetches the latest 30 notifications for the Admin.
 * Populates 'triggeredBy' to show which customer or admin performed the action.
 * Populates 'orderId' to provide direct access to order details if needed.
 */
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipientRole: "admin" })
            .populate("triggeredBy", "username email") // Fetch name and email of the actor
            .populate("orderId", "finalAmount orderStatus") // Fetch basic order info
            .sort({ createdAt: -1 }) // Latest first
            .limit(30);

        res.status(200).json(notifications);
    } catch (err) {
        console.error("Error fetching notifications:", err.message);
        res.status(500).json({ message: "Error fetching notification history" });
    }
};

const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id; // From authMiddleware

        const notifications = await Notification.find({ 
            recipient: userId, 
            recipientRole: "customer" 
        })
        .sort({ createdAt: -1 })
        .limit(20);

        res.status(200).json(notifications);
    } catch (err) {
        res.status(500).json({ message: "Error fetching your notifications" });
    }
};


module.exports = { getNotifications, getUserNotifications };