const mongoose = require("mongoose");

const tempUpdateSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        unique: true 
    },
    otp: { type: String, required: true },
    newEmail: { type: String, required: true },
    newUsername: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: '10m' } // TTL: Data expires after 10 minutes
});

module.exports = mongoose.model("TempUpdate", tempUpdateSchema);