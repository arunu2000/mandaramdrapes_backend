const mongoose = require('mongoose');
const TempUpdate = require('../models/TempUpdate');
const nodemailer = require('nodemailer');
const User = require("../models/User");
const crypto = require('crypto');
const { EMAIL_CONFIG, EMAIL_TEMPLATE,OTP_SETTINGS, } = require('../config/otp'); 
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

// Helper: Generate OTP
const generateOTP = () => {
    const min = Math.pow(10, OTP_SETTINGS.LENGTH - 1);
    const max = Math.pow(10, OTP_SETTINGS.LENGTH) - 1;
    return crypto.randomInt(min, max).toString();
};

const requestProfileUpdate = async (req, res) => {
    try {
        console.log("Request Profile Update Called");   
        const userId = req.user.id;
        const { newEmail, newUsername } = req.body;

        // 1. Basic Validation
        if (!newEmail || !newUsername) {
            return res.status(400).json({ message: "New email and username are required." });
        }

        // 2. Check if new email is already in use by another user
        const existingUser = await User.findOne({ email: newEmail, _id: { $ne: userId } });
        if (existingUser) {
            return res.status(400).json({ message: "This email is already taken by another account." });
        }

        // 3. Generate OTP
        const otpCode = generateOTP();

        // 4. Save/Update temporary data and OTP in the NEW TempUpdate Model
        await TempUpdate.findOneAndUpdate(
            { userId },
            { 
                otp: otpCode,
                newEmail,
                newUsername,
                createdAt: Date.now() 
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // 5. Send OTP to the NEW EMAIL
        const mailOptions = {
            from: EMAIL_CONFIG.auth.user,
            to: newEmail, // Sending to the new email
            subject: 'Verify Your New Email Address',
            ...EMAIL_TEMPLATE(otpCode)
        };
        await transporter.sendMail(mailOptions);

        res.status(200).json({ 
            message: `OTP sent to your new email (${newEmail}). Please verify to complete the update.` 
        });

    } catch (err) {
        console.error("Request Profile Update Error:", err);
        res.status(500).json({ message: "Error initiating profile update" });
    }
};

// Requires TempUpdate model
/**
 * POST /api/auth/profile/verify-update
 * POST /api/auth/adminProfile/verify-update
 */
const verifyAndUpdateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { otp } = req.body;

        // 1. Find and Delete the temporary record based on OTP and user ID
        const tempRecord = await TempUpdate.findOneAndDelete({
            userId,
            otp: otp 
            // Note: TTL index on TempUpdate model handles expiration
        });

        if (!tempRecord) {
            return res.status(401).json({ message: "Invalid or expired OTP." });
        }

        // 2. Perform Final Update on User Model
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { 
                email: tempRecord.newEmail,
                username: tempRecord.newUsername 
            },
            { new: true, runValidators: true }
        ).select('username email role'); // Select updated fields

        if (!updatedUser) {
             return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json({ 
            message: "Profile updated successfully.", 
            user: updatedUser 
        });

    } catch (err) {
        // Handle MongoDB unique constraint errors (e.g., if new email was somehow taken in between steps)
        if (err.code === 11000) {
            return res.status(400).json({ message: "The new email address is already in use." });
        }
        console.error("Verify and Update Profile Error:", err);
        res.status(500).json({ message: "Error updating profile." });
    }
};

module.exports = {
    requestProfileUpdate,
    verifyAndUpdateProfile
};