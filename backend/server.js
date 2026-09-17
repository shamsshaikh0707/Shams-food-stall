const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();

const Product = require("./models/Product");
const Order = require("./models/Order");

const app = express();
const PORT = 3000;

/* =========================================
   MIDDLEWARE
   ========================================= */

app.use(cors());
app.use(express.json());

/* =========================================
   FRONTEND + ADMIN
   ========================================= */

app.use(
    "/frontend",
    express.static(path.join(__dirname, "../frontend"))
);

app.use(
    "/admin",
    express.static(path.join(__dirname, "../admin"))
);

/* =========================================
   ADMIN AUTHENTICATION
   ========================================= */

const adminSessions = new Set();

function requireAdmin(req, res, next) {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Admin authentication required"
        });
    }

    const token = authHeader.substring(7);

    if (!adminSessions.has(token)) {
        return res.status(401).json({
            message: "Invalid or expired admin session"
        });
    }

    next();
}

/* =========================================
   ADMIN LOGIN
   ========================================= */

app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;

    if (
        username !== process.env.ADMIN_USERNAME ||
        password !== process.env.ADMIN_PASSWORD
    ) {
        return res.status(401).json({
            message: "Invalid username or password"
        });
    }

    const token = crypto.randomBytes(32).toString("hex");

    adminSessions.add(token);

    res.json({
        message: "Login successful",
        token
    });
});

/* =========================================
   ADMIN LOGOUT
   ========================================= */

app.post("/api/admin/logout", requireAdmin, (req, res) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.substring(7);

    adminSessions.delete(token);

    res.json({
        message: "Logged out successfully"
    });
});

/* =========================================
   CHECK ADMIN SESSION
   ========================================= */

app.get("/api/admin/check", requireAdmin, (req, res) => {
    res.json({
        authenticated: true
    });
});

/* =========================================
   GET PRODUCTS
   PUBLIC
   ========================================= */

app.get("/api/products", async (req, res) => {
    try {
        const products = await Product.find().sort({
            _id: -1
        });

        res.json(products);
    } catch (error) {
        console.error("Get products error:", error);

        res.status(500).json({
            message: "Failed to fetch products"
        });
    }
});

/* =========================================
   ADD PRODUCT
   ADMIN ONLY
   ========================================= */

app.post("/api/products", requireAdmin, async (req, res) => {
    try {
        const {
            name,
            price,
            available,
            image
        } = req.body;

        if (!name || price === undefined) {
            return res.status(400).json({
                message: "Product name and price are required"
            });
        }

        const product = await Product.create({
            name: String(name).trim(),
            price: Number(price),
            available:
                available === undefined
                    ? true
                    : Boolean(available),
            image: image || ""
        });

        res.status(201).json({
            message: "Product added successfully",
            product
        });
    } catch (error) {
        console.error("Add product error:", error);

        res.status(500).json({
            message: "Failed to add product"
        });
    }
});

/* =========================================
   UPDATE PRODUCT
   ADMIN ONLY
   ========================================= */

app.put("/api/products/:id", requireAdmin, async (req, res) => {
    try {
        const {
            name,
            price,
            available,
            image
        } = req.body;

        const updateData = {};

        if (name !== undefined) {
            updateData.name = String(name).trim();
        }

        if (price !== undefined) {
            updateData.price = Number(price);
        }

        if (available !== undefined) {
            updateData.available = Boolean(available);
        }

        if (image !== undefined) {
            updateData.image = image;
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json({
            message: "Product updated successfully",
            product
        });
    } catch (error) {
        console.error("Update product error:", error);

        res.status(500).json({
            message: "Failed to update product"
        });
    }
});

/* =========================================
   DELETE PRODUCT
   ADMIN ONLY
   ========================================= */

app.delete("/api/products/:id", requireAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(
            req.params.id
        );

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json({
            message: "Product deleted successfully"
        });
    } catch (error) {
        console.error("Delete product error:", error);

        res.status(500).json({
            message: "Failed to delete product"
        });
    }
});

/* =========================================
   CREATE ORDER
   PUBLIC
   ========================================= */

