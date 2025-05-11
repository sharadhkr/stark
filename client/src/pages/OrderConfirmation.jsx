import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaBox, FaShippingFast, FaHourglassHalf, FaTruck, FaClipboard, FaTrain } from 'react-icons/fa';
import axios from '../useraxios';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import placeholderImage from '../assets/logo.png';

// Animation Variants
const containerVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const itemVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

const statusStepVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};

const trainVariants = {
  initial: { y: 0 },
  animate: (currentStep) => ({
    y: currentStep * 60,
    transition: { duration: 2.5, ease: 'easeInOut' },
  }),
};

const OrderConfirmation = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const token = localStorage.getItem('token');
      const orderIds = state?.orderIds || [];

      if (!token || !orderIds.length) {
        toast.error('No valid order data found');
        setLoading(false);
        return;
      }

      try {
        const orderPromises = orderIds.map((orderId) =>
          axios.get(`/api/user/auth/order/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        );
        const responses = await Promise.all(orderPromises);
        const orders = responses.map((res) => res.data.order || res.data.data?.order);

        console.log('Backend Order Responses:', orders); // Debug log

        const combinedOrder = {
          orderIds,
          items: orders.flatMap((order) =>
            (order.items || []).map((item) => ({
              productId: item.productId?._id || item.productId,
              name: item.name || item.productId?.name || 'Unknown Product',
              price: item.price || item.productId?.price || 0,
              mrp: item.mrp || item.productId?.mrp || item.price * 1.2,
              quantity: item.quantity || 1,
              image: item.image || (Array.isArray(item.productId?.images) ? item.productId.images[0] : item.productId?.images) || placeholderImage,
              size: item.size || 'N/A',
              color: item.color || 'N/A',
            }))
          ),
          subtotal: orders.reduce((sum, order) => sum + (order.items || []).reduce((s, item) => s + (item.price || 0) * (item.quantity || 1), 0), 0),
          shipping: orders.reduce((sum, order) => sum + (order.shipping || 20), 0) / orders.length,
          totalAmount: orders.reduce((sum, order) => sum + (order.totalAmount || ((order.items || []).reduce((s, item) => s + (item.price || 0) * (item.quantity || 1), 0) + (order.shipping || 20))), 0),
          createdAt: orders[0]?.createdAt,
          status: orders.every((order) => order.status === orders[0]?.status) ? orders[0]?.status : 'Mixed',
        };

        const totalMRP = combinedOrder.items.reduce((sum, item) => sum + (item.mrp || item.price * 1.2) * item.quantity, 0);
        combinedOrder.discount = totalMRP - combinedOrder.subtotal;

        setOrderDetails(combinedOrder);
      } catch (error) {
        toast.error('Failed to fetch order details');
        console.error('Fetch Order Error:', error.response?.data || error.message);
      } finally {
        setLoading(false);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    };

    fetchOrderDetails();
  }, [state]);

  const handleCopyOrderIds = () => {
    const orderIdsText = orderDetails.orderIds.join(', ');
    navigator.clipboard.writeText(orderIdsText)
      .then(() => toast.success('Order IDs copied to clipboard!'))
      .catch(() => toast.error('Failed to copy order IDs'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 flex items-center justify-center">
        <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!orderDetails || !orderDetails.orderIds.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 flex items-center justify-center">
        <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
        <div className="text-gray-600 text-lg font-medium">No order details available</div>
      </div>
    );
  }

  const totalQuantity = orderDetails.items.reduce((sum, item) => sum + item.quantity, 0);
  const statusMap = {
    'Order Confirmed': 20,
    'Processing': 40,
    'Shipped': 60,
    'Out For Delivery': 80,
    'Delivered': 100,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 py-8 px-4 sm:px-6 font-poppins">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}
      <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
      <motion.div
        className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-8"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <motion.button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors text-sm sm:text-base"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowLeft />
            <span>Back to Home</span>
          </motion.button>
          <div className="flex items-center gap-2 text-green-600">
            <FaCheckCircle size={24} />
            <span className="text-sm sm:text-base font-semibold uppercase tracking-wide">Order Confirmed</span>
          </div>
        </div>

        {/* Confirmation Message */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Thank You for Your Order!</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-8">
          Your order has been successfully placed. You'll receive a confirmation soon, and the seller will contact you with further details.
        </p>

        {/* Modified Vertical Train Track Tracker */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-6">Order Status</h2>
          <div className="relative flex flex-col items-start gap-10 w-full max-w-sm">
            <div className="absolute left-8 w-1.5 bg-gray-200 h-[240px] rounded-full z-0" />
            <motion.div
              className="absolute left-8 w-1.5 bg-green-500 h-[240px] rounded-full z-0"
              initial={{ height: '0%' }}
              animate={{ height: `${statusMap[orderDetails.status] || 20}%` }}
              transition={{ duration: 2.5, ease: 'easeInOut' }}
            />
            {[
              { label: 'Order Confirmed', icon: <FaCheckCircle />, status: 'Order Confirmed' },
              { label: 'Processing', icon: <FaHourglassHalf />, status: 'Processing' },
              { label: 'Shipped', icon: <FaShippingFast />, status: 'Shipped' },
              { label: 'Out For Delivery', icon: <FaTruck />, status: 'Out For Delivery' },
              { label: 'Delivered', icon: <FaCheckCircle />, status: 'Delivered' },
            ].map((step, index) => (
              <motion.div
                key={index}
                className="relative flex items-center gap-3 w-full"
                variants={statusStepVariants}
                initial="initial"
                animate="animate"
                transition={{ delay: index * 0.3 }}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 z-10 ml-4 ${
                    statusMap[orderDetails.status] >= statusMap[step.status]
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {step.icon}
                </div>
                <p
                  className={`text-sm pl-4 w-40 ${
                    statusMap[orderDetails.status] >= statusMap[step.status]
                      ? 'text-green-600 font-semibold'
                      : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </p>
              </motion.div>
            ))}
            <motion.div
              className="absolute left-8 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white z-20"
              initial="initial"
              animate="animate"
              custom={((statusMap[orderDetails.status] || 20) / 100) * 4}
              variants={trainVariants}
            >
              <FaTrain size={14} />
            </motion.div>
          </div>
        </div>

        {/* Order Details */}
        <div className="space-y-8">
          {/* Order IDs */}
          <div className="bg-teal-50 p-4 sm:p-6 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm sm:text-base font-semibold text-gray-700">Order ID(s)</h2>
              <motion.button
                onClick={handleCopyOrderIds}
                className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaClipboard />
                <span>Copy</span>
              </motion.button>
            </div>
            <div className="text-sm sm:text-base text-gray-800 font-medium flex flex-wrap gap-2">
              {orderDetails.orderIds.map((id) => (
                <span key={id} className="group relative">
                  <span className="truncate max-w-[100px] sm:max-w-[150px] inline-block">{id.slice(0, 8)}...</span>
                  <span className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2">
                    {id}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="bg-teal-50 p-4 sm:p-6 rounded-xl">
            <h2 className="text-sm sm:text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <FaBox /> Items ({totalQuantity})
            </h2>
            <div className="space-y-4">
              {orderDetails.items.map((item, index) => (
                <motion.div
                  key={item.productId || index}
                  className="flex gap-4 items-center"
                  variants={itemVariants}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: index * 0.1 }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg shadow-sm"
                    onError={(e) => (e.target.src = placeholderImage)}
                  />
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Qty: {item.quantity} | Size: {item.size} | Color: {item.color}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      MRP: ₹{(item.mrp * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-sm sm:text-base text-green-600 font-medium">
                      Price: ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-teal-50 p-4 sm:p-6 rounded-xl">
            <h2 className="text-sm sm:text-base font-semibold text-gray-700 mb-4">Order Summary</h2>
            <div className="text-sm sm:text-base text-gray-700 space-y-2">
              <p className="flex justify-between">
                <span>Total Quantity:</span>
                <span>{totalQuantity}</span>
              </p>
              <p className="flex justify-between">
                <span>Total MRP:</span>
                <span>₹{(orderDetails.subtotal + orderDetails.discount).toFixed(2)}</span>
              </p>
              <p className="flex justify-between">
                <span>Discount:</span>
                <span>-₹{orderDetails.discount.toFixed(2)}</span>
              </p>
              <p className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{orderDetails.subtotal.toFixed(2)}</span>
              </p>
              <p className="flex justify-between">
                <span>Shipping:</span>
                <span>₹{orderDetails.shipping.toFixed(2)}</span>
              </p>
              <p className="flex justify-between font-semibold text-gray-800 pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span className="text-green-600">₹{orderDetails.totalAmount.toFixed(2)}</span>
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-sm sm:text-base text-gray-600 bg-teal-50 p-4 sm:p-6 rounded-xl">
            <p>
              <strong>Order Date:</strong>{' '}
              {orderDetails.createdAt ? new Date(orderDetails.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
            </p>
            <p>
              <strong>Status:</strong> {orderDetails.status || 'Order Confirmed'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <motion.button
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl shadow-md text-sm sm:text-base font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Orders
          </motion.button>
          <motion.button
            onClick={() => navigate('/track-order', { state: { orderIds: orderDetails.orderIds } })}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl shadow-md text-sm sm:text-base font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Track Order
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderConfirmation;