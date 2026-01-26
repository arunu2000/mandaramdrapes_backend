const User=require("../models/User")
const adminMiddleware = async (req, res, next) => {
    // Since authMiddleware runs first, req.user is already populated
    if (req.user && req.user.role === "admin") {
        return next();
    }
    
    // 403 means "Authenticated, but no permission"
    res.status(403).json({ message: "Access Denied. Admin role required." });
}
module.exports=adminMiddleware