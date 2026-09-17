const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        name: {
            type: String,
            required: true
        },

        price: {
            type: Number,
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    },
    {
        _id: false
    }
);

const orderSchema = new mongoose.Schema(
    {
        customer: {
            name: {
                type: String,
                required: true
            },

            phone: {
                type: String,
                required: true
            }
        },

        address: {
            house: {
                type: String,
                required: true
            },

            street: {
                type: String,
                required: true
            },

            city: {
                type: String,
                required: true
            },

            pincode: {
                type: String,
                required: true
            }
        },

        note: {
            type: String,
            default: ""
        },

        items: {
            type: [orderItemSchema],
            required: true
        },

        total: {
            type: Number,
            required: true
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Preparing",
                "Ready",
                "Delivered",
                "Cancelled"
            ],
            default: "Pending"
        }
    },

    {
        timestamps: true
    }
);

module.exports = mongoose.model("Order", orderSchema);