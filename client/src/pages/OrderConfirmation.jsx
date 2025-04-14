// // import React, { useState, useEffect } from 'react';
// // import { useLocation, useNavigate } from 'react-router-dom';
// // import { FaArrowLeft, FaCheckCircle, FaBox } from 'react-icons/fa';
// // import axios from '../useraxios';
// // import toast, { Toaster } from 'react-hot-toast';
// // import { motion } from 'framer-motion';
// // import placeholderImage from '../assets/logo.png';

// // // Animation Variants
// // const containerVariants = {
// //   initial: { opacity: 0, y: 20 },
// //   animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
// // };

// // const itemVariants = {
// //   initial: { opacity: 0, x: -20 },
// //   animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
// // };

// // const OrderConfirmation = () => {
// //   const { state } = useLocation();
// //   const navigate = useNavigate();
// //   const [orderDetails, setOrderDetails] = useState(null);
// //   const [loading, setLoading] = useState(true);

// //   useEffect(() => {
// //     const fetchOrderDetails = async () => {
// //       const token = localStorage.getItem('token');
// //       const orderIds = state?.orderIds || [];

// //       if (!token || !orderIds.length) {
// //         toast.error('No valid order data found');
// //         setLoading(false);
// //         return;
// //       }

// //       try {
// //         // Fetch details for all orders in the array
// //         const orderPromises = orderIds.map((orderId) =>
// //           axios.get(`/api/user/auth/orders/${orderId}`, {
// //             headers: { Authorization: `Bearer ${token}` },
// //           })
// //         );
// //         const responses = await Promise.all(orderPromises);
// //         const orders = responses.map((res) => res.data.order);

// //         // Combine order data for display
// //         const combinedOrder = {
// //           orderIds,
// //           items: orders.flatMap((order) => order.items || []),
// //           totalAmount: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
// //           createdAt: orders[0]?.createdAt, // Use the first order's date
// //           status: orders.every((order) => order.status === orders[0].status)
// //             ? orders[0].status
// //             : 'Mixed', // If statuses differ
// //         };

// //         setOrderDetails(combinedOrder);
// //       } catch (error) {
// //         toast.error('Failed to fetch order details');
// //         console.error(error);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchOrderDetails();
// //   }, [state]);

// //   if (loading) {
// //     return (
// //       <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
// //         <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
// //         <motion.div
// //           animate={{ rotate: 360 }}
// //           transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
// //           className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
// //         />
// //       </div>
// //     );
// //   }

// //   if (!orderDetails || !orderDetails.orderIds.length) {
// //     return (
// //       <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
// //         <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
// //         <div className="text-gray-600 text-lg">No order details available</div>
// //       </div>
// //     );
// //   }

// //   const totalQuantity = orderDetails.items.reduce((sum, item) => sum + (item.quantity || 0), 0);

// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 py-8 px-4">
// //       <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
// //       <motion.div
// //         className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-6"
// //         variants={containerVariants}
// //         initial="initial"
// //         animate="animate"
// //       >
// //         {/* Header */}
// //         <div className="flex items-center justify-between mb-6">
// //           <motion.button
// //             onClick={() => navigate('/')}
// //             className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
// //             whileHover={{ scale: 1.05 }}
// //             whileTap={{ scale: 0.95 }}
// //           >
// //             <FaArrowLeft />
// //             <span>Back to Home</span>
// //           </motion.button>
// //           <div className="flex items-center gap-2 text-blue-600">
// //             <FaCheckCircle size={20} />
// //             <span className="text-sm font-semibold uppercase tracking-wide">Order Confirmed</span>
// //           </div>
// //         </div>

// //         {/* Confirmation Message */}
// //         <h1 className="text-2xl font-bold text-gray-800 mb-4">Thank You for Your Order!</h1>
// //         <p className="text-sm text-gray-600 mb-6">
// //           Your order has been successfully placed. The seller will contact you soon with further details.
// //         </p>

// //         {/* Order Details */}
// //         <div className="space-y-6">
// //           {/* Order IDs */}
// //           <div className="bg-blue-50 p-4 rounded-xl">
// //             <h2 className="text-sm font-semibold text-gray-700 mb-2">Order ID(s)</h2>
// //             <p className="text-sm text-gray-800">
// //               {orderDetails.orderIds.length > 1
// //                 ? orderDetails.orderIds.join(', ')
// //                 : orderDetails.orderIds[0]}
// //             </p>
// //           </div>

