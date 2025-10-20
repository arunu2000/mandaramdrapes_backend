const express=require("express")
const router=express.Router()
const {placeOrder, getOrdersForAdmin, updateStatus} = require("../controllers/orderController")
const authMiddleware = require("../middleware/authMiddleware")
const {getOrders}=require("../controllers/orderController")
const adminMiddleware = require("../middleware/adminMiddleware")


router.post("/place",authMiddleware,placeOrder)
router.get("/myOrders",authMiddleware,getOrders)
router.get("/all",authMiddleware,adminMiddleware,getOrdersForAdmin)
router.get("/update/:id",authMiddleware,adminMiddleware,updateStatus)

module.exports=router