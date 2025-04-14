const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  icon: {
    type: String,
  },
  productCount: {
    type: Number,
    default: 0, // For trending categories
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to update `updatedAt`
categorySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Text index for search
categorySchema.index({ name: 'text' });

// Check if the model is already compiled to avoid OverwriteModelError
const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

module.exports = Category;