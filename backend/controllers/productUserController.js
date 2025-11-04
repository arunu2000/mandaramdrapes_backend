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
const productCard=async(req ,res)=>{
    try{
        const {productId}=req.params
        const product = await Product.findById(productId)
        res.status(200).json({message:"Product card displays successfully",product})
    }
    catch(err){
        console.log("Error in product card displaying",err.message)
        res.status(500).json({message:"Error in product card displaying"})
    }
}

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

module.exports={getAllCategories,getAllProducts,getProductsByCategoryId,productCard,getProfile}