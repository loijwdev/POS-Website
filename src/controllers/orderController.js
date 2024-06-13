const Order = require("../models/order");
const Product = require("../models/product");
const moment = require("moment");
var ObjectId = require("mongodb").ObjectId;
const puppeteer = require("puppeteer");
const createOrder = async (req, res) => {
  try {
    const id = req.params.id;
    const {
      totalAmount,
      paymentMethod,
      products,
      customerName,
      amount_given,
      change_given,
      discount,
      nameStaff,
    } = req.body;

    // Iterate through each product in the order
    for (const orderProduct of products) {
      const productId = orderProduct.product_id;
      const quantitySold = orderProduct.quantity;

      const product = await Product.findById(productId);
      if (!product) {
        throw new Error(`Product with ID ${productId} not found.`);
      }
      if (product.quantityInStock < quantitySold) {
        throw new Error(`Insufficient quantity in stock for product ${productId}.`);
      }
      product.quantityInStock -= quantitySold;
      await product.save();
    }

    const newOrder = new Order({
      customer_id: id,
      customer_name: customerName,
      staff_name: nameStaff,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      products: products,
      amount_given: amount_given,
      change_given: change_given,
      discount: discount,
    });
    const savedOrder = await newOrder.save();
    res.json({ success: true, message: "Order saved to the database.", order: savedOrder });
  } catch (error) {
    console.error("Error saving order:", error);
    res.json({ success: false, error: "An error occurred while saving the order." });
  }
};

const getAllOrder = async (req, res) => {
  const { role, firstname, avt } = req.session.user;
  let { page, pageSize, search } = req.query;
  // Set default values if not provided
  page = page ? parseInt(page, 10) : 1;
  pageSize = pageSize ? parseInt(pageSize, 10) : 5;

  // Create a MongoDB query object based on search criteria
  const query = {};
  if (search) {
    try {
      query._id = new ObjectId(search);
    } catch (error) {
      req.session.orderMessage = {
        type: "danger",
        message: "Hãy nhập đầy đủ mã hóa đơn",
      };
    }
  }
  // Fetch products with pagination and search
  const orders = await Order.find(query)
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .exec();
  const totalOrders = await Order.countDocuments(query);

  const totalPages = Math.ceil(totalOrders / pageSize);

  const pagination = {
    pages: Array.from({ length: totalPages }, (_, i) => ({
      page: i + 1,
      isCurrent: i + 1 === page,
    })),
    pageSize,
    currentPage: page,
    totalOrders,
  };
  if (page > 1) {
    pagination.prevPage = page - 1;
  }

  if (page < totalPages) {
    pagination.nextPage = page + 1;
  }
  const plainOrder = orders.map((order) => ({
    ...order.toJSON(),
    created: moment(order.created).format("DD/MM/YYYY HH:mm:ss"),
    total_amount: formatCurrency(order.total_amount),
  }));
  res.render("order", {
    orders: plainOrder,
    avt,
    firstname,
    role,
    totalPages,
    search,
    pagination,
  });
};

const getOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const orders = await Order.findById(orderId).exec();
    console.log(orders);
    res.json(orders);
  } catch (err) {
    res.status(500).send("Error fetching order data");
  }
};

const formatCurrency = (amount) => {
  const formattedAmount = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
  return formattedAmount;
};

