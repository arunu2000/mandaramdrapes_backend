const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Otp = require('../models/Otp');     
const User = require('../models/User'); // Assuming you have a User model for lookup
const { EMAIL_CONFIG, OTP_SETTINGS, EMAIL_TEMPLATE } = require('../config/otp'); 
const generateToken = require("../config/utils")

// 1. Initialize Nodemailer Transporter
// const transporter = nodemailer.createTransport(EMAIL_CONFIG);

// // Helper to generate a numerical OTP based on configured length
// const generateOTP = () => {
//     // Dynamically calculate min and max based on the configured length (e.g., 6 digits: 100000 to 999999)
//     const min = Math.pow(10, OTP_SETTINGS.LENGTH - 1);
//     const max = Math.pow(10, OTP_SETTINGS.LENGTH) - 1;
//     return crypto.randomInt(min, max).toString();
// };

// /**
//  * Handles the request to send an OTP to a user's email.
//  * POST /api/otp/send
//  */
// const sendOtp = async (req, res) => {
//     try {
//         console.log("sendOtp called")
//         const { email } = req.body;
        
//         // 1. Check if the user exists (Important for login/auth flow)
//         const user = await User.findOne({ email });
//         if (!user) {
//             // Use a generic failure message to avoid revealing whether an email exists in the system
//             return res.status(401).json({ message: "User has to sign up first" });
//         }

//         // 2. Generate and store/overwrite the OTP
//         const otpCode = generateOTP();

//         // findOneAndUpdate with upsert=true: 
//         // - Overwrites the existing document, resetting the TTL (`createdAt: Date.now()`).
//         // - Creates a new document if the email isn't found.
//         await Otp.findOneAndUpdate(
//             { email }, 
//             { otp: otpCode, createdAt: Date.now() }, // Resetting createdAt resets the 5-min timer
//             { upsert: true, new: true, setDefaultsOnInsert: true } 
//         );

//         // 3. Send the email
//         const mailOptions = {
//             from: EMAIL_CONFIG.auth.user, 
//             to: email,
//             ...EMAIL_TEMPLATE(otpCode), // Use the template for subject and HTML body
//         };

//         await transporter.sendMail(mailOptions);

//         res.status(200).json({ 
//             message: `Verification code sent to ${email}. Valid for ${OTP_SETTINGS.EXPIRY_MINUTES} minutes.` 
//         });

//     } catch (error) {
//         console.error("Error sending OTP:", error);
//         res.status(500).json({ message: "Failed to send OTP. Check server configuration." });
//     }
// };

/**
 * Handles the verification of the received OTP.
 * POST /api/otp/verify
 */
// const verifyOtp = async (req, res) => {
//     try {
//         console.log("verify otp called")
//         const { email, otp } = req.body;
        
//         // Use findOneAndDelete:
//         // 1. Tries to find the record matching both email AND the provided otp.
//         // 2. The TTL index handles expiration automatically: if the code is too old, it returns null.
//         // 3. If found, it immediately deletes the document (preventing code reuse).
//         const otpRecord = await Otp.findOneAndDelete({ 
//             email, 
//             otp 
//         });

//         if (otpRecord) {
//             // SUCCESS: Code matched and was valid.
            
//             // --- NEXT STEP: AUTHENTICATION ---
//             const user = await User.findOne({ email });
//             generateToken(user, res); // Call your token generation function here
//             // ---------------------------------
            
//             return res.status(200).json({ 
//                 message: "Verification successful! User is now authenticated." 
//             });
//         } else {
//             // FAILURE: Code was either incorrect OR expired (deleted by TTL).
//             return res.status(401).json({ message: "Invalid or expired verification code." });
//         }

//     } catch (error) {
//         console.error("Error verifying OTP:", error);
//         res.status(500).json({ message: "Server error during verification." });
//     }
// };

const verifyLoginOtp = async (req, res) => {
    try {
        console.log("Login Step 2 (Verify OTP) called");
        const { email, otp } = req.body;

        // 1. Find and Delete OTP (Prevent reuse)
        const otpRecord = await Otp.findOneAndDelete({ email, otp });

        if (otpRecord) {
            // --- SUCCESS: OTP IS VALID ---
            
            // 2. Find User to get Role/ID for Token
            const user = await User.findOne({ email });
            
            if (!user) {
                return res.status(400).json({ message: "User record not found." });
            }

            // 3. Generate JWT Token (Logs the user in)
            await generateToken(user, res);
            
            return res.status(200).json({ 
                message: "Logged in successfully", 
                role: user.role 
            });

        } else {
            // --- FAILURE ---
            return res.status(401).json({ message: "Invalid or expired OTP." });
        }

    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ message: "Server error during verification." });
    }
};

module.exports = { verifyLoginOtp };