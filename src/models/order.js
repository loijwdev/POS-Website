const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
  },
  customer_name: {
    type: String,
    ref: 'Customer',
  },
  staff_name: {
    type: String,
    ref: 'User'
  },
  products: [
    {
      product_name: {
        type: String,
        ref: 'Product',
      },
      product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', 
      },
      quantity: Number,
      unit_price: Number,
      total_price: Number,
    },
  ],
  total_amount: Number,
  amount_given: Number,
  change_given: Number,
  discount: Number,
  created: {
    type: Date,
    required: true,
    default: Date.now,
},
  payment_method: {
    type: String,
  }
});
const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
