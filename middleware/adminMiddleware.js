const User=require("../models/User")
const adminMiddleware=async(req,res,next)=>{
    if(req.user.role==="admin"){
        console.log("admin middleware called")
        return next()
    }
    res.status(400).json({message:"Access Denied, Not admin role"})
}
module.exports=adminMiddleware