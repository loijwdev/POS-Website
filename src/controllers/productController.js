const express = require("express");
const mongoose = require("mongoose");
const moment = require("moment");
const Product = require("../models/product");
const fs = require("fs");
const bwipjs = require("bwip-js");
const Order = require("../models/order");
const getAddProduct = (req, res) => {
  const {
    name,
    email,
    role,
    state,
    _id,
    lastname,
    firstname,
    birthday,
    phone,
    avt,
  } = req.session.user;
  res.render("addProduct", { role, firstname, avt });
};

const createProduct = async (req, res) => {
  try {
    const productUPC = req.body.barcode;
    const barcodeBase64 = await generateBarcode(productUPC);

    const product = new Product({
      image: req.file.filename,
      name: req.body.namePd,
      importPrice: req.body.importPrice,
      retailPrice: req.body.retailPrice,
      category: req.body.product_category,
      barcode: barcodeBase64,
      barcodeUPC: productUPC,
      quantityInStock: req.body.quantityInStock
    });
    await product.save();
    req.session.message = {
      type: "success",
      message: "Product added successfully",
    };
    res.redirect("/product");
  } catch (err) {
    console.error(err);
    req.session.message = {
      type: "danger",
      message: err.message,
    };
    res.status(500).redirect("/product/addProduct");
  }
};

function generateBarcode(productUPC) {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: "upca",
        text: productUPC,
        scale: 3,
        height: 10,
      },
      function (err, png) {
        if (err) {
          reject(err);
        } else {
          resolve(png.toString("base64"));
        }
      }
    );
  });
}

const formatCurrency = (amount) => {
  const formattedAmount = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
  return formattedAmount;
};

const getProducts = async (req, res) => {
  try {
    const {
      name,
      email,
      role,
      state,
      _id,
      lastname,
      firstname,
      birthday,
      phone,
      avt,
    } = req.session.user;
    let { page, pageSize, search } = req.query;

    // Set default values if not provided
    page = page ? parseInt(page, 10) : 1;
    pageSize = pageSize ? parseInt(pageSize, 10) : 5;

    // Create a MongoDB query object based on search criteria
    const query = {};
    if (search) {
      query.name = { $regex: new RegExp(search, "i") }; // Case-insensitive search on the 'name' field
    }

    // Fetch products with pagination and search
    const products = await Product.find(query)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();

    const totalProducts = await Product.countDocuments(query);

    const totalPages = Math.ceil(totalProducts / pageSize);

    const pagination = {
      pages: Array.from({ length: totalPages }, (_, i) => ({
        page: i + 1,
        isCurrent: i + 1 === page,
      })),
      pageSize,
      currentPage: page,
      totalProducts,
    };

    // Include information about the previous and next pages
    if (page > 1) {
      pagination.prevPage = page - 1;
    }

    if (page < totalPages) {
      pagination.nextPage = page + 1;
    }

    const plainProducts = products.map((product) => ({
      ...product.toJSON(),
      created: moment(product.created).format("DD/MM/YYYY HH:mm:ss"),
      importPrice: formatCurrency(product.importPrice),
      retailPrice: formatCurrency(product.retailPrice),
      role,
    }));

    res.render("product", {
      products: plainProducts,
      firstname,
      role,
      totalPages,
      search,
      pagination,
      avt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const editProduct = async (req, res) => {
  try {
    const {
      name,
      email,
      role,
      state,
      _id,
      lastname,
      firstname,
      birthday,
      phone,
      avt,
    } = req.session.user;
    const id = req.params.id;
    const product = await Product.findOne({ _id: id }).exec();

    if (!product) {
      return res.redirect("/product");
    }

    res.render("editProduct", {
      product: product,
      firstname,
      role,
      avt,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/product");
  }
};

const updateProduct = async (req, res) => {
  const id = req.params.id;
  const newImage = req.file ? req.file.filename : req.body.old_image;

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name: req.body.namePd,
        importPrice: req.body.importPrice,
        retailPrice: req.body.retailPrice,
        category: req.body.product_category,
        image: newImage,
        barcodeUPC: req.body.barcode,
        quantityInStock: req.body.quantityInStock
      },
      { new: true }
    );

    if (!updatedProduct) {
      throw new Error("Product not found");
    }

    if (req.file) {
      try {
        fs.unlinkSync(`./src/public/uploads/${req.body.old_image}`);
      } catch (err) {
        console.log(err);
      }
    }

    req.session.message = {
      type: "success",
      message: "Product updated successfully",
    };
    res.redirect("/product");
  } catch (err) {
    console.error(err);
    req.session.message = {
      type: "danger",
      message: err.message,
    };
    res.redirect("/product");
  }
};

const deleteProduct = async (req, res) => {
  let id = req.params.id;

  try {
    // Check if the product is associated with any order
    const isInOrder = await Order.exists({ "products.product_id": id });

    if (isInOrder) {
      // Product is in an order, cannot delete
      req.session.message = {
        type: "danger",
        message: "Không thể xóa sản phẩm",
      };
      res.redirect("/product");
      return;
    }

    // Product is not in any order, proceed with deletion
    const result = await Product.findOneAndDelete({ _id: id }).exec();

    if (result && result.image !== "") {
      try {
        fs.unlinkSync("./src/public/uploads/" + result.image);
        console.log("Image deleted:", result.image);
      } catch (err) {
        console.log("Error deleting image:", err);
      }
    }

    req.session.message = {
      type: "danger",
      message: "Product deleted successfully",
    };

    res.redirect("/product");
  } catch (err) {
    res.json({ message: err.message });
  }
};

const getAllProducts = async () => {
  try {
    const products = await Product.find().exec();
    const plainProducts = products.map((product) => ({
      ...product.toJSON(),
      created: moment(product.created).format("DD/MM/YYYY HH:mm:ss"),
      retailPriceFormatted: new Intl.NumberFormat("vi-VN").format(
        product.retailPrice
      ),
    }));
    return plainProducts;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getAddProduct,
  getProducts,
  editProduct,
  updateProduct,
  deleteProduct,
};
