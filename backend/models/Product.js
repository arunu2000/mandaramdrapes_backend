const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true }, // Store user name to display easily
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    image: { type: String },
    images: [{ type: String }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    
    // 💡 NEW: Store individual reviews
    reviews: [reviewSchema],
    
    // 💡 UPDATED: This will be the CALCULATED average
    rating: { type: Number, default: 0 },
    
    // 💡 NEW: Track number of reviews for display (e.g., "4.5 stars (120 reviews)")
    numReviews: { type: Number, default: 0 }

}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);