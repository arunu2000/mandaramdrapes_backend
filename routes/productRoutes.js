const express=require("express")
const authMiddleware = require("../middleware/authMiddleware")
const adminMiddleware = require("../middleware/adminMiddleware")
const upload = require("../middleware/upload")
const { productList,productAdd, productUpdate, productDelete } = require("../controllers/productController")
const router=express.Router()


router.get("/list",productList)
router.post("/add",authMiddleware,adminMiddleware,upload.single("image"),productAdd)
router.put("/update/:id",authMiddleware,adminMiddleware,upload.single("image"),productUpdate)
router.delete("/delete/:id",authMiddleware,adminMiddleware,productDelete)

module.exports=router