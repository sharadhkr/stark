const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Client } = require('@elastic/elasticsearch');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Seller = require('../models/sellerModel');
const Category = require('../models/categoryModel');
const Order = require('../models/orderModel');
const { sendOtp, verifyOtp } = require('../utils/otp');
const userLoggedin = require('../middleware/userLoggedin');
const { uploadSingle } = require('../config/multerConfig');
const { uploadToCloudinary } = require('../config/clowdnaryConfig');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'YOUR_RAZORPAY_KEY_ID';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'YOUR_RAZORPAY_KEY_SECRET';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

const tempOrdersStore = new Map();
// Optional Elasticsearch Client
const elasticsearch = process.env.ELASTICSEARCH_URL
  ? new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      maxRetries: 5,
      requestTimeout: 60000,
    })
  : null;

// Test Elasticsearch connection on startup (if enabled)
if (elasticsearch) {
  elasticsearch
    .ping()
    .then(() => console.log('Elasticsearch connected successfully'))
    .catch((err) => console.error('Elasticsearch connection failed on startup:', err));
}

// Index data into Elasticsearch (if enabled)
const indexData = async () => {
  if (!elasticsearch) return;

  try {
    const [products, categories, sellers] = await Promise.all([
      Product.find(),
      Category.find(),
      Seller.find(),
    ]);

    const bulkOps = [];
    products.forEach((product) =>
      bulkOps.push(
        { index: { _index: 'products', _id: product._id.toString() } },
        {
          name: product.name,
          description: product.description,
          category: product.category,
          sellerId: product.sellerId,
          image: product.image,
        }
      )
    );
    categories.forEach((category) =>
      bulkOps.push(
        { index: { _index: 'categories', _id: category._id.toString() } },
        { name: category.name }
      )
    );
    sellers.forEach((seller) =>
      bulkOps.push(
        { index: { _index: 'sellers', _id: seller._id.toString() } },
        { name: seller.name, shopName: seller.shopName }
      )
    );

    if (bulkOps.length) {
      await elasticsearch.bulk({ body: bulkOps });
      console.log('Data indexed into Elasticsearch');
    }
  } catch (error) {
    console.error('Elasticsearch Indexing Error:', error);
  }
};

// Run indexing on startup (if Elasticsearch is enabled)
if (elasticsearch) indexData();

// Authentication Routes
router.post('/send-otp', async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ message: 'Phone number is required' });

  try {
    await sendOtp(phoneNumber);
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { phoneNumber, otp } = req.body;
  if (!phoneNumber || !otp) return res.status(400).json({ message: 'Phone number and OTP are required' });

  try {
    const isValid = await verifyOtp(phoneNumber, otp);
    if (!isValid) return res.status(400).json({ message: 'Invalid OTP' });

    let user = await User.findOne({ phoneNumber });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = new User({ phoneNumber, role: 'user' });
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, phoneNumber: user.phoneNumber, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: isNewUser ? 'Registered and logged in successfully' : 'Logged in successfully',
      user: { id: user._id, phoneNumber: user.phoneNumber, role: user.role },
      token,
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/verify-token', userLoggedin, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('phoneNumber role');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      message: 'Token is valid',
      user: { id: user._id, phoneNumber: user.phoneNumber, role: user.role },
    });
  } catch (error) {
    console.error('Token Verification Error:', error);
    res.status(401).json({ message: 'Invalid or expired token', error: error.message });
  }
});

router.post('/logout', userLoggedin, async (req, res) => {
  try {
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ message: 'Failed to logout', error: error.message });
  }
});

// Profile Routes
router.get('/profile', userLoggedin, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      '-verificationToken -resetPasswordToken -resetPasswordExpire -loginAttempts -accountLockedUntil'
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ user });
  } catch (error) {
    console.error('Fetch Profile Error:', error);
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
});

