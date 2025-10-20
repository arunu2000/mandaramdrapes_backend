const mongoose=require("mongoose")
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("MongoDB Connected")
        
    } catch (err) {
        // Handle error
        console.error("Database connection error:", err);
    }
}
module.exports=connectDB