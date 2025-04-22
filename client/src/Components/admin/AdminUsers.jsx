import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaEdit, FaTrash, FaEye, FaUser, FaUsers, FaSearch, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from '../axios';
import useAdminAuth from '../../hooks/useAdminAuth';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const AdminUsers = ({ users = [], setUsers, loading: parentLoading }) => {
  const { isAdmin, error: authError, checkAdmin } = useAdminAuth();
  const [showDetails, setShowDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      console.log(`Searching users with query: ${searchQuery}`);
      const response = await axios.get(`/api/admin/auth/users/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Search users response:', response.data);
      setFilteredUsers(response.data.users || []);
    } catch (error) {
      console.error('Search users error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(error.response?.data?.message || 'Failed to search users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (id, updates) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      console.log(`Updating user ${id} with updates:`, updates);
      const response = await axios.put(`/api/admin/auth/users/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Update user response:', response.data);
      setUsers(users.map((u) => (u._id === id ? response.data.user : u)));
      setFilteredUsers(filteredUsers.map((u) => (u._id === id ? response.data.user : u)));
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Update user error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id, identifier) => {
    if (!window.confirm(`Are you sure you want to delete the user "${identifier}"?`)) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      console.log(`Deleting user ${id}`);
      await axios.delete(`/api/admin/auth/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter((u) => u._id !== id));
      setFilteredUsers(filteredUsers.filter((u) => u._id !== id));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Delete user error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDetails = (id) => {
    setShowDetails(showDetails === id ? null : id);
  };

  // Sync filtered users when users prop changes
  useEffect(() => {
    setFilteredUsers(users);
  }, [users]);

  // Validate props
  if (!Array.isArray(users)) {
    console.error('Invalid users prop:', users);
    return (
      <div className="text-red-600 p-6 bg-red-50 rounded-2xl shadow-md">
        Error: Invalid users data. Please try refreshing the page.
      </div>
    );
  }

  // Render loading state
  if (isAdmin === null || parentLoading || isLoading) {
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
        <h3 className="text-lg font-semibold text-red-700">Unable to Access Users</h3>
        <p className="text-sm text-red-600 mb-4">{authError || 'Please try again later.'}</p>
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
            placeholder="Search users by name or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all duration-200"
            aria-label="Search users"
            disabled={isLoading}
          />
        </div>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          disabled={isLoading}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm ${
            isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
          } transition-all duration-200 shadow-sm`}
          aria-label="Search users"
        >
          {isLoading ? <FaSpinner className="animate-spin" /> : 'Search'}
        </motion.button>
      </form>
      {filteredUsers.length === 0 ? (
        <div className="text-center text-gray-600 text-lg">No users found</div>
      ) : (
        filteredUsers.map((user) => {
          if (!user || !user._id) {
            console.warn('Invalid user detected:', user);
            return null;
          }
          const identifier = user.name || user.email || 'Unnamed User';
          return (
            <motion.div
              key={user._id}
              variants={fadeIn}
              className="bg-blue-50 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={identifier}
                      className="w-12 h-12 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <FaUsers size={20} />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{identifier}</h3>
                    <p className="text-sm text-gray-600">Email: {user.email || 'N/A'}</p>
                    <p className="text-sm text-gray-600">
                      Status: <span className={user.status === 'approved' ? 'text-emerald-600' : 'text-red-600'}>{user.status || 'Unknown'}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Role: <span className={user.role === 'admin' ? 'text-blue-600' : 'text-gray-600'}>{user.role || 'user'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() => toggleDetails(user._id)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-all duration-200"
                    aria-label={`View details for ${identifier}`}
                    title="View Details"
                  >
                    <FaEye size={16} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() =>
                      handleUpdateUser(user._id, {
                        status: user.status === 'approved' ? 'suspended' : 'approved',
                      })
                    }
                    className={`p-2 ${
                      user.status === 'approved' ? 'text-red-600 hover:bg-red-100' : 'text-emerald-600 hover:bg-emerald-100'
                    } rounded-full transition-all duration-200`}
                    aria-label={`${user.status === 'approved' ? 'Suspend' : 'Approve'} user`}
                    title={user.status === 'approved' ? 'Suspend User' : 'Approve User'}
                  >
                    <FaEdit size={16} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() =>
                      handleUpdateUser(user._id, {
                        role: user.role === 'admin' ? 'user' : 'admin',
                      })
                    }
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-all duration-200"
                    aria-label={`${user.role === 'admin' ? 'Demote to user' : 'Promote to admin'}`}
                    title={user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                  >
                    <FaUser size={16} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() => handleDeleteUser(user._id, identifier)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-all duration-200"
                    aria-label={`Delete user ${identifier}`}
                    title="Delete User"
                  >
                    <FaTrash size={16} />
                  </motion.button>
                </div>
              </div>
              {showDetails === user._id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-4 bg-white rounded-xl shadow-sm"
                >
                  <p className="text-sm text-gray-600">Orders: {user.orders?.length || 0}</p>
                  <p className="text-sm text-gray-600">Saved Items: {user.savedItems?.length || 0}</p>
                  <p className="text-sm text-gray-600">Wishlists: {user.wishlists?.length || 0}</p>
                  <p className="text-sm text-gray-600">Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                </motion.div>
              )}
            </motion.div>
          );
        }).filter(Boolean)
      )}
    </motion.div>
  );
};

export default AdminUsers;