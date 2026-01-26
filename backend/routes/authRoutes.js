const express=require("express")
const {signup, logout, resendOtp, refreshTokens} = require("../controllers/authController");
const {login}=require("../controllers/authController");
const { verifyLoginOtp } = require("../controllers/otpController");
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware"); // <-- NEW IMPORT
const { forgotPassword, verifyResetOtp, resetPassword } = require("../controllers/passwordResetController");

const 
router=express.Router()

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication APIs
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input data
 */
router.post("/signup",signup)
router.post("/login",login)
router.post('/refresh', refreshTokens)
router.post("/logout",logout)
// router.post("/sendOtp",sendOtp)
router.post("/login/verify",verifyLoginOtp)
router.post('/resend-otp',resendOtp);
router.post("/forgot-password",forgotPassword)
router.post('/verify-reset-otp',verifyResetOtp)
router.post('/reset-password',resetPassword)
// src/routes/authRoutes.js

// ... (existing imports)

// ... (existing routes)

// NEW: Endpoint for frontend to check cookie status and get role
router.get("/status", optionalAuthMiddleware, (req, res) => {
    if (req.user) {
        // req.user is set by optionalAuthMiddleware if the cookie is valid
        res.status(200).json({
            isLoggedIn: true,
            role: req.user.role,
        });
    } else {
        // If req.user is null, the cookie was missing or invalid/expired
        res.status(200).json({
            isLoggedIn: false,
            role: null,
        });
    }
});

// ... (existing module.exports)

module.exports=router