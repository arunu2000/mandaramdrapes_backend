const jwt = require("jsonwebtoken");
const User = require('../models/User'); // Assuming your User model is here
const crypto = require('crypto'); // We'll use this for better refresh token security

// Helper to generate a strong, random refresh token value
const generateRefreshTokenValue = () => {
    return crypto.randomBytes(32).toString('hex'); // 64 character long random string
};

const generateToken = async (user, res) => {
    // --- 1. ACCESS TOKEN (Short-Lived) ---
    // Set expiry much shorter (e.g., 15 minutes) for security
    const accessToken = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "15m" } 
    );
    
    // --- 2. REFRESH TOKEN (Long-Lived) ---
    const refreshTokenValue = generateRefreshTokenValue();
    
    // Sign the Refresh Token with its own, longer expiry (e.g., 7 days)
    const refreshToken = jwt.sign(
        { id: user._id, tokenValue: refreshTokenValue },
        process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET, // Use a separate secret if possible
        { expiresIn: "7d" }
    );

    // --- 3. DATABASE UPDATE (Store Refresh Token) ---
    // Update the user document with the new Refresh Token
    try {
        await User.findByIdAndUpdate(user._id, { 
            refreshToken: refreshTokenValue, // Store the random value, not the signed JWT, for easy revocation
            // Optionally, you could hash this value before saving for extra security
        });
    } catch (dbErr) {
        console.error("Failed to save refresh token to DB:", dbErr);
        throw new Error("Token Storage Failed");
        // Handle error gracefully if DB fails
    }

    // --- 4. SET COOKIES ---
    
    // Access Token Cookie (The 'jwt' cookie)
    res.cookie("jwt", accessToken, {
        maxAge: 15 * 60 * 1000, // 15 minutes
        httpOnly: true,
        sameSite: "none",
        secure: true,
        path: "/",
    });
    
    // Refresh Token Cookie (New separate cookie)
    res.cookie("refreshToken", refreshToken, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (Matches token expiry)
        httpOnly: true,
        sameSite: "none",
        secure: true,
        path: "/api/auth/refresh", // 💡 CRITICAL: Restrict the path only to the refresh endpoint
    });
    
    // return accessToken; // Typically you don't return the token if using cookies
};

module.exports = generateToken;

