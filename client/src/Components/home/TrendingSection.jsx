import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaFire } from 'react-icons/fa';
import axios from '../useraxios';
import toast from 'react-hot-toast';
import ProductCard from '../ProductCard';
import { IoChevronForward } from 'react-icons/io5';
import { Link } from 'react-router-dom';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const TrendingSection = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  const fetchTrendingProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/user/auth/trending');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching trending products:', error);
      setError(error.response?.data?.message || 'Failed to load trending products');
      toast.error(error.response?.data?.message || 'Failed to load trending products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingProducts();
  }, []);

  const addToCart = async (productId) => {
    try {
      const userToken = localStorage.getItem('token'); // Updated to match Home.jsx
      if (!userToken) {
        toast.error('Please log in to add items to cart');
        return;
      }
      await axios.post(
        '/api/user/auth/cart',
        { productId, quantity: 1, size: 'N/A', color: 'N/A' }, // Added size/color for compatibility
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
            <FaFire className="text-red-500" /> Trending Products (Today)
          </h2>
          <Link
            to="/trending"
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors duration-200"
            aria-label="View All Trending Products"
          >
            <IoChevronForward size={20} className="text-gray-600" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <p className="text-gray-500 text-center py-8">{error}</p>
        ) : products.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No trending products available.</p>
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
    </motion.section>
  );
};

export default TrendingSection;