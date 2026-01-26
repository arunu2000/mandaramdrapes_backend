const mongoose= require("mongoose")

const userSchema=new mongoose.Schema({
    username:{type:String,required:true,minLength:3,maxLength:20},
    email:{type:String,required:true,unique:true},
    phone:{type:Number,required:true,minLength:10,maxLength:10},
    password:{type:String,required:true},
    role:{
        type:String,
        enum:["customer","admin"],
        default:"customer"
    },
    refreshToken: { type: String, default: null },
    wishlist: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Product" // Refers to the Product model
    }]
},
      {timestamps:true}
)


module.exports=mongoose.model("User",userSchema)