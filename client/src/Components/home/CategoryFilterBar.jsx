import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { DataContext } from '../../App';

const CategoryFilterBar = React.memo(({ onCategoryChange, onPriceRangeChange }) => {
  const { cache } = useContext(DataContext);
  const categories = cache.categories?.data || [];
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 5000]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    onCategoryChange(category === 'all' ? null : category);
    toast.success(`Filtered by ${category === 'all' ? 'All Categories' : category}`);
  };

  const handlePriceRangeChange = (min, max) => {
    const newMin = Math.min(Math.max(+min, 0), 5000);
    const newMax = Math.min(Math.max(+max, 0), 5000);
    setPriceRange([newMin, newMax]);
    onPriceRangeChange([newMin, newMax]);
    toast.success(`Price range set to ₹${newMin} - ₹${newMax}`);
  };

  return (
    <div className="fixed top-0 left-0 w-full bg-yellow-100 border-b border-gray-200 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
          {['all', ...categories.map(c => c.name)].map((category) => (
            <motion.button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'text-black border-b-2 border-red-500'
                  : 'text-gray-600 hover:text-black'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Filter by ${category === 'all' ? 'All Categories' : category}`}
            >
              {category === 'all' ? 'All' : category}
            </motion.button>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={priceRange.join('-')}
            onChange={(e) => {
              const [min, max] = e.target.value.split('-').map(Number);
              handlePriceRangeChange(min, max);
            }}
            className="text-sm text-gray-700 border rounded px-2 py-1"
            aria-label="Select price range"
          >
            <option value="0-5000">₹0 - ₹5000</option>
            <option value="0-1000">₹0 - ₹1000</option>
            <option value="1000-2000">₹1000 - ₹2000</option>
            <option value="2000-5000">₹2000 - ₹5000</option>
          </select>
        </div>
      </div>
    </div>
  );
});

export default CategoryFilterBar;