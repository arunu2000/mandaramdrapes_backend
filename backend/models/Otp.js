const mongoose = require('mongoose');

// Assuming you'll require this in your main server file before connecting to the DB
const { OTP_SETTINGS } = require('../config/otp'); 

const OtpSchema = new mongoose.Schema({
    // Store the recipient's email
    email: { 
        type: String, 
        required: true, 
        index: true,
        unique: true // Ensure only one active OTP per email address
    },
    
    // The generated 6-digit OTP code
    otp: {
        type: String,
        required: true,
    },

    // Timestamp when the document was created. 
    // This field triggers the MongoDB TTL index.
    createdAt: {
        type: Date,
        default: Date.now,
        required: true,
        // Calculate expiry in seconds based on the configured minutes.
        // MongoDB will automatically delete this document after this duration.
        expires: OTP_SETTINGS.EXPIRY_MINUTES * 60, 
    },
});

const Otp = mongoose.model('Otp', OtpSchema);

module.exports = Otp;