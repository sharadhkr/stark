import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from '../useraxios';
import toast from 'react-hot-toast';
import ProductCard from '../components/ProductCard';

const sectionVariants = { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.3 } } };

const RelatedProducts = ({ product }) => {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      const token = localStorage.getItem('token');
      if (!token || !product) {
        setLoading(false);
        return;
      }

      try {
        // Step 1: Try fetching related products based on criteria
        const specificQuery = new URLSearchParams({
          category: product.category?._id || '',
          gender: product.gender || '',
          brand: product.brand || '',
          excludeProductId: product._id,
          limit: 10,
        }).toString();

        const specificResponse = await axios.get(`/api/user/auth/productss?${specificQuery}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const specificProducts = specificResponse.data.products || [];
        if (specificProducts.length > 0) {
          setRelatedProducts(specificProducts);
        } else {
          // Step 2: If no specific products, fetch random products
          const randomQuery = new URLSearchParams({
            limit: 10,
            random: true, // Optional flag for backend to return random products
          }).toString();

          const randomResponse = await axios.get(`/api/user/auth/products?${randomQuery}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          setRelatedProducts(randomResponse.data.products || []);
        }
      } catch (error) {
        console.error('Error fetching related products:', error);
        setError(error.response?.status === 404 ? 'No specific products found' : 'Failed to load related products');
        
        // Step 3: On error (e.g., 404), fetch random products as fallback
        if (error.response?.status === 404) {
          try {
            const randomQuery = new URLSearchParams({
              limit: 10,
              random: true,
            }).toString();

            const randomResponse = await axios.get(`/api/user/auth/products?${randomQuery}`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            setRelatedProducts(randomResponse.data.products || []);
            setError(null); // Clear error if random fetch succeeds
          } catch (randomError) {
            console.error('Error fetching random products:', randomError);
            setError('Failed to load any products');
            toast.error('Failed to load products');
          }
        } else {
          toast.error('Failed to load related products');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [product]);

  if (loading) {
    return (
      <motion.div variants={sectionVariants} className="mt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Similar Products</h2>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {[...Array(5)].map((_, idx) => (
            <div key={idx} className="min-w-[160px] h-[200px] bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </motion.div>
    );
  }

  if (error && relatedProducts.length === 0) {
    return (
      <motion.div variants={sectionVariants} className="mt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Similar Products</h2>
        <p className="text-gray-600">Unable to load products at this time.</p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={sectionVariants} className="mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-3">
        {relatedProducts.length > 0 && relatedProducts[0].category?._id === product.category?._id ? 'Similar Products' : 'Explore Other Products'}
      </h2>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        {relatedProducts.map((p) => (
          <motion.div
            key={p._id}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="min-w-[160px]"
          >
            <ProductCard product={p} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default RelatedProducts;