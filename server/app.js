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

app.use(cors({
  origin: 'Process.env.CLIENT_URL', 
  credentials: true
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