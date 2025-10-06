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

// //? multer setup using memory storage:
const storage = multer.memoryStorage();
const upload = multer({ storage });

//? upload multiple images
router.post("/", protect, upload.array("images"), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No files uploaded" });
        }

        const uploadPromises = req.files.map((file) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "products" },
                    (error, result) => {
                        if (result) resolve(result);
                        else reject(error);
                    },
                );
                streamifier.createReadStream(file.buffer).pipe(stream);
            });
        });

        const results = await Promise.all(uploadPromises);
        const images = results.map((r) => ({
            url: r.secure_url,
            public_id: r.public_id,
        }));

        res.status(200).json({ images });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Image upload failed" });
    }
});

//? delete image
router.delete("/", protect, async (req, res) => {
    try {
        const { public_id } = req.body;
        if (!public_id) return res.status(400).json({ message: "No public_id provided" });

        await cloudinary.uploader.destroy(public_id);
        res.status(200).json({ message: "Image deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Delete failed" });
    }
});

module.exports = router;
