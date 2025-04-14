import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from '../axios';
import { FaEye } from 'react-icons/fa';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const AdminOrders = ({ orders, setOrders, loading }) => {
  const [showDetails, setShowDetails] = useState(null);

  const statusOptions = [
    'order confirmed',
    'processing',
    'shipped',
    'out for delivery',
    'delivered',
    'cancelled',
    'returned',
  ];

  const getNextStatus = (currentStatus) => {
    const currentIndex = statusOptions.indexOf(currentStatus);
    if (currentIndex === -1 || currentStatus === 'cancelled' || currentStatus === 'returned') {
      return currentStatus;
    }
    return statusOptions[Math.min(currentIndex + 1, statusOptions.length - 3)];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'order confirmed': return 'text-blue-600';
      case 'processing': return 'text-indigo-600';
      case 'shipped': return 'text-purple-600';
      case 'out for delivery': return 'text-orange-600';
      case 'delivered': return 'text-emerald-600';
      case 'cancelled': return 'text-red-600';
      case 'returned': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const handleUpdateOrderStatus = async (id, currentStatus) => {
    const newStatus = getNextStatus(currentStatus);
    if (newStatus === currentStatus) {
      toast.error('No further status updates available');
      return;
    }
    try {
      const response = await axios.put(`/api/admin/auth/orders/${id}`, { status: newStatus });
      setOrders(orders.map((o) => (o._id === id ? response.data.order : o)));
      toast.success(`Order updated to "${newStatus}"`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update order status');
      console.error('Update order status error:', error);
    }
  };

  const toggleDetails = (id) => {
    setShowDetails(showDetails === id ? null : id);
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
      {loading ? (
        <div className="text-center text-gray-600 animate-pulse text-lg">Loading orders...</div>
      ) : !orders || orders.length === 0 ? (
        <div className="text-center text-gray-600 text-lg">No orders found</div>
      ) : (
        orders.map((order) => {
          if (!order || !order._id) {
            console.warn('Invalid order detected:', order);
            return null;
          }
          return (
            <motion.div
              key={order._id}
              variants={fadeIn}
              className="bg-blue-50 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Order #{order.orderId ? order.orderId.slice(-6) : 'Unknown'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Total: ₹{(order.total || 0).toFixed(2)} |{' '}
                    <span className={getStatusColor(order.status || 'unknown')}>
                      {order.status || 'Unknown'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Customer: {order.userId?.firstName || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Seller: {order.sellerId?.name || 'N/A'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() => toggleDetails(order._id)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-all duration-200"
                    aria-label={`View details for order ${order.orderId || order._id}`}
                  >
                    <FaEye />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleUpdateOrderStatus(order._id, order.status || 'order confirmed')}
                    className={`px-4 py-2 text-sm rounded-xl text-white shadow-sm transition-all duration-200 ${
                      order.status === 'delivered' ||
                      order.status === 'cancelled' ||
                      order.status === 'returned'
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    disabled={
                      order.status === 'delivered' ||
                      order.status === 'cancelled' ||
                      order.status === 'returned'
                    }
                    aria-label={`Update order status to ${getNextStatus(order.status || 'order confirmed')}`}
                  >
                    {order.status === 'delivered'
                      ? 'Delivered'
                      : order.status === 'cancelled'
                      ? 'Cancelled'
                      : order.status === 'returned'
                      ? 'Returned'
                      : `Mark as ${getNextStatus(order.status || 'order confirmed')}`}
                  </motion.button>
                </div>
              </div>
              {showDetails === order._id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-4 bg-white rounded-xl shadow-sm"
                >
                  <p className="text-sm text-gray-600">Payment Method: {order.paymentMethod || 'N/A'}</p>
                  <p className="text-sm text-gray-600">
                    Shipping: ₹{(order.shipping || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Payment Status:{' '}
                    <span
                      className={
                        order.paymentStatus === 'completed' ? 'text-emerald-600' : 'text-amber-600'
                      }
                    >
                      {order.paymentStatus || 'N/A'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Online Amount: ₹{(order.onlineAmount || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    COD Amount: ₹{(order.codAmount || 0).toFixed(2)}
                  </p>
                  <h4 className="text-sm font-medium text-gray-700 mt-2">Items:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {(order.items || []).map((item, index) => (
                      <li key={index}>
                        {item.productId?.name || 'Unknown Item'} (Qty: {item.quantity || 1}, Size:{' '}
                        {item.size || 'N/A'}, Color: {item.color || 'N/A'}, ₹
                        {(item.price || 0).toFixed(2)})
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </motion.div>
          );
        })
      )}
    </motion.div>
  );
};

export default AdminOrders;