const generatePDF = async (htmlContent, res, orderId) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({ format: "A5", printBackground: true });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="invoice_${orderId}.pdf"`
  );
  res.status(200).send(pdfBuffer);

  await browser.close();
};




const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId).exec();
    const formattedDate = moment(order.created).format("DD/MM/YYYY HH:mm:ss");
    const formattedTotalAmount = formatCurrency(order.total_amount);
    // Create HTML content for the PDF
    const htmlContent = `
        <div class="modal fade" id="exampleModal" class="modal" tabindex="-1" role="dialog"
        aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content" id="invoicemodal">
                <div class="modal-body">
                    <div id="finalinvoice">
                        <div id="print_invoice" <div="" class="col-12 partition">
                            <center>
                                <h5 class="font-weight-bolder w-50"><img style="width:13%; height:7%"src="http://localhost:3031/images/logoWeb.png" alt="" /></h5>
                                <h5>Số 19, đường Nguyễn Hữu Thọ, phường Tân Phong, Quận 7, TP. Hồ Chí Minh</h5>
                                <p><span class="font-weight-bold font-14">Điện thoại: </span>(028) 37 755 035</p>
                                <p><span class="font-weight-bold font-14">Email:
                                    </span>tonducthanguniversity@tdtu.edu.vn</p>
                            </center>
                        </div>
                        <hr>
                        <div class="row d-flex justify-content-around">
                            <div class="col-6">
                                <p id="orderNumber"><span class="font-weight-bold">Order Id: ${
                                  order._id
                                }</span></p>
                            </div>
                            <div class="col-6">
                                <p id="orderDate">Ngày và giờ: ${formattedDate}</p>
                            </div>
                        </div>
                        <div class="row d-flex justify-content-around">
                            <div class="col-6">
                                <p id="orderNameCus"><span class="font-weight-bold">Tên khách hàng: ${
                                  order.customer_name
                                }</span></p>
                            </div>
                            <div class="col-6">
                                <p id="orderPaymentMethod"><span>Phương thức thanh toán: ${
                                  order.payment_method
                                }</span></p>
                            </div>
                        </div>
                        <div class="row d-flex justify-content-around">
                            <div class="col-6">
                                <p id="orderNameStaff"><span class="font-weight-bold">Nhân viên: ${
                                  order.staff_name
                                }</span></p>
                            </div>
                            <div class="col-6">
                            </div>
                        </div>
                        <div class="table-responsive">
                            <table id="default-datatable" class="display table  ">
                                <thead>
                                    <tr>
                                        <th>Sr No</th>
                                        <th> Tên</th>
                                        <th> Số lượng</th>
                                        <th> Giá</th>
                                        <th> Tổng giá</th>
                                    </tr>
                                </thead>
                                <tbody id="item" class="align-items-center">
                                ${order.products
                                  .map(
                                    (product, index) => `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td>${product.product_name}</td>
                                        <td>${product.quantity}</td>
                                        <td>${formatCurrency(
                                          product.unit_price
                                        )}</td>
                                        <td>${formatCurrency(
                                          product.total_price
                                        )}</td>
                                    </tr>
                                `
                                  )
                                  .join("            ")}
                                </tbody>
                            </table>
                        </div>
                        <hr>
                        <div class="row justify-content-end" style="marin:-15px">
                            <table class="col-6 table table-borderless text-right">
                                <tbody>
                                <tr>
                                <td>Tổng giá thực:</td>
                                <td class="text-left"><span id="oldTotalAmountInvoice">${formatCurrency(order.total_amount /(1 - order.discount / 100)
                                )}</span></td>
                                </tr>
                                    <tr>
                                        <td>Khuyến mãi:</td>
                                        <td class="text-left"><span id="discount"> ${
                                          order.discount
                                        }%</span></td>
                                    </tr>
                                    <tr>
                                        <td class="font-weight-bold font-18">Tổng giá hóa đơn :</td>
                                        <td class="text-left" id="totalAmountInvoice">${formattedTotalAmount}</td>
                                    </tr>
                                    <tr>
                                            <td>Tiền nhận:</td>
                                            <td class="text-left"><span id="amount_given">${formatCurrency(
                                              order.amount_given
                                            )}</span></td>
                                        </tr>
                                        <tr>
                                            <td>Tiền thối:</td>
                                            <td class="text-left"><span id="change_given">${formatCurrency(
                                              order.change_given
                                            )}</span></td>
                                        </tr>
                                </tbody>
                            </table>
                        </div>
                        <hr>
                        <div class="row">
                            <p class="m-l-15">Mobile&Accessories</p>
                        </div>
                        <center>
                            <h3 class="font-18">******** Xin cám ơn quý khách ********</h3>
                        </center>
                        <hr>
                    </div>
                </div>
            </div>
        </div>
    </div>
        `;
    // Generate and download the PDF
    await generatePDF(htmlContent, res, orderId);
  } catch (err) {
    res.status(500).json({ error: "Error fetching order data" });
  }
};

const getRevenueLastSixMonths = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const pipeline = [
      {
        $match: {
          created: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: { $month: "$created" },
          totalAmount: { $sum: "$total_amount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ];
    const result = await Order.aggregate(pipeline);
    res.json(result);
  } catch (error) {
    console.error("Error fetching revenue:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching revenue." });
  }
};

const getSoldProductsStatistics = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $unwind: "$products",
      },
      {
        $group: {
          _id: "$products.product_name",
          quantity: { $sum: "$products.quantity" },
        },
      },
      {
        $sort: { quantity: -1 },
      },
      {
        $limit: 4, 
      }
    ]);
    res.json(result);
  } catch (error) {
    console.error("Error fetching sold products statistics:", error);
    throw error;
  }
};

module.exports = {
  createOrder,
  getOrder,
  downloadInvoice,
  getAllOrder,
  getRevenueLastSixMonths,
  getSoldProductsStatistics,
};
