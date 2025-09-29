const express = require("express");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

//! @route POST /api/products
//! @desc Create a new product
//! @access Private/Admin
router.post("/", protect, admin, async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            discountPrice,
            countInStock,
            category,
            brand,
            sizes,
            colors,
            collections,
            material,
            gender,
            images,
            isFeatured,
            isPublished,
            tags,
            dimensions,
            weight,
            sku,
        } = req.body;

        const product = new Product({
            name,
            description,
            price,
            discountPrice,
            countInStock,
            category,
            brand,
            sizes,
            colors,
            collections,
            material,
            gender,
            images,
            isFeatured,
            isPublished,
            tags,
            dimensions,
            weight,
            sku,
            user: req.user._id,
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
});

//! @route PUT /api/products/:id
//! @desc Update an existing product by id
//! @access Private/Admin
router.put("/:id", protect, admin, async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            discountPrice,
            countInStock,
            category,
            sku,
            brand,
            sizes,
            colors,
            collections,
            material,
            gender,
            images,
            isFeatured,
            isPublished,
            tags,
            dimensions,
            weight,
        } = req.body;

        //? find the product by id
        const product = await Product.findById(req.params.id);
        if (product) {
            //? update the product
            product.name = name || product.name;
            product.description = description || product.description;
            product.price = price || product.price;
            product.discountPrice = discountPrice || product.discountPrice;
            product.countInStock = countInStock || product.countInStock;
            product.category = category || product.category;
            product.sku = sku || product.sku;
            product.brand = brand || product.brand;
            product.sizes = sizes || product.sizes;
            product.colors = colors || product.colors;
            product.collections = collections || product.collections;
            product.material = material || product.material;
            product.gender = gender || product.gender;
            product.images = images || product.images;
            product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;
            product.isPublished = isPublished !== undefined ? isPublished : product.isPublished;
            product.tags = tags || product.tags;
            product.dimensions = dimensions || product.dimensions;
            product.weight = weight || product.weight;

            //? save the product
            const updatedProduct = await product.save();
            res.status(200).json(updatedProduct);
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
});

//! @route DELETE /api/products/:id
//! @desc Delete a product by id
//! @access Private/Admin
router.delete("/:id", protect, admin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            await product.deleteOne();
            res.status(200).json({ message: "Product removed" });
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
});

//! @route GET /api/products
//! @desc Get all products with optional query filters
//! @access Public
router.get("/", async (req, res) => {
    try {
        const {
            collection,
            size,
            color,
            gender,
            minPrice,
            maxPrice,
            sortBy,
            search,
            category,
            material,
            brand,
            limit,
        } = req.query;

        let query = {};
        //? Apply filters to query
        if (collection && collection.toLocaleLowerCase() !== "all") query.collections = collection;
        if (category && category.toLocaleLowerCase() !== "all") query.category = category;
        if (material) query.material = { $in: material.split(",") };
        if (brand) query.brand = { $in: brand.split(",") };
        if (size) query.sizes = { $in: size.split(",") };
        if (color) query.colors = { $in: [color] };
        if (gender) query.gender = gender;
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        //? Apply sorting
        let sort = {};
        if (sortBy) {
            switch (sortBy) {
                case "priceAsc":
                    sort = { price: 1 };
                    break;
                case "priceDesc":
                    sort = { price: -1 };
                    break;
                case "popularity":
                    sort = { rating: -1 };
                    break;
                default:
                    break;
            }
        }

        //? fetch products and apply sorting and limits:
        let products = await Product.find(query)
            .sort(sort)
            .limit(Number(limit) || 0);

        res.status(200).json(products);
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
});

//! @route GET /api/products/best-seller
//! @desc Retrieve the products with the highest rating
//! @access Public
router.get("/best-seller", async (req, res) => {
    try {
        const bestSeller = await Product.find().sort({ rating: -1 });
        if (bestSeller) {
            res.status(200).json(bestSeller);
        } else {
            res.status(404).json({ message: "No best sellers found" });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
});

//! @route GET /api/products/new-arrivals
//! @desc Retrieve latest 8 products - creation date
//! @access Public
router.get("/new-arrivals", async (req, res) => {
    try {
        const newArrivals = await Product.find().sort({ createdAt: -1 }).limit(8);
        if (newArrivals) {
            res.status(200).json(newArrivals);
        } else {
            res.status(404).json({ message: "No new arrivals found" });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
}) 

//! @route GET /api/products/:id
//! @desc Get a single product by id
//! @access Public
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            res.status(200).json(product);
        } else {
            res.status(404).json({ message: "Product Not Found" });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
});

//! @route GET /api/products/similar/:id
//! @desc Retrieve similar products based on the current product's gender & category
//! @access Public
router.get("/similar/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            const similarProducts = await Product.find({
                _id: { $ne: product._id },
                gender: product.gender,
                category: product.category,
            }).limit(4);

            res.status(200).json(similarProducts);
        } else {
            res.status(404).json({ message: "Product Not Found" });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;
