import React from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaStore, FaBox, FaShoppingCart, FaList, FaSignOutAlt, FaChartBar, FaImages, FaGift, FaStar, FaLayerGroup } from 'react-icons/fa';

const AdminNavBar = ({ activeSection, setActiveSection, handleLogout }) => {
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
    { name: 'layout', icon: FaLayerGroup, label: 'Layout' }, // New Layout section
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-100 to-blue-200 p-4 shadow-sm">
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
              className={`px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 flex items-center gap-2 ${
                activeSection === item.name ? 'bg-blue-200 text-blue-700' : 'bg-white text-gray-700 hover:bg-blue-100'
              } shadow-sm`}
              aria-label={`Switch to ${item.label} section`}
            >
              <item.icon /> {item.label}
            </motion.button>
          ))}
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            className="px-3 py-2 text-sm font-medium bg-white text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-sm"
            aria-label="Log out"
          >
            <FaSignOutAlt /> Logout
          </motion.button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavBar;