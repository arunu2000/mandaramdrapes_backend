const express=require("express")
const authMiddleware= require("../middleware/authMiddleware")
const adminMiddleware = require("../middleware/adminMiddleware")
const User=require("../models/User")
const bcrypt=require("bcrypt")
const router=express.Router()   

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management APIs
 */

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard stats
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Dashboard data
 */


router.get("/users",authMiddleware,adminMiddleware,async(req , res)=>{
    const users= await User.find().select("-password")
    // console.log("usersget",users)
    return res.json({users})
})

router.post("/users",authMiddleware,adminMiddleware,async(req,res)=>{
    try{
    const {username,email,phone,password,role}=req.body
    const existedUser=await User.findOne({email})
    if(existedUser){
        res.json({message:"User already exist"})
    }
    const salt=await bcrypt.genSalt(10)
    const hashedPassword= await bcrypt.hash(password,salt)
    const newUser= new User({
        username,
        email,
        phone,
        password:hashedPassword,
        
    })
    await newUser.save()
    res.json({message:"Admin created user successfully"})
    }
    catch(err){
        res.status(500).json({message:"Error in creating user",Error:err.message})
    }
})
module.exports=router