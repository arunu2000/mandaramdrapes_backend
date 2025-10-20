const express=require("express")
const { getAllCategories, getAllProducts,getProductsByCategoryId } = require("../controllers/productUserController")
const router=express.Router()

router.get("/shop/categories",getAllCategories)
router.get("/shop/products",getAllProducts)
router.get("/shop/categories/:categoryId",getProductsByCategoryId)

module.exports=router