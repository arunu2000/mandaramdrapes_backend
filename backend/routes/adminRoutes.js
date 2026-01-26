const express=require("express")
const authMiddleware= require("../middleware/authMiddleware")
const adminMiddleware = require("../middleware/adminMiddleware")
const User=require("../models/User")
const bcrypt=require("bcrypt")
const profileData = require("../controllers/profileAdminController")
const { requestProfileUpdate, verifyAndUpdateProfile } = require("../controllers/updateProfileController")
const { getAdminSummary } = require("../controllers/adminController")
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
      const existedUser = await User.findOne({
            $or: [
                { email: email },
                { phone: phone }
            ]
        })
    if(existedUser){
        return res.status(400).json({ Error: "Email or phone already exists." })
    }
    const salt=await bcrypt.genSalt(10)
    const hashedPassword= await bcrypt.hash(password,salt)
    const newUser= new User({
        username,
        email,
        phone,
        password:hashedPassword,
        role:role
    })
    await newUser.save()
    res.json({message: `User created successfully with role: ${role}.`})
    }
    catch(err){
        res.status(500).json({message:"Error in creating user",Error:err.message})
    }
})

router.get("/adminProfile",authMiddleware,adminMiddleware,profileData)
router.post("/adminProfile/request-update", authMiddleware, adminMiddleware, requestProfileUpdate);
router.post("/adminProfile/verify-update", authMiddleware, adminMiddleware, verifyAndUpdateProfile);
router.get("/summary",authMiddleware,adminMiddleware,getAdminSummary)


module.exports=router