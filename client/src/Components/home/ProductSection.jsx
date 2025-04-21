import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProductCard from '../ProductCard';
import GenderFilterBar from './GenderFilterBar';

const ProductSection = ({ products, filteredProducts: initialFilteredProducts, setFilteredProducts, loading }) => {
  useEffect(() => {
    setFilteredProducts(initialFilteredProducts || products || []);
  }, [initialFilteredProducts, products, setFilteredProducts]);

  const ProductSkeleton = () => (
    <div className="w-full h-64 bg-gray-200 rounded-lg animate-pulse"></div>
  );

  return (
    <div className="w-full px-2">
      <motion.section
        initial="hidden"
        animate="visible"
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
      >
        <GenderFilterBar products={products} setFilteredProducts={setFilteredProducts} />
        <div className="flex items-center justify-between px-3 mt-16 mb-6"> {/* Adjusted for fixed bar */}
          <h2 className="text-xl font-bold text-gray-800">Popular Products</h2>
        </div>

        <div className="grid gap-4 px-2 lg:grid-cols-5 grid-cols-2 overflow-x-auto pb-2 scrollbar-hidden">
          {loading ? (
            Array(4)
              .fill()
              .map((_, i) => <ProductSkeleton key={i} />)
          ) : initialFilteredProducts && initialFilteredProducts.length === 0 ? (
            <p className="text-gray-600">No products available.</p>
          ) : (
            (initialFilteredProducts || []).map((product) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))
          )}
        </div>
      </motion.section>
    </div>
  );
};

export default ProductSection;