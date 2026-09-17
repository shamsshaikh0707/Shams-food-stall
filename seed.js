const mongoose = require("mongoose");
require("dotenv").config({
    path: "./backend/.env"
});

const Product = require("./backend/models/Product");

const products = [
    {
        name: "Chicken Biryani",
        price: 150,
        available: true,
        image: ""
    },
    {
        name: "Chicken Roll",
        price: 80,
        available: true,
        image: ""
    },
    {
        name: "Chicken Burger",
        price: 120,
        available: true,
        image: ""
    },
    {
        name: "French Fries",
        price: 70,
        available: true,
        image: ""
    },
    {
        name: "Chicken Shawarma",
        price: 130,
        available: true,
        image: ""
    },
    {
        name: "Cold Drink",
        price: 40,
        available: true,
        image: ""
    }
];

async function seedDatabase() {
    try {
        console.log("");
        console.log("=================================");
        console.log("🍔 SHAMS FOOD STALL - SEED");
        console.log("=================================");

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected successfully!");

        await Product.deleteMany({});

        console.log("Old products removed.");

        const insertedProducts = await Product.insertMany(products);

        console.log("");
        console.log(`${insertedProducts.length} products added successfully!`);
        console.log("");

        insertedProducts.forEach((product) => {
            console.log(
                `✓ ${product.name} - ₹${product.price}`
            );
        });

        console.log("");
        console.log("=================================");
        console.log("✅ DATABASE SEEDED SUCCESSFULLY");
        console.log("=================================");
        console.log("");
    } catch (error) {
        console.error("");
        console.error("❌ Seed failed:");
        console.error(error.message);
        console.error("");
    } finally {
        await mongoose.connection.close();
        console.log("MongoDB connection closed.");
    }
}

seedDatabase();