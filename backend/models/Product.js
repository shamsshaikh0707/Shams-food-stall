const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    price: {
        type: Number,
        required: true,
        min: 0
    },

    available: {
        type: Boolean,
        default: true
    },

    image: {
        type: String,
        default: ""
    }
});

module.exports = mongoose.model("Product", productSchema);