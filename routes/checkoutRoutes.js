const express = require("express");
const Checkout = require("../models/Checkout");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

//! @route POST /api/checkout
//! @desc Create a new checkout session
//! @access Private
router.post("/", protect, async (req, res) => {
    const { checkoutItems, shippingAddress, paymentAddress, totalPrice } = req.body;

    if (!checkoutItems || checkoutItems.length === 0) {
        return res.status(400).json({ message: "No items in checkout" });
    }

    try {
        const newCheckout = await Checkout.create({
            user: req.user._id,
            checkoutItems,
            shippingAddress,
            paymentAddress,
            totalPrice,
        });

        res.status(201).json(newCheckout);
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
});

//! @route PUT /api/checkout/:id/pay
//! @desc Update checkout to mark as paid after successful payment
//! @access Private
router.put("/:id/pay", protect, async (req, res) => {
    const { paymentStatus, paymentDetails } = req.body;

    try {
        const checkout = await Checkout.findById(req.params.id);
        if (!checkout) {
            return res.status(404).json({ message: "Checkout not found" });
        }

        if (paymentStatus === "paid") {
            checkout.isPaid = true;
            checkout.paymentStatus = paymentStatus;
            checkout.paymentDetails = paymentDetails;
            checkout.paidAt = Date.now();

            await checkout.save();
            res.status(200).json(checkout);
        } else {
            res.status(400).json({ message: "Invalid Payment Status" });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
});

//! @route POST /api/checkout/:id/finalize
//! @desc Finalize checkout and convert to an order after payment confirmation
//! @access Private
router.post("/:id/finalize", protect, async (req, res) => {
    try {
        const checkout = await Checkout.findById(req.params.id);
        if (!checkout) {
            return res.status(404).json({ message: "Checkout not found" });
        }

        if (checkout.isPaid && !checkout.isFinalized) {
            //? create final order based on the checkout details:
            const finalOrder = await Order.create({
                user: checkout.user,
                orderItems: checkout.checkoutItems,
                shippingAddress: checkout.shippingAddress,
                paymentMethod: checkout.paymentMethod,
                totalPrice: checkout.totalPrice,
                isPaid: true,
                paidAt: checkout.paidAt,
                isDelivered: false,
                paymentStatus: "paid",
                paymentDetails: checkout.paymentDetails,
            });

            //? mark the checkout as finalized:
            checkout.isFinalized = true;
            checkout.finalizedAt = Date.now();

            await checkout.save();

            //? delete the cart associated with the user:
            await Cart.findOneAndDelete({ user: checkout.user });

            res.status(200).json(finalOrder);
        } else if (checkout.isFinalized) {
            res.status(400).json({ message: "Checkout has already been finalized" });
        } else {
            res.status(400).json({ message: "Checkout is not paid yet" });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;
