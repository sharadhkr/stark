import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TbCategory } from 'react-icons/tb';
import { debounce } from 'lodash';
import CategoryModal from '../AIAssistantModal';

const GenderFilterBar = ({ products = [], setFilteredProducts }) => {
  const [selectedGender, setSelectedGender] = useState('all');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Memoized gender normalization function
  const normalizeGender = useCallback((gender) => {
    if (!gender) return 'unknown';
    const lower = gender.toLowerCase().trim();
    if (['male', 'men', 'man'].includes(lower)) return 'men';
    if (['female', 'women', 'woman'].includes(lower)) return 'women';
    if (['kid', 'kids', 'child', 'children', 'kidz'].includes(lower)) return 'kids';
    return 'unknown';
  }, []);

  // Memoize filtered products with deduplication
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (selectedGender !== 'all') {
      filtered = filtered.filter((product) => {
        const productGender = normalizeGender(product.gender);
        console.log(`Product ID: ${product._id}, Gender: ${product.gender}, Normalized: ${productGender}`); // Debug
        return productGender === selectedGender;
      });
    }

    // Sort by price
    filtered.sort((a, b) => (a.price || 0) - (b.price || 0));

    // Deduplicate
    const seenIds = new Set();
    const uniqueFiltered = filtered.filter((product) => {
      if (!product._id || seenIds.has(product._id)) {
        console.warn(`Duplicate product ID in GenderFilterBar: ${product._id}`, product);
        return false;
      }
      seenIds.add(product._id);
      return true;
    });

    console.log(`Filtered products for ${selectedGender}: ${uniqueFiltered.length}`); // Debug
    return uniqueFiltered;
  }, [products, selectedGender, normalizeGender]);

  // Debounced setFilteredProducts to prevent rapid updates
  const debouncedSetFilteredProducts = useCallback(
    debounce((filtered) => {
      setFilteredProducts(filtered);
    }, 300),
    [setFilteredProducts]
  );

  // Update filtered products
  useEffect(() => {
    debouncedSetFilteredProducts(filteredProducts);
    return () => debouncedSetFilteredProducts.cancel(); // Cleanup debounce
  }, [filteredProducts, debouncedSetFilteredProducts]);

  // Memoize gender options
  const genderOptions = useMemo(() => ['all', 'men', 'women', 'kids'], []);

  return (
    <div className="w-full relative">
      <div className="w-full relative bg-white/85 drop-shadow-lg rounded-2xl z-10">
        <div className="w-full mx-auto px-4 py-4 flex items-center">
          <div className="w-full flex justify-between">
            <div className="w-[76%] flex justify-between">
              {genderOptions.map((gender) => (
                <motion.button
                  key={gender}
                  onClick={() => setSelectedGender(gender)}
                  className={`flex items-center text-sm font-semibold uppercase rounded-lg transition-all duration-300 ${
                    selectedGender === gender
                      ? 'bg-gray-500/0 text-violet-700 drop-shadow-md'
                      : 'bg-gray-100/0 text-gray-600'
                  }`}
                  whileTap={{ scale: 0.95 }}
                  aria-label={`Filter by ${gender === 'all' ? 'All Genders' : gender}`}
                >
                  {gender === 'all' ? 'All' : gender.charAt(0).toUpperCase() + gender.slice(1)}
                </motion.button>
              ))}
            </div>
            <div className="w-[10%] flex items-end">
              <motion.button
                onClick={() => setIsCategoryModalOpen(true)}
                className={`flex items-center text-sm font-semibold uppercase rounded-lg transition-all duration-300 ${
                  isCategoryModalOpen
                    ? 'bg-blue-500/0 text-violet-700 drop-shadow-md'
                    : 'bg-gray-100/0 text-gray-600'
                }`}
                whileTap={{ scale: 0.95 }}
                aria-label="Open category modal"
              >
                <TbCategory className="w-6 h-6 text-purple-700" />
              </motion.button>
            </div>
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
      <div className="absolute w-full z-1 opacity-40 top-0 left-0 flex items-center justify-center blur-xl">
        <div className="w-[30%] h-14 bg-purple-400"></div>
        <div className="w-[40%] h-14 skew-x-12 bg-pink-400"></div>
        <div className="w-[30%] h-14 bg-green-300"></div>
      </div>
    </div>
  );
};

export default GenderFilterBar;