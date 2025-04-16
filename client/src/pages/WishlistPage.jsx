import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { MdArrowBack, MdFavorite } from 'react-icons/md';
import axios from '../useraxios';
import WishlistProductCard from '../Components/WishlistProductCard'; // Adjust path as needed
import ProductCardSkeleton from '../Components/ProductCardSkeleton'; // Adjust path as needed

// Animation Variants
const fadeIn = { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.9, ease: 'easeInOut' } } };

const WishlistPage = () => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to view your wishlist', { duration: 5000 });
        navigate('/login');
        return;
      }
      const response = await axios.get('/api/user/auth/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const wishlistItems = response.data.wishlist.map(item => ({
        productId: item.productId?._id || item.productId,
        name: item.productId?.name || 'Unnamed Product',
        price: item.productId?.price || 0,
        image: item.productId?.image || null, // Assuming image is available in the API response
        discount: item.productId?.discount || null, // Assuming discount is available
      }));
      setWishlist({ items: wishlistItems });
    } catch (error) {
      toast.error('Failed to fetch wishlist: ' + (error.response?.data?.message || error.message), { duration: 5000 });
      setWishlist({ items: [] });
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/user/auth/wishlist/${productId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlist(prev => ({
        items: prev.items.filter(item => item.productId !== productId),
      }));
      toast.success('Item removed from wishlist!', { icon: '💔', duration: 3000 });
    } catch (error) {
      toast.error('Failed to remove item from wishlist: ' + (error.response?.data?.message || error.message), { duration: 5000 });
      throw error; // Propagate error to card component
    }
  };

  const moveToCart = async (productId, name, price) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/user/auth/cart',
        { productId, quantity: 1, price, name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await axios.put(`/api/user/auth/wishlist/${productId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlist(prev => ({
        items: prev.items.filter(item => item.productId !== productId),
      }));
      toast.success(`${name} moved to cart!`, { icon: '🛒', duration: 3000 });
    } catch (error) {
      toast.error('Failed to move item to cart: ' + (error.response?.data?.message || error.message), { duration: 5000 });
      throw error; 
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 text-gray-900 font-sans p-6">
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'text-sm font-medium',
          style: { background: '#dadadad', color: 'green', borderRadius: '17px' },
          error: { style: { background: '#EF4444', color: '#fff' } },
        }}
      />

      <motion.div variants={fadeIn} initial="initial" animate="animate" className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex gap-5 items-center mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 text-green-600 hover:text-green-800 transition-colors"
          >
            <div className="p-2 px-6 rounded-xl shadow-lg bg-gray-100 text-gray-600 font-black flex">
              <MdArrowBack size={20} />
            </div>
          </button>
          <h2 className="text-3xl font-semibold text-gray-500">Your Wishlist</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array(5).fill().map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : wishlist.items.length === 0 ? (
          <div className="text-center">
            <MdFavorite className="mx-auto text-gray-400" size={48} />
            <p className="text-gray-600 mt-4">Your wishlist is empty.</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 bg-green-600 text-white px-6 py-2 rounded-full font-medium hover:bg-green-700 transition-all duration-300"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            <AnimatePresence>
              {wishlist.items.map((item) => (
                <motion.div
                  key={item.productId}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <WishlistProductCard
                    product={item}
                    onRemove={removeFromWishlist}
                    onMoveToCart={moveToCart}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default WishlistPage;