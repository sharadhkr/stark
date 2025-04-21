const mongoose = require('mongoose');

// Schema for Homepage Layout
const layoutSchema = new mongoose.Schema({
  components: [{
    name: {
      type: String,
      required: [true, 'Component name is required'],
      trim: true,
      minlength: [1, 'Component name cannot be empty'],
    },
    props: {
      type: Object,
      default: {}, // Flexible props for component-specific configurations
    },
  }],
}, {
  timestamps: true, // Track creation and update times
});

// Model
const Layout = mongoose.model('Layout', layoutSchema);

module.exports = Layout;