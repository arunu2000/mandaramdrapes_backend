const User=require("../models/User")
const bcrypt= require("bcrypt")
const jwt=require("jsonwebtoken")

const signup =async (req, res) => {
    console.log("signup called")
        try {
            const { username, email, phone,password } = req.body;
            const duplicate = await User.findOne({
                $or:[
                    {email},
                    {phone}
                ]
            });
            if (duplicate) return res.status(400).json({ Error: "Email or phone already exist" });
            const salt=await bcrypt.genSalt(10)
            const hashedPassword=await bcrypt.hash(password,salt)
            const adminExist=await User.findOne({role:"admin"})
            if(!adminExist){
                const AdminUser = new User({ username, email, phone, password: hashedPassword, role: "admin" });
                await AdminUser.save();
                return res.status(201).json({ message: "Admin User created successfully", AdminUser });
            }
            
            const user = new User({ username, email, phone,password:hashedPassword });
            await user.save();
            res.status(201).json({ message: "User created successfully",user });
        } catch (err) {
            res.status(500).json({ Error: "Server error", details: err.message });
        }
    }


const login =async(req,res)=>{
    console.log("login called")
try{
    const {email,password}=req.body
    const user= await User.findOne({email})
    if(!user) return res.status(400).json({message:"invalid credentials"})
    
    const isMatch=await bcrypt.compare(password,user.password)
    if(!isMatch) {
        return res.status(400).json({message:"password mismatched"})
    }
    
    const token=jwt.sign({
        id:user._id,email:user.email,role:user.role
    },process.env.JWT_SECRET,
    {expiresIn:"24h"})

    res.status(200).json({message:"logged in Successfully",token,role:user.role})
}
catch(err){
    res.status(500).json({error:"Error occured", details:err.message})
}
}

const logout=async(req,res)=>{
    try{
        res.status(200).json({message:"Logout Successfull"})
    }
    catch(err){
        console.log("Error during logout",err.message);
        res.status(500).json({message:"Error during logout"})
    }
}

module.exports={signup,login,logout}