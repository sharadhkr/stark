const dotenv = require('dotenv')
dotenv.config()
const express = require("express");
const cors = require('cors');
const multer = require('multer');
const app = express();
const connectDB = require('./config/db');
const userAuthRoutes = require('./routes/userRouter');
const sellerAuthRoutes = require('./routes/sellerRouter');
const AdminAuthRoutes = require('./routes/adminRouter');

// Ensure CLIENT_URL is correctly read from environment variables
const clientUrl = process.env.CLIENT_URL || 'https://kidney-1-b2qy.onrender.com';

// Configure CORS
app.use(cors({
  origin: clientUrl, // Allow requests from the frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // If you're using cookies or auth tokens
}));

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Multer error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();
const categoryRoutes = require('./routes/category');
const aiRouter = require('./routes/airouter');
const userr = require("./routes/userrr")
app.use('/api/ai', aiRouter);
app.use('/api/user', userAuthRoutes);
app.use('/api/user/auth', userr);
app.use('/', userr);
app.use('/api/admin/auth', AdminAuthRoutes);
app.use('/api/seller/auth', sellerAuthRoutes);
app.use('/api/categories', categoryRoutes);

module.exports = app;