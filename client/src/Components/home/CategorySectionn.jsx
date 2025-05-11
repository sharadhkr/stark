import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from '../useraxios';
import toast from 'react-hot-toast';
import ProductCard from '../ProductCard';
import { DataContext } from '../../App';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const CategorySectionn = React.memo(({ category }) => {
  const { cache, updateCache, isDataStale } = useContext(DataContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const hasFetched = useRef(false);

  const cacheKey = `category_${category?._id || 'unknown'}`;
  const products = useMemo(() => cache[cacheKey]?.data || [], [cache, cacheKey]);

  const fetchProducts = async () => {
    if (!category?._id) {
      setError('Invalid category ID');
      setLoading(false);
      return;
    }
    if (cache[cacheKey]?.data?.length > 0 && !isDataStale(cache[cacheKey]?.timestamp)) {
      console.log(`Using cached data for ${cacheKey}`);
      return; // Use cached data if fresh
    }

    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching products for category ${category._id}`);
      const response = await axios.get(`/api/user/auth/category/${category._id}`);
      const fetchedProducts = response.data.products || [];
      updateCache(cacheKey, fetchedProducts);
      hasFetched.current = true;
    } catch (error) {
      console.error('Error fetching products:', error);
      const errorMsg = error.response?.data?.message || 'Failed to load products';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('CategorySectionn rendered, category ID:', category?._id);
    if (category?._id && !hasFetched.current) {
      fetchProducts();
    }
  }, [category?._id]); // Only depend on category._id

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

  if (!loading && products.length === 0 && !error && category?._id) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="py-6 px-4 sm:px-6 lg:px-8 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500">No products found in this category</p>
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
                  onClick={scrollRight}
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
              aria-label="View All Products"
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

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            <button
              onClick={fetchProducts}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
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
        )}
      </div>
    </motion.div>
  );
});

export default CategorySectionn;