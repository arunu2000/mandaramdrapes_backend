const { image } = require("../config/cloudinary")
const Category=require("../models/Category")
const Product=require('../models/Product')
const Order=require("../models/Order")
const Cart=require('../models/Cart')
const categoryList=async(req ,res)=>{
    console.log("category list called")
    try{
        const list=await Category.find()
        res.json({list})
    }
    catch(err){
        res.status(400).json({error:err.message})
    }
    
}

const categoryAdd=async(req ,res)=>{
    console.log("category add called")
    try{
        const {code,name,description}=req.body
        if(!code || !name){
            return res.status(400).json({message:"Code and Name are required"})
        }
        const category=new Category({
            code,
            name,
            description,
            image:req.file?.path||null
        })
        await category.save()
        res.status(200).json({message:"Admin added new category",category})

    }
    catch(err){
        console.error("🔥 Full error details:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
        res.status(500).json({message:"Error in category adding", error:err.message})
    }
    
}

const categoryUpdate=async(req,res)=>{
    console.log("category update called")
    try{
        const{id}=req.params
        const {code,name,description}=req.body
        // const {image}=req.file.path
        const updatedCategory={
            code,
            name,
            description,
            image:req.file?.path
        }
        const categoryToUpdate=await Category.findByIdAndUpdate(
            id,updatedCategory,{
            new:true,
        })
        if(!categoryToUpdate){
            return res.staus(400).json({message:"Category not found"})
        }
        res.status(200).json({message:"Category updated successfully",category:categoryToUpdate})
    }
    catch(err){
        res.status(500).json({message:"Error in category update",error:err.message})
    }
}

// const categoryDelete=async(req,res)=>{
    
//     try{
//         console.log("category delete called")
//         const{id}=req.params
//         const productsInCategory= await Product.find({category:id}).select('_id')
//         const productIds=productsInCategory.map(p=>p._id)
//         const affectedOrders=await Order.find({
//             'items.product':{$in:productIds},
//             'orderStatus':{$nin:['Delivered','Cancelled']}
//         }).select('_id')

//         const affectedOrdersIds=affectedOrders.map(p=>p._id)
//         if(affectedOrdersIds.length>0){
//             await Order.updateMany(
//                 {_id:{$in:affectedOrdersIds}},
//                 {$set:{orderStatus:'Cancelled'}}
//             )
//         }
//         const deletedProductResult = await Product.deleteMany({ category: id });

//         // B. Clean up Carts: Remove any items that match the IDs of the deleted products
//         // We use $pull to remove elements from the 'items' array where item.product is in productIds.
//         const cartCleanupResult = await Cart.updateMany(
//             { 'items.product': { $in: productIds } },
//             { $pull: { items: { product: { $in: productIds } } } }
//         );
//         const deleteCategory=await Category.findByIdAndDelete(id)
//         if(!deleteCategory){
//             return res.status(400).json({message:"Category not found to delete"})
//         }
//         res.status(200).json({message:"Category deleted successfully"})
//     }
//     catch(err){
//         res.status(500).json({message:"Error in category Delete",error:err.message})
//     }
// }


const categoryDelete = async (req, res) => {
    try {
        console.log("category delete called");
        // Using 'id' from req.params as per your existing code
        const { id } = req.params; 

        // 1. Find products in the category to get their IDs
        const productsInCategory = await Product.find({ category: id }).select('_id');
        const productIds = productsInCategory.map(p => p._id);

        // --- CORE FIX: Find affected carts before cleanup for later recalculation ---
        const affectedCarts = await Cart.find({ 'items.product': { $in: productIds } }).select('_id items totalAmount');
        const affectedCartIds = affectedCarts.map(cart => cart._id);
        
        // 2. Handle affected Orders: Find and Cancel non-Delivered/non-Cancelled orders
        const affectedOrders = await Order.find({
            'items.product': { $in: productIds },
            'orderStatus': { $nin: ['Delivered', 'Cancelled'] }
        }).select('_id');

        const affectedOrdersIds = affectedOrders.map(p => p._id);
        
        if (affectedOrdersIds.length > 0) {
            await Order.updateMany(
                { _id: { $in: affectedOrdersIds } },
                { $set: { orderStatus: 'Cancelled' } }
            );
            console.log(`Cancelled ${affectedOrdersIds.length} open orders due to category deletion.`);
        }

        // 3. Delete the products belonging to the category
        const deletedProductResult = await Product.deleteMany({ category: id });
        console.log("deletedProductResult",deletedProductResult)
        console.log(`Deleted ${deletedProductResult.deletedCount} products.`);


        // 4. Clean up Carts: Remove any items and recalculate totalAmount
        
        // A. Remove any items that match the IDs of the deleted products
        const cartCleanupResult = await Cart.updateMany(
            { 'items.product': { $in: productIds } },
            { $pull: { items: { product: { $in: productIds } } } }
        );
        console.log(`Cleaned up ${cartCleanupResult.modifiedCount} carts by removing items.`);

        // B. Recalculate and update totalAmount for all carts that were affected
        if (affectedCartIds.length > 0) {
            
            // Re-fetch the modified carts to get the new `items` array
            const modifiedCarts = await Cart.find({ _id: { $in: affectedCartIds } }).select('items totalAmount');
            
            // Loop through the modified carts and recalculate their total amount
            for (const cart of modifiedCarts) {
                let newTotal = 0;
                
                // For each remaining item, find the product's price.
                // Any product found here is a valid product from another category.
                for (const item of cart.items) {
                    // Fetch the product price to calculate the new total
                    const product = await Product.findById(item.product).select('price'); 
                    
                    if (product && product.price !== undefined) { 
                        newTotal += product.price * item.quantity;
                    }
                }
                
                // Update the total amount in the database
                if (cart.totalAmount !== newTotal) {
                    await Cart.updateOne(
                        { _id: cart._id },
                        { $set: { totalAmount: newTotal } }
                    );
                    console.log(`Recalculated total for cart ${cart._id}. New total: ${newTotal}`);
                }
            }
        }
        
        // 5. Delete the Category
        const deleteCategoryResult = await Category.findByIdAndDelete(id);
        
        if (!deleteCategoryResult) {
            return res.status(400).json({ message: "Category not found to delete" });
        }
        
        res.status(200).json({ message: "Category deleted successfully" });
    }
    catch (err) {
        console.error("Error in category Delete:", err.message);
        res.status(500).json({ message: "Error in category Delete", error: err.message });
    }
};

module.exports={categoryList,categoryAdd,categoryUpdate,categoryDelete}