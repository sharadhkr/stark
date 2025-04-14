import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { MdArrowBack, MdShoppingCart } from 'react-icons/md';
import { FaSpinner } from 'react-icons/fa';
import axios from '../useraxios';
import CartProductCard from '../Components/CartProductCard'; // Adjust path
import ProductCardSkeleton from '../Components/ProductCardSkeleton'; // Adjust path
import agroLogo from '../assets/logo.png';

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
      // Refresh full cart state to ensure all details are preserved
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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 text-gray-900 font-sans p-6">
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'text-sm font-medium',
          style: { background: 'white', color: 'green', borderRadius: '17px' },
          error: { style: { background: '#EF4444', color: '#fff' } },
        }}
      />

      <motion.header
        variants={fadeIn}
        initial="initial"
        animate="animate"
        className="max-w-7xl mx-auto flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <div className="p-2 rounded-full bg-blue-50 shadow-lg">
              <MdArrowBack size={24} />
            </div>
          </button>
          <h2 className="text-3xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="opacity-40">YOUR CART</span>
            <img src={agroLogo} alt="AgroTrade" className="w-10 h-10 object-contain" />
          </h2>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(3).fill().map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : cart.items.length === 0 && cart.savedForLater.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-blue-50 rounded-3xl shadow-lg"
          >
            <MdShoppingCart className="mx-auto text-gray-400" size={48} />
            <p className="text-gray-600 mt-4">Your cart is empty.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-600 transition-all duration-300 shadow-md"
            >
              Start Shopping
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-8">
              {cart.items.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="opacity-40">Items in Cart</span>
                    <span className="text-blue-600">({cart.items.length})</span>
                  </h3>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {cart.items.map((item) => (
                        <motion.div
                          key={`${item.productId}-${item.size}-${item.color}`}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
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
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="opacity-40">Saved for Later</span>
                    <span className="text-blue-600">({cart.savedForLater.length})</span>
                  </h3>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {cart.savedForLater.map((item) => (
                        <motion.div
                          key={`${item.productId}-${item.size}-${item.color}`}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CartProductCard
                            item={item}
                            onUpdateQuantity={() => {}} // Disabled for saved items
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
                <div className="bg-blue-50 p-6 rounded-3xl shadow-lg border border-blue-100 sticky top-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h3>
                  <div className="space-y-3 text-gray-700">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (10%)</span>
                      <span>₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>₹{shipping.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between font-semibold text-gray-900">
                      <span>Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCheckoutModalOpen(true)}
                    className={`mt-6 w-full bg-blue-500 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-600 transition-all duration-300 shadow-md flex items-center justify-center ${
                      isButtonFixed
                        ? 'fixed bottom-4 left-1/2 transform -translate-x-1/2 w-11/12 max-w-md z-50'
                        : ''
                    }`}
                    disabled={cart.items.length === 0 || loading}
                  >
                    {loading ? (
                      <FaSpinner className="animate-spin" size={20} />
                    ) : (
                      'Proceed to Checkout'
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
            <div className="bg-white p-6 rounded-3xl shadow-lg max-w-md w-full border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Checkout</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to checkout? Your total is ₹{total.toFixed(2)}.
              </p>
              <div className="flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCheckout}
                  className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
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

    const cartItems = cartResponse.data.cart.map((item) => ({
      productId: item.productId?._id || item.productId,
      name: item.productId?.name || 'Unnamed Product',
      price: item.productId?.price || 0,
      quantity: item.quantity || 1,
      size: item.size || 'N/A',
      color: item.color || 'N/A',
      image: item.productId?.image || null,
      stock: item.productId?.quantity || 0,
      discount: item.productId?.discount || 0,
    }));

    const savedItems = savedResponse.data.savedForLater.map((item) => ({
      productId: item.productId?._id || item.productId,
      name: item.productId?.name || 'Unnamed Product',
      price: item.productId?.price || 0,
      quantity: item.quantity || 1,
      size: item.size || 'N/A',
      color: item.color || 'N/A',
      image: item.productId?.image || null,
      stock: item.productId?.quantity || 0,
      discount: item.productId?.discount || 0,
    }));

    setCart({ items: cartItems, savedForLater: savedItems });
    console.log('Fetched Cart:', cartItems);
    console.log('Fetched Saved For Later:', savedItems);
  } catch (error) {
    toast.error('Failed to fetch cart: ' + (error.response?.data?.message || error.message));
    setCart({ items: [], savedForLater: [] });
    console.error('Fetch Cart Error:', error.response?.data || error);
  } finally {
    setLoading(false);
  }
};

export default CartPage;