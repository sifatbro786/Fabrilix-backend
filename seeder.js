const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("./models/Product");
const User = require("./models/User");
const Cart = require("./models/Cart");
const products = require("./data/products");

dotenv.config();

//? connect to DB:
mongoose.connect(process.env.MONGO_URI);

//? function to seed:
const seedData = async () => {
    try {
        //* clear existing data
        await Product.deleteMany();
        await User.deleteMany();
        await Cart.deleteMany();

        //* create a default admin user:
        const createdUser = await User.create({
            name: "Admin User",
            email: "admin@example.com",
            password: "123456",
            role: "admin",
        });

        //* assign the default user ID to each product:
        const userID = createdUser._id;
        const sampleProducts = products.map((product) => {
            return { ...product, user: userID };
        });

        //* insert the products into db:
        await Product.insertMany(sampleProducts);

        console.log("Data Imported!");
        process.exit();
    } catch (err) {
        console.log(err.message);
        process.exit(1);
    }
};

seedData();
