const mongoose= require("mongoose")

const userSchema=new mongoose.Schema({
    username:{type:String,required:true,minLength:3,maxLength:20},
    email:{type:String,required:true,unique:true},
    phone:{type:Number,required:true,minLength:10,maxLength:10},
    password:{type:String,required:true},
    role:{
        type:String,
        enum:["user","admin"],
        default:"user"
    }}, 
      {timestamps:true}
)


module.exports=mongoose.model("User",userSchema)