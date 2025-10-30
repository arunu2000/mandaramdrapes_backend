const { image } = require("../config/cloudinary")
const Category=require("../models/Category")
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

const categoryDelete=async(req,res)=>{
    console.log("category delete called")
    try{
        const{id}=req.params
        const productsInCategory= await Product.find({category:id}).select('_id')
        const productIds=productsInCategory.map(p=>p._id)
        const affectedOrders=await Order.find({
            'items.product':{$in:productIds},
            'orderStatus':{$nin:['Delivered','Cancelled']}
        }).select('_id')

        const affectedOrdersIds=affectedOrders.map(p=>p._id)
        if(affectedOrdersIds.length>0){
            await Order.updateMany(
                {_id:{$in:affectedOrdersIds}},
                {$set:{orderStatus:'Cancelled'}}
            )
        }

        const deleteCategory=await Category.findByIdAndDelete(id)
        if(!deleteCategory){
            return res.status(400).json({message:"Category not found to delete"})
        }
        res.status(200).json({message:"Category deleted successfully"})
    }
    catch(err){
        res.status(500).json({message:"Error in category Delete",error:err.message})
    }
}


// // controllers/categoryController.js
// const Category = require("../models/Category");
// const Product = require("../models/Product"); // <-- Need Product model
// const Order = require("../models/Order");   // <-- Need Order model

// // ... (categoryList, categoryAdd, categoryUpdate functions remain the same) ...

// const categoryDelete = async (req, res) => {
//     console.log("category delete called");
//     const { id: categoryId } = req.params; // Get category ID from route params

//     try {
//         // --- Step 1: Find all products belonging to this category ---
//         const productsInCategory = await Product.find({ category: categoryId }).select('_id');

//         // Extract just the product IDs
//         const productIds = productsInCategory.map(p => p._id);

//         // --- Step 2: Find all Orders containing any of these products ---
//         // We only care about orders that are NOT already 'Delivered' or 'Cancelled'
//         const affectedOrders = await Order.find({
//             'items.product': { $in: productIds }, // Find orders where items.product is one of the productIds
//             'orderStatus': { $nin: ['Delivered', 'Cancelled'] } // Only affect active orders
//         }).select('_id'); // We only need the order IDs for updating

//         // Extract order IDs
//         const orderIdsToCancel = affectedOrders.map(o => o._id);

//         // --- Step 3: Update the status of affected orders to 'Cancelled' ---
//         if (orderIdsToCancel.length > 0) {
//             await Order.updateMany(
//                 { _id: { $in: orderIdsToCancel } }, // Filter by the order IDs
//                 { $set: { orderStatus: 'Cancelled' } } // Set the new status
//             );
//             console.log(`Cancelled ${orderIdsToCancel.length} orders due to category deletion.`);
//         }

//         // --- Step 4: Delete the category itself ---
//         const deleteCategory = await Category.findByIdAndDelete(categoryId);

//         if (!deleteCategory) {
//             return res.status(404).json({ message: "Category not found to delete" }); // Use 404 for not found
//         }

//         // --- Step 5: Optionally, delete products in the category ---
//         // Decide if you want to delete the products themselves or just leave them 'orphaned'
//         // If you delete products, orders will show 'null' for that product.
//         // await Product.deleteMany({ category: categoryId });
//         // console.log(`Deleted ${productIds.length} products associated with the category.`);

//         res.status(200).json({
//             message: "Category deleted successfully. Associated active orders have been cancelled.",
//             cancelledOrdersCount: orderIdsToCancel.length
//         });

//     } catch (err) {
//         console.error("Error in category Delete:", err.message); // Log the error for debugging
//         res.status(500).json({ message: "Error during category deletion process", error: err.message });
//     }
// };

// module.exports = { /* categoryList, categoryAdd, categoryUpdate, */ categoryDelete }; // Make sure to export all functions


module.exports={categoryList,categoryAdd,categoryUpdate,categoryDelete}