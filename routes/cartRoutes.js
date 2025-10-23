const express=require("express")
const router=express.Router()
const authMiddleware = require("../middleware/authMiddleware")
const {cartAdd,cartList, cartRemove, updateProductQuantity} = require("../controllers/cartController")

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart APIs
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get all items in user's cart
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: List of cart items
 */

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Add a product to cart
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product added to cart
 */


router.post("/add",authMiddleware,cartAdd)
router.get("/list",authMiddleware,cartList)
router.delete("/remove/:productId",authMiddleware,cartRemove)
router.put("/updateQuantity/:productId",authMiddleware,updateProductQuantity)

module.exports=router