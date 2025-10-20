const express=require("express")
const router=express.Router()
const authMiddleware = require("../middleware/authMiddleware")
const CartAdd = require("../controllers/cartController")


router.post("/add",authMiddleware,CartAdd)

module.exports=router