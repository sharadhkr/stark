import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../axios';
import toast, { Toaster } from 'react-hot-toast';
import agroLogo from '../assets/logo.png';

const AdminAuth = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Basic validation
    if (!phoneNumber || phoneNumber.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      setLoading(false);
      return;
    }
    if (!password) {
      toast.error('Please enter your password');
      setLoading(false);
      return;
    }

    try {
      // Log the payload for debugging
      console.log('Login Payload:', { phoneNumber, password });

      const response = await axios.post('/api/admin/auth/login', { phoneNumber, password }, {
        headers: { 'Content-Type': 'application/json' },
      });

      // Log the full response for debugging
      console.log('Login Response:', response.data);

      const { token } = response.data;
      if (!token) {
        throw new Error('No token received from server');
      }

      localStorage.setItem('adminToken', token);
      toast.success('Logged in successfully!');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Login Error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-green-200 to-green-100 px-4">
      <Toaster position="top-right" toastOptions={{ className: 'text-sm sm:text-base' }} />
      <div className="w-full max-w-md sm:max-w-lg bg-white rounded-3xl shadow-xl p-6 sm:p-8 md:p-10 border border-green-200 relative overflow-hidden">
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <img
            src={agroLogo}
            alt="AgroTrade Logo"
            className="h-16 w-16 object-contain drop-shadow-md"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-green-700">Admin Login</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to manage AgroTrade</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Phone Number Input */}
          <div>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Enter phone number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-400"
              disabled={loading}
              required
            />
            {phoneNumber && phoneNumber.length !== 10 && (
              <p className="text-red-500 text-xs mt-1">Phone number must be 10 digits</p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-400"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-600'
            } text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-green-400 ${
              loading ? 'animate-pulse' : ''
            }`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminAuth;