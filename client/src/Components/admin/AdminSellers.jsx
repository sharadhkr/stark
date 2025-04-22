import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaEdit, FaTrash, FaEye, FaSearch, FaStore, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from '../axios';
import useAdminAuth from '../../hooks/useAdminAuth';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const AdminSellers = ({ sellers = [], setSellers, setActiveSection, loading }) => {
  const { isAdmin, error, checkAdmin } = useAdminAuth();
  const [showDetails, setShowDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSellers, setFilteredSellers] = useState(sellers);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setFilteredSellers(sellers);
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      console.log(`Searching sellers with query: ${searchQuery}`);
      const response = await axios.get(`/api/admin/auth/sellers/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Search sellers response:', response.data);
      setFilteredSellers(response.data.sellers || []);
    } catch (error) {
      console.error('Search sellers error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(error.response?.data?.message || 'Failed to search sellers');
    }
  };

  const handleToggleSellerStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'enabled' ? 'disabled' : 'enabled';
    try {
      const token = localStorage.getItem('adminToken');
      console.log(`Updating seller ${id} to status: ${newStatus}`);
      const response = await axios.put(
        `/api/admin/auth/sellers/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Update seller response:', response.data);
      setSellers(sellers.map((s) => (s._id === id ? { ...s, status: newStatus } : s)));
      setFilteredSellers(filteredSellers.map((s) => (s._id === id ? { ...s, status: newStatus } : s)));
      toast.success(`Seller ${newStatus} successfully`);
    } catch (error) {
      console.error('Update seller status error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(error.response?.data?.message || 'Failed to update seller status');
    }
  };

  const handleDeleteSeller = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the seller "${name || 'Unnamed Seller'}"?`)) return;
    try {
      const token = localStorage.getItem('adminToken');
      console.log(`Deleting seller ${id}`);
      await axios.delete(`/api/admin/auth/sellers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSellers(sellers.filter((s) => s._id !== id));
      setFilteredSellers(filteredSellers.filter((s) => s._id !== id));
      toast.success('Seller deleted successfully');
    } catch (error) {
      console.error('Delete seller error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(error.response?.data?.message || 'Failed to delete seller');
    }
  };

  const toggleDetails = (id) => {
    setShowDetails(showDetails === id ? null : id);
  };

  // Sync filtered sellers when sellers prop changes
  useEffect(() => {
    setFilteredSellers(sellers);
  }, [sellers]);

  // Validate props
  if (!Array.isArray(sellers)) {
    console.error('Invalid sellers prop:', sellers);
    return (
      <div className="text-red-600 p-6 bg-red-50 rounded-2xl shadow-md">
        Error: Invalid sellers data. Please try refreshing the page.
      </div>
    );
  }

  // Render loading state
  if (isAdmin === null || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-blue-600 text-4xl" />
      </div>
    );
  }

  // Render access denied state
  if (isAdmin === false) {
    return (
      <div className="text-center p-6 bg-red-50 rounded-2xl shadow-md">
        <h3 className="text-lg font-semibold text-red-700">Unable to Access Sellers</h3>
        <p className="text-sm text-red-600 mb-4">{error || 'Please try again later.'}</p>
        <motion.button
          onClick={checkAdmin}
          whileHover={{ scale: 1.05 }}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-200"
        >
          Retry
        </motion.button>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative w-full sm:w-64">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sellers by name or shop..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all duration-200"
            aria-label="Search sellers"
          />
        </div>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm"
          aria-label="Search sellers"
        >
          Search
        </motion.button>
      </form>
      {filteredSellers.length === 0 ? (
        <div className="text-center text-gray-600 text-lg">No sellers found</div>
      ) : (
        filteredSellers.map((seller) => {
          if (!seller || !seller._id) {
            console.warn('Invalid seller detected:', seller);
            return null;
          }
          return (
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
                      alt={seller.name || 'Seller'}
                      className="w-12 h-12 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <FaStore size={20} />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{seller.name || seller.phoneNumber || 'Unnamed Seller'}</h3>
                    <p className="text-sm text-gray-600">Shop: {seller.shopName || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Email: {seller.email || 'N/A'}</p>
                    <p className="text-sm text-gray-600">
                      Status: <span className={seller.status === 'enabled' ? 'text-emerald-600' : 'text-red-600'}>{seller.status || 'Unknown'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() => toggleDetails(seller._id)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-all duration-200"
                    aria-label={`View details for ${seller.name || 'seller'}`}
                    title="View Details"
                  >
                    <FaEye size={16} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleToggleSellerStatus(seller._id, seller.status)}
                    className={`px-4 py-2 text-sm rounded-xl text-white shadow-sm transition-all duration-200 flex items-center gap-2 ${
                      seller.status === 'enabled' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                    aria-label={`${seller.status === 'enabled' ? 'Disable' : 'Enable'} seller`}
                    title={seller.status === 'enabled' ? 'Disable Seller' : 'Enable Seller'}
                  >
                    {seller.status === 'enabled' ? 'Disable' : 'Enable'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() => handleDeleteSeller(seller._id, seller.name)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-all duration-200"
                    aria-label={`Delete seller ${seller.name || 'seller'}`}
                    title="Delete Seller"
                  >
                    <FaTrash size={16} />
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
                  <p className="text-sm text-gray-600">Revenue: ₹{(seller.revenue?.total || 0).toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Phone: {seller.phoneNumber || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Address: {seller.address || 'N/A'}</p>
                  <div className="mt-2 flex gap-4">
                    <button
                      onClick={() => setActiveSection('products')}
                      className="text-blue-600 hover:underline text-sm"
                      aria-label="View seller's products"
                    >
                      View Seller’s Products
                    </button>
                    <button
                      onClick={() => setActiveSection('orders')}
                      className="text-blue-600 hover:underline text-sm"
                      aria-label="View seller's orders"
                    >
                      View Seller’s Orders
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        }).filter(Boolean)
      )}
    </motion.div>
  );
};

export default AdminSellers;