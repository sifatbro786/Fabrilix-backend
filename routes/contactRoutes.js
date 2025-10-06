const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const Message = require("../models/Message");

//! POST /api/contact
//! @desc Send a contact message
//! @access Public
router.post("/", async (req, res) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ message: "Name, email and message are required." });
        }

        await Message.create({ name, email, message });

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === "true",
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });

        const mailOptions = {
            from: `"${process.env.FROM_NAME || "Website Contact"}" <${process.env.SMTP_USER}>`,
            to: process.env.CONTACT_RECEIVER_EMAIL,
            subject: `New contact message from ${name}`,
            text: `
You have a new contact message.

Name: ${name}
Email: ${email}
Message:
${message}
      `,
            html: `
        <div style="font-family: Arial, sans-serif; color: #374151;">
          <h2 style="color: #C58940;">New contact message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <hr />
          <p>${message.replace(/\n/g, "<br/>")}</p>
          <hr/>
          <p style="font-size:12px;color:#888">Sent from your website</p>
        </div>
      `,
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error("Mail error:", err);
                return res.status(500).json({ message: "Failed to send email notification" });
            }
            return res.status(200).json({ message: "Message sent successfully" });
        });
    } catch (err) {
        console.error("Contact route error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
