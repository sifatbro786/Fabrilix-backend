const express = require("express");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

//! @route GET /api/admin/products
//! @desc GET all products (admin only)
//! @access Private/Admin
router.get("/", protect, admin, async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json(products);
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;
