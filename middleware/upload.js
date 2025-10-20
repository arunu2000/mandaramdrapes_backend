const multer=require("multer")
const cloudinary=require("../config/cloudinary")
const {CloudinaryStorage}=require("multer-storage-cloudinary")

console.log("🚀 Cloudinary instance in upload.js:", !!cloudinary.config);
const storage=new CloudinaryStorage({
    cloudinary,
    params:{
        folder:"categories",
        allowedFormats:["jpg","jpeg","png","webp"],
        public_id:(req,file)=>Date.now()+ "-" +file.originalname.split(".")[0]
    }
})

const upload=multer({
    storage,    
    limits:{fileSize:2*1024*1024}
})

// const fileFilter = (req, file, cb) => {
//   console.log("📸 Upload attempt for:", file.originalname);
//   // only accept image types
//   if (file.mimetype.startsWith("image/")) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only image files are allowed!"), false);
//   }
// };

module.exports=upload