const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
require("dotenv").config();

//? cloudinary configuration:
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

//? multer setup using memory storage:
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", upload.single("image"), protect, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        //? Function to handle the stream upload to cloudinary
        const streamUpload = (fileBuffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream((error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                });

                // ? use streamifier to convert file buffer to a readable stream
                streamifier.createReadStream(fileBuffer).pipe(stream);
            });
        };

        //? call the stream upload function
        const result = await streamUpload(req.file.buffer);

        //? response with the uploaded image url
        res.status(200).json({ imageUrl: result.secure_url });
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;
