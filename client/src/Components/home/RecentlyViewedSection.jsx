import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { motion } from 'framer-motion';
import { FaEye } from 'react-icons/fa';
import axios from '../useraxios';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import ProductCard from '../ProductCard';
import { DataContext } from '../../App';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const RecentlyViewedSection = React.memo(() => {
  const { cache, updateCache, isDataStale } = useContext(DataContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const isMounted = useRef(true);

  const products = useMemo(() => cache.recentlyViewed?.data || [], [cache.recentlyViewed]);

  const fetchRecentlyViewed = async () => {
    if (!isMounted.current) return;
    if (!isDataStale(cache.recentlyViewed?.timestamp) && products.length > 0) {
      return; // Use cached data if fresh
    }

    setLoading(true);
    setError(null);
    try {
      const userToken = localStorage.getItem('token');
      let fetchedProducts = [];

      if (userToken) {
        const response = await axios.get('/api/user/auth/recently-viewed', {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        fetchedProducts = response.data.products || [];
      } else {
        const cookieViews = Cookies.get('recentlyViewed')
          ? JSON.parse(Cookies.get('recentlyViewed'))
          : [];
        if (cookieViews.length > 0) {
          const response = await axios.post('/api/user/auth/products-by-ids', {
            productIds: cookieViews,
          });
          fetchedProducts = response.data.products || [];
          fetchedProducts.sort((a, b) => cookieViews.indexOf(a._id) - cookieViews.indexOf(b._id));
        }
      }

      updateCache('recentlyViewed', fetchedProducts);
    } catch (error) {
      console.error('Error fetching recently viewed products:', error);
      const errorMsg = error.response?.data?.message || 'Failed to load recently viewed products';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const trackProductView = async (productId) => {
    try {
      const userToken = localStorage.getItem('token');
      if (userToken) {
        await axios.post(
          '/api/user/auth/recently-viewed',
          { productId },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
      } else {
        let cookieViews = Cookies.get('recentlyViewed')
          ? JSON.parse(Cookies.get('recentlyViewed'))
          : [];
        if (!cookieViews.includes(productId)) {
          cookieViews = [productId, ...cookieViews].slice(0, 10);
          Cookies.set('recentlyViewed', JSON.stringify(cookieViews), { expires: 7 });
        }
      }
      fetchRecentlyViewed();
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchRecentlyViewed();

   

 return () => {
      isMounted.current = false;
    };
  }, [cache.recentlyViewed?.timestamp, isDataStale, updateCache]);

  const addToCart = async (productId) => {
    try {
      const userToken = localStorage.getItem('token');
      if (!userToken) {
        toast.error('Please log in to add items to cart');
        return;
      }
      await axios.post(
        '/api/user/auth/cart',
        { productId, quantity: 1, size: 'N/A', color: 'N/A' },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      toast.success('Added to cart');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

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

  if (!loading && products.length === 0 && !error) {
    return (
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="py-4 px-2 sm:px-6 lg:px-8 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500">No recently viewed products</p>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="py-4 px-2 sm:px-6 lg:px-8 bg-gray-50"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2">
            <FaEye className="text-blue-500" /> Checkout Again
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
                    d="M9 5l-7 7 7-7"
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
              onClick={fetchRecentlyViewed}
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

export default RecentlyViewedSection;