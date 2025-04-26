import React from 'react';
import { motion } from 'framer-motion';
import ProductCard from '../ProductCard';
import GenderFilterBar from './GenderFilterBar';

const ProductSection = ({ products = [], filteredProducts = [], setFilteredProducts, loading = false }) => {
  const ProductSkeleton = () => (
    <div className="w-full h-64 bg-gray-200 rounded-lg animate-pulse"></div>
  );

  // console.log('ProductSection rendering:', { products, filteredProducts, loading }); // Debug

  return (
    <div className="w-full px-1 ">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="py-4 gap-5 flex flex-col"
      >
        <GenderFilterBar
          products={Array.isArray(products) ? products : []}
          setFilteredProducts={setFilteredProducts}
        />
        <div className="grid gap-4 px-2 grid-cols-2 lg:grid-cols-5 overflow-x-auto pb-2 min-h-[200px]">
          {loading ? (
            Array(6)
              .fill()
              .map((_, i) => <ProductSkeleton key={`skeleton-${i}`} />)
          ) : !Array.isArray(filteredProducts) || filteredProducts.length === 0 ? (
            <p className="text-gray-600 col-span-full text-center">No products available.</p>
          ) : (
            filteredProducts.map((product, index) => {
              if (!product || !product._id) {
                console.warn('Invalid product at index:', index, product); // Debug
                return null;
              }
              console.log('Rendering ProductCard for:', product); // Debug
              return (
                <motion.div
                  key={product._id || `product-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="min-h-[200px]"
                >
                  <ProductCard product={product} />
                </motion.div>
              );
            })
          )}
        </div>
      </motion.section>
    </div>
  );
};

export default ProductSection;