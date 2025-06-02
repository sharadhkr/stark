import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { MdArrowBack, MdShoppingCart } from 'react-icons/md';
import { FaSpinner } from 'react-icons/fa';
import axios from '../useraxios';
import CartProductCard from '../Components/CartProductCard'; // Adjust path
import ProductCardSkeleton from '../Components/ProductCardSkeleton'; // Adjust path
import agroLogo from '../assets/slogo.webp';

const fadeIn = { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.9, ease: 'easeInOut' } } };
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } },
};

const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], savedForLater: [] });
  const [loading, setLoading] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isButtonFixed, setIsButtonFixed] = useState(false);
  const orderSummaryRef = useRef(null);

  useEffect(() => {
    fetchCart(setCart, setLoading, toast, navigate);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (orderSummaryRef.current) {
        const rect = orderSummaryRef.current.getBoundingClientRect();
        setIsButtonFixed(rect.bottom < window.innerHeight * 0.1);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const updateQuantity = async (productId, newQuantity, size, color) => {
    if (newQuantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    const originalCart = { ...cart };
    const itemToUpdate = cart.items.find(
      (item) => item.productId === productId && item.size === size && item.color === color
    );
    if (!itemToUpdate) return;

    if (newQuantity > itemToUpdate.stock) {
      toast.error(`Only ${itemToUpdate.stock} items available in stock!`);
      return;
    }

    setCart((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.productId === productId && item.size === size && item.color === color
          ? { ...item, quantity: newQuantity }
          : item
      ),
    }));

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `/api/user/auth/cart/${productId}`,
        { quantity: newQuantity, size, color },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCart(setCart, setLoading, toast, navigate);
      toast.success('Quantity updated!');
    } catch (error) {
      setCart(originalCart);
      toast.error('Failed to update quantity: ' + (error.response?.data?.message || error.message));
      console.error('Update Quantity Error:', error.response?.data || error);
    }
  };

  const removeItem = async (productId, size, color, isSavedForLater = false) => {
    const originalCart = { ...cart };
    setCart((prev) => ({
      ...prev,
      [isSavedForLater ? 'savedForLater' : 'items']: prev[isSavedForLater ? 'savedForLater' : 'items'].filter(
        (item) => !(item.productId === productId && item.size === size && item.color === color)
      ),
    }));

    try {
      const token = localStorage.getItem('token');
      const endpoint = isSavedForLater ? 'save-for-later' : 'cart';
      await axios.delete(`/api/user/auth/${endpoint}/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { size, color },
      });
      await fetchCart(setCart, setLoading, toast, navigate);
      toast.success('Item removed!');
    } catch (error) {
      setCart(originalCart);
      toast.error('Failed to remove item: ' + (error.response?.data?.message || error.message));
      console.error('Remove Item Error:', error.response?.data || error);
    }
  };

  const saveForLater = async (productId, quantity, size, color) => {
    const item = cart.items.find(
      (item) => item.productId === productId && item.size === size && item.color === color
    );
    if (!item) return;

    const originalCart = { ...cart };
    setCart((prev) => ({
      items: prev.items.filter(
        (i) => !(i.productId === productId && i.size === size && i.color === color)
      ),
      savedForLater: prev.savedForLater.some(
        (i) => i.productId === productId && i.size === size && i.color === color
      )
        ? prev.savedForLater
        : [...prev.savedForLater, { ...item }],
    }));

    try {
      const token = localStorage.getItem('token');
      await Promise.all([
        axios.post(
          '/api/user/auth/save-for-later',
          { productId, quantity, size, color },
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.delete(`/api/user/auth/cart/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { size, color },
        }),
      ]);
      await fetchCart(setCart, setLoading, toast, navigate);
      toast.success(`${item.name} saved for later!`);
    } catch (error) {
      setCart(originalCart);
      toast.error('Failed to save for later: ' + (error.response?.data?.message || error.message));
      console.error('Save For Later Error:', error.response?.data || error);
    }
  };

  const moveToCart = async (productId, quantity, size, color) => {
    const item = cart.savedForLater.find(
      (item) => item.productId === productId && item.size === size && item.color === color
    );
    if (!item) return;

    const originalCart = { ...cart };
    setCart((prev) => ({
      items: prev.items.some((i) => i.productId === productId && i.size === size && i.color === color)
        ? prev.items
        : [...prev.items, { ...item }],
      savedForLater: prev.savedForLater.filter(
        (i) => !(i.productId === productId && i.size === size && i.color === color)
      ),
    }));

    try {
      const token = localStorage.getItem('token');
      await Promise.all([
        axios.post(
          '/api/user/auth/cart',
          { productId, quantity, size, color },
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.delete(`/api/user/auth/save-for-later/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { size, color },
        }),
      ]);
      await fetchCart(setCart, setLoading, toast, navigate);
      toast.success(`${item.name} moved to cart!`);
    } catch (error) {
      setCart(originalCart);
      toast.error('Failed to move to cart: ' + (error.response?.data?.message || error.message));
      console.error('Move To Cart Error:', error.response?.data || error);
    }
  };

  const handleCheckout = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to proceed to checkout');
      navigate('/login');
      return;
    }

    if (cart.items.length === 0) {
      toast.error('Your cart is empty!');
      setIsCheckoutModalOpen(false);
      return;
    }

    const checkoutCart = cart.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      image: item.image || null,
      stock: item.stock || 0,
      discount: item.discount || 0,
    }));

    setIsCheckoutModalOpen(false);
    navigate('/checkout', { state: { cart: checkoutCart } });
  };

  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const shipping = subtotal > 0 ? 5 : 0;
  const total = subtotal + tax + shipping;

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
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => navigate('/')}
              className="text-gray-600"
            >
              <MdArrowBack size={24} />
            </motion.button>
            <img src={agroLogo} alt="Agro Logo" className="h-10" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">My Bag</h1>
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
        ) : cart.items.length === 0 && cart.savedForLater.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-lg shadow-sm"
          >
            <MdShoppingCart className="mx-auto text-gray-400" size={48} />
            <p className="text-gray-600 mt-4 text-lg">Your bag is empty</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="mt-4 bg-pink-500 text-white px-6 py-2 rounded-md font-medium hover:bg-pink-600 transition-all duration-300"
            >
              Shop Now
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {cart.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    My Bag ({cart.items.length} {cart.items.length === 1 ? 'item' : 'items'})
                  </h3>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {cart.items.map((item) => (
                        <motion.div
                          key={`${item.productId}-${item.size}-${item.color}`}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CartProductCard
                            item={item}
                            onUpdateQuantity={updateQuantity}
                            onRemove={(id, size, color) => removeItem(id, size, color, false)}
                            onSaveForLater={saveForLater}
                            isSavedForLater={false}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {cart.savedForLater.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Saved for Later ({cart.savedForLater.length})
                  </h3>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {cart.savedForLater.map((item) => (
                        <motion.div
                          key={`${item.productId}-${item.size}-${item.color}`}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CartProductCard
                            item={item}
                            onUpdateQuantity={() => {}}
                            onRemove={(id, size, color) => removeItem(id, size, color, true)}
                            onSaveForLater={moveToCart}
                            isSavedForLater={true}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>

            {cart.items.length > 0 && (
              <div className="lg:col-span-1" ref={orderSummaryRef}>
                <div className="bg-white p-6 rounded-lg shadow-sm sticky top-20">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Details</h3>
                  <div className="space-y-3 text-gray-600 text-sm">
                    <div className="flex justify-between">
                      <span>Bag Total</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (10%)</span>
                      <span>₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Charges</span>
                      <span className={shipping === 0 ? 'text-green-600' : ''}>
                        {shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="border-t pt-3 flex justify-between font-semibold text-gray-900">
                      <span>Total Amount</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCheckoutModalOpen(true)}
                    className={`mt-6 w-full bg-pink-500 text-white px-6 py-3 rounded-md font-medium hover:bg-pink-600 transition-all duration-300 flex items-center justify-center ${
                      isButtonFixed
                        ? 'fixed bottom-4 left-1/2 transform -translate-x-1/2 w-11/12 max-w-md z-50 bg-pink-500 rounded-md'
                        : ''
                    }`}
                    disabled={cart.items.length === 0 || loading}
                  >
                    {loading ? (
                      <FaSpinner className="animate-spin" size={20} />
                    ) : (
                      'Place Order'
                    )}
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <AnimatePresence>
        {isCheckoutModalOpen && (
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          >
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Order</h3>
              <p className="text-gray-600 mb-6 text-sm">
                Your order total is ₹{total.toFixed(2)}. Proceed to checkout?
              </p>
              <div className="flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCheckout}
                  className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors text-sm"
                >
                  Proceed
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const fetchCart = async (setCart, setLoading, toast, navigate) => {
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to view your cart');
      navigate('/login');
      return;
    }
    const [cartResponse, savedResponse] = await Promise.all([
      axios.get('/api/user/auth/cart', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/user/auth/save-for-later', { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    const cartItems = (cartResponse.data.cart?.items || []).map((item) => ({
      productId: item.product?._id || item.productId,
      name: item.product?.name || 'Unnamed Product',
      price: item.product?.price || 0,
      quantity: item.quantity || 1,
      size: item.size || 'N/A',
      color: item.color || 'N/A',
      image: item.product?.images?.[0] || null,
      stock: item.product?.quantity || 0,
      discount: item.product?.discount || 0,
    }));

    const savedItems = (savedResponse.data.savedForLater || []).map((item) => ({
      productId: item.productId?._id || item.productId,
      name: item.productId?.name || 'Unnamed Product',
      price: item.productId?.price || 0,
      quantity: item.quantity || 1,
      size: item.size || 'N/A',
      color: item.color || 'N/A',
      image: item.productId?.images?.[0] || null,
      stock: item.productId?.quantity || 0,
      discount: item.productId?.discount || 0,
    }));

    setCart({ items: cartItems, savedForLater: savedItems });
  } catch (error) {
    toast.error('Failed to fetch cart: ' + (error.response?.data?.message || error.message));
    setCart({ items: [], savedForLater: [] });
  } finally {
    setLoading(false);
  }
};

export default CartPage;