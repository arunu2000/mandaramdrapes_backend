const Product=require("../models/Product")

const productList=async(req , res)=>{
    try{
        const {categoryId}=req.query
        let filter={}
        if(categoryId){
            filter.category=categoryId
        }
        const list=await Product.find(filter).populate('category', 'name').sort({createdAt:-1})
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

const productDelete=async(req,res)=>{
    try{
        const {id}=req.params
        const productToDelete=await Product.findByIdAndDelete(id)
        if(!productToDelete){
            return res.status(400).status({message:"Cannot find document for deleting"})
        }
        res.status(200).json({message:"Product deleted successfully"})
    }
    catch(err){
        res.status(500).json({message:"Error in product deleting",error:err.message})
    }
}
module.exports={productList,productAdd,productUpdate,productDelete}