const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: [true, 'Seller ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [3, 'Product name must be at least 3 characters'],
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    images: [{
      type: String,
      required: true,
      validate: {
        validator: function (array) {
          return array.length >= 1;
        },
        message: 'At least one image is required for the product.',
      },
    }],
    sizes: [{
      type: String,
      required: [true, 'At least one size is required'],
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Custom'],
      validate: {
        validator: function (array) {
          return array.length > 0;
        },
        message: 'At least one size must be specified.',
      },
    }],
    colors: [{
      type: String,
      required: [true, 'At least one color is required'],
      trim: true,
      validate: {
        validator: function (array) {
          return array.length > 0;
        },
        message: 'At least one color must be specified.',
      },
    }],
    material: {
      type: String,
      required: [true, 'Material is required'],
      trim: true,
      enum: [
        'Cotton', 'Polyester', 'Wool', 'Silk', 'Linen', 'Denim', 'Leather',
        'Rayon', 'Nylon', 'Spandex', 'Blend', 'Other'
      ],
    },
    gender: {
      type: String,
      required: [true, 'Gender target is required'],
      enum: ['Men', 'Women', 'Unisex', 'Kids'],
    },
    brand: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
      minlength: [2, 'Brand name must be at least 2 characters'],
      maxlength: [50, 'Brand name cannot exceed 50 characters'],
    },
    fit: {
      type: String,
      required: [true, 'Fit type is required'],
      enum: ['Regular', 'Slim', 'Loose', 'Tailored', 'Oversized', 'Athletic'],
    },
    careInstructions: {
      type: String,
      required: [true, 'Care instructions are required'],
      trim: true,
      maxlength: [200, 'Care instructions cannot exceed 200 characters'],
    },
    status: {
      type: String,
      default: 'enabled',
      enum: ['enabled', 'disabled'],
    },
    isReturnable: {
      type: Boolean,
      default: false,
    },
    returnPeriod: {
      type: Number,
      default: 0,
      validate: {
        validator: function (value) {
          return this.isReturnable ? value > 0 && value <= 30 : value === 0;
        },
        message: 'Return period must be between 1 and 30 days if returnable, otherwise 0.',
      },
    },
    views: {
      type: Number,
      default: 0,
      min: [0, 'Views cannot be negative'],
    },
    orders: {
      type: Number,
      default: 0,
      min: [0, 'Orders cannot be negative'],
    },
    saves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    wishlists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dimensions: {
      chest: { type: Number, min: 0 },
      length: { type: Number, min: 0 },
      sleeve: { type: Number, min: 0 },
    },
    weight: {
      type: Number,
      min: [0, 'Weight cannot be negative'],
      default: 0,
    },
    isCashOnDeliveryAvailable: {
      type: Boolean,
      default: false,
    },
    onlinePaymentPercentage: {
      type: Number,
      default: 100,
      min: [0, 'Online payment percentage cannot be negative'],
      max: [100, 'Online payment percentage cannot exceed 100'],
      validate: {
        validator: function (value) {
          return this.isCashOnDeliveryAvailable ? value >= 0 && value <= 100 : value === 100;
        },
        message: 'Online payment percentage must be 100 if COD is not available, or between 0-100 if COD is available.',
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

productSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ sellerId: 1, category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);