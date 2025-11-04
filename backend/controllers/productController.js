const mongoose = require('mongoose');
const Product=require("../models/Product")
const Order=require("../models/Order")

const productList=async(req , res)=>{
    try{
        const {categoryId}=req.query
        // let filter={}
        // if(categoryId){
        //     filter.category=categoryId
        // }
        const list=await Product.find({category:categoryId}).populate('category', 'name').sort({createdAt:-1})
        res.status(200).json({list})
    }
    catch(err){
        res.status(500).json({message:"Error in viewing product list",error:err.message})
    }   
}



const productAdd=async(req,res)=>{
    try{
        const {code,name,description,price,category}=req.body
        if(!code || !name || !category || !price){
            return res.status(400).json({message:"Code, name, category and price should be required"})
        }
        const existedData=await Product.findOne({
            $or:[{code},{name}]
        })
        if (existedData){
            return res.status(400).json({message:"The added product exists"})
        }
        const newProduct= new Product({
            code,
            name,
            description,
            price,
            category,
            image:req.file?.path || null
        })
        await newProduct.save()
        res.status(200).json({message:"Product added successfully"})
    }
    catch(err){
        console.error("🔥 Full error details:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
        res.status(500).json({message:"Error in product adding",error:err.message})   
    }
}

const productUpdate=async(req,res)=>{
    try{
        const {id}=req.params
        const {code,name,description,price,category}=req.body
        const updatedProduct={
            code,
            name,
            description,
            price,
            category,
            image:req.file?.path
        }
        const productToUpdate=await Product.findByIdAndUpdate(id,updatedProduct,{new:true})
        if(!productToUpdate){
            return res.status(400).json({message:"Cannot find document for updating"})
        }
        res.status(200).json({message:"Product updated successfully"})

    }
    catch(err){
        res.status(500).json({message:"Error in product update",error:err.message})
    }
}



const productDelete = async (req, res) => {
    try {
        const { id } = req.params; // 'id' is the ID of the product to delete

        // 1. Define the single product ID we are concerned about
        const productIdToDelete = id; 

        // 2. Handle affected Orders: Find and Cancel non-Delivered/non-Cancelled orders
        const affectedOrders = await Order.find({
            // Use the single product ID directly in the 'items.product' filter
            'items.product': productIdToDelete, 
            'orderStatus': { $nin: ['Delivered', 'Cancelled'] }
        }).select('_id');

        const affectedOrdersIds = affectedOrders.map(p => p._id);

        if (affectedOrdersIds.length > 0) {
            await Order.updateMany(
                { _id: { $in: affectedOrdersIds } },
                { $set: { orderStatus: 'Cancelled' } }
            );
            // Log for clarity, confirming the product's impact
            console.log(`Cancelled ${affectedOrdersIds.length} open orders due to deletion of product: ${productIdToDelete}.`);
        }
        
        // 3. Delete the product
        const productToDelete = await Product.findByIdAndDelete(id);
        
        if (!productToDelete) {
            return res.status(404).json({ message: "Cannot find document for deleting" }); // Use 404 for 'not found'
        }

        res.status(200).json({ message: "Product deleted successfully" });
    }
    catch (err) {
        console.error("Error in product deleting:", err.message);
        res.status(500).json({ message: "Error in product deleting", error: err.message });
    }
};
module.exports={productList,productAdd,productUpdate,productDelete}