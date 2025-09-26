const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");

const app = express();
app.use(express.json());
app.use(cors());

dotenv.config();

const port = process.env.PORT || 5000;

//! Connect to MongoDB:
connectDB();

app.get("/", (req, res) => {
    res.send("Welcome to Fabrilix API!");
});

//! API Routes:
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
