import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../useraxios';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaTruck, FaCreditCard, FaCheckCircle, FaMapMarkerAlt, FaMoneyBillWave, FaWallet } from 'react-icons/fa';
import placeholderImage from '../assets/logo.png';

// Load Razorpay script with cache busting and error handling
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.querySelector('script[src*="checkout.razorpay.com"]')) {
      resolve(true); // Script already loaded
      return;
    }
    const script = document.createElement('script');
    script.src = `https://checkout.razorpay.com/v1/checkout.js?t=${Date.now()}`; // Cache busting
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay checkout script');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

// Animation Variants
const stepVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const CheckoutPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState({ name: '', phoneNumber: '', email: '' });
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to proceed with checkout');
      navigate('/login');
      return;
    }

    const fetchCheckoutData = async () => {
      try {
        const userRes = await axios.get('/api/user/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = userRes.data.user || userRes.data.data?.user || userRes.data;
        if (!user) throw new Error('User data not found');

        setUserDetails({
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.phoneNumber,
          phoneNumber: user.phoneNumber,
          email: user.email || '',
        });
        setSavedAddresses(user.addresses || []);
        if (user.addresses?.length > 0) setSelectedAddress(user.addresses[0]._id);

        let items = [];
        if (state?.cart?.length) {
          items = await Promise.all(
            state.cart.map(async (item) => {
              const productRes = await axios.get(`/api/user/auth/products/${item.productId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const product = productRes.data.product || productRes.data.data?.product;
              if (!product) return null;
              return {
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: Array.isArray(item.image) ? item.image[0] : item.image,
                size: item.size,
                color: item.color,
                isCashOnDeliveryAvailable: product.isCashOnDeliveryAvailable ?? true,
                onlinePaymentPercentage: product.onlinePaymentPercentage ?? 100,
                sellerId: product.sellerId?._id || product.sellerId,
              };
            })
          ).then((items) => items.filter((item) => item !== null));
        } else {
          const cartRes = await axios.get('/api/user/auth/cart', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const cart = cartRes.data.cart || cartRes.data.data?.cart;
          if (!cart) throw new Error('Cart data not found');
          items = cart.map((item) => ({
            productId: item.productId._id || item.productId,
            name: item.productId.name,
            price: item.priceAtAdd || item.productId.price,
            quantity: item.quantity,
            image: Array.isArray(item.productId.images) ? item.productId.images[0] : item.productId.images,
            size: item.size,
            color: item.color,
            isCashOnDeliveryAvailable: item.productId.isCashOnDeliveryAvailable ?? true,
            onlinePaymentPercentage: item.productId.onlinePaymentPercentage ?? 100,
            sellerId: item.productId.sellerId?._id || item.productId.sellerId,
          }));
        }

        if (!items.length) {
          toast.error('Your cart is empty');
          navigate('/cart');
        } else {
          setCartItems(items);
        }
      } catch (error) {
        console.error('Fetch Checkout Data Error:', error.response?.data || error.message);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          toast.error('Session expired, please login again');
          navigate('/login');
        } else {
          toast.error(error.response?.data?.message || error.message || 'Failed to load checkout details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutData();
  }, [navigate, state?.cart]);

  const handleUserDetailsChange = (e) => setUserDetails({ ...userDetails, [e.target.name]: e.target.value });
  const handleAddressChange = (e) => setAddress({ ...address, [e.target.name]: e.target.value });

  const handleAddNewAddress = async () => {
    if (!address.street || !address.city || !address.state || !address.postalCode) {
      toast.error('Please fill in all address fields');
      return;
    }
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/user/auth/add-address', address, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newAddress = res.data.address;
      setSavedAddresses([...savedAddresses, newAddress]);
      setSelectedAddress(newAddress._id);
      setShowNewAddressForm(false);
      toast.success('Address added successfully');
      setCurrentStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add address');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAddress = () => {
    if (!selectedAddress) {
      toast.error('Please select or add a delivery address');
      return;
    }
    setCurrentStep(2);
  };

  const calculatePaymentSplit = () => {
    return cartItems.map((item) => {
      const onlinePercentage = item.onlinePaymentPercentage / 100;
      const totalItemCost = item.price * item.quantity;
      return {
        ...item,
        onlineAmount: paymentMethod === 'cod_full' ? 0 : Number((totalItemCost * onlinePercentage).toFixed(2)),
        codAmount: paymentMethod === 'razorpay_full' ? 0 : Number((totalItemCost * (1 - onlinePercentage)).toFixed(2)),
      };
    });
  };

  const paymentOptions = () => {
    const allCODAvailable = cartItems.every((item) => item.isCashOnDeliveryAvailable);
    const anySplitPayment = cartItems.some((item) => item.onlinePaymentPercentage < 100 && item.isCashOnDeliveryAvailable);

    const options = [];
    options.push({ method: 'Full Online Payment', desc: 'Pay 100% online via Razorpay', value: 'razorpay_full' });

    if (allCODAvailable) {
      if (anySplitPayment) {
        options.push({
          method: 'Split Payment',
          desc: 'Pay partial online, rest on delivery',
          value: 'razorpay_split',
        });
      }
      options.push({ method: 'Full Cash on Delivery', desc: 'Pay 100% on delivery', value: 'cod_full' });
    }

    return options;
  };

  const handlePlaceOrder = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }
    if (!userDetails.name || !userDetails.phoneNumber) {
      toast.error('Please provide your name and phone number');
      setCurrentStep(3);
      return;
    }
  
    setIsProcessing(true);
    const token = localStorage.getItem('token');
    const itemsWithPayment = calculatePaymentSplit();
    const totalOnlineAmount = itemsWithPayment.reduce((sum, item) => sum + item.onlineAmount, 0);
    const totalCODAmount = itemsWithPayment.reduce((sum, item) => sum + item.codAmount, 0);
    const totalAmount = totalOnlineAmount + totalCODAmount + 50;
  
    const orderData = {
      items: itemsWithPayment.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        color: item.color,
        onlineAmount: item.onlineAmount,
        codAmount: item.codAmount,
        sellerId: item.sellerId,
      })),
      totalAmount,
      onlineAmount: totalOnlineAmount,
      codAmount: totalCODAmount,
      shipping: 50,
      userDetails,
      addressId: selectedAddress,
      paymentMethod: paymentMethod === 'cod_full' ? 'Cash on Delivery' : 'Razorpay',
      fromCart: true,
    };
  
    try {
      if (paymentMethod === 'cod_full') {
        const res = await axios.post('/api/user/auth/place-order', orderData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Order placed successfully!');
        navigate('/order-confirmation', { state: { orderIds: res.data.orders.map((o) => o.orderId) } });
      } else {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          toast.error('Failed to load payment gateway. Please check your internet connection or try again later.');
          setIsProcessing(false);
          return;
        }
  
        const orderResponse = await axios.post('/api/user/auth/create-order', orderData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { razorpay, orders } = orderResponse.data;
  
        if (!razorpay || !razorpay.orderId) {
          throw new Error('Razorpay order creation failed');
        }
  
        const RAZORPAY_KEY = 'rzp_live_q3VDcaCSe5gBVo'; // Hardcoded for now; replace with env in production
        const options = {
          key: RAZORPAY_KEY,
          amount: razorpay.amount,
          currency: razorpay.currency,
          name: 'Stark Strips',
          description: 'Order Payment',
          order_id: razorpay.orderId,
          handler: async (response) => {
            try {
              const verifyResponse = await axios.post(
                '/api/user/auth/verify-payment',
                {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderData: { addressId: selectedAddress, fromCart: true },
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (verifyResponse.data.success) {
                toast.success('Payment successful!');
                navigate('/order-confirmation', { state: { orderIds: verifyResponse.data.orders.map((o) => o.orderId) } });
              } else {
                toast.error('Payment verification failed');
              }
            } catch (error) {
              toast.error(error.response?.data?.message || 'Payment verification error');
            }
          },
          prefill: {
            name: userDetails.name,
            contact: userDetails.phoneNumber,
            email: userDetails.email || 'customer@example.com',
          },
          theme: { color: '#3B82F6' },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              toast.error('Payment cancelled by user');
            },
          },
        };
  
        const paymentObject = new window.Razorpay(options);
        paymentObject.on('payment.failed', (response) => {
          setIsProcessing(false);
          toast.error(`Payment failed: ${response.error.description}`);
        });
        paymentObject.open();
      }
    } catch (error) {
      console.error('Order Error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to process order');
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 50; // Fixed shipping cost as per your code
  const total = subtotal + shipping;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!cartItems.length) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
        <div className="text-gray-600 text-lg">Your cart is empty</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 relative">
          {[
            { step: 1, label: 'Address', icon: <FaTruck className="w-5 h-5" /> },
            { step: 2, label: 'Payment', icon: <FaCreditCard className="w-5 h-5" /> },
            { step: 3, label: 'Confirm', icon: <FaCheckCircle className="w-5 h-5" /> },
          ].map(({ step, label, icon }) => (
            <motion.div
              key={step}
              className="flex-1 text-center z-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: step * 0.2, duration: 0.5 }}
            >
              <div
                className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                  currentStep >= step ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}
              >
                {icon}
              </div>
              <p
                className={`mt-2 text-sm font-semibold uppercase tracking-wide ${
                  currentStep >= step ? 'text-teal-600' : 'text-gray-500'
                }`}
              >
                {label}
              </p>
            </motion.div>
          ))}
          <div className="absolute inset-x-0 top-5 h-1 bg-gray-200 z-0">
            <motion.div
              className="h-full bg-teal-500"
              initial={{ width: '0%' }}
              animate={{ width: `${(currentStep - 1) * 50}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <motion.button
            onClick={() => navigate('/cart')}
            className="mb-6 flex items-center gap-2 text-teal-600 hover:text-teal-700 transition-colors font-medium bg-teal-50 px-4 py-2 rounded-xl shadow-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowLeft />
            <span>Back to Cart</span>
          </motion.button>

          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Delivery Address</h2>
                {savedAddresses.length > 0 ? (
                  <div className="space-y-3">
                    {savedAddresses.map((addr) => (
                      <motion.div
                        key={addr._id}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                          selectedAddress === addr._id ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedAddress(addr._id)}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            id={addr._id}
                            name="address"
                            value={addr._id}
                            checked={selectedAddress === addr._id}
                            onChange={(e) => setSelectedAddress(e.target.value)}
                            className="text-teal-600 focus:ring-teal-500 w-5 h-5"
                          />
                          <label htmlFor={addr._id} className="text-sm text-gray-700 leading-tight">
                            {`${addr.street}, ${addr.city}, ${addr.state}, ${addr.postalCode}, ${addr.country}`}
                          </label>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No saved addresses. Please add one below.</p>
                )}
                <motion.button
                  onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                  className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <FaMapMarkerAlt /> {showNewAddressForm ? 'Cancel' : 'Add New Address'}
                </motion.button>
                {showNewAddressForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 bg-teal-50 p-4 rounded-xl"
                  >
                    {[
                      { name: 'street', placeholder: 'Street Address' },
                      { name: 'city', placeholder: 'City' },
                      { name: 'state', placeholder: 'State' },
                      { name: 'postalCode', placeholder: 'Postal Code' },
                      { name: 'country', placeholder: 'Country', disabled: true },
                    ].map((field) => (
                      <input
                        key={field.name}
                        type="text"
                        name={field.name}
                        value={address[field.name]}
                        onChange={handleAddressChange}
                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-400 bg-white text-gray-700 text-sm shadow-sm"
                        placeholder={field.placeholder}
                        required={!field.disabled}
                        disabled={field.disabled || isProcessing}
                      />
                    ))}
                    <motion.button
                      onClick={handleAddNewAddress}
                      disabled={isProcessing}
                      className={`w-full px-4 py-3 rounded-xl shadow-md text-sm font-medium ${
                        isProcessing ? 'bg-gray-400' : 'bg-teal-500 hover:bg-teal-600 text-white'
                      }`}
                      whileHover={!isProcessing ? { scale: 1.05 } : {}}
                      whileTap={!isProcessing ? { scale: 0.95 } : {}}
                    >
                      {isProcessing ? 'Saving...' : 'Save Address'}
                    </motion.button>
                  </motion.div>
                )}
                {savedAddresses.length > 0 && !showNewAddressForm && (
                  <motion.button
                    onClick={handleConfirmAddress}
                    disabled={isProcessing}
                    className={`w-full px-4 py-3 rounded-xl shadow-md text-sm font-medium ${
                      isProcessing ? 'bg-gray-400' : 'bg-teal-500 hover:bg-teal-600 text-white'
                    }`}
                    whileHover={!isProcessing ? { scale: 1.05 } : {}}
                    whileTap={!isProcessing ? { scale: 0.95 } : {}}
                  >
                    Continue to Payment
                  </motion.button>
                )}
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Payment Method</h2>
                <div className="space-y-3">
                  {paymentOptions().map(({ method, desc, value }) => (
                    <motion.div
                      key={value}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        paymentMethod === value ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setPaymentMethod(value)}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          id={value}
                          name="paymentMethod"
                          value={value}
                          checked={paymentMethod === value}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="text-teal-600 focus:ring-teal-500 w-5 h-5"
                        />
                        <div>
                          <label htmlFor={value} className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            {method === 'Full Online Payment' && <FaCreditCard />}
                            {method === 'Split Payment' && <FaWallet />}
                            {method === 'Full Cash on Delivery' && <FaMoneyBillWave />}
                            {method}
                          </label>
                          <p className="text-xs text-gray-500">{desc}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {paymentMethod === 'razorpay_split' && (
                  <div className="bg-teal-50 p-4 rounded-xl text-sm text-gray-700">
                    <p><strong>Payment Split Details:</strong></p>
                    {calculatePaymentSplit().map((item) => (
                      <p key={item.productId}>
                        {item.name}: ₹{item.onlineAmount} Online, ₹{item.codAmount} COD
                      </p>
                    ))}
                  </div>
                )}
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => setCurrentStep(1)}
                    disabled={isProcessing}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium shadow-sm ${
                      isProcessing ? 'bg-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    whileHover={!isProcessing ? { scale: 1.05 } : {}}
                    whileTap={!isProcessing ? { scale: 0.95 } : {}}
                  >
                    Back
                  </motion.button>
                  <motion.button
                    onClick={() => setCurrentStep(3)}
                    disabled={!paymentMethod || isProcessing}
                    className={`flex-1 px-4 py-3 rounded-xl shadow-md text-sm font-medium ${
                      !paymentMethod || isProcessing ? 'bg-gray-400' : 'bg-teal-500 hover:bg-teal-600 text-white'
                    }`}
                    whileHover={paymentMethod && !isProcessing ? { scale: 1.05 } : {}}
                    whileTap={paymentMethod && !isProcessing ? { scale: 0.95 } : {}}
                  >
                    Review Order
                  </motion.button>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
                <div className="space-y-4 bg-teal-50 p-4 rounded-xl">
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.productId}
                      className="flex gap-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <img
                        src={item.image || placeholderImage}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md shadow-sm"
                        onError={(e) => (e.target.src = placeholderImage)}
                      />
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-800">{item.name}</h3>
                        <p className="text-xs text-gray-600">Qty: {item.quantity} | Size: {item.size} | Color: {item.color}</p>
                        <p className="text-sm text-teal-600 font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                        {paymentMethod === 'razorpay_split' && (
                          <p className="text-xs text-gray-500">
                            Online: ₹{calculatePaymentSplit().find((i) => i.productId === item.productId)?.onlineAmount} | COD: ₹{calculatePaymentSplit().find((i) => i.productId === item.productId)?.codAmount}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  <div className="text-sm text-gray-700 space-y-2 pt-3 border-t border-gray-200">
                    <p className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Shipping:</span>
                      <span>₹{shipping.toFixed(2)}</span>
                    </p>
                    {paymentMethod !== 'cod_full' && (
                      <p className="flex justify-between">
                        <span>Online Payment:</span>
                        <span>₹{calculatePaymentSplit().reduce((sum, item) => sum + item.onlineAmount, 0).toFixed(2)}</span>
                      </p>
                    )}
                    {paymentMethod !== 'razorpay_full' && (
                      <p className="flex justify-between">
                        <span>COD Amount:</span>
                        <span>₹{calculatePaymentSplit().reduce((sum, item) => sum + item.codAmount, 0).toFixed(2)}</span>
                      </p>
                    )}
                    <p className="flex justify-between font-semibold text-gray-800 pt-2">
                      <span>Total:</span>
                      <span className="text-teal-600">₹{total.toFixed(2)}</span>
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Your Details</h3>
                  <input
                    type="text"
                    name="name"
                    value={userDetails.name}
                    onChange={handleUserDetailsChange}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-400 bg-white text-gray-700 text-sm shadow-sm"
                    placeholder="Full Name"
                    required
                    disabled={isProcessing}
                  />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={userDetails.phoneNumber}
                    onChange={handleUserDetailsChange}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-400 bg-white text-gray-700 text-sm shadow-sm"
                    placeholder="Phone Number"
                    required
                    disabled={isProcessing}
                  />
                  <input
                    type="email"
                    name="email"
                    value={userDetails.email}
                    onChange={handleUserDetailsChange}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-400 bg-white text-gray-700 text-sm shadow-sm"
                    placeholder="Email (optional)"
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-2 text-sm text-gray-700 bg-teal-50 p-4 rounded-xl">
                  <p>
                    <strong>Address:</strong>{' '}
                    {savedAddresses.find((addr) => addr._id === selectedAddress)
                      ? `${savedAddresses.find((addr) => addr._id === selectedAddress).street}, ${savedAddresses.find((addr) => addr._id === selectedAddress).city}, ${savedAddresses.find((addr) => addr._id === selectedAddress).state}, ${savedAddresses.find((addr) => addr._id === selectedAddress).postalCode}, ${savedAddresses.find((addr) => addr._id === selectedAddress).country}`
                      : 'Not selected'}
                  </p>
                  <p>
                    <strong>Payment Method:</strong>{' '}
                    {paymentMethod === 'razorpay_full'
                      ? 'Full Online Payment'
                      : paymentMethod === 'razorpay_split'
                      ? 'Split Payment'
                      : 'Full Cash on Delivery'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => setCurrentStep(2)}
                    disabled={isProcessing}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium shadow-sm ${
                      isProcessing ? 'bg-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    whileHover={!isProcessing ? { scale: 1.05 } : {}}
                    whileTap={!isProcessing ? { scale: 0.95 } : {}}
                  >
                    Back
                  </motion.button>
                  <motion.button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className={`flex-1 px-4 py-3 rounded-xl shadow-md text-sm font-medium ${
                      isProcessing ? 'bg-gray-400' : 'bg-teal-500 hover:bg-teal-600 text-white'
                    }`}
                    whileHover={!isProcessing ? { scale: 1.05 } : {}}
                    whileTap={!isProcessing ? { scale: 0.95 } : {}}
                  >
                    {isProcessing
                      ? 'Processing...'
                      : paymentMethod === 'cod_full'
                      ? 'Place Order'
                      : 'Pay Now'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;