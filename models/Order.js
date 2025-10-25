const mongoose=require("mongoose")

const orderSchema=new mongoose.Schema({
    user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
    items:[{
        product:{type:mongoose.Schema.Types.ObjectId,ref:"Product"},
        quantity:{type:Number,default:1},
        price:{type:Number,required:true}
    }],
    totalAmount:{type:Number,required:true},
    // paymentStatus:{type:String,enum:["Pending","Paid"],default:"Pending"},
    orderStatus:{type:String,enum:["Processing","Shipped","Delivered"],default:"Processing"}
},{timestamps:true})

module.exports=mongoose.model("Order",orderSchema)  