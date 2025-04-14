const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sellerSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    shopName: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
      minlength: [3, 'Shop name must be at least 3 characters'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
      minlength: [6, 'Password must be at least 6 characters'],
    },
    profilePicture: { type: String, default: '' },
    paymentId: { type: String, trim: true },
    aadharId: {
      type: String,
      trim: true,
      match: [/^\d{12}$/, 'Aadhar ID must be a 12-digit number'],
    },
    status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'enabled', 'disabled'],
    },
    role: {
      type: String,
      default: 'seller',
      enum: ['seller', 'admin'],
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentDetails: {
      bankAccount: {
        accountNumber: {
          type: String,
          trim: true,
          match: [/^\d{9,18}$/, 'Account number must be 9-18 digits'],
        },
        ifscCode: {
          type: String,
          trim: true,
          match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code'],
        },
        accountHolderName: { type: String, trim: true },
      },
      upiId: {
        type: String,
        trim: true,
        match: [/^[a-zA-Z0-9.-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,64}$/, 'Invalid UPI ID'],
      },
      razorpayAccountId: { type: String, trim: true },
    },
    revenue: {
      total: { type: Number, default: 0, min: 0 },
      online: { type: Number, default: 0, min: 0 },
      cod: { type: Number, default: 0, min: 0 },
      pendingCod: { type: Number, default: 0, min: 0 },
    },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

sellerSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  this.updatedAt = Date.now();
  next();
});

sellerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

sellerSchema.index({ name: 'text', shopName: 'text' });

module.exports = mongoose.model('Seller', sellerSchema);