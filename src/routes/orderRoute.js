const express = require('express')
const router = express.Router()

const {createOrder, getOrder, downloadInvoice, getAllOrder, getRevenueLastSixMonths, getSoldProductsStatistics} = require('../controllers/orderController')

router.post("/checkout/:id", createOrder);
router.get("/getOrder/:id",getOrder)
router.get("/download-invoice/:id", downloadInvoice)
router.get("/", getAllOrder)
router.get("/getrevenue6m", getRevenueLastSixMonths)
router.get("/getProductsStatistics", getSoldProductsStatistics)


module.exports = router
