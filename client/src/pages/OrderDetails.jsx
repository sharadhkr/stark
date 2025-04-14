import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../useraxios';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaBox, FaUser, FaStore, FaMoneyBillWave } from 'react-icons/fa';
import agroLogo from '../assets/logo.png';

const dashboardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const sectionVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const statusOrder = [
    'order confirmed', // Replacing 'order placed' for Amazon-like terminology
    'processing',
    'shipped',
    'out for delivery',
    'delivered',
  ];

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

    const timeSincePlaced = Date.now() - new Date(order.createdAt).getTime();
    const hoursSincePlaced = timeSincePlaced / (1000 * 60 * 60);
    if (hoursSincePlaced > 24) {
      toast.error('Order can only be cancelled within 24 hours of placement');
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

  const handleReturnOrder = async () => {
    toast.error('Return functionality TBD'); // Placeholder for future implementation
    // Add logic here when backend supports returns
  };

  const calculateTotal = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0);
  };

  const getCurrentStatusIndex = () => {
    if (!order) return -1;
    return statusOrder.indexOf(order.status.toLowerCase());
  };

  const canCancel = () => {
    if (!order || ['delivered', 'cancelled', 'returned'].includes(order.status.toLowerCase())) return false;
    const timeSincePlaced = Date.now() - new Date(order.createdAt).getTime();
    return timeSincePlaced <= 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Order not found or failed to load.</p>
      </div>
    );
  }

  const totalAmount = order.total || calculateTotal(order.items);

  return (
    <div className="min-h-screen bg-gray-100 px-4 pt-5 pb-10">
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
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 bg-white px-4 py-2 rounded-lg shadow-sm"
          >
            <FaArrowLeft /> Back to Dashboard
          </button>
        </motion.div>

        <motion.div
          variants={sectionVariants}
          className="bg-white rounded-lg shadow-md p-6 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4">
            <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-3">
              <FaBox className="text-gray-500" />
              Order #{order.orderId.slice(-6)}
            </h1>
            <p className="text-sm text-gray-600">
              Placed on: {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Amazon-Style Progress Bar */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">Order Progress</h2>
            <div className="relative">
              <div className="flex justify-between items-start">
                {statusOrder.map((status, index) => {
                  const isActive = getCurrentStatusIndex() >= index;
                  const isCompleted = getCurrentStatusIndex() > index;
                  const historyEntry = order.statusHistory?.find(h => h.status.toLowerCase() === status) || null;
                  return (
                    <div key={status} className="flex-1 text-center relative">
                      {/* Step Indicator */}
                      <div className="relative flex justify-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                            isActive ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'
                          }`}
                        >
                          {isCompleted ? (
                            <span className="text-white font-bold">✓</span>
                          ) : (
                            <span className="text-gray-500">{index + 1}</span>
                          )}
                        </div>
                      </div>
                      {/* Connecting Line */}
                      {index > 0 && (
                        <div
                          className={`absolute top-4 left-[-50%] w-[100%] h-1 ${
                            isActive ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                          style={{ zIndex: -1 }}
                        />
                      )}
                      {/* Status Label */}
                      <p className={`mt-2 text-sm font-medium ${isActive ? 'text-green-600' : 'text-gray-600'}`}>
                        {status.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </p>
                      {/* Timestamp/Details */}
                      {historyEntry && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(historyEntry.timestamp).toLocaleString()}
                          {historyEntry.details && <span> - {historyEntry.details}</span>}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              {['cancelled', 'returned'].includes(order.status.toLowerCase()) && (
                <p className="mt-4 text-sm text-red-600 text-center">
                  Order {order.status.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} on{' '}
                  {new Date(order.statusHistory?.find(h => h.status === order.status)?.timestamp || order.updatedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FaUser className="text-gray-500" /> Shipping Details
            </h2>
            <div className="mt-2 text-sm text-gray-600">
              <p><span className="font-medium">Name:</span> {order.customer.name}</p>
              <p><span className="font-medium">Email:</span> {order.customer.email}</p>
              <p><span className="font-medium">Address:</span> {order.customer.address}</p>
            </div>
          </div>

          {/* Seller Info */}
          {order.sellerId && (
            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FaStore className="text-gray-500" /> Sold By
              </h2>
              <div className="mt-2 text-sm text-gray-600">
                <p><span className="font-medium">Shop Name:</span> {order.sellerId.shopName || 'N/A'}</p>
                <p><span className="font-medium">Seller:</span> {order.sellerId.name || 'Unknown'}</p>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Items</h2>
            {order.items.map((item, index) => (
              <motion.div
                key={item.productId?._id || index}
                whileHover={{ scale: 1.01 }}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-2"
              >
                <img
                  src={item.productId?.image?.[0] || agroLogo}
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
                </div>
                <p className="text-sm font-medium text-gray-800">
                  Subtotal: ₹{(item.price * item.quantity).toFixed(2)}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FaMoneyBillWave className="text-gray-500" /> Order Total
            </h2>
            <p className="text-xl font-bold text-gray-800 mt-2">₹{totalAmount.toFixed(2)}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
            {canCancel() && (
              <button
                onClick={handleCancelOrder}
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium shadow-md"
              >
                Cancel Order
              </button>
            )}
            {order.status === 'delivered' && (
              <button
                onClick={handleReturnOrder}
                className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors duration-200 font-medium shadow-md"
              >
                Return Order
              </button>
            )}
          </div>
        </motion.div>
      </motion.main>
    </div>
  );
};

export default OrderDetails;