const User = require("../models/User");
const Product = require("../models/Product");
const mongoose = require("mongoose");

const getWishlist = async (req, res) => {
    try {
        console.log("get wishlist called")
        const userId = req.user.id;
        
        // 1. Find the user and populate the 'wishlist' array
        const user = await User.findById(userId)
            .select('wishlist')
            // Populate the array with product details
            .populate({ 
                path: 'wishlist',
                model: 'Product',
                // Select only the listing fields required by the frontend
                select: 'name price image rating code' 
            })
            // Remove null entries in case a product was deleted from the system
            .orFail(); 

        // Filter out any null products if they were deleted after being added to the wishlist
        const wishlistItems = user.wishlist.filter(item => item !== null);

        res.status(200).json({
            message: "Wishlist fetched successfully",
            items: wishlistItems,
            count: wishlistItems.length
        });
    } catch (err) {
        console.error("Error fetching wishlist:", err.message);
        res.status(500).json({ message: "Error fetching wishlist" });
    }
};

/**
 * POST /api/wishlist
 * Adds a product to the user's wishlist. (Idempotent: adding a duplicate is a no-op).
 */
const addToWishlist = async (req, res) => {
    try {
        console.log("add to wishlist called")
        const userId = req.user.id;
        const { productId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "Invalid product ID format." });
        }

        // 1. Check if product exists (optional but good practice)
        const productExists = await Product.findById(productId);
        if (!productExists) {
             return res.status(404).json({ message: "Product not found." });
        }

        // 2. Use $addToSet to add the product ID only if it's not already present (ensures idempotency)
        const user = await User.findByIdAndUpdate(
            userId,
            { $addToSet: { wishlist: productId } }, // $addToSet prevents duplicates
            { new: true, select: 'wishlist' }
        );
        if (!user) {
            // This happens if the user ID from the JWT payload does not exist in the DB.
            return res.status(404).json({ message: "Authenticated user not found." });
        }
        res.status(200).json({
            message: "Product added to wishlist successfully",
            wishlistCount: user.wishlist.length
        });
    } catch (err) {
        console.error("Error adding to wishlist:", err.message);
        res.status(500).json({ message: "Error adding to wishlist" });
    }
};

/**
 * DELETE /api/wishlist/:productId
 * Removes a single product from the user's wishlist. (No-op if product wasn't there).
 */
const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "Invalid product ID format." });
        }

        // 1. Use $pull to remove the product ID from the array
        const user = await User.findByIdAndUpdate(
            userId,
            { $pull: { wishlist: productId } },
            { new: true, select: 'wishlist' }
        );

        // The update is successful even if the product wasn't in the list (graceful no-op)
        res.status(200).json({
            message: "Product removed from wishlist successfully",
            wishlistCount: user.wishlist.length
        });
    } catch (err) {
        console.error("Error removing from wishlist:", err.message);
        res.status(500).json({ message: "Error removing from wishlist" });
    }
};

/**
 * DELETE /api/wishlist (Bulk removal for "Remove All")
 */
const clearWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Use $set to replace the wishlist array with an empty array
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: { wishlist: [] } },
            { new: true, select: 'wishlist' }
        );

        res.status(200).json({
            message: "Wishlist cleared successfully",
            wishlistCount: user.wishlist.length
        });
    } catch (err) {
        console.error("Error clearing wishlist:", err.message);
        res.status(500).json({ message: "Error clearing wishlist" });
    }
}

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist
};