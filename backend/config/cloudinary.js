// const cloudinary=require("cloudinary").v2

// cloudinary.config({
//     cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
//     api_key:process.env.CLOUDINARY_API_KEY,
//     api_secret:process.env.CLOUDINARY_API_SECRET
// })

// module.exports=cloudinary


const dotenv = require("dotenv");
dotenv.config(); // ✅ Ensure env vars are loaded here too (safe redundancy)
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("Cloudinary config loaded:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "❌ Missing",
  api_key: process.env.CLOUDINARY_API_KEY ? "✅ Loaded" : "❌ Missing",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "✅ Loaded" : "❌ Missing",
})

module.exports = cloudinary;
