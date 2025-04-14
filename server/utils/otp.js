const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// In-memory OTP storage (use Redis in production)
const otps = new Map();

const sendOtp = async (phoneNumber) => {
  if (!phoneNumber) {
    throw new Error('Phone number is required');
  }

  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP temporarily
  otps.set(phoneNumber, otp);

  // Send OTP via Twilio
  await client.messages.create({
    body: `Your Stark Strip OTP is: ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber,
  });

  return otp; // For testing; remove or handle securely in production
};

const verifyOtp = (phoneNumber, otp) => {
  const storedOtp = otps.get(phoneNumber);
  if (!storedOtp || storedOtp !== otp) {
    return false;
  }
  otps.delete(phoneNumber); // Clear OTP after verification
  return true;
};

module.exports = { sendOtp, verifyOtp };