app.post("/api/orders", async (req, res) => {
    try {
        const {
            customer,
            address,
            note,
            items,
            total
        } = req.body;

        /* -----------------------------
           CUSTOMER VALIDATION
           ----------------------------- */

        if (
            !customer ||
            !customer.name ||
            !customer.phone
        ) {
            return res.status(400).json({
                message: "Customer name and phone are required"
            });
        }

        /* -----------------------------
           ADDRESS VALIDATION
           ----------------------------- */

        if (
            !address ||
            !address.house ||
            !address.street ||
            !address.city ||
            !address.pincode
        ) {
            return res.status(400).json({
                message: "Complete address is required"
            });
        }

        /* -----------------------------
           ITEMS VALIDATION
           ----------------------------- */

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "Order must contain at least one item"
            });
        }

        /* -----------------------------
           TOTAL VALIDATION
           ----------------------------- */

        if (
            total === undefined ||
            Number(total) <= 0
        ) {
            return res.status(400).json({
                message: "Invalid order total"
            });
        }

        /* -----------------------------
           CLEAN ORDER ITEMS
           ----------------------------- */

        const cleanItems = items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: Number(item.price),
            quantity: Number(item.quantity)
        }));

        /* -----------------------------
           CREATE ORDER
           ----------------------------- */

        const order = await Order.create({
            customer: {
                name: String(customer.name).trim(),
                phone: String(customer.phone).trim()
            },

            address: {
                house: String(address.house).trim(),
                street: String(address.street).trim(),
                city: String(address.city).trim(),
                pincode: String(address.pincode).trim()
            },

            note: note
                ? String(note).trim()
                : "",

            items: cleanItems,

            total: Number(total),

            status: "Pending"
        });

        console.log("");
        console.log("🔔 NEW ORDER RECEIVED!");
        console.log("Order ID:", order._id);
        console.log("Customer:", order.customer.name);
        console.log("Phone:", order.customer.phone);
        console.log("Total:", order.total);
        console.log("");

        res.status(201).json({
            message: "Order placed successfully",
            order
        });
    } catch (error) {
        console.error("Create order error:", error);

        res.status(500).json({
            message: "Failed to place order"
        });
    }
});

/* =========================================
   GET ALL ORDERS
   ADMIN ONLY
   ========================================= */

app.get("/api/orders", requireAdmin, async (req, res) => {
    try {
        const orders = await Order.find().sort({
            createdAt: -1
        });

        res.json(orders);
    } catch (error) {
        console.error("Get orders error:", error);

        res.status(500).json({
            message: "Failed to fetch orders"
        });
    }
});

/* =========================================
   GET SINGLE ORDER
   ADMIN ONLY
   ========================================= */

app.get("/api/orders/:id", requireAdmin, async (req, res) => {
    try {
        const order = await Order.findById(
            req.params.id
        );

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        res.json(order);
    } catch (error) {
        console.error("Get order error:", error);

        res.status(500).json({
            message: "Failed to fetch order"
        });
    }
});

/* =========================================
   UPDATE ORDER STATUS
   ADMIN ONLY
   ========================================= */

app.put(
    "/api/orders/:id/status",
    requireAdmin,
    async (req, res) => {
        try {
            const { status } = req.body;

            const allowedStatuses = [
                "Pending",
                "Preparing",
                "Ready",
                "Delivered",
                "Cancelled"
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid order status"
                });
            }

            const order =
                await Order.findByIdAndUpdate(
                    req.params.id,
                    {
                        status
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                );

            if (!order) {
                return res.status(404).json({
                    message: "Order not found"
                });
            }

            res.json({
                message: "Order status updated successfully",
                order
            });
        } catch (error) {
            console.error(
                "Update order status error:",
                error
            );

            res.status(500).json({
                message: "Failed to update order status"
            });
        }
    }
);

/* =========================================
   DELETE ORDER
   ADMIN ONLY
   ========================================= */

app.delete(
    "/api/orders/:id",
    requireAdmin,
    async (req, res) => {
        try {
            const order =
                await Order.findByIdAndDelete(
                    req.params.id
                );

            if (!order) {
                return res.status(404).json({
                    message: "Order not found"
                });
            }

            res.json({
                message: "Order deleted successfully"
            });
        } catch (error) {
            console.error(
                "Delete order error:",
                error
            );

            res.status(500).json({
                message: "Failed to delete order"
            });
        }
    }
);

/* =========================================
   ROOT ROUTE
   ========================================= */

app.get("/", (req, res) => {
    res.redirect("/frontend/");
});

/* =========================================
   404 API HANDLER
   ========================================= */

app.use("/api", (req, res) => {
    res.status(404).json({
        message: "API route not found"
    });
});

/* =========================================
   MONGODB CONNECTION
   ========================================= */

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("");
        console.log("=================================");
        console.log("🍔 SHAMS FOOD STALL");
        console.log("=================================");
        console.log(
            "Backend: http://localhost:3000"
        );
        console.log(
            "Frontend: http://localhost:3000/frontend/"
        );
        console.log(
            "Admin: http://localhost:3000/admin/"
        );
        console.log("=================================");
        console.log("");
        console.log(
            "MongoDB connected successfully!"
        );
        console.log("");
    })
    .catch((error) => {
        console.error(
            "MongoDB connection failed:",
            error.message
        );
    });

/* =========================================
   START SERVER
   ========================================= */

app.listen(PORT, () => {
    console.log(
        `Server running on http://localhost:${PORT}`
    );
});