const express=require("express")
const {categoryList, categoryAdd, categoryUpdate, categoryDelete}=require("../controllers/categoryController")
const authMiddleware=require("../middleware/authMiddleware")
const adminMiddleware=require("../middleware/adminMiddleware")
const multer=require("multer")
const upload=require("../middleware/upload")
const router=express.Router()


router.get("/list",categoryList)
router.post("/add",authMiddleware,adminMiddleware,upload.single("image"),categoryAdd)
router.put("/update/:id",authMiddleware,adminMiddleware,upload.single("image"),categoryUpdate)
router.delete("/delete/:id",authMiddleware,adminMiddleware,categoryDelete)

module.exports=router