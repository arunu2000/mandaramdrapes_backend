
const express=require("express")
const http = require("http");
const { Server } = require("socket.io");
const path = require('path') 
const connectDB=require("./config/db")
const dotenv=require("dotenv")
const cors = require("cors");
const swaggerUi=require('swagger-ui-express')
const swaggerSpec=require('./swagger')
const cookieParser=require("cookie-parser")
const Otp=require("./models/Otp")
const initSocket = require("./socket/socketManager")


dotenv.config()


const app=express() 
const server = http.createServer(app);
app.use(cookieParser())
app.use(cors({
    origin: ["http://localhost:5173","http://192.168.29.116:5173","http://localhost:5174","http://localhost:5176"],
    credentials: true
}));

app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://192.168.29.116:5173"],
        credentials: true
    }
});
initSocket(io); // Modularized socket logic
app.set("socketio", io); // Global access for controllers

// connectDB()

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const categoryRoutes=require("./routes/categoryRoutes")
const productRoutes=require("./routes/productRoutes")
const cartRoutes=require("./routes/cartRoutes")
const orderRoutes=require("./routes/orderRoutes")
const userRoutes=require("./routes/userRoutes");
const addressRoutes=require("./routes/addressRoutes")
const notificationRoutes=require("./routes/notificationRoutes")
const { api } = require("./config/cloudinary");

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/category",categoryRoutes)
app.use("/api/product",productRoutes)
app.use("/api/user", userRoutes)
app.use("/api/cart",cartRoutes)
app.use("/api/order",orderRoutes)
app.use("/api/address", addressRoutes);
app.use("/api/notifications", notificationRoutes);


app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))
// app.post("/test", (req, res) => {
//   console.log("Test route called");
//   res.send("Test route works");
// });
const startServer = async () => {
    try {
        console.log("Starting server process...")
        
        // 3. Await the database connection
        await connectDB();
        
        // 3. Await the index creation (crucial for TTL/OTP expiry)
        await Otp.createIndexes();
        console.log("MongoDB TTL indexes confirmed and created successfully.");
        
        // Start the Express server only after DB and Indexes are ready
        const PORT=process.env.PORT || 5000
        app.listen(PORT,"0.0.0.0",()=>console.log(`Server running on PORT ${PORT}`))

    } catch (error) {
        console.error("Critical error during server startup:", error.message);
        // Exit process on critical startup failure
        process.exit(1); 
    }
}

// Execute the startup function
startServer()

// const PORT=process.env.PORT || 5000
// app.listen(PORT,"0.0.0.0",()=>console.log(`server running on PORT ${PORT}`))