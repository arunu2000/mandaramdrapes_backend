const User = require("../models/User")

const profileData=async(req , res)=>{
    try{
        const adminData=await User.findOne({role:"admin"}).select('username')
        res.status(200).json({message:"Admin profile data fetched",adminData})
    }
    catch(err){
        console.log("Error in fetching admin profile data")
        res.status(500).json({message:"Error in fetching admin profile data"})
    }
}

module.exports=profileData