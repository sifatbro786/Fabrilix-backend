const express = require("express");
const Order = require("../models/Order");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

//! @route GET /api/orders/my-orders
//! @desc GET loggedIn user's orders
//! @access Private
router.get("/my-orders", protect, async (req, res) => {
    try {
        //? find orders for the authenticated user:
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }); //sort by most recent orders
        res.status(200).json(orders);
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
});

//! @route GET /api/orders/:id
//! @desc GET order details by id
//! @access Private
router.get("/:id", protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate("user", "name email");
        if (order) {
            res.status(200).json(order);
        } else {
            res.status(404).json({ message: "Order not found" });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;
