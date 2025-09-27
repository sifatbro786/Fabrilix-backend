const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

//* helper function to get a cart by userId or guestId
const getCart = async (userId, guestId) => {
    if (userId) {
        return await Cart.findOne({ user: userId });
    } else if (guestId) {
        return await Cart.findOne({ guestId });
    }
    return null;
};

//! @route POST /api/cart
//! @desc Add a product to the cart for a guest or loggedIn user
//! @access Private
router.post("/", async (req, res) => {
    const { productId, quantity, size, color, guestId, userId } = req.body;

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        //? determine if the user is loggedIn or guest
        let cart = await getCart(userId, guestId);

        //? if the cart exists, update it
        if (cart) {
            const productIndex = cart.products.findIndex(
                (p) => p.productId.toString() === productId && p.size === size && p.color === color,
            );
            if (productIndex > -1) {
                // ? if the product already exists in the cart, update the quantity
                cart.products[productIndex].quantity += Number(quantity);
            } else {
                // ? if the product doesn't exist in the cart, add it
                cart.products.push({
                    productId,
                    name: product.name,
                    image: product.images[0].url,
                    price: product.price,
                    size,
                    color,
                    quantity,
                });
            }

            //? recalculate the total price of the cart
            cart.totalPrice = cart.products.reduce(
                (acc, item) => acc + item.price * item.quantity,
                0,
            );

            await cart.save();
            res.status(200).json(cart);
        } else {
            //? create a new cart for the guest or loggedIn user
            const newCart = await Cart.create({
                user: userId ? userId : undefined,
                guestId: guestId ? guestId : "guest_" + new Date().getTime(),
                products: [
                    {
                        productId,
                        name: product.name,
                        image: product.images[0].url,
                        price: product.price,
                        size,
                        color,
                        quantity,
                    },
                ],
                totalPrice: product.price * quantity,
            });

            return res.status(201).json(newCart);
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
});

//! @route PUT /api/cart
//! @desc Update product quantity in the cart for a guest or loggedIn user
//! @access Public
router.put("/", async (req, res) => {
    const { productId, quantity, size, color, guestId, userId } = req.body;

    try {
        let cart = await getCart(userId, guestId);
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        const productIndex = cart.products.findIndex(
            (p) => p.productId.toString() === productId && p.size === size && p.color === color,
        );
        if (productIndex > -1) {
            //? update quantity
            if (quantity > 0) {
                cart.products[productIndex].quantity = quantity;
            } else {
                cart.products.splice(productIndex, 1);
            }

            //? recalculate the total price of the cart
            cart.totalPrice = cart.products.reduce(
                (acc, item) => acc + item.price * item.quantity,
                0,
            );

            await cart.save();
            res.status(200).json(cart);
        } else {
            res.status(404).json({ message: "Product not found in cart" });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
});

//! @route DELETE /api/cart
//! @desc Remove a product from the cart
//! @access Public
router.delete("/", async (req, res) => {
    const { productId, size, color, guestId, userId } = req.body;

    try {
        let cart = await getCart(userId, guestId);
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        const productIndex = cart.products.findIndex(
            (p) => p.productId.toString() === productId && p.size === size && p.color === color,
        );
        if (productIndex > -1) {
            cart.products.splice(productIndex, 1);
            cart.totalPrice = cart.products.reduce(
                (acc, item) => acc + item.price * item.quantity,
                0,
            );
            await cart.save();
            res.status(200).json(cart);
        } else {
            res.status(404).json({ message: "Product not found in cart" });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
});

//! @route GET /api/cart
//! @desc Get loggedIn user's or guest user's cart
//! @access Public
router.get("/", async (req, res) => {
    const { userId, guestId } = req.query;

    try {
        const cart = await getCart(userId, guestId);
        if (cart) {
            res.status(200).json(cart);
        } else {
            res.status(404).json({ message: "Cart not found" });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
});

//! @route GET /api/cart/merge
//! @desc Merge guest cart with loggedIn user's cart
//! @access Private
router.post("/merge", protect, async (req, res) => {
    const { guestId } = req.body;

    try {
        //? find the guest cart and user cart:
        const guestCart = await Cart.findOne({ guestId });
        const userCart = await Cart.findOne({ user: req.user.id });

        if (guestCart) {
            if (guestCart.products.length === 0) {
                res.status(404).json({ message: "Guest cart is empty" });
            }

            if (userCart) {
                //? merge guest cart into user cart:
                guestCart.products.forEach((guestItem) => {
                    const productIndex = userCart.products.findIndex(
                        (item) =>
                            item.productId.toString() === guestItem.productId.toString() &&
                            item.size === guestItem.size &&
                            item.color === guestItem.color,
                    );

                    if (productIndex > -1) {
                        userCart.products[productIndex].quantity += guestItem.quantity;
                    } else {
                        userCart.products.push(guestItem);
                    }
                });

                userCart.totalPrice = userCart.products.reduce(
                    (acc, item) => acc + item.price * item.quantity,
                    0,
                );

                await userCart.save();

                //? remove the guest cart after merging:
                try {
                    await Cart.findOneAndDelete({ guestId });
                } catch (err) {
                    console.log("Error while deleting guest cart", err.message);
                }
                res.status(200).json(userCart);
            } else {
                //? if the user has no existing cart, assign the guest cart to the user:
                guestCart.user = req.user._id;
                guestCart.guestId = undefined;
                await guestCart.save();

                res.status(200).json(guestCart);
            }
        } else {
            //? guest cart has already been merged, return user cart:
            if (userCart) {
                res.status(200).json(userCart);
            } else {
                res.status(404).json({ message: "Guest cart not found" });
            }
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;
