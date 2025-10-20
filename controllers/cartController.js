const Product = require("../models/Product")
const Cart=require("../models/Cart")

const CartAdd=async(req,res)=>{
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
        const existingCartProduct=cart.items.find((i)=>{
            i.product.toString()===productId
        })
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

module.exports=CartAdd