// const Product = require("../models/Product")
// const Cart=require("../models/Cart")

// const cartAdd=async(req,res)=>{
//     try{
//         console.log("cart add called")
//         const {productId,quantity}=req.body
//         const userId=req.user.id
//         let cart=await Cart.findOne({user:userId})
//         if(!cart){
//             cart=new Cart({
//                 user:userId,
//                 items:[],
//                 totalAmount:0
//             })
//         }
//         // let product=await cart.items.find
//         const existingCartProduct=cart.items.find((i)=>i.product.toString()===productId)
//         if(existingCartProduct){
//             existingCartProduct.quantity+=quantity
//         }
//         else{
//             cart.items.push({product:productId,quantity})
//         }

//         let totalAmount=0
//         for (const item of cart.items){
         
            
//             const p=await Product.findById(item.product)

//             // console.log('!!!!!!!!!!!@@@@!!',Product);
//             // console.log('!!!!!!!!!!!!!',p);
            
//             totalAmount+=p.price*item.quantity
//         }
//         cart.totalAmount=totalAmount

//         await cart.save()
//         res.status(200).json({message:"Cart added successfully",cart})
//     }
//     catch(err){
//         console.log("Error in cart adding",err.message)
//         res.status(500).json({message:"Error in cart adding"})

//     }

// }



// const cartList=async(req, res)=>{
//     try{
//         const userId=req.user.id
//         const cart=await Cart.findOne({user:userId}).populate({path:"items.product",select:"name price image"})
//         if(!cart){
//             return res.status(200).json({message:"Cart is empty"})
//         }
//         const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
//         totalAmount=cart.totalAmount
//         res.status(200).json({message:"Cart fetched successfully",cart,quantity:totalQuantity,totalAmount})
//     }
//     catch(err){
//         console.log("Error in fetching cart",err.message)
//         res.status(500).json({message:"Error in fetching cart"})
//     }
// }

// const cartRemove=async(req,res)=>{
//     try{
//         const {productId}=req.params
//         const userId=req.user.id
//         let cart=await Cart.findOne({user:userId})
//         if(!cart){
//             return res.status(400).json({message:"product is not found in cart"})
//         }
//         cart.items=cart.items.filter(item=>item.product.toString()!==productId)
//         let totalAmount=0
//         for(const item of cart.items){
//             const p=await Product.findById(item.product)
//             totalAmount+=p.price*item.quantity
//         }
//         cart.totalAmount=totalAmount
//         await cart.save()
//         res.status(200).json({message:"product in cart removed successfully",cart})

//     }
//     catch(err){
//         console.log("Error in removing cart",err.message)
//         res.status(500).json({message:"Error in removing cart"})
//     }
// }



// const updateProductQuantity=async(req,res)=>{
//     try{
//         console.log("update quantity called")
//         const {productId}=req.params
//         const {quantity}=req.body
//         const userId=req.user.id
//         let cart=await Cart.findOne({user:userId})
//         if(!cart){
//             return res.status(400).json({message:"User cart is not found"})
//         }
//         const existingCart=cart.items.find(item=>item.product.toString()===productId)
//         if(!existingCart){
//             return res.status(400).json({message:"Product id doesn't match"})
//         }
//         existingCart.quantity=quantity
//         let totalAmount=0
//         for(const item of cart.items){
//             const p=await Product.findById(item.product)
//             totalAmount+=p.price*item.quantity
//         }
//         cart.totalAmount=totalAmount
//         await cart.save()
//         res.status(200).json({message:"product quantity in cart updated successfully",cart})

        
//     }
//     catch(err){
//         console.log("Error in updating quantity in cart",err.message)
//         res.status(500).json({message:"Error in updating quantity in cart"})
//     }
// }


// module.exports={cartAdd,cartList,cartRemove,updateProductQuantity}



const Product = require("../models/Product")
const Cart=require("../models/Cart")
const Category = require("../models/Category") // Assuming Category model is available

