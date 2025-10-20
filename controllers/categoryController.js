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

module.exports={categoryList,categoryAdd,categoryUpdate,categoryDelete}