// //           {/* Items */}
// //           <div className="bg-blue-50 p-4 rounded-xl">
// //             <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
// //               <FaBox /> Items ({totalQuantity})
// //             </h2>
// //             <div className="space-y-3">
// //               {orderDetails.items.map((item, index) => (
// //                 <motion.div
// //                   key={item.productId || index}
// //                   className="flex gap-3"
// //                   variants={itemVariants}
// //                   initial="initial"
// //                   animate="animate"
// //                   transition={{ delay: index * 0.1 }}
// //                 >
// //                   <img
// //                     src={item.productId?.image?.[0] || placeholderImage}
// //                     alt={item.productId?.name || 'Product'}
// //                     className="w-12 h-12 object-cover rounded-md shadow-sm"
// //                     onError={(e) => (e.target.src = placeholderImage)}
// //                   />
// //                   <div className="flex-1">
// //                     <p className="text-sm font-medium text-gray-800">
// //                       {item.productId?.name || 'Unknown Product'}
// //                     </p>
// //                     <p className="text-xs text-gray-600">
// //                       Qty: {item.quantity} × ₹{item.price?.toFixed(2)}
// //                     </p>
// //                     <p className="text-sm text-blue-600 font-medium">
// //                       ₹{(item.quantity * item.price).toFixed(2)}
// //                     </p>
// //                   </div>
// //                 </motion.div>
// //               ))}
// //             </div>
// //           </div>

// //           {/* Summary */}
// //           <div className="bg-blue-50 p-4 rounded-xl">
// //             <h2 className="text-sm font-semibold text-gray-700 mb-2">Summary</h2>
// //             <div className="text-xs text-gray-700 space-y-1">
// //               <p className="flex justify-between">
// //                 <span>Total Quantity:</span>
// //                 <span>{totalQuantity}</span>
// //               </p>
// //               <p className="flex justify-between">
// //                 <span>Subtotal:</span>
// //                 <span>₹{(orderDetails.totalAmount - 50).toFixed(2)}</span>
// //               </p>
// //               <p className="flex justify-between">
// //                 <span>Shipping:</span>
// //                 <span>₹50.00</span>
// //               </p>
// //               <p className="flex justify-between font-semibold text-gray-800 pt-1 border-t border-gray-200">
// //                 <span>Total:</span>
// //                 <span className="text-blue-600">₹{orderDetails.totalAmount.toFixed(2)}</span>
// //               </p>
// //             </div>
// //           </div>

// //           {/* Additional Info */}
// //           <div className="text-xs text-gray-600">
// //             <p>
// //               <strong>Order Date:</strong>{' '}
// //               {orderDetails.createdAt
// //                 ? new Date(orderDetails.createdAt).toLocaleString()
// //                 : 'N/A'}
// //             </p>
// //             <p>
// //               <strong>Status:</strong> {orderDetails.status || 'Pending'}
// //             </p>
// //           </div>
// //         </div>

// //         {/* Action Button */}
// //         <motion.button
// //           onClick={() => navigate('/dashboard')} // Assuming a dashboard route exists
// //           className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-md text-sm font-medium"
// //           whileHover={{ scale: 1.05 }}
// //           whileTap={{ scale: 0.95 }}
// //         >
// //           View Orders
// //         </motion.button>
// //       </motion.div>
// //     </div>
// //   );
// // };

// // export default OrderConfirmation;
// import React, { useState, useEffect } from 'react';
// import { useLocation, useParams } from 'react-router-dom';
// import axios from '../useraxios';
// import toast, { Toaster } from 'react-hot-toast';
// import { motion } from 'framer-motion';

// const OrderConfirmation = () => {
//   const { orderId } = useParams(); // For /order/:orderId
//   const { state } = useLocation(); // For /order-confirmation
//   const [order, setOrder] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchOrder = async () => {
//       try {
//         const token = localStorage.getItem('token');
//         if (!token) throw new Error('Not authenticated');

//         let response;
//         if (orderId) {
//           response = await axios.get(`/api/user/auth/order/${orderId}`, {
//             headers: { Authorization: `Bearer ${token}` },
//           });
//           setOrder(response.data.order);
//         } else if (state?.orderIds?.length) {
//           response = await axios.get(`/api/user/auth/order/${state.orderIds[0]}`, {
//             headers: { Authorization: `Bearer ${token}` },
//           });
//           setOrder(response.data.order);
//         }
//       } catch (error) {
//         toast.error(error.response?.data?.message || 'Failed to load order details');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchOrder();
//   }, [orderId, state]);

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <motion.div
//           animate={{ rotate: 360 }}
//           transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
//           className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
//         />
//       </div>
//     );
//   }

