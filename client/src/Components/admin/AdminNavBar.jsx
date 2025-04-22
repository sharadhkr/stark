import React from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaStore, FaBox, FaShoppingCart, FaList, FaSignOutAlt, FaChartBar, FaImages, FaGift, FaStar, FaLayerGroup, FaSpinner } from 'react-icons/fa';
import useAdminAuth from '../../hooks/useAdminAuth';
import toast from 'react-hot-toast';

const AdminNavBar = ({ activeSection, setActiveSection, handleLogout }) => {
  const { isAdmin, error, checkAdmin } = useAdminAuth();

  const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const sections = [
    { name: 'overview', icon: FaChartBar, label: 'Overview' },
    { name: 'sellers', icon: FaStore, label: 'Sellers' },
    { name: 'products', icon: FaBox, label: 'Products' },
    { name: 'orders', icon: FaShoppingCart, label: 'Orders' },
    { name: 'users', icon: FaUsers, label: 'Users' },
    { name: 'categories', icon: FaList, label: 'Categories' },
    { name: 'ads', icon: FaImages, label: 'Ads' },
    { name: 'combo-offers', icon: FaGift, label: 'Combo Offers' },
    { name: 'sponsored-products', icon: FaStar, label: 'Sponsored Products' },
    { name: 'layout', icon: FaLayerGroup, label: 'Layout' },
  ];

  const confirmLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      handleLogout();
      toast.success('Logged out successfully');
    }
  };

  if (isAdmin === null) {
    return (
      <div className="flex justify-center items-center h-16 bg-gradient-to-r from-blue-100 to-blue-200">
        <FaSpinner className="animate-spin text-blue-600 text-2xl" />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="text-center p-4 bg-red-50 rounded-2xl shadow-md">
        <h3 className="text-lg font-semibold text-red-700">Access Denied</h3>
        <p className="text-sm text-red-600 mb-4">{error || 'Please try again later.'}</p>
        <motion.button
          onClick={checkAdmin}
          whileHover={{ scale: 1.05 }}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-200"
        >
          Retry
        </motion.button>
      </div>
    );
  }

  return (
    <nav className="bg-gradient-to-r from-blue-100 to-blue-200 p-4 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="text-xl font-semibold text-gray-700 flex items-center gap-2 bg-blue-50 rounded-2xl py-4 justify-center"
        >
          <FaUsers className="text-blue-600" /> Admin Dashboard
        </motion.h1>
        <div className="flex flex-wrap justify-center gap-2">
          {sections.map((item) => (
            <motion.button
              key={item.name}
              onClick={() => setActiveSection(item.name)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 flex items-center gap-2 ${
                activeSection === item.name
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-blue-100'
              } shadow-sm relative group`}
              aria-label={`Switch to ${item.label} section`}
              title={item.label}
            >
              <item.icon size={16} />
              {item.label}
              <span className="absolute hidden group-hover:block bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded-md">
                {item.label}
              </span>
            </motion.button>
          ))}
          <motion.button
            onClick={confirmLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 text-sm font-medium bg-white text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-sm relative group"
            aria-label="Log out"
            title="Logout"
          >
            <FaSignOutAlt size={16} />
            Logout
            <span className="absolute hidden group-hover:block bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded-md">
              Logout
            </span>
          </motion.button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavBar;