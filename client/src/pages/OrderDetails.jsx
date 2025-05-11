import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../useraxios';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaBox, FaUser, FaStore, FaMoneyBillWave, FaClipboard, FaCheckCircle, FaHourglassHalf, FaShippingFast, FaTruck, FaBoxOpen } from 'react-icons/fa';
import Confetti from 'react-confetti';
import agroLogo from '../assets/logo.png';

const dashboardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const sectionVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};

const statusNodeVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: (index) => ({
    scale: 1,
    opacity: 1,
    transition: { delay: index * 0.2, duration: 0.4, ease: 'easeOut' },
  }),
};

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState(null);

  const statusOrder = [
    'Order Confirmed',
    'Processing',
    'Shipped',
    'Out For Delivery',
    'Delivered',
  ];

  const statusDetails = {
    'Order Confirmed': 'Your order has been successfully received.',
    'Processing': 'Your order is being prepared for shipment.',
    'Shipped': 'Your order has been shipped and is on its way.',
    'Out For Delivery': 'Your order is out for delivery and will arrive soon.',
    'Delivered': 'Your order has been delivered. Enjoy!',
    'Cancelled': 'Your order has been cancelled.',
    'Returned': 'Your order has been returned.',
  };

  useEffect(() => {
    const fetchOrder = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to view order details');
        navigate('/login');
        return;
      }

      try {
        const res = await axios.get(`/api/user/auth/order/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched Order:', res.data.order);
        setOrder(res.data.order);
      } catch (error) {
        console.error('Fetch Error:', error.response?.data || error.message);
        toast.error(error.response?.data?.message || 'Failed to load order details');
        navigate('/dashboard');
      } finally {
        setLoading(false);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    };
    fetchOrder();
  }, [orderId, navigate]);

  const handleCancelOrder = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to cancel the order');
      return;
    }

    try {
      await axios.put(
        `/api/user/auth/orders/${orderId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Order cancelled successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleReturnOrder = () => {
    toast.info('Return functionality is not yet available. Contact support for assistance.');
  };

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.orderId)
      .then(() => toast.success('Order ID copied to clipboard!'))
      .catch(() => toast.error('Failed to copy order ID'));
  };

  const calculateTotal = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
  };

  const getCurrentStatusIndex = () => {
    if (!order) return -1;
    return statusOrder.indexOf(order.status);
  };

  const canCancel = () => {
    if (!order || ['Delivered', 'Cancelled', 'Returned'].includes(order.status)) return false;
    const timeSincePlaced = Date.now() - new Date(order.createdAt).getTime();
    return timeSincePlaced <= 24 * 60 * 60 * 1000; // 24 hours
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 flex items-center justify-center">
        <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 flex items-center justify-center">
        <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
        <p className="text-gray-600 text-lg font-medium">Order not found or failed to load.</p>
      </div>
    );
  }

  const subtotal = calculateTotal(order.items);
  const shipping = order.shipping || 20;
  const totalMRP = order.items.reduce((sum, item) => sum + ((item.mrp || item.price * 1.2) * (item.quantity || 0)), 0);
  const discount = totalMRP - subtotal;
  const totalAmount = order.total || (subtotal + shipping);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 px-4 pt-5 pb-10 font-poppins">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={100} />}
      <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
      <motion.main
        initial="initial"
        animate="animate"
        variants={dashboardVariants}
        className="max-w-5xl mx-auto py-4 px-4 sm:px-6"
      >
        <motion.div variants={dashboardVariants} className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium transition-colors duration-200 bg-white px-4 py-2 rounded-lg shadow-sm"
          >
            <FaArrowLeft /> Back to Dashboard
          </button>
        </motion.div>

        <motion.div
          variants={sectionVariants}
          className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center gap-3">
                <FaBox className="text-teal-500" />
                Order #{order.orderId.slice(-6)}
              </h1>
              <motion.button
                onClick={handleCopyOrderId}
                className="flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaClipboard />
                <span>Copy</span>
              </motion.button>
            </div>
            <p className="text-sm text-gray-600">
              Placed on: {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>

          {/* Order Status Tracker */}
          <div className="space-y-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Order Progress</h2>
            <div className="flex flex-col sm:flex-row justify-between items-center relative space-y-8 sm:space-y-0 sm:space-x-4">
              {statusOrder.map((status, index) => {
                const isActive = getCurrentStatusIndex() >= index;
                const historyEntry = order.statusHistory?.find(h => h.status === status) || null;
                return (
                  <motion.div
                    key={status}
                    className="flex-1 flex flex-col items-center relative z-10"
                    variants={statusNodeVariants}
                    initial="initial"
                    animate="animate"
                    custom={index}
                    onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
                    whileHover={{ scale: 1.1 }}
                  >
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer relative group ${
                        isActive ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white' : 'bg-gray-200 text-gray-400'
                      } ${order.status === status ? 'animate-pulse' : ''}`}
                    >
                      {index === 0 ? <FaCheckCircle /> : index === 1 ? <FaHourglassHalf /> : index === 2 ? <FaShippingFast /> : index === 3 ? <FaTruck /> : <FaBoxOpen />}
                      <span className="absolute -top-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2">
                        {statusDetails[status]}
                      </span>
                    </div>
                    <p
                      className={`mt-3 text-xs sm:text-sm text-center font-medium ${
                        isActive ? 'text-teal-600' : 'text-gray-500'
                      } ${order.status === status ? 'font-bold' : ''}`}
                    >
                      {status}
                    </p>
                    {historyEntry && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(historyEntry.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        {historyEntry.details && <span> - {historyEntry.details}</span>}
                      </p>
                    )}
                    {selectedStatus === status && (
                      <motion.div
                        className="mt-2 text-xs text-gray-600 bg-teal-50 p-2 rounded-lg"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {statusDetails[status]}{historyEntry ? ` Updated: ${new Date(historyEntry.timestamp).toLocaleString('en-IN')}` : ''}
                      </motion.div>
                    )}
                    {index < 4 && (
                      <div
                        className={`absolute top-6 sm:top-7 left-1/2 sm:left-[calc(50%+28px)] w-full sm:w-[calc(100%-56px)] h-1 z-0 ${
                          isActive ? 'bg-gradient-to-r from-teal-500 to-blue-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </motion.div>
                );
              })}
              {['Cancelled', 'Returned'].includes(order.status) && (
                <p className="mt-4 text-sm text-red-600 text-center">
                  Order {order.status} on{' '}
                  {new Date(order.statusHistory?.find(h => h.status === order.status)?.timestamp || order.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FaUser className="text-teal-500" /> Shipping Details
            </h2>
            <div className="mt-2 text-sm text-gray-600">
              <p><span className="font-medium">Name:</span> {order.customer?.name || 'N/A'}</p>
              <p><span className="font-medium">Email:</span> {order.customer?.email || 'N/A'}</p>
              <p><span className="font-medium">Address:</span> {order.customer?.address || 'N/A'}</p>
            </div>
          </div>

          {/* Seller Info */}
          {order.sellerId && (
            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FaStore className="text-teal-500" /> Sold By
              </h2>
              <div className="mt-2 text-sm text-gray-600">
                <p><span className="font-medium">Shop Name:</span> {order.sellerId.shopName || 'N/A'}</p>
                <p><span className="font-medium">Seller:</span> {order.sellerId.name || 'Unknown'}</p>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaBox className="text-teal-500" /> Items
            </h2>
            {order.items.map((item, index) => (
              <motion.div
                key={item.productId?._id || index}
                whileHover={{ scale: 1.01 }}
                className="flex items-center gap-4 p-4 bg-teal-50 rounded-lg mb-2"
              >
                <img
                  src={item.productId?.image?.[0] || item.image || agroLogo}
                  alt={item.productId?.name || item.name || 'Product'}
                  className="w-16 h-16 object-cover rounded-md"
                  onError={(e) => (e.target.src = agroLogo)}
                />
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-800">
                    {item.productId?.name || item.name || 'Unknown Product'}
                  </p>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity || 0}</p>
                  <p className="text-sm text-gray-600">Price: ₹{(item.price || 0).toFixed(2)}</p>
                  <p className="text-sm text-gray-600">MRP: ₹{(item.mrp || (item.price * 1.2)).toFixed(2)}</p>
                </div>
                <p className="text-sm font-medium text-teal-600">
                  Subtotal: ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FaMoneyBillWave className="text-teal-500" /> Order Summary
            </h2>
            <div className="mt-2 text-sm text-gray-700 space-y-2">
              <p className="flex justify-between">
                <span>Total Quantity:</span>
                <span>{order.items.reduce((sum, item) => sum + (item.quantity || 0), 0)}</span>
              </p>
              <p className="flex justify-between">
                <span>Total MRP:</span>
                <span>₹{totalMRP.toFixed(2)}</span>
              </p>
              <p className="flex justify-between">
                <span>Discount:</span>
                <span>-₹{discount.toFixed(2)}</span>
              </p>
              <p className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </p>
              <p className="flex justify-between">
                <span>Shipping:</span>
                <span>₹{shipping.toFixed(2)}</span>
              </p>
              <p className="flex justify-between font-semibold text-gray-800 pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span className="text-teal-600">₹{totalAmount.toFixed(2)}</span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
            <button
              onClick={handleCancelOrder}
              disabled={!canCancel()}
              className={`flex-1 px-6 py-2 rounded-lg font-medium shadow-md transition-colors duration-200 ${
                canCancel()
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Cancel Order
            </button>
            <button
              onClick={handleReturnOrder}
              disabled={order.status !== 'Delivered'}
              className={`flex-1 px-6 py-2 rounded-lg font-medium shadow-md transition-colors duration-200 ${
                order.status === 'Delivered'
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Return Order
            </button>
          </div>
        </motion.div>
      </motion.main>
    </div>
  );
};

export default OrderDetails;