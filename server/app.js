const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const app = express();
const connectDB = require('./config/db');
const userAuthRoutes = require('./routes/userRouter');
const sellerAuthRoutes = require('./routes/sellerRouter');
const AdminAuthRoutes = require('./routes/adminRouter');

// Apply CORS middleware first to ensure headers are added to all responses
app.use(cors({
  origin: '*', // Allow requests from any origin
  credentials: true // Allow credentials (e.g., cookies) if needed
}));

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Error-handling middleware for Multer and other errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Multer error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

// Connect to the database
connectDB();

// Routes
const categoryRoutes = require('./routes/category');
const userr = require('./routes/userrr');
app.use('/api/user', userAuthRoutes);
app.use('/api/user/auth', userr);
app.use('/', userr);
app.use('/api/admin/auth', AdminAuthRoutes);
app.use('/api/seller/auth', sellerAuthRoutes);
app.use('/api/categories', categoryRoutes);

// Catch-all for 404 errors
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;