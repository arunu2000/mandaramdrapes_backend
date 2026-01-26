const mongoose = require('mongoose'); // Ensure this is imported
const Category = require("../models/Category")
const Product = require("../models/Product")
const User=require("../models/User")


const getAllCategories=async(req , res)=>{
    try{
        console.log("category user side list called")
        const categories=await Category.find().select('name image')
        res.status(200).json({message:"Category fetched in user dispaly",categories})
    }
    catch(err){
        console.log("Error in category fetching of user side",err.message)
        res.status(500).json({message:"Error in category fetching of user side"})
    }
}

// const getAllProducts=async(req , res)=>{
//     try{
//         const products=await Product.find().populate('category', 'name').select('name image description price category')
//         res.status(200).json({message:"Products fetched successfully",products})
//     }
//     catch(err){
//         console.log("Error in products fetching",err.message)
//         res.status(500).json({message:"Error in products fetching"})
//     }
// }



const getAllProducts = async (req, res) => {
    try {
        // --- Aggregation Pipeline for Robust Filtering ---
        const list = await Product.aggregate([
            // 1. Join with the categories collection (like populate)
            {
                $lookup: {
                    // **VERIFY THIS NAME:** 'categories' must be the exact collection name
                    from: 'categories', 
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            
            // 2. Filter out products where the category couldn't be found (i.e., categoryDetails array is empty)
            {
                $match: {
                    'categoryDetails': { $ne: [] }
                }
            },
            
            // 3. Unwind the category details to treat it as a single object
            { $unwind: '$categoryDetails' },
            
            // 4. Project and shape the output fields
            {
                $project: {
                    _id: 1,
                    name: 1,
                    image: 1,
                    description: 1,
                    price: 1,
                    // Re-create the populated 'category' field for the frontend
                    category: {
                        _id: '$categoryDetails._id',
                        name: '$categoryDetails.name'
                    }
                }
            },
            // 5. Optional: Add a sort stage if your featured products are ordered (e.g., by creation date)
            // { $sort: { createdAt: -1 } } 
        ]);

        console.log(`Fetched ${list.length} products after filtering for existing categories.`);

        res.status(200).json({ 
            message: "Products fetched successfully", 
            products: list 
        });

    } catch (err) {
        console.error("Error in products fetching (Aggregation):", err.message);
        res.status(500).json({ message: "Error in products fetching" });
    }
};



const getProductsByCategoryId=async(req , res)=>{
    try{
        console.log("products of the selected category called")
        const {categoryId}=req.params
        const getProducts=await Product.find({category:categoryId}).populate('category','name')
        res.status(200).json({message:"Products fetched by the selected category ID",getProducts})
    }
    catch(err){
        console.log('Error in products fetching by the selected category ID', err.message)
        res.status(500).json({message:'Error in products fetching by the selected category ID'})
    }
}

// const getProductsByCategoryId = async(req, res) => {
//     try {
//         // The parameter is the slug (e.g., 'shirts', 't-shirts')
//         const { categoryId: categorySlugOrName } = req.params;

//         // 1. CRITICAL: Find the Category document using the slug/name
//         // We assume your category documents have a 'name' field that matches the slug.
//         const category = await Category.findOne({ name: categorySlugOrName });
        
//         if (!category) {
//             // 404 response if the slug doesn't correspond to any category
//             return res.status(404).json({ message: `Category '${categorySlugOrName}' not found.` });
//         }
        
//         // 2. Optimized Product Query: Use the MongoDB ObjectId (category._id)
//         // This prevents the Mongoose CastError and efficiently fetches products.
//         const getProducts = await Product.find({ category: category._id })
//                                          // Populate the 'category' field, selecting only the 'name' for the frontend
//                                          .populate('category', 'name'); 
        
//         // The frontend expects the data to be in the 'getProducts' key.
//         res.status(200).json({ 
//             message: "Products fetched successfully by category slug", 
//             getProducts 
//         });
//     }
//     catch(err) {
//         // Log the full error for server debugging
//         console.error('FATAL Error in products fetching by category slug:', err.message, err.stack); 
        
//         // Return 500 for general server/database errors (like connection loss)
//         res.status(500).json({ message: 'Internal server error while fetching products.' });
//     }
// }
// const productCard=async(req ,res)=>{
//     try{
//         const {productId}=req.params
//         const product = await Product.findById(productId)
//         res.status(200).json({message:"Product card displays successfully",product})
//     }
//     catch(err){
//         console.log("Error in product card displaying",err.message)
//         res.status(500).json({message:"Error in product card displaying"})
//     }
// }


/**
 * GET /api/products/:productId
 * Fetches detailed product info + related products
 */
const productCard = async (req, res) => {
    try {
        const { productId } = req.params;

        // 1. Validate Product ID format (prevents server crashing on bad IDs)
        if (!require("mongoose").Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "Invalid Product ID" });
        }

        // 2. Fetch the Main Product
        // Populate category to display breadcrumbs (Home > Category > Product)
        const product = await Product.findById(productId).populate("category", "name");

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // 3. Fetch Related Products
        // Logic: Same category, NOT the current product, limit to 4-10 items
        const relatedProducts = await Product.find({
            category: product.category._id,
            _id: { $ne: product._id } // Exclude current product
        })
        .select("name price image stock rating") // Select only needed fields for cards
        .limit(4); // Limit to 4 items for the carousel

        // 4. Construct the Response
        // We explicitly check stock to set an 'inStock' flag for easier frontend logic
        const productResponse = {
            ...product.toObject(),
            inStock: product.stock > 0,
            stockStatus: product.stock > 0 ? "In Stock" : "Out of Stock"
        };

        res.status(200).json({
            message: "Product details fetched successfully",
            product: productResponse,
            relatedProducts
        });

    } catch (err) {
        console.error("Error fetching product details:", err.message);
        res.status(500).json({ message: "Server error fetching product details" });
    }
};



