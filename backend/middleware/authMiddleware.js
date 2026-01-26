const jwt = require("jsonwebtoken");

// --- 1. Authentication Middleware ---
const authMiddleware = (req, res, next) => {
    // Check if cookies exists (requires cookie-parser)
    const token = req.cookies ? req.cookies.jwt : null;

    if (!token) {
        // MUST be 401 for the frontend interceptor to trigger refresh
        return res.status(401).json({ message: "Access Denied. No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Contains id, email, role
        next();
    } catch (err) {
        // If token is expired or malformed, return 401
        return res.status(401).json({ 
            message: "Session expired or invalid token", 
            expired: err.name === 'TokenExpiredError' 
        });
    }
};

module.exports = authMiddleware;