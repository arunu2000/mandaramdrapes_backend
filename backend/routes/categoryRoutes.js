const express=require("express")
const {categoryList, categoryAdd, categoryUpdate, categoryDelete}=require("../controllers/categoryController")
const authMiddleware=require("../middleware/authMiddleware")
const adminMiddleware=require("../middleware/adminMiddleware")
const multer=require("multer")
const upload=require("../middleware/upload")
const router=express.Router()

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Product category APIs
 */

/**
 * @swagger
 * /api/category:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of all categories
 */

/**
 * @swagger
 * /api/category:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 */


router.get("/list",categoryList)
router.post("/add",authMiddleware,adminMiddleware,upload.single("image"),categoryAdd)
router.put("/update/:id",authMiddleware,adminMiddleware,upload.single("image"),categoryUpdate)
router.delete("/delete/:id",authMiddleware,adminMiddleware,categoryDelete)

module.exports=router