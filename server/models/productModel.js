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
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      validate: {
        validator: function (value) {
          return value <= this.price;
        },
        message: 'Discount cannot exceed the product price',
      },
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: [0, 'Discount percentage cannot be negative'],
      max: [100, 'Discount percentage cannot exceed 100'],
    },
    discountedPrice: {
      type: Number,
      default: function () {
        if (this.discount > 0) {
          return Math.max(0, this.price - this.discount);
        }
        return Math.max(0, this.price * (1 - this.discountPercentage / 100));
      },
      min: [0, 'Discounted price cannot be negative'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    sizes: [
      {
        type: String,
        required: true,
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size', 'Custom'],
      },
    ],
    colors: [
      {
        type: String,
        required: true,
        trim: true,
        enum: ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Gray', 'Other'],
      },
    ],
    material: {
      type: String,
      required: [true, 'Material is required'],
      trim: true,
      enum: [
        'Cotton',
        'Polyester',
        'Wool',
        'Silk',
        'Linen',
        'Denim',
        'Leather',
        'Rayon',
        'Nylon',
        'Spandex',
        'Blend',
        'Other',
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
      enum: ['Regular', 'Slim', 'Loose', 'Tailored', 'Oversized', 'Athletic', 'Relaxed', 'Skinny', 'Custom'],
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
    stockStatus: {
      type: String,
      default: 'in_stock',
      enum: ['in_stock', 'out_of_stock', 'low_stock', 'pre_order'],
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
    dimensions: {
      chest: {
        type: Number,
        min: [0, 'Chest dimension cannot be negative'],
        default: 0,
      },
      length: {
        type: Number,
        min: [0, 'Length dimension cannot be negative'],
        default: 0,
      },
      sleeve: {
        type: Number,
        min: [0, 'Sleeve dimension cannot be negative'],
        default: 0,
      },
    },
    weight: {
      type: Number,
      min: [0, 'Weight cannot be negative'],
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, 'Tag cannot exceed 50 characters'],
      },
    ],
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: [0, 'Rating cannot be negative'],
        max: [5, 'Rating cannot exceed 5'],
      },
      count: {
        type: Number,
        default: 0,
        min: [0, 'Rating count cannot be negative'],
      },
    },
    availabilityDate: {
      type: Date,
      default: Date.now,
    },
    isSponsored: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: [0, 'View count cannot be negative'],
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
  },
  { timestamps: true }
);

// Pre-save middleware to update discountedPrice and updatedAt
productSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  if (this.discount > 0) {
    this.discountedPrice = Math.max(0, this.price - this.discount);
  } else {
    this.discountedPrice = Math.max(0, this.price * (1 - this.discountPercentage / 100));
  }
  next();
});

// Pre-update middleware to update discountedPrice and updatedAt
productSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.price || update.discount || update.discountPercentage) {
    const price = update.price ?? this.getQuery().price;
    const discount = update.discount ?? this.getQuery().discount ?? 0;
    const discountPercentage = update.discountPercentage ?? this.getQuery().discountPercentage ?? 0;
    if (discount > 0) {
      update.discountedPrice = Math.max(0, price - discount);
    } else {
      update.discountedPrice = Math.max(0, price * (1 - discountPercentage / 100));
    }
  }
  update.updatedAt = Date.now();
  this.setUpdate(update);
  next();
});

// Text index for search optimization
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ sellerId: 1, category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ viewCount: -1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);