import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingCart, LoaderCircle } from 'lucide-react';
import { debounce } from 'lodash';
import axios from '../useraxios';
import CartProductCard from '../Components/CartProductCard';
import ProductCardSkeleton from '../Components/ProductCardSkeleton';
import agroLogo from '../assets/slogo.webp';

const fadeIn = { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.9, ease: 'easeInOut' } } };
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } },
};

const CartPage = React.memo(() => {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], savedForLater: [] });
  const [loading, setLoading] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const toastRef = useRef({}); // Track toast notifications
  const isMounted = useRef(false); // Track component mount state

  // Debounced fetchCart to prevent multiple rapid API calls
  const fetchCart = useCallback(debounce(async () => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        if (!toastRef.current['login-error']) {
          toastRef.current['login-error'] = toast.error('Please log in to view your cart', {
            onClose: () => delete toastRef.current['login-error'],
          });
        }
        navigate('/login');
        return;
      }
      const [cartResponse, savedResponse] = await Promise.all([
        axios.get('/api/user/auth/cart', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/user/auth/save-for-later', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const cartItems = (cartResponse.data.cart?.items || [])
        .filter((item) => item.product?._id)
        .map((item, index) => ({
          cartItemId: index,
          productId: item.product?._id || item.productId,
          name: item.product?.name || 'Unnamed Product',
          price: item.product?.price || 0,
          quantity: item.quantity || 1,
          size: item.size || 'N/A',
          color: item.color || 'N/A',
          image: item.product?.images?.[0] || null,
          sizes: Array.isArray(item.product?.sizes) ? item.product.sizes : ['S', 'M', 'L'],
          stock: item.product?.quantity || 0,
          discount: item.product?.discount || 0,
        }));

      const savedItems = (savedResponse.data.savedForLater || [])
        .filter((item) => item.productId?._id)
        .map((item, index) => ({
          cartItemId: index,
          productId: item.productId?._id || item.productId,
          name: item.productId?.name || 'Unnamed Product',
          price: item.productId?.price || 0,
          quantity: item.quantity || 1,
          size: item.size || 'N/A',
          color: item.color || 'N/A',
          image: item.productId?.images?.[0] || null,
          sizes: Array.isArray(item.productId?.sizes) ? item.productId.sizes : ['S', 'M', 'L'],
          stock: item.productId?.quantity || 0,
          discount: item.productId?.discount || 0,
        }));

      setCart({ items: cartItems, savedForLater: savedItems });
      if (cartItems.length === 0 && !toastRef.current['empty-cart']) {
        toastRef.current['empty-cart'] = toast('Your cart is empty', {
          icon: '🛒',
          onClose: () => delete toastRef.current['empty-cart'],
        });
      }
    } catch (error) {
      if (!toastRef.current['fetch-error']) {
        toastRef.current['fetch-error'] = toast.error('Failed to fetch cart: ' + (error.response?.data?.message || error.message), {
          onClose: () => delete toastRef.current['fetch-error'],
        });
      }
      console.error('Fetch Cart Error:', error.response?.data || error);
      setCart({ items: [], savedForLater: [] });
    } finally {
      setLoading(false);
    }
  }, 300), [navigate]);

  useEffect(() => {
    isMounted.current = true;
    fetchCart();
    return () => {
      isMounted.current = false;
      fetchCart.cancel(); // Cleanup debounce
    };
  }, [fetchCart]);

  const updateQuantity = useCallback(
    debounce(async (productId, newQuantity, size, color) => {
      if (newQuantity < 1) {
        if (!toastRef.current[`quantity-error-${productId}-${size}-${color}`]) {
          toastRef.current[`quantity-error-${productId}-${size}-${color}`] = toast.error('Quantity must be at least 1', {
            onClose: () => delete toastRef.current[`quantity-error-${productId}-${size}-${color}`],
          });
        }
        return;
      }

      const itemToUpdate = cart.items.find(
        (item) => item.productId === productId && item.size === size && item.color === color
      );
      if (!itemToUpdate) {
        if (!toastRef.current[`item-not-found-${productId}-${size}-${color}`]) {
          toastRef.current[`item-not-found-${productId}-${size}-${color}`] = toast.error('Item not found in cart', {
            onClose: () => delete toastRef.current[`item-not-found-${productId}-${size}-${color}`],
          });
        }
        return;
      }

      if (newQuantity > itemToUpdate.stock) {
        if (!toastRef.current[`stock-error-${productId}-${size}-${color}`]) {
          toastRef.current[`stock-error-${productId}-${size}-${color}`] = toast.error(`Only ${itemToUpdate.stock} items available in stock!`, {
            onClose: () => delete toastRef.current[`stock-error-${productId}-${size}-${color}`],
          });
        }
        return;
      }

      const originalCart = { ...cart };
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
        await axios.put(
          `/api/user/auth/cart/${productId}`,
          { quantity: newQuantity, size, color },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!toastRef.current[`quantity-success-${productId}-${size}-${color}`]) {
          toastRef.current[`quantity-success-${productId}-${size}-${color}`] = toast.success('Quantity updated!', {
            onClose: () => delete toastRef.current[`quantity-success-${productId}-${size}-${color}`],
          });
        }
      } catch (error) {
        setCart(originalCart);
        if (!toastRef.current[`quantity-error-${productId}-${size}-${color}`]) {
          toastRef.current[`quantity-error-${productId}-${size}-${color}`] = toast.error('Failed to update quantity: ' + (error.response?.data?.message || error.message), {
            onClose: () => delete toastRef.current[`quantity-error-${productId}-${size}-${color}`],
          });
        }
        console.error('Update Quantity Error:', error.response?.data || error);
      }
    }, 300),
    [cart]
  );

  const removeItem = useCallback(
    debounce(async (productId, size, color, isSavedForLater = false) => {
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
        if (!toastRef.current[`remove-success-${productId}-${size}-${color}`]) {
          toastRef.current[`remove-success-${productId}-${size}-${color}`] = toast.success('Item removed!', {
            onClose: () => delete toastRef.current[`remove-success-${productId}-${size}-${color}`],
          });
        }
      } catch (error) {
        setCart(originalCart);
        if (!toastRef.current[`remove-error-${productId}-${size}-${color}`]) {
          toastRef.current[`remove-error-${productId}-${size}-${color}`] = toast.error('Failed to remove item: ' + (error.response?.data?.message || error.message), {
            onClose: () => delete toastRef.current[`remove-error-${productId}-${size}-${color}`],
          });
        }
        console.error('Remove Item Error:', error.response?.data || error);
      }
    }, 300),
    [cart]
  );

  const saveForLater = useCallback(
    debounce(async (productId, quantity, size, color) => {
      const item = cart.items.find(
        (item) => item.productId === productId && item.size === size && item.color === color
      );
      if (!item) {
        if (!toastRef.current[`save-not-found-${productId}-${size}-${color}`]) {
          toastRef.current[`save-not-found-${productId}-${size}-${color}`] = toast.error('Item not found in cart', {
            onClose: () => delete toastRef.current[`save-not-found-${productId}-${size}-${color}`],
          });
        }
        return;
      }

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
        if (!toastRef.current[`save-success-${productId}-${size}-${color}`]) {
          toastRef.current[`save-success-${productId}-${size}-${color}`] = toast.success(`${item.name} saved for later!`, {
            onClose: () => delete toastRef.current[`save-success-${productId}-${size}-${color}`],
          });
        }
      } catch (error) {
        setCart(originalCart);
        if (!toastRef.current[`save-error-${productId}-${size}-${color}`]) {
          toastRef.current[`save-error-${productId}-${size}-${color}`] = toast.error('Failed to save for later: ' + (error.response?.data?.message || error.message), {
            onClose: () => delete toastRef.current[`save-error-${productId}-${size}-${color}`],
          });
        }
        console.error('Save For Later Error:', error.response?.data || error);
      }
    }, 300),
    [cart]
  );

  const moveToCart = useCallback(
    debounce(async (productId, quantity, size, color) => {
      const item = cart.savedForLater.find(
        (item) => item.productId === productId && item.size === size && item.color === color
      );
      if (!item) {
        if (!toastRef.current[`move-not-found-${productId}-${size}-${color}`]) {
          toastRef.current[`move-not-found-${productId}-${size}-${color}`] = toast.error('Item not found in saved for later', {
            onClose: () => delete toastRef.current[`move-not-found-${productId}-${size}-${color}`],
          });
        }
        return;
      }

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
            '/api/user/auth/cart/add',
            { productId, quantity, size, color },
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          axios.delete(`/api/user/auth/save-for-later/${productId}`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { size, color },
          }),
        ]);
        if (!toastRef.current[`move-success-${productId}-${size}-${color}`]) {
          toastRef.current[`move-success-${productId}-${size}-${color}`] = toast.success(`${item.name} moved to cart!`, {
            onClose: () => delete toastRef.current[`move-success-${productId}-${size}-${color}`],
          });
        }
      } catch (error) {
        setCart(originalCart);
        if (!toastRef.current[`move-error-${productId}-${size}-${color}`]) {
          toastRef.current[`move-error-${productId}-${size}-${color}`] = toast.error('Failed to move to cart: ' + (error.response?.data?.message || error.message), {
            onClose: () => delete toastRef.current[`move-error-${productId}-${size}-${color}`],
          });
        }
        console.error('Move To Cart Error:', error.response?.data || error);
      }
    }, 300),
    [cart]
  );

  const handleCheckout = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      if (!toastRef.current['checkout-login-error']) {
        toastRef.current['checkout-login-error'] = toast.error('Please login to proceed to checkout', {
          onClose: () => delete toastRef.current['checkout-login-error'],
        });
      }
      navigate('/login');
      return;
    }

    if (cart.items.length === 0) {
      if (!toastRef.current['empty-cart-error']) {
        toastRef.current['empty-cart-error'] = toast.error('Your cart is empty!', {
          onClose: () => delete toastRef.current['empty-cart-error'],
        });
      }
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
  }, [cart.items, navigate]);

  const { subtotal, discountTotal, tax, shipping, total } = useMemo(() => {
    const sub = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const disc = cart.items.reduce((sum, item) => sum + (item.discount || 0) * item.quantity, 0);
    const tx = sub * 0.12; // 12% GST
    const ship = sub > 0 ? 20 : 0; // ₹20 delivery
    return {
      subtotal: sub,
      discountTotal: disc,
      tax: tx,
      shipping: ship,
      total: sub - disc + tx + ship,
    };
  }, [cart.items]);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'text-sm font-medium',
          style: { background: '#fff', color: '#333', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
          error: { style: { background: '#FF4D4F', color: '#fff' } },
          success: { style: { background: '#10B981', color: '#fff' } },
        }}
      />

      {/* Header */}
      <header className="bg-white shadow-sm p-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex gap-2 items-center">
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => navigate('/')}
              className="text-gray-600"
            >
              <ArrowLeft size={24} />
            </motion.button>
            {/* <img src={agroLogo} alt="Agro Logo" className="h-10" /> */}
          </div>
          <h1 className="text-xl font-bold text-gray-800">Shopping Bag</h1>
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
            <ShoppingCart className="mx-auto text-gray-400" size={48} />
            <p className="text-gray-600 mt-4 text-lg">Your bag is empty</p>
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
              {cart.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    My Bag ({cart.items.length} {cart.items.length === 1 ? 'item' : 'items'})
                  </h3>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {cart.items.map((item) => (
                        <motion.div
                          key={`cart-${item.cartItemId}-${item.productId}-${item.size}-${item.color}`}
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
                          key={`saved-${item.cartItemId}-${item.productId}-${item.size}-${item.color}`}
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
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-lg shadow-sm sticky top-20">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Details</h3>
                  <div className="space-y-3 text-gray-600 text-sm">
                    <div className="flex justify-between">
                      <span>Bag Total</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {discountTotal > 0 && (
                      <div className="flex justify-between">
                        <span>Discount</span>
                        <span className="text-green-600">−₹{discountTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>GST (12%)</span>
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
                </div>
              </div>
            )}
          </div>
        )}
        {cart.items.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCheckoutModalOpen(true)}
            className="w-11/12 max-w-md bg-green-500 text-white px-6 py-3 shadow-lg m-auto mt-4 rounded-md font-medium hover:bg-green-600 transition-all duration-300 flex items-center justify-center z-50"
            disabled={cart.items.length === 0 || loading}
          >
            {loading ? <LoaderCircle className="animate-spin" size={20} /> : 'Place Order'}
          </motion.button>
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
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
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
});

export default CartPage;