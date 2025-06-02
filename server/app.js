const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const multer = require("multer");

// Load environment variables
dotenv.config();

const app = express();

// Connect to DB
connectDB();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allowed CORS origins
const allowedOrigins = [
  "https://starkk.shop",
  "http://localhost:5173"
];

// CORS middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400 // Cache preflight response for 24 hours
}));

// Optional: Explicit handling of OPTIONS requests (preflight)
app.options("*", cors());

// Multer error handler (e.g., file upload issues)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Multer error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

// Routes
const userAuthRoutes = require("./routes/userRouter");
const sellerAuthRoutes = require("./routes/sellerRouter");
const adminAuthRoutes = require("./routes/adminRouter");
const categoryRoutes = require("./routes/category");
const userrRoutes = require("./routes/userrr");

app.use("/api/user", userAuthRoutes);
app.use("/api/user/auth", userrRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/seller/auth", sellerAuthRoutes);
app.use("/api/categories", categoryRoutes);

// Handle undefined routes
app.use("*", (req, res) => {
  res.status(404).json({ message: "API route not found" });
});

module.exports = app;
