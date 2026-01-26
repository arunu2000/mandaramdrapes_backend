// src/middleware/optionalAuthMiddleware.js (NEW FILE)
const jwt = require("jsonwebtoken");

const optionalAuthMiddleware = (req, res, next) => {
    const token = req.cookies.jwt; // Read the cookie

    if (!token) {
        req.user = null; // No token, user is not authenticated
        return next();
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Set user object if valid
    } catch (err) {
        // Token is present but expired/invalid. The session is over.
        console.log("Token invalid/expired during status check.");
        req.user = null;
    }
    next();
};

module.exports = optionalAuthMiddleware;
