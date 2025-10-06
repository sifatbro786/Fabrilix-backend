const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        discountPrice: {
            type: Number,
            default: 0,
        },
        countInStock: {
            type: Number,
            required: true,
            default: 0,
        },
        gender: {
            type: String,
            enum: ["Men", "Women"],
            required: true,
        },
        sku: {
            type: String,
            unique: true,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        brand: {
            type: String,
            default: "",
        },
        sizes: {
            type: [String],
            required: true,
        },
        colors: {
            type: [String],
            required: true,
        },
        collections: {
            type: String,
            trim: true,
            default: "",
        },
        material: {
            type: String,
            default: "",
        },
        images: [
            {
                url: { type: String, required: true },
                public_id: { type: String },
                altText: { type: String },
            },
        ],

        isFeatured: {
            type: Boolean,
            default: false,
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
        rating: {
            type: Number,
            default: 0,
        },
        numReviews: {
            type: Number,
            default: 0,
        },
        tags: {
            type: [String],
            default: [],
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        metaTitle: {
            type: String,
            default: "",
        },
        metaDescription: {
            type: String,
            default: "",
        },
        metaKeywords: {
            type: String,
            default: "",
        },
        dimensions: {
            length: { type: Number, default: 0 },
            width: { type: Number, default: 0 },
            height: { type: Number, default: 0 },
        },
        weight: {
            type: Number,
            default: 0,
        },
    },

    {
        timestamps: true,
    },
);

module.exports = mongoose.model("Product", productSchema);
