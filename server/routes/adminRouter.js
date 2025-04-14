const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
const Seller = require('../models/sellerModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Category = require('../models/Category');
const adminLoggedin = require('../middleware/adminLoggedin');
const multer = require('multer');
const { uploadToCloudinary } = require('../config/clowdnaryConfig');
const mongoose = require('mongoose');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, or JPG files allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Validation middleware
const validateRequiredFields = (fields) => (req, res, next) => {
  const missingFields = fields.filter((field) => {
    if (field === 'images') return !req.files || req.files.length === 0;
    return !req.body[field];
  });
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(', ')}`,
    });
  }
  next();
};

// Admin Creation
router.post('/create', async (req, res) => {
  try {
    const { phoneNumber, email, name, password } = req.body;
    if (!phoneNumber || !password || !name) {
      return res.status(400).json({ success: false, message: 'Phone number, name, and password are required' });
    }

    const existingAdmin = await Admin.findOne({ phoneNumber });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Admin already exists' });
    }

    const admin = new Admin({ phoneNumber, email, name, password });
    await admin.save();

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: { id: admin._id, phoneNumber, email, name },
    });
  } catch (error) {
    console.error('Admin creation failed:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    if (!phoneNumber || !password) {
      return res.status(400).json({ success: false, message: 'Phone number and password are required' });
    }

    const admin = await Admin.findOne({ phoneNumber }).select('+password');
    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, phoneNumber: admin.phoneNumber, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      admin: { id: admin._id, phoneNumber: admin.phoneNumber, name: admin.name, role: 'admin' },
      token,
    });
  } catch (error) {
    console.error('Admin login failed:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Verify Token
router.get('/verify-token', adminLoggedin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      admin: { id: admin._id, phoneNumber: admin.phoneNumber, name: admin.name, role: 'admin' },
    });
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ success: false, message: 'Invalid or expired token', error: error.message });
  }
});

// Get All Sellers
router.get('/sellers', adminLoggedin, async (req, res) => {
  try {
    const sellers = await Seller.find({})
      .populate({ path: 'products', select: 'name price status' })
      .populate({ path: 'orders', select: 'orderId total status' });
    res.status(200).json({ success: true, sellers });
  } catch (error) {
    console.error('Failed to fetch sellers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sellers', error: error.message });
  }
});

// Update Seller
router.put('/sellers/:id', adminLoggedin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, name, shopName, address, email, phoneNumber } = req.body;

    if (status && !['pending', 'enabled', 'disabled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (name) updateData.name = name.trim();
    if (shopName) updateData.shopName = shopName.trim();
    if (address) updateData.address = address.trim();
    if (email) updateData.email = email.trim();
    if (phoneNumber) updateData.phoneNumber = phoneNumber.trim();

    const seller = await Seller.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    res.status(200).json({ success: true, seller });
  } catch (error) {
    console.error('Failed to update seller:', error);
    res.status(500).json({ success: false, message: 'Failed to update seller', error: error.message });
  }
});

// Delete Seller
router.delete('/sellers/:id', adminLoggedin, async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await Seller.findById(id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    await Product.deleteMany({ sellerId: id });
    await Order.deleteMany({ sellerId: id });
    await Seller.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Seller and associated data deleted successfully' });
  } catch (error) {
    console.error('Failed to delete seller:', error);
    res.status(500).json({ success: false, message: 'Failed to delete seller', error: error.message });
  }
});

// Get All Products
router.get('/products', adminLoggedin, async (req, res) => {
  try {
    const products = await Product.find({})
      .populate('sellerId', 'name shopName')
      .populate('category', 'name');
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
});

// Create Product
router.post(
  '/products',
  adminLoggedin,
  upload.array('images', 10),
  validateRequiredFields([
    'name',
    'sellerId',
    'category',
    'quantity',
    'price',
    'description',
    'images',
    'sizes',
    'colors',
    'material',
    'gender',
    'brand',
    'fit',
    'careInstructions',
  ]),
  async (req, res) => {
    const {
      name,
      sellerId,
      category,
      quantity,
      price,
      description,
      sizes,
      colors,
      material,
      gender,
      brand,
      fit,
      careInstructions,
      isReturnable,
      returnPeriod,
      dimensions,
      weight,
      isCashOnDeliveryAvailable,
      onlinePaymentPercentage,
    } = req.body;

    try {
      if (!mongoose.Types.ObjectId.isValid(category) || !mongoose.Types.ObjectId.isValid(sellerId)) {
        return res.status(400).json({ success: false, message: 'Invalid category or seller ID' });
      }

      const [categoryDoc, seller] = await Promise.all([
        Category.findById(category),
        Seller.findById(sellerId),
      ]);

      if (!categoryDoc) {
        return res.status(400).json({ success: false, message: 'Category does not exist' });
      }
      if (!seller || seller.status !== 'enabled') {
        return res.status(400).json({ success: false, message: 'Seller is disabled or not found' });
      }

      const parsedQuantity = Number(quantity);
      const parsedPrice = Number(price);
      const parsedReturnPeriod = Number(returnPeriod) || 0;
      const parsedWeight = Number(weight) || 0;
      const parsedOnlinePaymentPercentage = Number(onlinePaymentPercentage) || 100;
      const parsedIsCashOnDeliveryAvailable = isCashOnDeliveryAvailable === 'true' || isCashOnDeliveryAvailable === true;
      const parsedSizes = Array.isArray(sizes) ? sizes : JSON.parse(sizes);
      const parsedColors = Array.isArray(colors) ? colors : JSON.parse(colors);
      let parsedDimensions = dimensions ? (typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions) : {};

      if (isNaN(parsedQuantity) || parsedQuantity < 0) {
        return res.status(400).json({ success: false, message: 'Quantity must be a non-negative number' });
      }
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ success: false, message: 'Price must be a positive number' });
      }
      if (parsedWeight < 0) {
        return res.status(400).json({ success: false, message: 'Weight cannot be negative' });
      }
      if (parsedSizes.length === 0 || parsedColors.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one size and one color are required' });
      }
      if (
        parsedDimensions.chest &&
        parsedDimensions.chest < 0 ||
        parsedDimensions.length &&
        parsedDimensions.length < 0 ||
        parsedDimensions.sleeve &&
        parsedDimensions.sleeve < 0
      ) {
        return res.status(400).json({ success: false, message: 'Dimensions cannot be negative' });
      }
      if (
        isNaN(parsedOnlinePaymentPercentage) ||
        parsedOnlinePaymentPercentage < 0 ||
        parsedOnlinePaymentPercentage > 100
      ) {
        return res.status(400).json({
          success: false,
          message: 'Online payment percentage must be between 0 and 100',
        });
      }
      if (!parsedIsCashOnDeliveryAvailable && parsedOnlinePaymentPercentage !== 100) {
        return res.status(400).json({
          success: false,
          message: 'Online payment percentage must be 100 if COD is not available',
        });
      }

      const imageUploads = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.buffer, { folder: 'products', resource_type: 'image' }))
      );
      const imageUrls = imageUploads.map((result) => result.url);

      const isProductReturnable = isReturnable === 'true' || isReturnable === true;
      if (isProductReturnable && (parsedReturnPeriod <= 0 || parsedReturnPeriod > 30)) {
        return res.status(400).json({ success: false, message: 'Return period must be between 1 and 30 days' });
      }

      const product = new Product({
        sellerId,
        name: name.trim(),
        category,
        quantity: parsedQuantity,
        price: parsedPrice,
        description: description.trim(),
        images: imageUrls,
        sizes: parsedSizes,
        colors: parsedColors,
        material: material.trim(),
        gender,
        brand: brand.trim(),
        fit,
        careInstructions: careInstructions.trim(),
        status: 'enabled',
        isReturnable: isProductReturnable,
        returnPeriod: isProductReturnable ? parsedReturnPeriod : 0,
        dimensions: parsedDimensions.chest ? parsedDimensions : undefined,
        weight: parsedWeight,
        isCashOnDeliveryAvailable: parsedIsCashOnDeliveryAvailable,
        onlinePaymentPercentage: parsedOnlinePaymentPercentage,
        views: 0,
        orders: 0,
      });

      await product.save();
      await Seller.findByIdAndUpdate(sellerId, { $push: { products: product._id } });
      await product.populate('category', 'name').populate('sellerId', 'name shopName');

      res.status(201).json({ success: true, message: 'Product created successfully', product });
    } catch (error) {
      console.error('Product creation error:', error);
      res.status(500).json({ success: false, message: 'Server error creating product', error: error.message });
    }
  }
);

// Update Product
router.put('/products/:id', adminLoggedin, upload.array('images', 10), async (req, res) => {
  const { id } = req.params;
  const {
    name,
    sellerId,
    category,
    quantity,
    price,
    description,
    sizes,
    colors,
    material,
    gender,
    brand,
    fit,
    careInstructions,
    isReturnable,
    returnPeriod,
    status,
    dimensions,
    weight,
    isCashOnDeliveryAvailable,
    onlinePaymentPercentage,
  } = req.body;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (sellerId && !mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ success: false, message: 'Invalid seller ID' });
    }
    if (category && !mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    if (sellerId && sellerId !== product.sellerId.toString()) {
      const seller = await Seller.findById(sellerId);
      if (!seller || seller.status !== 'enabled') {
        return res.status(400).json({ success: false, message: 'Seller is disabled or not found' });
      }
      await Seller.findByIdAndUpdate(product.sellerId, { $pull: { products: id } });
      await Seller.findByIdAndUpdate(sellerId, { $push: { products: id } });
      product.sellerId = sellerId;
    }
    if (category) {
      const categoryDoc = await Category.findById(category);
      if (!categoryDoc) {
        return res.status(400).json({ success: false, message: 'Category does not exist' });
      }
      product.category = category;
    }

    if (name) product.name = name.trim();
    if (description) product.description = description.trim();
    if (material) product.material = material.trim();
    if (gender) product.gender = gender;
    if (brand) product.brand = brand.trim();
    if (fit) product.fit = fit;
    if (careInstructions) product.careInstructions = careInstructions.trim();
    if (status && ['enabled', 'disabled'].includes(status)) product.status = status;

    if (quantity !== undefined) {
      const parsedQuantity = Number(quantity);
      if (isNaN(parsedQuantity) || parsedQuantity < 0) {
        return res.status(400).json({ success: false, message: 'Quantity must be a non-negative number' });
      }
      product.quantity = parsedQuantity;
    }
    if (price !== undefined) {
      const parsedPrice = Number(price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ success: false, message: 'Price must be a positive number' });
      }
      product.price = parsedPrice;
    }
    if (sizes) {
      const parsedSizes = Array.isArray(sizes) ? sizes : JSON.parse(sizes);
      if (parsedSizes.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one size is required' });
      }
      product.sizes = parsedSizes;
    }
    if (colors) {
      const parsedColors = Array.isArray(colors) ? colors : JSON.parse(colors);
      if (parsedColors.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one color is required' });
      }
      product.colors = parsedColors;
    }
    if (req.files && req.files.length > 0) {
      const imageUploads = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.buffer, { folder: 'products', resource_type: 'image' }))
      );
      product.images = imageUploads.map((result) => result.url);
    }
    if (isReturnable !== undefined) {
      const isProductReturnable = isReturnable === 'true' || isReturnable === true;
      const parsedReturnPeriod = Number(returnPeriod) || product.returnPeriod;
      if (isProductReturnable && (parsedReturnPeriod <= 0 || parsedReturnPeriod > 30)) {
        return res.status(400).json({ success: false, message: 'Return period must be between 1 and 30 days' });
      }
      product.isReturnable = isProductReturnable;
      product.returnPeriod = isProductReturnable ? parsedReturnPeriod : 0;
    }
    if (dimensions) {
      const parsedDimensions = typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions;
      if (
        parsedDimensions.chest &&
        parsedDimensions.chest < 0 ||
        parsedDimensions.length &&
        parsedDimensions.length < 0 ||
        parsedDimensions.sleeve &&
        parsedDimensions.sleeve < 0
      ) {
        return res.status(400).json({ success: false, message: 'Dimensions cannot be negative' });
      }
      product.dimensions = parsedDimensions;
    }
    if (weight !== undefined) {
      const parsedWeight = Number(weight);
      if (isNaN(parsedWeight) || parsedWeight < 0) {
        return res.status(400).json({ success: false, message: 'Weight cannot be negative' });
      }
      product.weight = parsedWeight;
    }
    if (isCashOnDeliveryAvailable !== undefined) {
      const parsedIsCashOnDeliveryAvailable = isCashOnDeliveryAvailable === 'true' || isCashOnDeliveryAvailable === true;
      const parsedOnlinePaymentPercentage = Number(onlinePaymentPercentage) || product.onlinePaymentPercentage;
      if (
        isNaN(parsedOnlinePaymentPercentage) ||
        parsedOnlinePaymentPercentage < 0 ||
        parsedOnlinePaymentPercentage > 100
      ) {
        return res.status(400).json({
          success: false,
          message: 'Online payment percentage must be between 0 and 100',
        });
      }
      if (!parsedIsCashOnDeliveryAvailable && parsedOnlinePaymentPercentage !== 100) {
        return res.status(400).json({
          success: false,
          message: 'Online payment percentage must be 100 if COD is not available',
        });
      }
      product.isCashOnDeliveryAvailable = parsedIsCashOnDeliveryAvailable;
      product.onlinePaymentPercentage = parsedOnlinePaymentPercentage;
    }

    await product.save();
    await product.populate('sellerId', 'name shopName').populate('category', 'name');

    res.status(200).json({ success: true, message: 'Product updated successfully', product });
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ success: false, message: 'Server error updating product', error: error.message });
  }
});

// Delete Product
router.delete('/products/:id', adminLoggedin, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (product.sellerId) {
      await Seller.findByIdAndUpdate(product.sellerId, { $pull: { products: id } });
    }
    await Product.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Failed to delete product:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
  }
});

// Get All Orders
router.get('/orders', adminLoggedin, async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('sellerId', 'name shopName')
      .populate('userId', 'firstName email')
      .populate('items.productId', 'name images');
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
  }
});

// Update Order Status
router.put('/orders/:id', adminLoggedin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = [
      'order confirmed',
      'processing',
      'shipped',
      'out for delivery',
      'delivered',
      'cancelled',
      'returned',
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    if (status === 'delivered' && order.paymentMethod !== 'Razorpay') {
      order.paymentStatus = 'completed';
    } else if (status === 'cancelled' || status === 'returned') {
      order.paymentStatus = 'failed';
    }

    await order.save();

    if (order.sellerId) {
      const seller = await Seller.findById(order.sellerId);
      const orders = await Order.find({ sellerId: order.sellerId, status: { $ne: 'cancelled' } });
      seller.revenue.total = orders.reduce((acc, o) => acc + (o.total || 0), 0);
      seller.revenue.online = orders.reduce((acc, o) => acc + (o.onlineAmount || 0), 0);
      seller.revenue.cod = orders.reduce((acc, o) => acc + (o.codAmount || 0), 0);
      seller.revenue.pendingCod = orders
        .filter((o) => o.paymentStatus === 'pending' && o.codAmount > 0)
        .reduce((acc, o) => acc + (o.codAmount || 0), 0);
      await seller.save();
    }

    await order
      .populate('sellerId', 'name shopName')
      .populate('userId', 'firstName email')
      .populate('items.productId', 'name images');

    res.status(200).json({ success: true, message: 'Order updated successfully', order });
  } catch (error) {
    console.error('Order update error:', error);
    res.status(500).json({ success: false, message: 'Server error updating order', error: error.message });
  }
});

// Get All Users
router.get('/users', adminLoggedin, async (req, res) => {
  try {
    const users = await User.find({})
      .populate({ path: 'wishlist.productId', select: 'name price' })
      .populate({ path: 'savedForLater.productId', select: 'name price' });
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
});

// Update User
router.put('/users/:id', adminLoggedin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, firstName, lastName, email, phoneNumber } = req.body;

    if (role && !['user', 'seller', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role value' });
    }

    const updateData = {};
    if (role) updateData.role = role;
    if (firstName) updateData.firstName = firstName.trim();
    if (lastName) updateData.lastName = lastName.trim();
    if (email) updateData.email = email.trim();
    if (phoneNumber) updateData.phoneNumber = phoneNumber.trim();

    const user = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Failed to update user:', error);
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
});

// Delete User
router.delete('/users/:id', adminLoggedin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await Order.deleteMany({ userId: id });
    await User.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'User and associated data deleted successfully' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
  }
});

// Get Analytics
router.get('/analytics', adminLoggedin, async (req, res) => {
  try {
    const topProducts = await Product.find({})
      .sort({ orders: -1, views: -1 })
      .limit(10)
      .populate('sellerId', 'name shopName')
      .populate('category', 'name');

    const topSellers = await Seller.find({})
      .sort({ 'revenue.total': -1 })
      .limit(10)
      .populate({ path: 'products', select: 'name price' })
      .populate({ path: 'orders', select: 'orderId total status' });

    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
        },
      },
    ]);

    const productStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          totalViews: { $sum: '$views' },
          totalOrders: { $sum: '$orders' },
          totalProducts: { $sum: 1 },
        },
      },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { categoryName: '$category.name', totalViews: 1, totalOrders: 1, totalProducts: 1 } },
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        topProducts,
        topSellers,
        orderStats,
        productStats,
      },
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics', error: error.message });
  }
});

module.exports = router;