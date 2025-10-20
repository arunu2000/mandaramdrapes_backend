const jwt =require("jsonwebtoken")
const authMiddleware=(req,res,next)=>{
    const token=req.header("Authorization")?.replace("Bearer ","")
    if(!token) {
        return res.status(400).json({message:"Access Denied. No token provided"})
    }
    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        console.log("authentication middleware called")
        req.user=decoded
        // console.log(req.user,"req.user")

        next()

}
catch(err){
    res.status(400).json({message:"Error in authMiddleware",err})
}
    }
module.exports=authMiddleware