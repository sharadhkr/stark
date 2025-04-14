const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const isLoggedIn = async (req, res, next) => {
  try {
    // Log the Authorization header
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid Authorization header');
      return res.status(401).json({ message: 'Unauthorized: Missing or invalid token' });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];
    console.log('Extracted token:', token);

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded token:', decoded);

    // Log current time and token expiration for debugging
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    console.log('Current time (Unix):', currentTime);
    console.log('Token expires at (Unix):', decoded.exp);
    console.log('Time until expiration (seconds):', decoded.exp - currentTime);
    if (decoded.exp < currentTime) {
      console.log('Token is expired');
      return res.status(401).json({ message: 'Unauthorized: Token has expired', expired: true });
    }

    // Check if the decoded token has the expected user ID field
    if (!decoded.id && !decoded._id) {
      console.log('Invalid token payload: No user ID found in decoded token');
      return res.status(401).json({ message: 'Unauthorized: Invalid token payload' });
    }

    // Use the correct field for user ID
    const userId = decoded.id || decoded._id;

    // Find the user in the database
    const user = await User.findById(userId);
    if (!user) {
      console.log(`User not found for ID: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Attach the user to the request
    req.user = user;
    console.log('User authenticated:', user._id.toString());
    next();
  } catch (error) {
    console.error('Auth error:', error.name, error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized: Token has expired', expired: true });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    } else if (error.name === 'NotBeforeError') {
      return res.status(401).json({ message: 'Unauthorized: Token not yet valid' });
    }

    return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }
};

module.exports = isLoggedIn;