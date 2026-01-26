const User = require('../models/User');
const Otp = require('../models/Otp');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Import your existing configs
const { EMAIL_CONFIG, OTP_SETTINGS, EMAIL_TEMPLATE } = require('../config/otp');

const transporter = nodemailer.createTransport(EMAIL_CONFIG);

// Helper: Generate OTP
const generateOTP = () => {
    const min = Math.pow(10, OTP_SETTINGS.LENGTH - 1);
    const max = Math.pow(10, OTP_SETTINGS.LENGTH) - 1;
    return crypto.randomInt(min, max).toString();
};

/**
 * Step 1: Request Password Reset
 * POST /api/auth/forgot-password
 * Body: { email }
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // 1. Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            // Security: Don't reveal if user exists, but for UI flow we might need to return 404
            // or just say "If email exists, OTP sent."
            return res.status(404).json({ message: "User with this email does not exist." });
        }

        // 2. Generate and Save OTP
        const otpCode = generateOTP();
        
        await Otp.findOneAndUpdate(
            { email },
            { otp: otpCode, createdAt: Date.now() },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // 3. Send Email
        const mailOptions = {
            from: EMAIL_CONFIG.auth.user,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <h3>Password Reset Request</h3>
                <p>Use the code below to reset your password. It expires in 5 minutes.</p>
                <h1 style="background: #eee; padding: 10px; width: fit-content;">${otpCode}</h1>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "OTP sent to your email." });

    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ message: "Error sending OTP" });
    }
};

/**
 * Step 2: Verify OTP for Reset
 * POST /api/auth/verify-reset-otp
 * Body: { email, otp }
 */
const verifyResetOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // 1. Validate OTP
        const otpRecord = await Otp.findOneAndDelete({ email, otp });

        if (!otpRecord) {
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }

        // 2. Generate a temporary "Reset Token"
        // This token allows the user to perform the password change in the next step.
        // It expires quickly (e.g., 5-10 minutes) so it can't be reused later.
        const resetToken = jwt.sign(
            { email: email, purpose: 'password_reset' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '10m' }
        );
        res.cookie("reset_token", resetToken, {
            maxAge: 10 * 60 * 1000, // 10 minutes in milliseconds
            httpOnly: true,         // Prevent JS access (XSS protection)
            sameSite: "none",       // Match your login config (needed for cross-site/dev tunnels)
            secure: true,           // Always use secure for consistency
            path: "/"               // Available across the site
        });

        // 3. Return the token to the frontend
        res.status(200).json({ 
            message: "OTP Verified. You may now reset your password."
           // Frontend must store this to send in Step 3
        });

    } catch (err) {
        console.error("Verify Reset OTP Error:", err);
        res.status(500).json({ message: "Error verifying OTP" });
    }
};

/**
 * Step 3: Reset Password
 * POST /api/auth/reset-password
 * Body: { newPassword, resetToken }
 */
const resetPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const resetToken = req.cookies.reset_token;
        if (!resetToken) {
            return res.status(401).json({ message: "Unauthorized. Missing reset token." });
        }

        // 1. Verify the Reset Token
        let decoded;
        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        } catch (e) {
            return res.status(401).json({ message: "Invalid or expired reset token." });
        }

        // Ensure token is for reset purpose
        if (decoded.purpose !== 'password_reset') {
             return res.status(401).json({ message: "Invalid token type." });
        }

        const email = decoded.email;

        // 2. Hash the New Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 3. Update User Password in DB
        await User.findOneAndUpdate(
            { email: email },
            { password: hashedPassword }
        );

        res.clearCookie("reset_token", {
            httpOnly: true,
            sameSite: "none",
            secure: true
        });

        res.status(200).json({ message: "Password reset successfully. You can now login." });

    } catch (err) {
        console.error("Reset Password Error:", err);
        res.status(500).json({ message: "Error resetting password" });
    }
};

module.exports = { forgotPassword, verifyResetOtp, resetPassword };