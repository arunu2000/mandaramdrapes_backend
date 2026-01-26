const express=require("express")
const router=express.Router()
const {placeOrder, getOrdersForAdmin, updateStatus, verifyPayment, cancelOrder, preCheckout, placeOrderPOD} = require("../controllers/orderController")
const authMiddleware = require("../middleware/authMiddleware")
const {getOrders}=require("../controllers/orderController")
const adminMiddleware = require("../middleware/adminMiddleware")

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order placement and tracking APIs
 */

/**
 * @swagger
 * /api/order:
 *   post:
 *     summary: Place a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cartItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *               totalAmount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Order placed successfully
 */

/**
 * @swagger
 * /api/order:
 *   get:
 *     summary: Get all orders for logged-in user
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: List of user orders
 */


router.post("/place",authMiddleware,placeOrder)
router.post("/verifyPayment",authMiddleware,verifyPayment)
router.post("/placeOrderPOD",authMiddleware,placeOrderPOD)
router.post("/cancel/:id", authMiddleware, cancelOrder)
router.post("/pre-checkout", authMiddleware, preCheckout);
router.get("/myOrders",authMiddleware,getOrders)
router.get("/all",authMiddleware,adminMiddleware,getOrdersForAdmin)
router.put("/update/:id",authMiddleware,adminMiddleware,updateStatus)


module.exports=router