router.put('/profile', userLoggedin, uploadSingle, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { firstName, email } = req.body;

    if (firstName) user.firstName = firstName.trim();
    if (email) user.email = email.trim().toLowerCase();

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, {
        folder: 'user_profiles',
        resource_type: 'image',
        timeout: 10000,
      });
      user.profilePicture = uploadResult.url;
    }

    await user.save({ validateBeforeSave: true });
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// Address Routes
router.post('/add-address', userLoggedin, async (req, res) => {
  try {
    const { street, city, state, postalCode, country } = req.body;
    if (!street || !city || !state || !postalCode || !country) {
      return res.status(400).json({ message: 'All address fields are required' });
    }

    const user = await User.findById(req.user.id);
    const newAddress = { street, city, state, postalCode, country };
    user.addresses.push(newAddress);
    await user.save();

    const addedAddress = user.addresses[user.addresses.length - 1];
    res.status(200).json({ address: addedAddress });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ message: 'Failed to add address' });
  }
});

router.delete('/remove-address/:addressId', userLoggedin, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.addresses.id(req.params.addressId).remove();
    await user.save();
    res.status(200).json({ message: 'Address removed successfully' });
  } catch (error) {
    console.error('Error removing address:', error);
    res.status(500).json({ message: 'Failed to remove address' });
  }
});

// Product Routes
router.get('/products', async (req, res) => {
  try {
    const { category, sellerId } = req.query;
    let query = {};

    if (category && category.toLowerCase() !== 'all') {
      const categoryDoc = await Category.findOne({
        name: { $regex: new RegExp(`^${category}$`, 'i') },
      });
      if (!categoryDoc) return res.status(404).json({ message: `Category '${category}' not found` });
      query.category = categoryDoc._id;
    }

    if (sellerId) query.sellerId = sellerId;

    const products = await Product.find(query)
      .populate('sellerId', 'name phoneNumber')
      .populate('category', 'name');

    res.status(200).json({ products: products.length ? products : [], message: products.length ? undefined : 'No products found' });
  } catch (error) {
    console.error('Fetch Products Error:', error);
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
});

router.get('/products/:productId', userLoggedin, async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(productId)
      .populate('sellerId', 'name shopName')
      .populate('category', 'name');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await Product.updateOne({ _id: productId }, { $inc: { views: 1 } });

    res.status(200).json({ product });
  } catch (error) {
    console.error('Fetch Product Error:', error);
    res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
});

// Seller Routes
router.get('/sellers', async (req, res) => {
  try {
    const sellers = await Seller.find({ role: 'seller', status: 'enabled' })
      .select('name shopName profilePicture phoneNumber address')
      .lean();

    const sellersWithDefaultImage = sellers.map((seller) => ({
      ...seller,
      profilePicture:
        seller.profilePicture && seller.profilePicture !== ''
          ? seller.profilePicture
          : 'https://via.placeholder.com/80x80?text=No+Image',
    }));

    res.status(200).json({ sellers: sellersWithDefaultImage });
  } catch (error) {
    console.error('Fetch Sellers Error:', error);
    res.status(500).json({ message: 'Failed to fetch sellers', error: error.message });
  }
});

router.get('/seller/:sellerId', async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.sellerId);
    if (!seller || seller.role !== 'seller') return res.status(404).json({ message: 'Seller not found' });
    res.status(200).json({ seller });
  } catch (error) {
    console.error('Fetch Seller Error:', error);
    res.status(500).json({ message: 'Failed to fetch seller', error: error.message });
  }
});

// Seller Authentication Middleware
const authSeller = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const seller = await Seller.findById(decoded._id).select('+password');
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    req.seller = seller;
    next();
  } catch (error) {
    console.error('Auth Seller Error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Seller Products Route
router.get('/seller/products', authSeller, async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.seller._id }).populate('category', 'name');
    res.json({ products });
  } catch (error) {
    console.error('Seller Products Fetch Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Category Routes
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().select('name icon');
    res.status(200).json({ categories });
  } catch (error) {
    console.error('Fetch Categories Error:', error);
    res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
});

// Wishlist Routes
router.get('/wishlist', userLoggedin, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('wishlist.productId');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ wishlist: user.wishlist });
  } catch (error) {
    console.error('Fetch Wishlist Error:', error);
    res.status(500).json({ message: 'Failed to fetch wishlist', error: error.message });
  }
});