// Helper function for validation and recalculation
const validateAndRecalculateCart = async (cart) => {
    let isCartModified = false;
    let newItems = [];
    let totalAmount = 0;

    // We must use a for...of loop here to allow for asynchronous database calls (await)
    for (const item of cart.items) {
        // Fetch the product and populate its category to check for existence
        const product = await Product.findById(item.product).populate('category');

        // VALIDATION: Check 1: Product exists AND Check 2: Product's Category exists
        if (product && product.category) {
            // If valid, keep the item and calculate its contribution to the total
            newItems.push(item);
            totalAmount += product.price * item.quantity;
        } else {
            // Product or its Category is deleted, so mark for modification
            isCartModified = true;
            console.log(`Removed product ${item.product} from cart: Product or Category unavailable.`);
        }
    }

    if (isCartModified) {
        cart.items = newItems;
    }
    
    // Always update totalAmount based on current prices and valid items
    cart.totalAmount = totalAmount;

    return { cart, isCartModified };
};


const cartAdd=async(req,res)=>{
    try{
        console.log("cart add called")
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
        
        const existingCartProduct=cart.items.find((i)=>i.product.toString()===productId)
        if(existingCartProduct){
            existingCartProduct.quantity+=quantity
        }
        else{
            cart.items.push({product:productId,quantity})
        }

        // Recalculate total amount after modification
        let totalAmount=0
        for (const item of cart.items){
            const p=await Product.findById(item.product)
            // Safety check in cartAdd to ensure the product is still available, though validation should handle most cases
            if (p) {
                totalAmount+=p.price*item.quantity
            } else {
                 console.warn(`Product ${item.product} not found during cart calculation.`);
            }
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
        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(200).json({ message: "Cart is empty" });
        }

        // --- CORE VALIDATION AND CLEANUP LOGIC ---
        const { cart: validatedCart, isCartModified } = await validateAndRecalculateCart(cart);
        
        if (isCartModified) {
            // If items were removed, save the changes to the database
            await validatedCart.save();
        }

        // Populate the cart for the final response as expected by the frontend
        const cartToRespond = await validatedCart.populate({
            path: "items.product",
            select: "name price image"
        });
        // -----------------------------------------

        const totalQuantity = cartToRespond.items.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = cartToRespond.totalAmount;
        
        res.status(200).json({
            message: "Cart fetched and validated successfully",
            cart: cartToRespond,
            quantity: totalQuantity,
            totalAmount
        });
        
    }
    catch(err){
        console.log("Error in fetching cart",err.message)
        res.status(500).json({message:"Error in fetching cart"})
    }
}

const cartRemove=async(req,res)=>{
    try{
        const {productId}=req.params
        const userId=req.user.id
        let cart=await Cart.findOne({user:userId})
        if(!cart){
            return res.status(400).json({message:"product is not found in cart"})
        }
        cart.items=cart.items.filter(item=>item.product.toString()!==productId)
        
        // Recalculate total amount using the new helper
        const { cart: updatedCart } = await validateAndRecalculateCart(cart);
        // Note: isCartModified check is implicitly handled by the filter above,
        // but recalculation is needed if we removed an item.
        
        await updatedCart.save()
        res.status(200).json({message:"product in cart removed successfully",cart: updatedCart})

    }
    catch(err){
        console.log("Error in removing cart",err.message)
        res.status(500).json({message:"Error in removing cart"})
    }
}



const updateProductQuantity=async(req,res)=>{
    try{
        console.log("update quantity called")
        const {productId}=req.params
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
        
        // Recalculate total amount using the new helper for correctness
        const { cart: updatedCart } = await validateAndRecalculateCart(cart);
        
        await updatedCart.save()
        res.status(200).json({message:"product quantity in cart updated successfully",cart: updatedCart})
    }
    catch(err){
        console.log("Error in updating quantity in cart",err.message)
        res.status(500).json({message:"Error in updating quantity in cart"})
    }
}


module.exports={cartAdd,cartList,cartRemove,updateProductQuantity}
