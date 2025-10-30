
const express=require("express")
const path = require('path') 
const connectDB=require("./config/db")
const dotenv=require("dotenv")
const cors = require("cors");
const swaggerUi=require('swagger-ui-express')
const swaggerSpec=require('./swagger')


dotenv.config()


const app=express()
app.use(cors({
    origin:"http://localhost:5173",
}))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 

connectDB()

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const categoryRoutes=require("./routes/categoryRoutes")
const productRoutes=require("./routes/productRoutes")
const cartRoutes=require("./routes/cartRoutes")
const orderRoutes=require("./routes/orderRoutes")
const userRoutes=require("./routes/userRoutes")

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/category",categoryRoutes)
app.use("/api/product",productRoutes)
app.use("/api/user", userRoutes)
app.use("/api/cart",cartRoutes)
app.use("/api/order",orderRoutes)

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))
// app.post("/test", (req, res) => {
//   console.log("Test route called");
//   res.send("Test route works");
// });


const PORT=process.env.PORT || 5000
app.listen(PORT,"0.0.0.0",()=>console.log(`server running on PORT ${PORT}`))