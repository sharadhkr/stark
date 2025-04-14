import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from '../axios';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const AdminSellers = ({ sellers, setSellers, setActiveSection, loading }) => {
  const [showDetails, setShowDetails] = useState(null);

  const handleToggleSellerStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'enabled' ? 'disabled' : 'enabled';
    try {
      const response = await axios.put(`/api/admin/auth/sellers/${id}`, { status: newStatus });
      setSellers(sellers.map((s) => (s._id === id ? { ...s, status: newStatus } : s)));
      toast.success(`Seller ${newStatus} successfully`);
    } catch (error) {
      toast.error('Failed to update seller status');
    }
  };

  const handleDeleteSeller = async (id) => {
    if (!window.confirm('Are you sure you want to delete this seller?')) return;
    try {
      await axios.delete(`/api/admin/auth/sellers/${id}`);
      setSellers(sellers.filter((s) => s._id !== id));
      toast.success('Seller deleted successfully');
    } catch (error) {
      toast.error('Failed to delete seller');
    }
  };

  const toggleDetails = (id) => {
    setShowDetails(showDetails === id ? null : id);
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
      {loading ? (
        <div className="text-center text-gray-600 animate-pulse text-lg">Loading sellers...</div>
      ) : sellers.length === 0 ? (
        <div className="text-center text-gray-600 text-lg">No sellers found</div>
      ) : (
        sellers.map((seller) => (
          <motion.div
            key={seller._id}
            variants={fadeIn}
            className="bg-blue-50 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                {seller.profilePicture ? (
                  <img
                    src={seller.profilePicture}
                    alt={seller.name}
                    className="w-12 h-12 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <FaStore />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{seller.name || seller.phoneNumber || 'Unnamed Seller'}</h3>
                  <p className="text-sm text-gray-600">Shop: {seller.shopName || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Email: {seller.email || 'N/A'}</p>
                  <p className="text-sm text-gray-600">
                    Status: <span className={seller.status === 'enabled' ? 'text-emerald-600' : 'text-red-600'}>{seller.status}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => toggleDetails(seller._id)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-all duration-200"
                  aria-label={`View details for ${seller.name}`}
                >
                  <FaEye />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleToggleSellerStatus(seller._id, seller.status)}
                  className={`px-4 py-2 text-sm rounded-xl text-white shadow-sm transition-all duration-200 ${
                    seller.status === 'enabled' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                  aria-label={`${seller.status === 'enabled' ? 'Disable' : 'Enable'} seller`}
                >
                  {seller.status === 'enabled' ? 'Disable' : 'Enable'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => handleDeleteSeller(seller._id)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-all duration-200"
                  aria-label={`Delete seller ${seller.name}`}
                >
                  <FaTrash />
                </motion.button>
              </div>
            </div>
            {showDetails === seller._id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-white rounded-xl shadow-sm"
              >
                <p className="text-sm text-gray-600">Products: {seller.products?.length || 0}</p>
                <p className="text-sm text-gray-600">Orders: {seller.orders?.length || 0}</p>
                <p className="text-sm text-gray-600">Revenue: ₹{seller.revenue?.total?.toFixed(2) || 0}</p>
                <p className="text-sm text-gray-600">Phone: {seller.phoneNumber || 'N/A'}</p>
                <p className="text-sm text-gray-600">Address: {seller.address || 'N/A'}</p>
                <div className="mt-2">
                  <button
                    onClick={() => setActiveSection('products')}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Seller’s Products
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))
      )}
    </motion.div>
  );
};

export default AdminSellers;