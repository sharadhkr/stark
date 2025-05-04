import React, { useState, useEffect, useMemo, useRef, useContext, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaFire } from 'react-icons/fa';
import axios from '../useraxios'; // Custom axios instance
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import ProductCard from '../ProductCard';
import { DataContext } from '../../App';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const TrendingSection = React.memo(() => {
  const { cache, updateCache, isDataStale } = useContext(DataContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const isMounted = useRef(true);
  const retryCount = useRef(0);
  const debounceTimeout = useRef(null);
  const MAX_RETRIES = 3;
  const BASE_RETRY_DELAY = 1000; // 1 second

  const products = useMemo(() => cache.trendingProducts?.data || [], [cache.trendingProducts]);

  const delay = useCallback((ms) => new Promise((resolve) => setTimeout(resolve, ms)), []);

  const fetchTrendingProducts = useCallback(async () => {
    if (!isMounted.current) return;
    if (!isDataStale(cache.trendingProducts?.timestamp) && cache.trendingProducts?.data) {
      return; // Skip if data is fresh (even if empty)
    }
    if (retryCount.current >= MAX_RETRIES) {
      setError('Unable to load trending products after multiple attempts');
      setLoading(false);
      toast.error('Failed to load trending products');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/user/auth/trending');
      const fetchedProducts = response.data.products || [];
      updateCache('trendingProducts', fetchedProducts);
      retryCount.current = 0; // Reset on success, even if empty
      setLoading(false); // Ensure loading stops for empty response
    } catch (error) {
      console.error('Error fetching trending products:', error);
      const status = error.response?.status;
      const errorMsg = status === 401 ? 'Please log in to view trending products' : error.response?.data?.message || 'Failed to load trending products';
      setError(errorMsg);
      toast.error(errorMsg);
      if (status !== 401) {
        retryCount.current += 1;
        if (retryCount.current < MAX_RETRIES) {
          const delayMs = BASE_RETRY_DELAY * Math.pow(2, retryCount.current);
          console.log(`Retrying fetch after ${delayMs}ms (attempt ${retryCount.current + 1})`);
          await delay(delayMs);
          fetchTrendingProducts();
        }
      }
    } finally {
      if (isMounted.current && (retryCount.current >= MAX_RETRIES || error?.includes('log in'))) {
        setLoading(false);
      }
    }
  }, [isDataStale, updateCache, delay]);

  const debouncedFetchTrendingProducts = useCallback(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      fetchTrendingProducts();
    }, 500); // 500ms debounce
  }, [fetchTrendingProducts]);

  const trackProductView = useCallback(async (productId) => {
    try {
      console.log(`Tracking view for product ${productId}`);
      const userToken = localStorage.getItem('token');
      if (userToken) {
        await axios.post('/api/user/auth/recently-viewed', { productId });
      } else {
        let cookieViews = Cookies.get('recentlyViewed')
          ? JSON.parse(Cookies.get('recentlyViewed'))
          : [];
        if (!cookieViews.includes(productId)) {
          cookieViews = [productId, ...cookieViews].slice(0, 10);
          Cookies.set('recentlyViewed', JSON.stringify(cookieViews), { expires: 7 });
        }
      }
      debouncedFetchTrendingProducts(); // Refresh trending products
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  }, [debouncedFetchTrendingProducts]);

  const addToCart = useCallback(async (productId) => {
    try {
      const userToken = localStorage.getItem('token');
      if (!userToken) {
        toast.error('Please log in to add items to cart');
        return;
      }
      await axios.post('/api/user/auth/cart', {
        productId,
        quantity: 1,
        size: 'N/A',
        color: 'N/A',
      });
      toast.success('Added to cart');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchTrendingProducts();
    return () => {
      isMounted.current = false;
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [fetchTrendingProducts]);

  const scrollLeft = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -224, behavior: 'smooth' });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 224, behavior: 'smooth' });
    }
  }, []);

  if (!loading && products.length === 0 && !error) {
    return null; // Hide component if no products
  }

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="py-6 px-4 sm:px-6 lg:px-8 bg-gray-50"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2">
            <FaFire className="text-red-500" /> Trending Products
          </h2>
          {products.length > 1 && (
            <div className="flex gap-2">
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
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            <button
              onClick={() => {
                retryCount.current = 0;
                fetchTrendingProducts();
              }}
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
                <ProductCard
                  product={product}
                  onClick={() => trackProductView(product._id)}
                  onAddToCart={() => addToCart(product._id)}
                />
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.section>
  );
});

export default TrendingSection;