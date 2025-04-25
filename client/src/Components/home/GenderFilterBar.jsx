import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TbCategory } from 'react-icons/tb';
import CategoryModal from '../AIAssistantModal';

const GenderFilterBar = ({ products = [], setFilteredProducts }) => {
  const [selectedGender, setSelectedGender] = useState('all');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Normalize gender
  const normalizeGender = (gender) => {
    if (!gender) return 'unknown';
    const lower = gender.toLowerCase();
    if (['male', 'men'].includes(lower)) return 'men';
    if (['female', 'women'].includes(lower)) return 'women';
    if (['kid', 'kids', 'child', 'children'].includes(lower)) return 'kids';
    return lower;
  };

  // Memoize filtered products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (selectedGender !== 'all') {
      filtered = filtered.filter((product) => {
        const productGender = normalizeGender(product.gender);
        return productGender === selectedGender;
      });
    }

    filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    console.log('GenderFilterBar filteredProducts:', filtered); // Debug
    return filtered;
  }, [products, selectedGender]);

  // Update filteredProducts
  useEffect(() => {
    setFilteredProducts(filteredProducts);
  }, [filteredProducts, setFilteredProducts]);

  return (
    <div className="w-full bg-white border-b border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex space-x-8 overflow-x-auto">
          {['all', 'men', 'women', 'kids'].map((gender) => (
            <motion.button
              key={gender}
              onClick={() => setSelectedGender(gender)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold uppercase rounded-full transition-all duration-300 ${
                selectedGender === gender
                  ? 'bg-blue-500 text-white border-2 border-blue-600 shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Filter by ${gender === 'all' ? 'All Genders' : gender}`}
            >
              <TbCategory className="w-5 h-5" />
              {gender === 'all' ? 'All' : gender.charAt(0).toUpperCase() + gender.slice(1)}
            </motion.button>
          ))}
          <motion.button
            onClick={() => setIsCategoryModalOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold uppercase rounded-full transition-all duration-300 ${
              isCategoryModalOpen
                ? 'bg-blue-500 text-white border-2 border-blue-600 shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Open category modal"
          >
            <TbCategory className="w-5 h-5" />
            Category
          </motion.button>
        </div>
      </div>

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