router.put('/wishlist/:productId', userLoggedin, async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const wishlistIndex = user.wishlist.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (wishlistIndex !== -1) {
      user.wishlist.splice(wishlistIndex, 1);
      await user.save();
      return res.status(200).json({ message: 'Removed from Wishlist', inWishlist: false });
    }

    user.wishlist.push({ productId });
    await user.save();
    return res.status(200).json({ message: 'Added to Wishlist', inWishlist: true });
  } catch (error) {
    console.error('Wishlist Error:', error);
    res.status(500).json({ message: 'Failed to update wishlist', error: error.message });
  }
});

router.get('/wishlist/:productId', userLoggedin, async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isInWishlist = user.wishlist.some(
      (item) => item.productId.toString() === productId
    );
    res.status(200).json({ inWishlist: isInWishlist });
  } catch (error) {
    console.error('Fetch Wishlist Status Error:', error);
    res.status(500).json({ message: 'Failed to fetch wishlist status', error: error.message });
  }
});

// Cart Routes
router.get('/cart', userLoggedin, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('cart.productId');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ cart: user.cart });
  } catch (error) {
    console.error('Fetch Cart Error:', error);
    res.status(500).json({ message: 'Failed to fetch cart', error: error.message });
  }
});

router.post('/cart', userLoggedin, async (req, res) => {
  try {
    const { productId, quantity, size, color } = req.body;
    if (!productId || !quantity || !size || !color) {
      return res.status(400).json({ message: 'productId, quantity, size, and color are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (quantity > product.quantity) {
      return res.status(400).json({ message: `Only ${product.quantity} items available in stock` });
    }

    const cartItem = { productId, quantity, size, color };
    await user.updateCart(cartItem);

    await user.populate('cart.productId');
    res.status(201).json({ message: 'Added to cart', cart: user.cart });
  } catch (error) {
    console.error('Add to Cart Error:', error);
    res.status(500).json({ message: 'Failed to add to cart', error: error.message });
  }
});

router.put('/cart/:productId', userLoggedin, async (req, res) => {
  try {
    const { quantity, size, color } = req.body;
    if (!quantity || !size || !color) {
      return res.status(400).json({ message: 'quantity, size, and color are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (quantity > product.quantity) {
      return res.status(400).json({ message: `Only ${product.quantity} items available in stock` });
    }

    const cartIndex = user.cart.findIndex(
      (item) => item.productId.toString() === req.params.productId && item.size === size && item.color === color
    );
    if (cartIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart with specified size and color' });
    }

    user.cart[cartIndex].quantity = quantity;
    await user.save();

    await user.populate('cart.productId');
    res.status(200).json({ message: 'Cart updated', cart: user.cart });
  } catch (error) {
    console.error('Update Cart Error:', error);
    res.status(500).json({ message: 'Failed to update cart', error: error.message });
  }
});


// Save for Later Routes
router.get('/save-for-later', userLoggedin, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('savedForLater.productId');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ savedForLater: user.savedForLater });
  } catch (error) {
    console.error('Fetch Saved For Later Error:', error);
    res.status(500).json({ message: 'Failed to fetch saved for later', error: error.message });
  }
});
// ... (Previous imports and routes remain unchanged)

