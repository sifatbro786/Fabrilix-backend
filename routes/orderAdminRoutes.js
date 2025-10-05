const express = require("express");
const Order = require("../models/Order");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

//! @route GET /api/admin/orders
//! @desc GET all orders (admin only)
//! @access Private/Admin
router.get("/", protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({}).populate("user", "name email");
        res.status(200).json(orders);
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
});

//! @route PUT /api/admin/orders/:id
//! @desc Update order status (admin only)
//! @access Private/Admin
router.put("/:id", protect, admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate("user", "name");
        if (order) {
            order.status = req.body.status || order.status;
            order.isDelivered = req.body.status === "Delivered" ? true : order.isDelivered;
            order.deliveredAt = req.body.status === "Delivered" ? Date.now() : order.deliveredAt;

            const updatedOrder = await order.save();
            res.status(200).json({ message: "Order updated successfully", order: updatedOrder });
        } else {
            res.status(404).json({ message: "Order not found" });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
});

//! @route DELETE /api/admin/orders/:id
//! @desc Delete an order (admin only)
//! @access Private/Admin
router.delete("/:id", protect, admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            await order.deleteOne();
            res.status(200).json({ message: "Order deleted successfully" });
        } else {
            res.status(404).json({ message: "Order not found" });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;
