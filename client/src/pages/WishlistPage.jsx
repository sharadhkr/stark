import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { MdArrowBack, MdFavorite } from 'react-icons/md';
import axios from '../useraxios';
import WishlistProductCard from '../Components/WishlistProductCard';
import ProductCardSkeleton from '../Components/ProductCardSkeleton';

// Animation Variants
const fadeIn = { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.9, ease: 'easeInOut' } } };

const WishlistPage = () => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to view your wishlist', { duration: 5000 });
        navigate('/login');
        return;
      }
      const response = await axios.get('/api/user/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Wishlist API response:', JSON.stringify(response.data, null, 2));

      const wishlistItems = (response.data.wishlist || [])
        .filter((item) => item.productId?._id)
        .map((item, index) => ({
          wishlistItemId: index,
          productId: item.productId._id.toString(),
          name: item.productId.name || 'Unnamed Product',
          price: item.productId.price || 0,
          image: Array.isArray(item.productId.images) ? item.productId.images[0] : null,
          images: Array.isArray(item.productId.images) ? item.productId.images : [],
          sizes: Array.isArray(item.productId.sizes) ? item.productId.sizes : ['S', 'M', 'L'],
          colors: Array.isArray(item.productId.colors) ? item.productId.colors : ['Black', 'White'],
          discount: item.productId.discount || 0,
          discountPercentage: item.productId.discountPercentage || 0,
          stock: item.productId.quantity || 0,
          material: item.productId.material || 'Unknown',
        }));

      setWishlist({ items: wishlistItems });
      if (wishlistItems.length === 0) {
        console.warn('Wishlist is empty after fetch');
      }
    } catch (error) {
      toast.error('Failed to fetch wishlist: ' + (error.response?.data?.message || error.message), { duration: 5000 });
      console.error('Fetch Wishlist Error:', error.response?.data || error);
      setWishlist({ items: [] });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const removeFromWishlist = useCallback(
    async (productId) => {
      const originalWishlist = { ...wishlist };
      setWishlist((prev) => ({
        items: prev.items.filter((item) => item.productId !== productId),
      }));
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/user/wishlist/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Item removed from wishlist!', { icon: '💔', duration: 3000 });
      } catch (error) {
        setWishlist(originalWishlist);
        toast.error('Failed to remove item from wishlist: ' + (error.response?.data?.message || error.message), {
          duration: 5000,
        });
        console.error('Remove Wishlist Error:', error.response?.data || error);
        throw error;
      }
    },
    [wishlist]
  );

  const moveToCart = useCallback(
    async (productId, size, color, quantity = 1) => {
      const originalWishlist = { ...wishlist };
      const item = wishlist.items.find((item) => item.productId === productId);
      if (!item) {
        toast.error('Item not found in wishlist', {
          style: {
            background: '#FF4D4F',
            color: '#fff',
            borderRadius: '12px',
            padding: '8px 16px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            fontSize: '14px',
            fontWeight: '500',
          },
        });
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Please login to add to cart');
        }
        await axios.post('/api/user/wishlist/move-to-cart', { productId, quantity, size, color }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWishlist((prev) => ({
          items: prev.items.filter((item) => item.productId !== productId),
        }));
        toast.success(`${item.name} moved to cart!`, {
          duration: 1500,
          style: {
            background: '#f3f4f6',
            color: '#10b981',
            borderRadius: '12px',
            padding: '8px 16px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            fontSize: '14px',
            fontWeight: '500',
          },
        });
      } catch (error) {
        setWishlist(originalWishlist);
        toast.error('Failed to move item to cart: ' + (error.response?.data?.message || error.message), {
          duration: 5000,
          style: {
            background: '#FF4D4F',
            color: '#fff',
            borderRadius: '12px',
            padding: '8px 16px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            fontSize: '14px',
            fontWeight: '500',
          },
        });
        console.error('Move to Cart Error:', error.response?.data || error);
        throw error;
      }
    },
    [wishlist]
  );

  const { subtotal, discountTotal } = wishlist.items.reduce(
    (acc, item) => {
      const discountedPrice =
        item.discount > 0
          ? item.price - item.discount
          : item.discountPercentage > 0
          ? item.price * (1 - item.discountPercentage / 100)
          : item.price;
      return {
        subtotal: acc.subtotal + item.price,
        discountTotal: acc.discountTotal + (item.price - discountedPrice),
      };
    },
    { subtotal: 0, discountTotal: 0 }
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'text-sm font-medium',
          style: { background: '#fff', color: '#333', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
          error: { style: { background: '#FF4D4F', color: '#fff' } },
        }}
      />

      {/* Header */}
      <header className="bg-white shadow-sm p-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex gap-2 items-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="text-gray-600"
          >
            <MdArrowBack size={24} />
          </motion.button>
          <h1 className="text-xl font-bold text-gray-800">Your Wishlist</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {Array(3).fill().map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : wishlist.items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-lg shadow-sm"
          >
            <MdFavorite className="mx-auto text-gray-400" size={48} />
            <p className="text-gray-600 mt-4 text-lg">Your wishlist is empty</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="mt-4 bg-green-500 text-white px-6 py-2 rounded-md font-medium hover:bg-green-600 transition-all duration-300"
            >
              Shop Now
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Wishlist ({wishlist.items.length} {wishlist.items.length === 1 ? 'item' : 'items'})
              </h3>
              <div className="space-y-4">
                <AnimatePresence>
                  {wishlist.items.map((item) => (
                    <motion.div
                      key={`wishlist-${item.wishlistItemId}-${item.productId}`}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
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
            </div>

            {wishlist.items.length > 0 && (
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-lg shadow-sm sticky top-20">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Details</h3>
                  <div className="space-y-3 text-gray-600 text-sm">
                    <div className="flex justify-between">
                      <span>Wishlist Total</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {discountTotal > 0 && (
                      <div className="flex justify-between">
                        <span>Discount</span>
                        <span className="text-green-600">−₹{discountTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-3 flex justify-between font-semibold text-gray-900">
                      <span>Net Amount</span>
                      <span>₹{(subtotal - discountTotal).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default WishlistPage;