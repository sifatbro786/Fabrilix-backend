const express = require("express");
const Subscriber = require("../models/Subscriber");

const router = express.Router();

//! @route GET /api/subscriber
//! @desc Handle newsletter subscription
//! @access Public
router.post("/subscribe", async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        let subscriber = await Subscriber.findOne({ email });
        if (subscriber) {
            return res.status(400).json({ message: "Email already subscribed" });
        }

        //? create a new subscriber
        subscriber = new Subscriber({ email });
        await subscriber.save();

        res.status(201).json({ message: "Successfully subscribed to the newsletter" });
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;
