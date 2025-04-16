import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import axios from '../selleraxios';
import Overview from "../Components/seller/Overview";
import Products from '../Components/seller/Products';
import Orders from '../Components/seller/Orders';
import Profile from '../Components/seller/Profile';
import { FaChartBar, FaBox, FaShoppingCart, FaUser, FaSignOutAlt, FaBan } from 'react-icons/fa';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [revenue, setRevenue] = useState({
    totalRevenue: 0,
    onlineRevenue: 0,
    codRevenue: 0,
    pendingCodRevenue: 0,
  });
  const [seller, setSeller] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No seller token found. Please log in.');

        const [productsRes, ordersRes, revenueRes, profileRes, categoriesRes] = await Promise.all([
          axios.get('/api/seller/auth/products'),
          axios.get('/api/seller/auth/orders'),
          axios.get('/api/seller/auth/revenue'),
          axios.get('/api/seller/auth/profile'),
          axios.get('/api/seller/auth/categories'),
        ]);

        setProducts(productsRes.data.data.products || []);
        setOrders(ordersRes.data.data.orders || []);
        setRevenue(revenueRes.data.data || {
          totalRevenue: 0,
          onlineRevenue: 0,
          codRevenue: 0,
          pendingCodRevenue: 0,
        });
        setSeller(profileRes.data.data.seller || null);
        setCategories(categoriesRes.data.data.categories || []);
      } catch (error) {
        toast.error(error.message || 'Failed to load dashboard data');
        console.error('Dashboard fetch error:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token');
          navigate('/seller/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/seller/login');
    toast.success('Logged out successfully');
  };

  if (loading) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200"
      >
        <p className="text-lg text-gray-600 animate-pulse">Loading dashboard...</p>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 font-inter relative">
      <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
      <div
        className={`transition-all duration-300 ${
          seller?.status === 'disabled' ? 'blur-lg pointer-events-none' : ''
        }`}
      >
        <nav className="bg-white shadow-lg p-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="text-xl sm:text-2xl font-semibold text-gray-700 flex items-center gap-2"
            >
              <FaUser className="text-blue-600" /> Seller Dashboard
            </motion.h1>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {[
                { name: 'overview', icon: FaChartBar, label: 'Overview' },
                { name: 'products', icon: FaBox, label: 'Products' },
                { name: 'orders', icon: FaShoppingCart, label: 'Orders' },
                { name: 'profile', icon: FaUser, label: 'Profile' },
              ].map((item) => (
                <motion.button
                  key={item.name}
                  onClick={() => setActiveSection(item.name)}
                  whileHover={{ scale: seller?.status === 'disabled' ? 1 : 1.05 }}
                  whileTap={{ scale: seller?.status === 'disabled' ? 1 : 0.95 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm sm:text-base font-medium ${
                    activeSection === item.name
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
                  } shadow-sm transition-colors duration-200 ${
                    seller?.status === 'disabled' ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                  disabled={seller?.status === 'disabled'}
                >
                  <item.icon />
                  {item.label}
                </motion.button>
              ))}
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: seller?.status === 'disabled' ? 1 : 1.05 }}
                whileTap={{ scale: seller?.status === 'disabled' ? 1 : 0.95 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm sm:text-base font-medium bg-gray-100 text-red-600 hover:bg-red-50 shadow-sm transition-colors duration-200 ${
                  seller?.status === 'disabled' ? 'cursor-not-allowed opacity-50' : ''
                }`}
                disabled={seller?.status === 'disabled'}
              >
                <FaSignOutAlt />
                Logout
              </motion.button>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto p-4 sm:p-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="bg-blue-50 p-4 sm:p-6 rounded-2xl shadow-lg mb-6 text-center"
          >
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 capitalize">
              {activeSection}
            </h2>
          </motion.div>

          {activeSection === 'overview' && (
            <motion.div initial="hidden" animate="visible" variants={fadeIn}>
              <Overview
                seller={seller}
                products={products}
                orders={orders}
                revenue={revenue}
                loading={loading}
              />
            </motion.div>
          )}
          {activeSection === 'products' && (
            <motion.div initial="hidden" animate="visible" variants={fadeIn}>
              <Products
                products={products}
                setProducts={setProducts}
                categories={categories}
                loading={loading}
              />
            </motion.div>
          )}
          {activeSection === 'orders' && (
            <motion.div initial="hidden" animate="visible" variants={fadeIn}>
              <Orders orders={orders} setOrders={setOrders} loading={loading} />
            </motion.div>
          )}
          {activeSection === 'profile' && (
            <motion.div initial="hidden" animate="visible" variants={fadeIn}>
              <Profile seller={seller} setSeller={setSeller} loading={loading} />
            </motion.div>
          )}
        </main>
      </div>

      {seller?.status === 'disabled' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 flex items-center p-10 justify-center z-50 bg-gray-500/10"
        >
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl text-center transform">
            <FaBan className="text-5xl text-red-600 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Account Disabled</h2>
            <p className="text-gray-600 mb-6">
              Your seller account is currently disabled. Please contact the admin for assistance.
            </p>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                <strong>Phone:</strong>{' '}
                <a href="tel:+917724974347" className="text-blue-600 hover:underline">
                  +91-7724974347
                </a>
              </p>
              <p className="text-sm text-gray-600">
                <strong>Email:</strong>{' '}
                <a href="mailto:admin@marketplace.com" className="text-blue-600 hover:underline">
                  admin@marketplace.com
                </a>
              </p>
            </div>
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-6 px-6 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors duration-200"
            >
              Logout
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SellerDashboard;