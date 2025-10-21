const Category = require("../models/Category")
const Product = require("../models/Product")

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

const getAllProducts=async(req , res)=>{
    try{
        const products=await Product.find().populate('category', 'name').select('name image description price category')
        res.status(200).json({message:"Products fetched successfully",products})
    }
    catch(err){
        console.log("Error in products fetching",err.message)
        res.status(500).json({message:"Error in products fetching"})
    }
}

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

module.exports={getAllCategories,getAllProducts,getProductsByCategoryId,productCard}