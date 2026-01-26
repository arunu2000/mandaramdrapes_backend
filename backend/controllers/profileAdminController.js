const User = require("../models/User")

// Admin side: GET /api/auth/adminProfile

const profileData = async (req, res) => {
    try {
        // Use the ID from the authenticated user token (set by authMiddleware)
        const userId = req.user.id; 
        
        const adminData = await User.findById(userId).select('username email role');
        
        if (!adminData) {
            return res.status(404).json({ message: "Admin profile not found" });
        }

        res.status(200).json({ 
            message: "Admin profile data fetched", 
            adminData 
        });
    } catch (err) {
        console.error("Error in fetching admin profile data:", err.message);
        res.status(500).json({ message: "Error in fetching admin profile data" });
    }
}

module.exports=profileData