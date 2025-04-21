import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaEye } from 'react-icons/fa';
import { IoChevronForward } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import axios from '../useraxios';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import ProductCard from '../ProductCard';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const RecentlyViewedSection = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const isMounted = useRef(true);

  const fetchRecentlyViewed = async () => {
    if (!isMounted.current) return;

    setLoading(true);
    setError(null);
    try {
      const userToken = localStorage.getItem('token'); // Updated to match other sections
      let fetchedProducts = [];

      if (userToken) {
        // Fetch for logged-in users
        console.log('Fetching recently viewed products (logged-in)...');
        const response = await axios.get('/api/user/auth/recently-viewed');
        console.log('Recently viewed response:', response.data);
        fetchedProducts = response.data.products || [];
      } else {
        // Fetch for guest users from cookies
        console.log('Fetching recently viewed products (guest)...');
        const cookieViews = Cookies.get('recentlyViewed') ? JSON.parse(Cookies.get('recentlyViewed')) : [];
        if (cookieViews.length > 0) {
          const response = await axios.post('/api/user/auth/products-by-ids', { productIds: cookieViews });
          fetchedProducts = response.data.products || [];
          // Sort by cookie order (most recent first)
          fetchedProducts.sort((a, b) => cookieViews.indexOf(a._id) - cookieViews.indexOf(b._id));
        }
      }

      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error fetching recently viewed products:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load recently viewed products';
      setError(errorMessage);
      toast.error(errorMessage);
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
        let cookieViews = Cookies.get('recentlyViewed') ? JSON.parse(Cookies.get('recentlyViewed')) : [];
        if (!cookieViews.includes(productId)) {
          cookieViews = [productId, ...cookieViews].slice(0, 10); // Keep last 10
          Cookies.set('recentlyViewed', JSON.stringify(cookieViews), { expires: 7 });
        }
      }
      // Refresh products after tracking view
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
  }, []);

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

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="py-6 px-4 sm:px-6 lg:px-8 bg-gray-50"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaEye className="text-blue-500" /> Recently Viewed Products
          </h2>
          <Link
            to="/recently-viewed"
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors duration-200"
            aria-label="View All Recently Viewed Products"
          >
            <IoChevronForward size={20} className="text-gray-600" />
          </Link>
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
        ) : products.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recently viewed products.</p>
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
                />
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.section>
  );
};

export default RecentlyViewedSection;