// Cart Routes
router.delete('/cart/:productId', userLoggedin, async (req, res) => {
  try {
    const { size, color } = req.body;
    if (!size || !color) {
      return res.status(400).json({ message: 'size and color are required to identify the cart item' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Log state before operation
    console.log('Cart before remove:', JSON.stringify(user.cart));

    const cartIndex = user.cart.findIndex(
      (item) => item.productId.toString() === req.params.productId && item.size === size && item.color === color
    );
    if (cartIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Atomically remove the item from cart
    const updateResult = await User.findOneAndUpdate(
      { _id: req.user.id, 'cart.productId': req.params.productId, 'cart.size': size, 'cart.color': color },
      { $pull: { cart: { productId: req.params.productId, size, color } } },
      { new: true }
    ).populate('cart.productId');

    if (!updateResult) {
      return res.status(500).json({ message: 'Failed to update cart due to concurrency issue' });
    }

    console.log('Cart after remove:', JSON.stringify(updateResult.cart));
    res.status(200).json({ message: 'Item removed from cart', cart: updateResult.cart });
  } catch (error) {
    console.error('Remove from Cart Error:', error);
    res.status(500).json({ message: 'Failed to remove item from cart', error: error.message });
  }
});

// Save for Later Routes
router.post('/save-for-later', userLoggedin, async (req, res) => {
  try {
    const { productId, quantity, size, color } = req.body;
    if (!productId || !quantity || !size || !color) {
      return res.status(400).json({ message: 'productId, quantity, size, and color are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Log state before operation
    console.log('Cart before save:', JSON.stringify(user.cart));
    console.log('Saved for later before save:', JSON.stringify(user.savedForLater));

    // Atomically update cart and savedForLater
    const updateResult = await User.findOneAndUpdate(
      { _id: req.user.id },
      {
        $pull: { cart: { productId, size, color } }, // Remove from cart if exists
        $addToSet: { savedForLater: { productId, quantity, size, color } }, // Add to savedForLater if not already present
      },
      { new: true }
    )
      .populate('cart.productId')
      .populate('savedForLater.productId');

    if (!updateResult) {
      return res.status(500).json({ message: 'Failed to update due to concurrency issue' });
    }

    console.log('Cart after save:', JSON.stringify(updateResult.cart));
    console.log('Saved for later after save:', JSON.stringify(updateResult.savedForLater));
    res.status(201).json({
      message: 'Saved for later',
      cart: updateResult.cart,
      savedForLater: updateResult.savedForLater,
    });
  } catch (error) {
    console.error('Save For Later Error:', error);
    res.status(500).json({ message: 'Failed to save for later', error: error.message });
  }
});

// ... (Rest of router.js remains unchanged)

router.delete('/save-for-later/:productId', userLoggedin, async (req, res) => {
  try {
    const { size, color } = req.body;
    if (!size || !color) {
      return res.status(400).json({ message: 'size and color are required to identify the saved item' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const itemIndex = user.savedForLater.findIndex(
      (item) => item.productId.toString() === req.params.productId && item.size === size && item.color === color
    );
    if (itemIndex === -1) return res.status(404).json({ message: 'Item not found in saved for later' });

    user.savedForLater.splice(itemIndex, 1);
    await user.save();

    await user.populate('savedForLater.productId');
    res.status(200).json({ message: 'Item removed from saved for later', savedForLater: user.savedForLater });
  } catch (error) {
    console.error('Remove Saved For Later Error:', error);
    res.status(500).json({ message: 'Failed to remove from saved for later', error: error.message });
  }
});

// Order Routes
router.get('/order/:orderId', userLoggedin, async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId })
      .populate({
        path: 'items.productId',
        select: 'name image price',
      })
      .lean();

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.status(200).json({ order });
  } catch (error) {
    console.error('Fetch Order Error:', error);
    res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
});

router.get('/orders', userLoggedin, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).populate('sellerId', 'name email');
    res.status(200).json({ orders });
  } catch (error) {
    console.error('Fetch Orders Error:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});



router.post('/create-order', userLoggedin, async (req, res) => {
  try {
    const { items, totalAmount, onlineAmount, codAmount, shipping, addressId, paymentMethod, fromCart, userDetails } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0 || !totalAmount || !addressId || !paymentMethod) {
      return res.status(400).json({ message: 'Items, totalAmount, addressId, and paymentMethod are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const address = user.addresses.id(addressId);
    if (!address) return res.status(400).json({ message: 'Invalid address ID' });

    const itemsBySeller = {};
    for (const item of items) {
      const product = await Product.findById(item.productId).populate('sellerId');
      if (!product) return res.status(404).json({ message: `Product not found: ${item.productId}` });
      if (product.quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      const sellerId = product.sellerId._id.toString();
      if (!itemsBySeller[sellerId]) itemsBySeller[sellerId] = { items: [], seller: product.sellerId };
      itemsBySeller[sellerId].items.push({
        productId: product._id,
        name: product.name,
        price: item.price || product.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        onlineAmount: item.onlineAmount || 0,
        codAmount: item.codAmount || 0,
      });
    }

    let razorpayOrder = null;
    if (paymentMethod === 'Razorpay' && onlineAmount > 0) {
      const razorpayOptions = {
        amount: Math.round(onlineAmount * 100), // Convert to paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        // No transfers array
      };
      razorpayOrder = await razorpay.orders.create(razorpayOptions);
    } else if (paymentMethod !== 'Cash on Delivery') {
      return res.status(400).json({ message: 'Invalid payment method or zero online amount for Razorpay' });
    }

    const customerDetails = {
      name: userDetails?.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.phoneNumber,
      email: userDetails?.email || user.email || 'N/A',
      phoneNumber: userDetails?.phoneNumber || user.phoneNumber,
      address: `${address.street}, ${address.city}, ${address.state}, ${address.postalCode}, ${address.country}`,
    };

    const tempOrders = Object.keys(itemsBySeller).map((sellerId) => {
      const { items: sellerItems, seller } = itemsBySeller[sellerId];
      const sellerTotal = sellerItems.reduce((sum, item) => sum + (item.onlineAmount || 0) + (item.codAmount || 0), 0) +
        (shipping || 0) / Object.keys(itemsBySeller).length;

      return {
        orderId: razorpayOrder ? razorpayOrder.id : `ORD_${Date.now()}_${sellerId}`,
        userId: req.user.id,
        sellerId,
        customer: customerDetails,
        items: sellerItems,
        total: sellerTotal,
        onlineAmount: sellerItems.reduce((sum, item) => sum + (item.onlineAmount || 0), 0),
        codAmount: sellerItems.reduce((sum, item) => sum + (item.codAmount || 0), 0),
        shipping: shipping / Object.keys(itemsBySeller).length || 0,
        paymentMethod,
        paymentStatus: paymentMethod === 'Cash on Delivery' ? 'pending' : 'pending',
        status: 'pending',
      };
    });

    const tempOrderKey = razorpayOrder ? razorpayOrder.id : tempOrders[0].orderId;
    tempOrdersStore.set(tempOrderKey, tempOrders);

    const response = {
      message: 'Order(s) created, proceed to payment if applicable',
      orders: tempOrders.map((o) => ({ orderId: o.orderId, sellerId: o.sellerId })),
    };
    if (razorpayOrder) {
      response.razorpay = {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      };
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message || error });
  }
});

router.post('/verify-payment', userLoggedin, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderData) {
      return res.status(400).json({ message: 'Payment details and order data are required' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const address = user.addresses.id(orderData.addressId);
    if (!address) return res.status(400).json({ message: 'Invalid address' });

    const tempOrders = tempOrdersStore.get(razorpay_order_id);
    if (!tempOrders || tempOrders.length === 0) {
      return res.status(400).json({ message: 'No pending orders found' });
    }

    const orders = [];
    for (const tempOrder of tempOrders) {
      const order = new Order({
        ...tempOrder,
        paymentId: razorpay_payment_id,
        paymentStatus: 'completed',
        status: 'order confirmed',
      });
      await order.save();
      orders.push(order);

      for (const item of order.items) {
        await Product.updateOne({ _id: item.productId }, { $inc: { quantity: -item.quantity } });
      }
      await Seller.updateOne({ _id: order.sellerId }, { $inc: { totalOrders: 1 } });
    }

    if (orderData.fromCart) {
      user.cart = [];
      await user.save();
    }

    tempOrdersStore.delete(razorpay_order_id);

    res.status(200).json({
      success: true,
      message: 'Payment verified and order placed successfully',
      orders: orders.map((o) => ({ orderId: o.orderId, sellerId: o.sellerId })),
    });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment', error: error.message });
  }
});

router.post('/place-order', userLoggedin, async (req, res) => {
  try {
    const { items, totalAmount, onlineAmount, codAmount, shipping, userDetails, addressId, paymentMethod, fromCart } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0 || !totalAmount || !addressId || !paymentMethod || !userDetails) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (paymentMethod !== 'Cash on Delivery') {
      return res.status(400).json({ message: 'Use /create-order for online payments' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const address = user.addresses.id(addressId);
    if (!address) return res.status(400).json({ message: 'Invalid address ID' });

    const itemsBySeller = {};
    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        return res.status(400).json({ message: `Invalid productId: ${item.productId}` });
      }
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.productId}` });
      if (product.quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      const sellerId = product.sellerId.toString();
      if (!itemsBySeller[sellerId]) itemsBySeller[sellerId] = { items: [], seller: product.sellerId };
      itemsBySeller[sellerId].items.push({
        productId: product._id,
        name: product.name,
        price: item.price || product.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        onlineAmount: item.onlineAmount || 0,
        codAmount: item.codAmount || 0,
      });
    }

    const orders = [];
    for (const sellerId of Object.keys(itemsBySeller)) {
      const { items: sellerItems } = itemsBySeller[sellerId];
      const sellerTotal = sellerItems.reduce((sum, item) => sum + (item.onlineAmount || 0) + (item.codAmount || 0), 0) +
        (shipping || 0) / Object.keys(itemsBySeller).length;

      const order = new Order({
        orderId: `ORD_${Date.now()}_${sellerId}`,
        userId: req.user.id,
        sellerId,
        customer: {
          name: userDetails.name,
          email: userDetails.email || user.email,
          phoneNumber: userDetails.phoneNumber || user.phoneNumber,
          address: `${address.street}, ${address.city}, ${address.state}, ${address.postalCode}, ${address.country}`,
        },
        items: sellerItems,
        total: sellerTotal,
        onlineAmount: sellerItems.reduce((sum, item) => sum + (item.onlineAmount || 0), 0),
        codAmount: sellerItems.reduce((sum, item) => sum + (item.codAmount || 0), 0),
        shipping: shipping / Object.keys(itemsBySeller).length || 0,
        paymentMethod,
        paymentStatus: 'pending',
        status: 'order confirmed',
      });

      await order.save();
      orders.push(order);

      // No stock deduction for COD until delivery
      await Seller.updateOne({ _id: sellerId }, { $inc: { totalOrders: 1 } });
    }

    if (fromCart) {
      user.cart = [];
      await user.save();
    }

    res.status(200).json({
      message: 'Order placed successfully',
      orders: orders.map((o) => ({ orderId: o.orderId, sellerId: o.sellerId })),
    });
  } catch (error) {
    console.error('Place Order Error:', error);
    res.status(500).json({ message: 'Failed to place order', error: error.message });
  }
});

router.put('/orders/:orderId/cancel', userLoggedin, async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId, userId: req.user.id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const orderDate = new Date(order.createdAt);
    const now = new Date();
    const hoursDiff = (now - orderDate) / (1000 * 60 * 60);
    if (hoursDiff > 24) {
      return res.status(400).json({ message: 'Order can only be cancelled within 24 hours' });
    }

    if (order.status === 'cancelled' || order.status === 'delivered') {
      return res.status(400).json({ message: 'Order cannot be cancelled' });
    }

    order.status = 'cancelled';
    await order.save();

    for (const item of order.items) {
      await Product.updateOne({ _id: item.productId }, { $inc: { quantity: item.quantity } });
    }

    res.status(200).json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel Order Error:', error);
    res.status(500).json({ message: 'Failed to cancel order', error: error.message });
  }
});

// Checkout Routes
router.post('/checkout', userLoggedin, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('cart.productId');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.cart || user.cart.length === 0) return res.status(400).json({ message: 'Cart is empty' });
    if (!user.addresses || user.addresses.length === 0) {
      return res.status(400).json({ message: 'Please add a delivery address' });
    }

    const total = user.cart.reduce((sum, item) => sum + item.productId.price * item.quantity, 0);

    const itemsBySeller = {};
    for (const item of user.cart) {
      const sellerId = item.productId.sellerId.toString();
      if (!itemsBySeller[sellerId]) {
        itemsBySeller[sellerId] = { items: [], seller: item.productId.sellerId };
      }
      itemsBySeller[sellerId].items.push({
        productId: item.productId._id,
        name: item.productId.name,
        price: item.productId.price,
        quantity: item.quantity,
      });
    }

    const orders = [];
    for (const sellerId of Object.keys(itemsBySeller)) {
      const { items: sellerItems } = itemsBySeller[sellerId];
      const sellerTotal = sellerItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const order = new Order({
        orderId: `ORD_${Date.now()}_${sellerId}`,
        userId: req.user.id,
        sellerId,
        customer: {
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.phoneNumber,
          phoneNumber: user.phoneNumber,
          address: `${user.addresses[0].street}, ${user.addresses[0].city}, ${user.addresses[0].state}, ${user.addresses[0].postalCode}, ${user.addresses[0].country}`,
        },
        items: sellerItems,
        total: sellerTotal,
        status: 'pending',
      });

      await order.save();
      orders.push(order);
    }

    for (const item of user.cart) {
      await Product.updateOne({ _id: item.productId }, { $inc: { quantity: -item.quantity } });
    }

    user.cart = [];
    await user.save();

    res.status(200).json({ message: 'Checkout successful', total, orders: orders.map((o) => o.orderId) });
  } catch (error) {
    console.error('Checkout Error:', error);
    res.status(500).json({ message: 'Failed to process checkout', error: error.message });
  }
});

router.post('/checkout/:productId', userLoggedin, async (req, res) => {
  try {
    const productId = req.params.productId;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    if (!quantity || quantity <= 0) return res.status(400).json({ message: 'Valid quantity is required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (quantity > product.quantity) {
      return res.status(400).json({ message: 'Requested quantity exceeds available stock' });
    }

    const total = product.price * quantity;

    const order = new Order({
      orderId: `ORD_${Date.now()}_${product.sellerId}`,
      userId: req.user.id,
      sellerId: product.sellerId,
      customer: {
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.phoneNumber,
        phoneNumber: user.phoneNumber,
        address: `${user.addresses[0].street}, ${user.addresses[0].city}, ${user.addresses[0].state}, ${user.addresses[0].postalCode}, ${user.addresses[0].country}`,
      },
      items: [{ productId: product._id, name: product.name, price: product.price, quantity }],
      total: total,
      status: 'pending',
    });

    await order.save();
    await Product.updateOne({ _id: productId }, { $inc: { quantity: -quantity } });
    await Seller.updateOne({ _id: product.sellerId }, { $inc: { totalOrders: 1 } });

    res.status(200).json({
      orderId: order.orderId,
      amount: total,
      productName: product.name,
      message: 'Order created, proceed to payment',
    });
  } catch (error) {
    console.error('Checkout Error:', error);
    res.status(500).json({ message: 'Failed to initiate checkout', error: error.message });
  }
});

// Search Routes
router.get('/search/recent', userLoggedin, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ recentSearches: user.recentSearches || [] });
  } catch (error) {
    console.error('Recent Searches Error:', error);
    res.status(500).json({ message: 'Failed to fetch recent searches' });
  }
});

router.post('/search/recent', userLoggedin, async (req, res) => {
  try {
    const { query } = req.body;
    const user = await User.findById(req.user.id);

    if (!query) {
      user.recentSearches = [];
      await user.save();
      return res.status(200).json({ message: 'Recent searches cleared' });
    }

    if (!user.recentSearches) user.recentSearches = [];
    user.recentSearches = [query, ...user.recentSearches.filter((q) => q !== query)].slice(0, 5);
    await user.save();
    res.status(200).json({ message: 'Search saved' });
  } catch (error) {
    console.error('Save/Clear Recent Search Error:', error);
    res.status(500).json({ message: 'Failed to save or clear search' });
  }
});

router.get('/search/trending', userLoggedin, async (req, res) => {
  try {
    const trendingSearches = ['phones', 'laptops', 'clothes', 'shoes', 'accessories'];
    const topSellers = await Seller.find()
      .sort({ totalOrders: -1 })
      .limit(5)
      .select('name shopName _id');
    const topCategories = await Category.find()
      .sort({ productCount: -1 })
      .limit(5)
      .select('name _id');
    const topProducts = await Product.find()
      .sort({ views: -1 })
      .limit(5)
      .select('name image _id');

    res.status(200).json({
      trendingSearches,
      topSellers,
      topCategories,
      topProducts,
    });
  } catch (error) {
    console.error('Trending Data Error:', error);
    res.status(500).json({ message: 'Failed to fetch trending data' });
  }
});

router.get('/search/suggestions', userLoggedin, async (req, res) => {
  try {
    const { q } = req.query;
    const user = await User.findById(req.user.id);

    let products = [];
    let categories = [];
    let sellers = [];
    let recentSearches = q ? [] : user.recentSearches || [];

    if (q) {
      if (elasticsearch) {
        try {
          const [productSearch, categorySearch, sellerSearch] = await Promise.all([
            elasticsearch.search({
              index: 'products',
              body: {
                query: { multi_match: { query: q, fields: ['name', 'description'], fuzziness: 'AUTO' } },
                size: 8,
              },
            }),
            elasticsearch.search({
              index: 'categories',
              body: { query: { match: { name: q } }, size: 8 },
            }),
            elasticsearch.search({
              index: 'sellers',
              body: {
                query: { multi_match: { query: q, fields: ['name', 'shopName'], fuzziness: 'AUTO' } },
                size: 8,
              },
            }),
          ]);

          products = productSearch.hits.hits.map((hit) => ({ _id: hit._id, ...hit._source }));
          categories = categorySearch.hits.hits.map((hit) => ({ _id: hit._id, ...hit._source }));
          sellers = sellerSearch.hits.hits.map((hit) => ({ _id: hit._id, ...hit._source }));
          console.log('Elasticsearch search successful');
        } catch (elasticError) {
          console.warn('Elasticsearch unavailable, falling back to MongoDB:', elasticError);
        }
      }

      if (!products.length) {
        const [mongoProducts, mongoCategories, mongoSellers] = await Promise.all([
          Product.find({ $text: { $search: q } })
            .limit(8)
            .select('name image _id'),
          Category.find({ $text: { $search: q } })
            .limit(8)
            .select('name _id'),
          Seller.find({ $text: { $search: q } })
            .limit(8)
            .select('name shopName _id'),
        ]);

        products = mongoProducts;
        categories = mongoCategories;
        sellers = mongoSellers;
        console.log('MongoDB search successful');
      }
    }

    res.status(200).json({
      recentSearches, // Fixed typo from RihannaSearches
      products,
      categories,
      sellers,
    });
  } catch (error) {
    console.error('Search Suggestions Error:', error);
    res.status(500).json({ message: 'Failed to fetch suggestions' });
  }
});

router.get('/search', userLoggedin, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: 'Query parameter is required' });

    let products = [];
    if (elasticsearch) {
      try {
        const productSearch = await elasticsearch.search({
          index: 'products',
          body: {
            query: { multi_match: { query: q, fields: ['name', 'description'], fuzziness: 'AUTO' } },
          },
        });
        products = productSearch.hits.hits.map((hit) => ({ _id: hit._id, ...hit._source }));
        console.log('Elasticsearch full search successful');
      } catch (elasticError) {
        console.warn('Elasticsearch unavailable for full search, falling back to MongoDB:', elasticError);
      }
    }

    if (!products.length) {
      products = await Product.find({ $text: { $search: q } })
        .select('name image _id description')
        .populate('sellerId', 'name shopName');
      console.log('MongoDB full search successful');
    }

    res.status(200).json({ products });
  } catch (error) {
    console.error('Search Error:', error);
    res.status(500).json({ message: 'Failed to perform search' });
  }
});

router.get('/productss', async (req, res) => {
  try {
    const { category, gender, brand, excludeProductId, limit, random } = req.query;
    let query = {
      ...(category && { category }),
      ...(gender && { gender }),
      ...(brand && { brand }),
      ...(excludeProductId && { _id: { $ne: excludeProductId } }),
      status: 'enabled',
    };

    let products = await Product.find(query)
      .limit(parseInt(limit) || 10)
      .populate('category', 'name')
      .populate('sellerId', 'name shopName');

    if (products.length === 0 || random === 'true') {
      products = await Product.aggregate([
        { $match: { status: 'enabled', _id: { $ne: excludeProductId } } },
        { $sample: { size: parseInt(limit) || 10 } },
      ]);
      products = await Product.populate(products, [
        { path: 'category', select: 'name' },
        { path: 'sellerId', select: 'name shopName' },
      ]);
    }

    res.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;