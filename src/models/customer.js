const mongoose = require("mongoose")
const customertSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    address: String,
    gender: String 
})

module.exports = mongoose.model('Customer',customertSchema)