const express=require("express")
const router=express.Router()
const authMiddleware = require("../middleware/authMiddleware")
const { saveLocationAndGetShipping } = require("../controllers/addressController")

router.post("/save-geo", authMiddleware, saveLocationAndGetShipping);

module.exports=router