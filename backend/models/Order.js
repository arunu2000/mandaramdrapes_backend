// const mongoose=require("mongoose")

// const orderSchema=new mongoose.Schema({
//     user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
//     items:[{
//         product:{type:mongoose.Schema.Types.ObjectId,ref:"Product"},
//         quantity:{type:Number,default:1},
//         price:{type:Number,required:true}
//     }],
//     totalAmount:{type:Number,required:true},
//     // paymentStatus:{type:String,enum:["Pending","Paid"],default:"Pending"},
//     orderStatus:{type:String,enum:["Processing","Shipped","Delivered","Cancelled"],default:"Processing"}
// },{timestamps:true})

// module.exports=mongoose.model("Order",orderSchema)  

const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1 },
        price: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true },

    shippingCharge: Number, 
    finalAmount: Number,
    
    // --- 💳 RAZORPAY SPECIFIC FIELDS ---
    // This ID is created by Razorpay during the 'placeOrder' step
    razorpayOrderId: { 
        type: String, 
        required: true 
    }, 
    
    // This is the ID of the actual transaction, received after success
    razorpayPaymentId: { 
        type: String 
    }, 
    
    // The signature used to verify that the payment is authentic
    razorpaySignature: { 
        type: String 
    }, 
    paymentMethod: { 
    type: String, 
    enum: ["Online", "POD"], 
    default: "Online" 
},
    
    paymentStatus: { 
        type: String, 
        enum: ["Pending", "Paid", "Failed"], 
        default: "Pending" 
    },
    // ----------------------------------

    orderStatus: { 
        type: String, 
        enum: ["Processing", "Confirmed", "Shipped", "Delivered", "Cancelled"], 
        default: "Processing" 
    }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);