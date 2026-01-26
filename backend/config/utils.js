// const jwt=require("jsonwebtoken")
// const generateToken=(user,res)=>{
//       const token=jwt.sign({
//             id:user._id,email:user.email,role:user.role
//         },process.env.JWT_SECRET,
//         {expiresIn:"7d"})
    
//         res.cookie("jwt",token,{
//             maxAge: 7 * 24 * 60 * 60 * 1000,
//             httpOnly: true,
//             sameSite: "none",
//             // secure: process.env.NODE_ENV === "development"
//             secure: true,
//             path:"/"
//         })
//     // return token
// }
// module.exports=generateToken

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


// import axios from "axios";
// import { domainUrl } from "./constant";

// // const api = axios.create({
// //   baseURL: domainUrl,
// //   withCredentials: true, // Automatically send/receive cookies
// //   headers: { "Content-Type": "application/json" },
// // });

// // export default api;


// // import axios from 'axios';

// // Create your axios instance
// const api = axios.create({
//     baseURL: domainUrl,
//     withCredentials: true,
//     headers: { "Content-Type": "application/json" }, //  CRITICAL: This allows sending/receiving cookies
// });

// // Response Interceptor
// api.interceptors.response.use(
//     (response) => {
//         // If the request succeeds, just return the response
//         return response;
//     },
//     async (error) => {
//         const originalRequest = error.config;

//         // Check if error is 401 (Unauthorized) and we haven't retried yet
//         if (error.response.status === 401 && !originalRequest._retry) {
//             originalRequest._retry = true; // Mark this request as retried so we don't loop forever

//             try {
//                 // 1. Call the Refresh Endpoint
//                 // We don't need to pass data; cookies are sent automatically because of 'withCredentials: true'
//                 await api.post('/auth/refresh');

//                 // 2. If successful, retry the original request
//                 // The new cookies are already set by the browser automatically!
//                 return api(originalRequest);

//             } catch (refreshError) {
//                 // 3. If refresh fails (e.g., token expired after 7 days), force logout
//                 console.log("Session expired completely.");
//                 window.location.href = "/login"; // Redirect to login page
//                 return Promise.reject(refreshError);
//             }
//         }

//         return Promise.reject(error);
//     }
// );

// export default api;