import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TbCategory } from 'react-icons/tb';
import CategoryModal from '../AIAssistantModal'; // Assume this component exists or will be created

const GenderFilterBar = ({ products, setFilteredProducts }) => {
  const [selectedGender, setSelectedGender] = useState('all');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  useEffect(() => {
    let filtered = [...products];

    if (selectedGender !== 'all') {
      filtered = filtered.filter((product) =>
        product.gender && product.gender.toLowerCase() === selectedGender.toLowerCase()
      );
    }

    filtered.sort((a, b) => a.price - b.price);
    setFilteredProducts(filtered);
  }, [selectedGender, products, setFilteredProducts]);

  return (
    <div className=" top-0 left-0 w-full bg-gradient-to-r from-yellow-50 via-yellow-100 to-yellow-50 border-b border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Gender and Category Buttons */}
        <div className="flex space-x-8 overflow-x-auto scrollbar-hide">
          {['all', 'men', 'women', 'kids'].map((gender) => (
            <motion.button
              key={gender}
              onClick={() => setSelectedGender(gender)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold uppercase rounded-full transition-all duration-300 ${
                selectedGender === gender
                  ? 'bg-white text-black border-2 border-red-500 shadow-md'
                  : 'bg-transparent text-gray-600 hover:bg-gray-100 hover:shadow-lg'
              }`}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Filter by ${gender === 'all' ? 'All Genders' : gender}`}
            >
              <TbCategory className="w-5 h-5 text-gray-700" />
              {gender === 'all' ? 'All' : gender.charAt(0).toUpperCase() + gender.slice(1)}
            </motion.button>
          ))}
          <motion.button
            onClick={() => setIsCategoryModalOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold uppercase rounded-full transition-all duration-300 ${
              isCategoryModalOpen
                ? 'bg-white text-black border-2 border-red-500 shadow-md'
                : 'bg-transparent text-gray-600 hover:bg-gray-100 hover:shadow-lg'
            }`}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Open category modal"
          >
            <TbCategory className="w-5 h-5 text-gray-700" />
            Category
          </motion.button>
        </div>

        {/* Placeholder for future features (optional) */}
        <div className="flex items-center space-x-2">
          {/* Removed price range */}
        </div>
      </div>

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <CategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          products={products}
          setFilteredProducts={setFilteredProducts}
        />
      )}
    </div>
  );
};

export default GenderFilterBar;