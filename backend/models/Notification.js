const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    recipientRole: { 
        type: String, 
        enum: ["admin", "customer"], 
        required: true 
    },
    type: { 
        type: String, 
        enum: ["NEW_ORDER", "ORDER_UPDATE", "PAYMENT_FAILED"],
        required: true 
    },
    isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);