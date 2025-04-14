import React from 'react';
import { motion } from 'framer-motion';
import { IoClose, IoFilter, IoPricetagOutline, IoGridOutline } from 'react-icons/io5';

const FilterModal = ({
  showFilter,
  setShowFilter,
  selectedCategory,
  setSelectedCategory,
  categories,
  priceRange,
  setPriceRange,
  applyFilters,
}) => {
  if (!showFilter) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-800/40 to-indigo-900/40 backdrop-blur-xl flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 20 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-gradient-to-br from-white to-indigo-50/80 p-8 rounded-3xl shadow-2xl w-96 max-w-full border border-indigo-200/30 relative overflow-hidden"
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-indigo-300/20 to-purple-300/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tr from-teal-300/20 to-indigo-300/20 rounded-full blur-2xl opacity-50" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-2">
            <IoFilter size={24} />
            Filter Products
          </h3>
          <motion.button
            whileHover={{ rotate: 90, scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowFilter(false)}
            className="text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <IoClose size={24} />
          </motion.button>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-gray-800 font-semibold mb-3">
            <IoGridOutline size={20} className="text-indigo-500" />
            Category
          </label>
          <motion.select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-300"
            whileHover={{ scale: 1.02 }}
          >
            <option value="all" className="p-3 bg-white">
              All Categories
            </option>
            {categories.map((category) => (
              <option
                key={category._id}
                value={category._id}
                className="p-3 bg-white hover:bg-indigo-100"
              >
                {category.name}
              </option>
            ))}
          </motion.select>
        </div>

        {/* Price Range Filter */}
        <div className="mb-8">
          <label className="flex items-center gap-2 text-gray-800 font-semibold mb-3">
            <IoPricetagOutline size={20} className="text-indigo-500" />
            Price Range: <span className="text-indigo-600">${priceRange[0]} - ${priceRange[1]}</span>
          </label>
          <div className="space-y-4">
            <input
              type="range"
              min="0"
              max="1000"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
              className="w-full h-2 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
            />
            <input
              type="range"
              min="0"
              max="1000"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
              className="w-full h-2 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 5px 15px rgba(0, 0, 0, 0.15)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilter(false)}
            className="px-5 py-2 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl font-semibold shadow-md hover:from-gray-300 hover:to-gray-400 transition-all duration-300"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 5px 15px rgba(79, 70, 229, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            onClick={applyFilters}
            className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-md hover:from-indigo-600 hover:to-purple-700 transition-all duration-300"
          >
            Apply Filters
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default FilterModal;