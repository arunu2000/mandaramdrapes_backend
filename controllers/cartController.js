const Product = require("../models/Product")
const Cart=require("../models/Cart")

const cartAdd=async(req,res)=>{
    try{
        const {productId,quantity}=req.body
        const userId=req.user.id
        let cart=await Cart.findOne({user:userId})
        if(!cart){
            cart=new Cart({
                user:userId,
                items:[],
                totalAmount:0
            })
        }
        // let product=await cart.items.find
        const existingCartProduct=cart.items.find((i)=>i.product.toString()===productId)
        if(existingCartProduct){
            existingCartProduct.quantity+=quantity
        }
        else{
            cart.items.push({product:productId,quantity})
        }

        let totalAmount=0
        for (const item of cart.items){
            const p=await Product.findById(item.product)
            totalAmount+=p.price*item.quantity
        }
        cart.totalAmount=totalAmount

        await cart.save()
        res.status(200).json({message:"Cart added successfully",cart})
    }
    catch(err){
        console.log("Error in cart adding",err.message)
        res.status(500).json({message:"Error in cart adding"})

    }

}

const cartList=async(req, res)=>{
    try{
        const userId=req.user.id
        const cart=await Cart.findOne({user:userId}).populate({path:"items.product",select:"name price image"})
        if(!cart){
            return res.status(200).json({message:"Cart is empty"})
        }
        const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        totalAmount=cart.totalAmount
        res.status(200).json({message:"Cart fetched successfully",cart,quantity:totalQuantity,totalAmount})
    }
    catch(err){
        console.log("Error in fetching cart",err.message)
        res.status(500).josn({message:"Error in fetching cart"})
    }
}

const cartRemove=async(req,res)=>{
    try{
        const {productId}=req.params()
        const userId=req.user.id
        let cart=await Cart.findOne({user:userId})
        if(!cart){
            return res.status(400).json({message:"product is not found in cart"})
        }
        cart.items=cart.items.filter(item=>item.product.toString()!==productId)
        let totalAmount=0
        for(const item of cart.items){
            const p=await Product.findById(item.product)
            totalAmount+=p.price*item.quantity
        }
        cart.totalAmount=totalAmount
        await cart.save()
        res.status(200).json({message:"product in cart removed successfully",cart})

    }
    catch(err){
        console.log("Error in removing cart",err.message)
        res.status(500).json({message:"Error in removing cart"})
    }
}

const updateProductQuantity=async(req,res)=>{
    try{
        const {productId}=req.params()
        const {quantity}=req.body
        const userId=req.user.id
        let cart=await Cart.findOne({user:userId})
        if(!cart){
            return res.status(400).json({message:"User cart is not found"})
        }
        const existingCart=cart.items.find(item=>item.product.toString()===productId)
        if(!existingCart){
            return res.status(400).json({message:"Product id doesn't match"})
        }
        existingCart.quantity=quantity
        let totalAmount=0
        for(const item of cart.items){
            const p=await Product.findById(item.product)
            totalAmount+=p.price*item.quantity
        }
        cart.totalAmount=totalAmount
        await cart.save()
        res.status(200).json({message:"product quantity in cart updated successfully",cart})

        
    }
    catch(err){
        console.log("Error in updating quantity in cart",err.message)
        res.status(500).json({message:"Error in updating quantity in cart"})
    }
}


module.exports={cartAdd,cartList,cartRemove,updateProductQuantity}