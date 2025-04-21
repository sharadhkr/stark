import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from '../useraxios';
import ProductCard from '../ProductCard';
import toast from 'react-hot-toast';
import { IoChevronForward } from 'react-icons/io5';

const CategorySectionn = ({ category }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  const fetchProducts = async () => {
    if (!category?._id) {
      setError('Invalid category ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/user/auth/category/${category._id}`);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.response?.data?.message || 'Failed to load products');
      toast.error(error.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (category?._id) {
      fetchProducts();
    }
  }, [category]);

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{category.name || 'Category'}</h2>
          <Link
            to={`/category/${category.name}`}
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors duration-200"
            aria-label="View All Products"
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
          <p className="text-gray-500 text-center py-8">No products found in this category.</p>
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
    </div>
  );
};

export default CategorySectionn;