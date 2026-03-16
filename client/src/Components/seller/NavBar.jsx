import React, { useState } from 'react';
import { FaStore, FaChevronDown, FaSignOutAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

const NavBar = ({ activeSection, setActiveSection, handleLogout }) => {
  const [isNavOpen, setIsNavOpen] = useState(false);

  const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <nav className="bg-gradient-to-r from-blue-100 to-blue-200 p-4 shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="text-xl sm:text-2xl font-semibold text-gray-700 flex items-center gap-2 w-full py-4 bg-blue-50 rounded-2xl justify-center sm:w-auto"
        >
          <FaStore className="text-blue-600" /> Seller Dashboard
        </motion.h1>
        <div className="flex items-center gap-3">
          <div className="sm:hidden">
            <motion.button
              onClick={() => setIsNavOpen(!isNavOpen)}
              whileHover={{ scale: 1.1 }}
              className="text-gray-600 focus:outline-none p-2 rounded-full hover:bg-blue-100"
              aria-label="Toggle navigation menu"
            >
              <FaChevronDown className={`transition-transform duration-200 ${isNavOpen ? 'rotate-180' : ''}`} />
            </motion.button>
          </div>
          <div
            className={`${
              isNavOpen ? 'flex' : 'hidden'
            } sm:flex flex-col sm:flex-row items-center gap-2 sm:gap-3 absolute sm:static top-16 left-0 right-0 bg-blue-50 sm:bg-transparent shadow-md sm:shadow-none p-4 sm:p-0 rounded-b-2xl sm:rounded-none`}
          >
            {['overview', 'products', 'orders', 'profile'].map((section) => (
              <motion.button
                key={section}
                onClick={() => {
                  setActiveSection(section);
                  setIsNavOpen(false);
                }}
                whileHover={{ scale: 1.05 }}
                className={`w-full sm:w-auto px-4 py-2 text-sm sm:text-base font-medium rounded-xl transition-all duration-200 ${
                  activeSection === section ? 'bg-blue-200 text-blue-700' : 'bg-white text-gray-700 hover:bg-blue-100'
                } shadow-sm`}
                aria-label={`Switch to ${section} section`}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </motion.button>
            ))}
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.05 }}
              className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base font-medium bg-white text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-sm"
              aria-label="Log out"
            >
              <FaSignOutAlt /> Logout
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;