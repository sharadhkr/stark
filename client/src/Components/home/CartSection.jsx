import React, { useMemo, useContext } from 'react';
import { motion } from 'framer-motion';
import { FaShoppingCart } from 'react-icons/fa';
import axios from '../useraxios';
import toast from 'react-hot-toast';
import { DataContext } from '../../App';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const DEFAULT_IMAGE = 'https://your-server.com/generic-product-placeholder.jpg';

const CartSection = React.memo(() => {
  const { cache } = useContext(DataContext);
  const cartItems = cache.cart.data || [];
  const isLoading = cache.cart.isLoading || false;

  const validItems = useMemo(() => {
    return Array.isArray(cartItems)
      ? cartItems
          .filter((item) => item && item.product && item.product._id)
          .map((item) => ({
            ...item,
            product: {
              ...item.product,
              images: [
                {
                  url:
                    item.product.images?.[0]?.url && item.product.images[0].url !== 'https://via.placeholder.com/150'
                      ? item.product.images[0].url
                      : DEFAULT_IMAGE,
                },
              ],
            },
          }))
      : [];
  }, [cartItems]);

  const addToCart = async (productId) => {
    const userToken = localStorage.getItem('token');
    if (!userToken) {
      toast.error('Please log in to add items to cart');
      return;
    }
    try {
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
    <motion.section initial="hidden" animate="visible" variants={fadeIn} className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
          <FaShoppingCart aria-hidden="true" /> Your Cart
        </h2>
        {isLoading ? (
          <div className="text-center text-gray-600 animate-pulse" aria-live="polite">
            Loading...
          </div>
        ) : validItems.length === 0 ? (
          <p className="text-gray-500" aria-live="polite">
            Your cart is empty.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {validItems.map((item) => (
              <div
                key={item.product._id}
                className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              >
                <img
                  src={item.product.images[0].url}
                  alt={item.product.name || 'Product'}
                  className="w-full h-40 object-cover rounded-lg mb-4"
                  loading="lazy"
                  onError={(e) => {
                    if (e.target.src !== DEFAULT_IMAGE) {
                      console.warn(`Failed to load cart image: ${e.target.src}`);
                      e.target.src = DEFAULT_IMAGE;
                    }
                  }}
                />
                <h3 className="text-md font-semibold text-gray-700">{item.product.name || 'Unnamed Product'}</h3>
                <p className="text-sm text-gray-600">₹{item.product.price || 0}</p>
                <p className="text-sm text-gray-600">Quantity: {item.quantity || 1}</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                  onClick={() => addToCart(item.product._id)}
                  disabled={isLoading}
                  aria-label={`Add more ${item.product.name} to cart`}
                >
                  Add More
                </motion.button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
});

export default CartSection;