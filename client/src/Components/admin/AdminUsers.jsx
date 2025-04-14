import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEdit, FaTrash, FaEye, FaUser, FaUsers } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from '../axios';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const AdminUsers = ({ users, setUsers, loading }) => {
  const [showDetails, setShowDetails] = useState(null);

  const handleUpdateUser = async (id, updates) => {
    try {
      const response = await axios.put(`/api/admin/auth/users/${id}`, updates);
      setUsers(users.map((u) => (u._id === id ? response.data.user : u)));
      toast.success('User updated successfully');
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`/api/admin/auth/users/${id}`);
      setUsers(users.filter((u) => u._id !== id));
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const toggleDetails = (id) => {
    setShowDetails(showDetails === id ? null : id);
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
      {loading ? (
        <div className="text-center text-gray-600 animate-pulse text-lg">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="text-center text-gray-600 text-lg">No users found</div>
      ) : (
        users.map((user) => (
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
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <FaUsers />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{user.name || user.email}</h3>
                  <p className="text-sm text-gray-600">Email: {user.email}</p>
                  <p className="text-sm text-gray-600">
                    Status: <span className={user.status === 'approved' ? 'text-emerald-600' : 'text-red-600'}>{user.status}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => toggleDetails(user._id)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-all duration-200"
                  aria-label={`View details for ${user.name}`}
                >
                  <FaEye />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => handleUpdateUser(user._id, { status: user.status === 'approved' ? 'suspended' : 'approved' })}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-all duration-200"
                  aria-label={`${user.status === 'approved' ? 'Suspend' : 'Approve'} user`}
                >
                  <FaEdit />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => handleDeleteUser(user._id)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-all duration-200"
                  aria-label={`Delete user ${user.name}`}
                >
                  <FaTrash />
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
              </motion.div>
            )}
          </motion.div>
        ))
      )}
    </motion.div>
  );
};

export default AdminUsers;