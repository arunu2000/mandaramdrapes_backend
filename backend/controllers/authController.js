const User=require("../models/User")
const bcrypt= require("bcrypt")
const jwt=require("jsonwebtoken")
const generateToken = require("../config/utils")
const Otp = require('../models/Otp'); 
const nodemailer = require('nodemailer');
const crypto = require('crypto');
// Import your existing configs
const { EMAIL_CONFIG, OTP_SETTINGS, EMAIL_TEMPLATE } = require('../config/otp'); 

// Initialize Transporter
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

// Helper: Generate OTP (Same as your existing logic)
const generateOTP = () => {
    const min = Math.pow(10, OTP_SETTINGS.LENGTH - 1);
    const max = Math.pow(10, OTP_SETTINGS.LENGTH) - 1;
    return crypto.randomInt(min, max).toString();
};

const signup =async (req, res) => {
    
        try {
            console.log("signup called")
            const { username, email, phone,password } = req.body;
            const duplicate = await User.findOne({
                $or:[
                    {email},
                    {phone}
                ]
            });
            if (duplicate) return res.status(400).json({ Error: "Email or phone already exist" });
            const salt=await bcrypt.genSalt(10)
            const hashedPassword=await bcrypt.hash(password,salt)
            const adminExist=await User.findOne({role:"admin"})
            if(!adminExist){
                const AdminUser = new User({ username, email, phone, password: hashedPassword, role: "admin" });
                await AdminUser.save();
                await generateToken(AdminUser,res)
                
                return res.status(201).json({ message: "Admin User created successfully", AdminUser });
            }
            
            const user = new User({ username, email, phone,password:hashedPassword });
            await user.save();
            await generateToken(user,res)
            return res.status(201).json({ message: "User created successfully",user });
        } catch (err) {
            return res.status(500).json({ Error: "Server error", details: err.message });
        }
    }



const logout = async (req, res) => {
    try {
        // 1. Get user ID from the request (attached by your auth middleware)
        const userId = req.user?.id; 

        if (userId) {
            // 2. INVALIDATE in Database
            // This ensures that even if the cookie isn't cleared, it's useless
            await User.findByIdAndUpdate(userId, { refreshToken: null });
        }

        // 3. Clear the Access Token Cookie
        res.clearCookie("jwt", {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            path: "/" // Ensure path matches where it was set
        });

        // 4. Clear the Refresh Token Cookie
        res.clearCookie("refreshToken", {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            path: "/api/auth/refresh" // MUST match the restricted path in generateToken
        });

        res.status(200).json({ message: "Logout Successful" });
    }
    catch (err) {
        console.log("Error during logout", err.message);
        res.status(500).json({ message: "Error during logout" });
    }
}

const login = async (req, res) => {
    try {
        console.log("Login Step 1 called");
        const { email, password } = req.body;

        // 1. Validate User Exists
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        // 2. Validate Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Password mismatched" });
        }

        // --- CHANGE STARTS HERE ---
        // Instead of generating token, we generate & send OTP
        await Otp.findOneAndDelete({ email });
        // 3. Generate OTP
        const otpCode = generateOTP();

        // 4. Save/Update OTP in Database
        // await Otp.findOneAndUpdate(
        //     { email }, 
        //     { otp: otpCode, createdAt: Date.now() }, 
        //     { upsert: true, new: true, setDefaultsOnInsert: true } 
        // );

        await Otp.create({
            email,
            otp: otpCode,
            createdAt: Date.now() // Resets the TTL countdown
        });

        // 5. Send Email
        const mailOptions = {
            from: EMAIL_CONFIG.auth.user, 
            to: email,
            ...EMAIL_TEMPLATE(otpCode), 
        };

        await transporter.sendMail(mailOptions);

        // 6. Return response telling frontend to move to Step 2
        res.status(200).json({
            message: "Credentials verified. OTP sent to your email.",
            step: "VERIFY_OTP", // Flag for frontend to show OTP input
            email: email // Send back email so frontend knows who to verify
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "Error occurred", details: err.message });
    }
};



/**
 * POST /api/auth/refresh
 * Endpoint to generate a new Access Token using the Refresh Token.
 */
const refreshTokens = async (req, res) => {
    // 1. Get Refresh Token from the restricted cookie
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token not provided." });
    }

    try {
        // 2. Verify the Refresh Token
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        
        const userId = decoded.id;
        const tokenValue = decoded.tokenValue; // The random value we saved to the DB

        // 3. Look up user and validate the token against the DB
        const user = await User.findById(userId);

        if (!user || user.refreshToken !== tokenValue) {
            // Token is revoked, invalid, or mismatched. Clear cookies.
            res.clearCookie('jwt');
            res.clearCookie('refreshToken');
            return res.status(403).json({ message: "Invalid or revoked refresh token." });
        }

        // 4. Generate NEW tokens (Access and Refresh)
        // This function handles creation, DB storage, and setting the cookies.
        await generateToken(user, res); 
        
        // 5. Success response
        res.status(200).json({ message: "Access token refreshed successfully." });

    } catch (err) {
        // Handle JWT expiration or signature mismatch
        res.clearCookie('jwt');
        res.clearCookie('refreshToken');
        return res.status(403).json({ message: "Invalid or expired refresh token. Please log in again." });
    }
};


const resendOtp = async (req, res) => {
    try {
        console.log("Resend OTP called");
        const { email } = req.body;

        // 1. Validate User Exists (Critical check for security/lookup)
        const user = await User.findOne({ email });
        if (!user) {
            // Send a generic success message even if user isn't found 
            // to avoid revealing which emails are registered.
            return res.status(200).json({ message: "If registered, OTP has been sent." });
        }

        // --- OTP GENERATION LOGIC (Copied from 'login') ---
        
        // 2. Clear old OTP record
        await Otp.findOneAndDelete({ email });
        
        // 3. Generate New OTP
        const otpCode = generateOTP();

        // 4. Create new OTP record (resets TTL)
        await Otp.create({
            email,
            otp: otpCode,
            createdAt: Date.now()
        });

        // 5. Send Email
        const mailOptions = {
            from: EMAIL_CONFIG.auth.user, 
            to: email,
            ...EMAIL_TEMPLATE(otpCode), 
        };

        await transporter.sendMail(mailOptions);

        // 6. Return success
        res.status(200).json({
            message: "New verification code sent to your email.",
            email: email
        });

    } catch (err) {
        console.error("Resend OTP Error:", err);
        res.status(500).json({ error: "Error occurred during resend", details: err.message });
    }
};

module.exports={signup,login,logout,resendOtp,refreshTokens}