import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const CategoryFilterBar = ({ products, setFilteredProducts }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 5000]);

  // Update filtered products whenever category or price range changes
  useEffect(() => {
    let filtered = [...products];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    filtered = filtered.filter(
      (product) => product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    filtered.sort((a, b) => a.price - b.price);
    setFilteredProducts(filtered);
  }, [selectedCategory, priceRange, products, setFilteredProducts]);

  return (
    <div className="fixed top-0 left-0 w-full bg-yellow-100 border-b border-gray-200 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        {/* Category Buttons */}
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
          {['all', 'Men', 'Women', 'Kids'].map((category) => (
            <motion.button
              key={category}
              onClick={() => setSelectedCategory(category)}
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

        {/* Price Range (Simplified Toggle for Now) */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">
            ₹{priceRange[0]} - ₹{priceRange[1]}
          </span>
          <motion.button
            onClick={() => {
              const newMin = prompt('Enter minimum price (0-5000):', priceRange[0]) || 0;
              const newMax = prompt('Enter maximum price (0-5000):', priceRange[1]) || 5000;
              setPriceRange([
                Math.min(Math.max(+newMin, 0), 5000),
                Math.min(Math.max(+newMax, 0), 5000),
              ]);
              toast.success('Price range updated!');
            }}
            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            aria-label="Set price range"
          >
            Set Range
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default CategoryFilterBar;