//   if (!order) {
//     return <div className="min-h-screen flex items-center justify-center">Order not found</div>;
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 py-8 px-4">
//       <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
//       <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-6">
//         <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Confirmation</h2>
//         <div className="space-y-4">
//           <p><strong>Order ID:</strong> {order.orderId}</p>
//           <p><strong>Status:</strong> {order.status}</p>
//           <p><strong>Total:</strong> ₹{order.total.toFixed(2)}</p>
//           <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
//           <p><strong>Customer:</strong> {order.customer.name}</p>
//           <p><strong>Address:</strong> {order.customer.address}</p>
//           <div>
//             <strong>Items:</strong>
//             <ul className="list-disc pl-5 mt-2">
//               {order.items.map((item, index) => (
//                 <li key={index}>
//                   {item.name} - Qty: {item.quantity} - ₹{(item.price * item.quantity).toFixed(2)}
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OrderConfirmation;

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaBox } from 'react-icons/fa';
import axios from '../useraxios';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
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

const OrderConfirmation = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

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
        const orders = responses.map((res) => res.data.order);

        const combinedOrder = {
          orderIds,
          items: orders.flatMap((order) => order.items || []),
          totalAmount: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
          createdAt: orders[0]?.createdAt,
          status: orders.every((order) => order.status === orders[0].status)
            ? orders[0].status
            : 'Mixed',
        };

        setOrderDetails(combinedOrder);
      } catch (error) {
        toast.error('Failed to fetch order details');
        console.error('Fetch Order Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [state]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
        <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!orderDetails || !orderDetails.orderIds.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
        <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
        <div className="text-gray-600 text-lg">No order details available</div>
      </div>
    );
  }

  const totalQuantity = orderDetails.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const shippingFee = 50; // Could be dynamic from backend if provided

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 py-8 px-4">
      <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
      <motion.div
        className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-6"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <motion.button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowLeft />
            <span>Back to Home</span>
          </motion.button>
          <div className="flex items-center gap-2 text-blue-600">
            <FaCheckCircle size={20} />
            <span className="text-sm font-semibold uppercase tracking-wide">Order Confirmed</span>
          </div>
        </div>

        {/* Confirmation Message */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Thank You for Your Order!</h1>
        <p className="text-sm text-gray-600 mb-6">
          Your order has been successfully placed. The seller will contact you soon with further details.
        </p>

        {/* Order Details */}
        <div className="space-y-6">
          {/* Order IDs */}
          <div className="bg-blue-50 p-4 rounded-xl">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Order ID(s)</h2>
            <p className="text-sm text-gray-800">
              {orderDetails.orderIds.length > 1
                ? orderDetails.orderIds.join(', ')
                : orderDetails.orderIds[0]}
            </p>
          </div>

          {/* Items */}
          <div className="bg-blue-50 p-4 rounded-xl">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FaBox /> Items ({totalQuantity})
            </h2>
            <div className="space-y-3">
              {orderDetails.items.map((item, index) => (
                <motion.div
                  key={item.productId || index}
                  className="flex gap-3"
                  variants={itemVariants}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: index * 0.1 }}
                >
                  <img
                    src={item.productId?.image?.[0] || placeholderImage}
                    alt={item.productId?.name || 'Product image'}
                    className="w-12 h-12 object-cover rounded-md shadow-sm"
                    onError={(e) => (e.target.src = placeholderImage)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {item.productId?.name || 'Unknown Product'}
                    </p>
                    <p className="text-xs text-gray-600">
                      Qty: {item.quantity || 0} × ₹{(item.price || 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-blue-600 font-medium">
                      ₹{((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 p-4 rounded-xl">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Summary</h2>
            <div className="text-xs text-gray-700 space-y-1">
              <p className="flex justify-between">
                <span>Total Quantity:</span>
                <span>{totalQuantity}</span>
              </p>
              <p className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{(orderDetails.totalAmount - shippingFee).toFixed(2)}</span>
              </p>
              <p className="flex justify-between">
                <span>Shipping:</span>
                <span>₹{shippingFee.toFixed(2)}</span>
              </p>
              <p className="flex justify-between font-semibold text-gray-800 pt-1 border-t border-gray-200">
                <span>Total:</span>
                <span className="text-blue-600">₹{orderDetails.totalAmount.toFixed(2)}</span>
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-xs text-gray-600">
            <p>
              <strong>Order Date:</strong>{' '}
              {orderDetails.createdAt
                ? new Date(orderDetails.createdAt).toLocaleString()
                : 'N/A'}
            </p>
            <p>
              <strong>Status:</strong> {orderDetails.status || 'Pending'}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <motion.button
          onClick={() => navigate('/dashboard')}
          className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-md text-sm font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          View Orders
        </motion.button>
      </motion.div>
    </div>
  );
};

export default OrderConfirmation;