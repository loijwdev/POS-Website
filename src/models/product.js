const mongoose = require("mongoose")
const productSchema = new mongoose.Schema({
    barcodeUPC: {
        type: String,
        required: true
    },
    barcode: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    importPrice: {
        type: Number,
        required: true
    },
    retailPrice: {
        type:Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    quantityInStock: {
        type: Number,
        required: true,
        default: 5
    },
    created: {
        type: Date,
        required: true,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now()
      }
})

module.exports = mongoose.model('Product',productSchema)