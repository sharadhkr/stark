import React, { useMemo, useRef, useContext } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ProductCard from '../ProductCard';
import { DataContext } from '../../App';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const DEFAULT_IMAGE = 'https://your-server.com/generic-product-placeholder.jpg';

const CategorySectionn = React.memo(({ category }) => {
  const { cache } = useContext(DataContext);
  const scrollRef = useRef(null);
  const cacheKey = `category_${category?._id || 'unknown'}`;
  const products = useMemo(() => {
    const categoryProducts = cache[cacheKey]?.data || [];
    return categoryProducts.map((product) => ({
      ...product,
      image: product.image && product.image !== 'https://via.placeholder.com/150' ? product.image : DEFAULT_IMAGE,
    }));
  }, [cache, cacheKey]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -224, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 224, behavior: 'smooth' });
    }
  };

  if (products.length === 0 && category?._id) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="py-6 px-4 sm:px-6 lg:px-8 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500" aria-live="polite">
            No products found in this category
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="py-6 px-4 sm:px-6 lg:px-8 bg-gray-50"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{category?.name || 'Category'}</h2>
          <div className="flex items-center gap-2">
            {products.length > 1 && (
              <>
                <button
                  onClick={scrollLeft}
                  className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"
                  aria-label="Scroll left"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                 

System: onClick={scrollRight}
                  className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"
                  aria-label="Scroll right"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </>
            )}
            <Link
              to={`/category/${category?.name}`}
              className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors duration-200"
              aria-label={`View all products in ${category?.name}`}
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
        <motion.div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 cursor-grab active:cursor-grabbing"
          style={{ scrollBehavior: 'smooth' }}
        >
          {products.map((product) => (
            <div key={product._id} className="flex-shrink-0">
              <ProductCard product={product} />
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
});

export default CategorySectionn;