const getProfile=async(req, res)=>{
    try{
        const userId=req.user.id
        const users=await User.findById(userId).select("username email")
        res.status(200).json({message:"User profile data fetched successfully",users})
    }
    catch(err){
        console.log("Error in User profile data fetching",err.message)
        res.status(500).json({message:"Error in User profile data fetching"})
    }
}


/**
 * POST /api/auth/profile/request-update
 * POST /api/auth/adminProfile/request-update
 */


/**
 * Handles the GET /api/products/search request.
 * Implements combined search, filters, sorting, and pagination.
 */
const searchProducts = async (req, res) => {
    try {
        // --- 1. Get Query Parameters and Set Defaults ---
        const {
            q, // Search keyword
            category,
            minPrice,
            maxPrice,
            minRating,
            sort,
            page = 1,
            limit = 24 // Default limit as per requirements (e.g., "Showing 1–24...")
        } = req.query;

        // Ensure limit is a safe number
        const pageSize = parseInt(limit) > 0 && parseInt(limit) <= 100 ? parseInt(limit) : 24;
        const skip = (parseInt(page) - 1) * pageSize;

        // --- 2. Build the Mongoose Query Object (Filter `{} => {field: value}`) ---
        let query = {};

        // 2a. Text Search (q) - Case-Insensitive, Partial Match
        // Uses $regex for flexible search on 'name' and 'description' fields.
        if (q) {
            const regex = new RegExp(q, 'i'); // 'i' for case-insensitive
            query.$or = [
                { name: { $regex: regex } },
                { description: { $regex: regex } }
                // Add 'code' or other searchable fields here
            ];
        }

        // 2b. Category Filter
        if (category) {
            // Assuming 'category' is the Category 'name' or 'code' from the frontend
            // We need to find the Category ObjectId first.
            const catDoc = await Category.findOne({ $or: [{ name: category }, { code: category }] });

            if (catDoc) {
                query.category = catDoc._id;
            } else {
                // If category is provided but not found, no products will match,
                // which handles the "Conflicting filters" edge case gracefully.
                // We can force an empty result set:
                query.category = null;
            }
        }

        // 2c. Price Range Filter
        if (minPrice || maxPrice) {
            query.price = {};
            // Validation (Non-negative numeric values) is expected from the frontend,
            // but we add server-side checks for safety.
            if (minPrice && !isNaN(parseFloat(minPrice)) && parseFloat(minPrice) >= 0) {
                query.price.$gte = parseFloat(minPrice);
            }
            if (maxPrice && !isNaN(parseFloat(maxPrice)) && parseFloat(maxPrice) >= 0) {
                query.price.$lte = parseFloat(maxPrice);
            }
            // Check minPrice <= maxPrice. If reversed, we can adjust the query or let it return 0 results.
            if (query.price.$gte && query.price.$lte && query.price.$gte > query.price.$lte) {
                // If min > max, let the query run; it will return an empty set.
            }
        }

        // 2d. Rating Filter (assuming 'rating' is a Number field 1-5)
        if (minRating && !isNaN(parseFloat(minRating)) && parseFloat(minRating) >= 1) {
             // Clamping to allowed bounds (1-5) - assuming your model has a 'rating' field
            query.rating = { $gte: Math.max(1, Math.min(5, parseFloat(minRating))) };
        }


        // --- 3. Build the Mongoose Sort Object (`{} => {field: direction}`) ---
        let sortCriteria = {};
        const allowedSorts = ['relevance', 'price-asc', 'price-desc', 'newest', 'rating'];
        
        if (sort && allowedSorts.includes(sort)) {
            switch (sort) {
                case 'price-asc':
                    sortCriteria.price = 1; // 1 for ascending (low-to-high)
                    break;
                case 'price-desc':
                    sortCriteria.price = -1; // -1 for descending (high-to-low)
                    break;
                case 'newest':
                    sortCriteria.createdAt = -1; // Newest is descending creation date
                    break;
                case 'rating':
                    sortCriteria.rating = -1; // Highest rating first
                    break;
                case 'relevance':
                default:
                    // For 'relevance', we rely on Mongoose $text score if using text index,
                    // otherwise, it defaults to a neutral sort (e.g., newest).
                    // For now, if no text search (q) is present, fallback to 'newest'.
                    if (q) {
                        // Advanced relevance ranking requires Mongoose text indexes and $text search
                        // which is complex. For simplicity here, we'll keep the sort neutral
                        // unless a specific field is requested. Let's fallback to newest for now.
                        sortCriteria.createdAt = -1;
                    } else {
                        sortCriteria.createdAt = -1; // Default/Fallback sort
                    }
                    break;
            }
        } else {
            // Fallback to default sort if not provided or invalid
            sortCriteria.createdAt = -1; // Default: newest first
        }


        // --- 4. Execute Queries ---
        
        // 4a. Count Total Documents (for pagination metadata)
        const totalItems = await Product.countDocuments(query);

        // 4b. Fetch Paginated Products
        // To minimize payload (as requested), we use .select()
        const items = await Product.find(query)
            .sort(sortCriteria)
            .skip(skip)
            .limit(pageSize)
            .select('id name price rating image category') // Only listing fields
            .populate('category', 'name'); // Optionally populate category name if needed on listing


        // --- 5. Return Paginated Response ---
        res.status(200).json({
            items,
            total: totalItems,
            page: parseInt(page),
            pageSize: pageSize,
            // Include other metadata like totalPages for client calculation
            totalPages: Math.ceil(totalItems / pageSize)
        });

    } catch (error) {
        console.error("Product Search Error:", error);
        // 5xx error handling
        res.status(500).json({ message: "An unexpected server error occurred during search. Please retry.", details: error.message });
    }
};

const createProductReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const productId = req.params.id;
        
        // Assume req.user is set by your authMiddleware
        const userId = req.user.id; 
        const userName = req.user.username; // Or req.user.name

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // 1. Check if user already reviewed this product
        const alreadyReviewed = product.reviews.find(
            (r) => r.user.toString() === userId.toString()
        );

        if (alreadyReviewed) {
            return res.status(400).json({ message: "Product already reviewed" });
        }

        // 2. Add new review
        const review = {
            name: userName,
            rating: Number(rating),
            comment,
            user: userId,
        };

        product.reviews.push(review);

        // 3. Update NumReviews
        product.numReviews = product.reviews.length;

        // 4. Calculate New Average Rating
        // Sum of all ratings / Total number of reviews
        product.rating =
            product.reviews.reduce((acc, item) => item.rating + acc, 0) /
            product.reviews.length;

        await product.save();

        res.status(201).json({ message: "Review added" });

    } catch (err) {
        console.error("Error creating review:", err);
        res.status(500).json({ message: "Error creating review" });
    }
};


module.exports={getAllCategories,getAllProducts,getProductsByCategoryId,productCard,getProfile,searchProducts,createProductReview}