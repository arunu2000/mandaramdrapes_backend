const express=require("express")
const { getAllCategories, getAllProducts,getProductsByCategoryId, productCard, getProfile } = require("../controllers/productUserController")
const authMiddleware = require("../middleware/authMiddleware")
const router=express.Router()

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile management APIs
 */

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User profile data
 */

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */


router.get("/shop/categories",getAllCategories)
router.get("/shop/products",getAllProducts)
router.get("/shop/product/:productId",productCard)
router.get("/shop/categories/:categoryId",getProductsByCategoryId)
router.get("/profile",authMiddleware,getProfile)

module.exports=router