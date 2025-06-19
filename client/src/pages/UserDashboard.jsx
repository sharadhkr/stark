import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUser,
  FaSignOutAlt,
  FaShoppingBag,
  FaHeart,
  FaShoppingCart,
  FaQuestionCircle,
  FaCog,
  FaMapMarkerAlt,
  FaCamera,
  FaChevronDown,
  FaTimes,
  FaPlus,
  FaTrash,
  FaList,
} from 'react-icons/fa';
import { isUserLoggedIn, userLogout } from '../utils/authUtils';
import axios from '../useraxios';
import agroLogo from '../assets/logo.png';
import agrotade from '../assets/logoname.png';
import ProductCardSkeleton from '../Components/ProductCardSkeleton';
import { MdArrowBack } from 'react-icons/md';

// Animation Variants
const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } };
const slideIn = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } },
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    profilePicture: '',
    addresses: [{ street: '', city: '', state: '', postalCode: '', country: 'India', isDefault: false }],
    preferences: { notifications: true, preferredCategories: [] },
  });
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [showEditProfilePanel, setShowEditProfilePanel] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = isUserLoggedIn();
      setIsAuthenticated(loggedIn);
      if (loggedIn) {
        await fetchUserData();
      }
    };
    checkAuth();
  }, []);

  const fetchUserData = useCallback(async (retryCount = 0) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [profileRes, ordersRes] = await Promise.all([
        axios.get('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/user/orders', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const user = profileRes.data.user;
      const newProfile = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        profilePicture: user.profilePicture || '',
        addresses: user.addresses && user.addresses.length
          ? user.addresses
          : [{ street: '', city: '', state: '', postalCode: '', country: 'India', isDefault: true }],
        preferences: user.preferences || { notifications: true, preferredCategories: [] },
      };
      setProfile(newProfile);
      setProfilePicturePreview(newProfile.profilePicture || null);
      const fetchedOrders = (ordersRes.data.orders || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(fetchedOrders);
      handleOrderFilter(orderFilter, fetchedOrders);
    } catch (error) {
      if (error.response?.status === 401) {
        if (retryCount < 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return fetchUserData(retryCount + 1);
        }
        userLogout(navigate);
        toast.error('Session expired. Please log in again.', {
          style: { background: '#ef4444', color: '#ffffff', borderRadius: '8px', padding: '12px' },
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to load data.', {
          style: { background: '#ef4444', color: '#ffffff', borderRadius: '8px', padding: '12px' },
        });
      }
    } finally {
      setLoading(false);
    }
  }, [orderFilter, navigate]);

  const handleLogout = () => {
    userLogout(navigate);
    toast.success('Logged out successfully!', {
      style: { background: '#f9fafb', color: '#111827', borderRadius: '8px', padding: '12px' },
    });
  };

  const validateAddress = (address) => {
    return address.street && address.city && address.state && address.postalCode && address.country;
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!profile.email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      toast.error('Please enter a valid email.', {
        style: { background: '#ef4444', color: '#ffffff', borderRadius: '8px', padding: '12px' },
      });
      return;
    }

    // Validate addresses
    for (const addr of profile.addresses) {
      if (!validateAddress(addr)) {
        toast.error('All address fields are required.', {
          style: { background: '#ef4444', color: '#ffffff', borderRadius: '8px', padding: '12px' },
        });
        return;
      }
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('firstName', profile.firstName);
    formData.append('lastName', profile.lastName);
    formData.append('email', profile.email);
    formData.append('addresses', JSON.stringify(profile.addresses));
    formData.append('preferences', JSON.stringify(profile.preferences));
    if (profilePicturePreview instanceof File) {
      formData.append('profilePicture', profilePicturePreview);
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('/api/user/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setProfile(prev => ({ ...prev, ...res.data.user }));
      setProfilePicturePreview(res.data.user.profilePicture || null);
      setShowEditProfilePanel(false);
      toast.success('Profile updated successfully!', {
        style: { background: '#f9fafb', color: '#111827', borderRadius: '8px', padding: '12px' },
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile.', {
        style: { background: '#ef4444', color: '#ffffff', borderRadius: '8px', padding: '12px' },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicturePreview(file);
    }
  };

  const handleAddCurrentLocation = (index) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.', {
        style: { background: '#ef4444', color: '#ffffff', borderRadius: '8px', padding: '12px' },
      });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const apiKey = import.meta.env.VITE_OPENCAGE_API_KEY || 'YOUR_OPENCAGE_API_KEY';
          const res = await axios.get(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`);
          const { components } = res.data.results[0];
          const newAddr = {
            street: components.road || 'Unknown Street',
            city: components.city || components.town || 'Unknown City',
            state: components.state || 'Unknown State',
            postalCode: components.postcode || '000000',
            country: components.country || 'India',
            isDefault: profile.addresses.length === 0,
          };
          const newAddresses = [...profile.addresses];
          newAddresses[index] = newAddr;
          setProfile({ ...profile, addresses: newAddresses });
          toast.success('Location fetched successfully! Please save profile.', {
            style: { background: '#f9fafb', color: '#111827', borderRadius: '8px', padding: '12px' },
          });
        } catch (error) {
          toast.error('Failed to fetch location data. Please enter manually.', {
            style: { background: '#ef4444', color: '#ffffff', borderRadius: '8px', padding: '12px' },
          });
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        toast.error('Unable to retrieve your location. Please allow location access.', {
          style: { background: '#ef4444', color: '#ffffff', borderRadius: '8px', padding: '12px' },
        });
      }
    );
  };

  const handleOrderFilter = (filter, orderList = orders) => {
    setOrderFilter(filter);
    const filtered = filter === 'all'
      ? orderList
      : orderList.filter(order => order.status.toLowerCase() === filter);
    setFilteredOrders(filtered);
  };

  const renderOrderCard = (order) => {
    const total = order.total || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const statusColor = order.status.toLowerCase() === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600';
    return (
      <motion.div
        key={order._id}
        whileHover={{ scale: 1.02 }}
        className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-all duration-300 cursor-pointer"
        onClick={() => navigate(`/order/${order.orderId}`)}
      >
        <img
          src={order.items[0]?.images?.[0] || agroLogo}
          alt={order.items[0]?.name || 'Product'}
          className="w-20 h-20 object-cover rounded-lg border border-gray-100"
          onError={(e) => (e.target.src = agroLogo)}
        />
        <div className="flex-1">
          <p className="text-lg font-semibold text-gray-900">{order.items[0]?.name || 'Unknown Product'}</p>
          <p className="text-sm text-gray-500">Order ID: {order.orderId.slice(0, 10)}...</p>
          <p className="text-sm text-gray-500">Items: {order.items.length}</p>
          <p className="text-sm text-gray-600">Total: ₹{total.toFixed(2)}</p>
          <p className="text-sm text-gray-500">Placed: {new Date(order.createdAt).toLocaleDateString()}</p>
          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${statusColor}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/order/${order.orderId}`);
          }}
          className="text-pink-600 hover:text-pink-700 text-sm font-medium"
        >
          View Details
        </button>
      </motion.div>
    );
  };

  const addNewAddress = () => {
    setProfile({
      ...profile,
      addresses: [
        ...profile.addresses,
        { street: '', city: '', state: '', postalCode: '', country: 'India', isDefault: false },
      ],
    });
  };

  const removeAddress = (index) => {
    if (profile.addresses.length === 1) {
      toast.error('At least one address is required.', {
        style: { background: '#ef4444', color: '#ffffff', borderRadius: '8px', padding: '12px' },
      });
      return;
    }
    const newAddresses = profile.addresses.filter((_, i) => i !== index);
    if (!newAddresses.some(addr => addr.isDefault) && newAddresses.length > 0) {
      newAddresses[0].isDefault = true;
    }
    setProfile({ ...profile, addresses: newAddresses });
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#f9fafb', color: '#111827', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '12px' },
          success: { style: { background: '#f9fafb', color: '#111827' } },
          error: { style: { background: '#ef4444', color: '#ffffff' } },
        }}
      />
      <header className="bg-white shadow-sm p-4 sticky top-0 z-20">
              <div className="max-w-7xl mx-auto flex gap-2 items-center">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/')}
                  className="text-gray-600"
                >
                  <MdArrowBack size={24} />
                </motion.button>
                <h1 className="text-xl font-bold text-gray-800">Profile</h1>
                <div className="w-10" />
              </div>
            </header>

      <main className="max-w-7xl mx-auto py-12 px-6">
        <motion.div variants={fadeIn} initial="initial" animate="animate" className="space-y-8">
          {isAuthenticated ? (
            <>
              <div className="bg-white rounded-2xl shadow-sm p-8 flex items-center gap-6">
                <motion.img
                  src={profile.profilePicture || agroLogo}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-pink-100 shadow-sm"
                  onError={(e) => (e.target.src = agroLogo)}
                  whileHover={{ scale: 1.05 }}
                />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{`${profile.firstName} ${profile.lastName}`.trim() || 'User'}</p>
                  <p className="text-sm text-gray-500 mt-1">{profile.email}</p>
                  <p className="text-sm text-gray-500">{profile.phoneNumber || 'No phone number'}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <p className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                  <FaMapMarkerAlt className="w-5 h-5 text-pink-600" /> Addresses
                </p>
                {profile.addresses.length ? (
                  <div className="mt-4 space-y-3">
                    {profile.addresses.map((addr, index) => (
                      <p key={index} className="text-sm text-gray-600">
                        {`${addr.street}, ${addr.city}, ${addr.state}, ${addr.postalCode}, ${addr.country}`}
                        {addr.isDefault && <span className="ml-2 inline-block px-2 py-1 text-xs font-medium text-pink-600 bg-pink-50 rounded-full">Default</span>}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 mt-2">No addresses provided</p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { icon: FaShoppingBag, label: 'Orders', action: () => setShowOrdersModal(true) },
                  { icon: FaHeart, label: 'Wishlist', action: () => navigate('/wishlist') },
                  { icon: FaShoppingCart, label: 'Cart', action: () => navigate('/cart') },
                  { icon: FaQuestionCircle, label: 'Help Center', action: () => navigate('/help-center') },
                  { icon: FaUser, label: 'Manage Account', action: () => setShowEditProfilePanel(true) },
                ].map(({ icon: Icon, label, action }, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={action}
                    className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4 text-gray-900 hover:shadow-md transition-all duration-300"
                  >
                    <Icon className="w-6 h-6 text-pink-600" />
                    <span className="text-base font-medium">{label}</span>
                  </motion.button>
                ))}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                    className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4 text-gray-900 hover:shadow-md transition-all duration-300 w-full"
                  >
                    <FaCog className="w-6 h-6 text-pink-600" />
                    <span className="text-base font-medium">Settings</span>
                    <FaChevronDown className={`w-4 h-4 ml-auto text-gray-500 transition-transform ${showSettingsMenu ? 'rotate-180' : ''}`} />
                  </motion.button>
                  {showSettingsMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg w-full z-10 border border-gray-100"
                    >
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl transition-all duration-200"
                      >
                        Logout
                      </button>
                      <button
                        onClick={() => navigate('/add-account')}
                        className="w-full text-left px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-b-xl transition-all duration-200"
                      >
                        Add Another Account
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
              <p className="text-gray-900 text-xl font-semibold mb-6">Please log in to access your dashboard</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="bg-pink-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-pink-700 transition-all duration-300"
              >
                Login
              </motion.button>
            </div>
          )}
          <div className="bg-white rounded-2xl shadow-sm p-8 mt-8">
            {/* <p className="text-lg font-semibold text-gray-900 mb-4">More Information </p> */}
            <div className="flex flex-col items-start gap-6 text-sm text-gray-600">
              {[
                { label: ' FAQs', path: '/faq' },
                { label: ' About Us', path: '/about' },
                { label: ' Terms of Use', path: '/terms' },
                { label: ' Privacy Policy', path: '/privacy' },
              ].map(({ label, path }, index) => (
                <button
                  key={index}
                  onClick={() => navigate(path)}
                  className="hover:text-pink-600 transition-colors duration-200"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Orders Modal */}
        <AnimatePresence>
          {showOrdersModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
                onClick={() => setShowOrdersModal(false)}
              />
              <motion.div
                variants={slideIn}
                initial="initial"
                animate="animate"
                exit="exit"
                className="fixed top-0 right-0 h-full bg-white p-8 shadow-2xl max-w-md w-full z-40 overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <FaShoppingBag className="w-6 h-6 text-pink-600" /> My Orders
                  </h2>
                  <button
                    onClick={() => setShowOrdersModal(false)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <FaTimes className="w-6 h-6" />
                  </button>
                </div>
                <div className="mb-6">
                  <select
                    value={orderFilter}
                    onChange={(e) => handleOrderFilter(e.target.value)}
                    className="w-full bg-gray-50 text-gray-900 rounded-lg px-4 py-2 text-sm border border-gray-200 focus:ring-2 focus:ring-pink-600 focus:border-pink-600 outline-none transition-all duration-200"
                  >
                    <option value="all">All Orders</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                {loading ? (
                  <div className="space-y-6">
                    {Array(3).fill().map((_, index) => (
                      <ProductCardSkeleton key={index} />
                    ))}
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <FaShoppingBag className="mx-auto w-16 h-16 text-gray-300" />
                    <p className="text-gray-600 mt-4 text-base">No orders found</p>
                  </div>
                ) : (
                  <div className="space-y-6">{filteredOrders.map(renderOrderCard)}</div>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowOrdersModal(false)}
                  className="mt-8 w-full bg-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-pink-700 transition-all duration-300"
                >
                  Close
                </motion.button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Edit Profile Panel */}
        <AnimatePresence>
          {showEditProfilePanel && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
                onClick={() => setShowEditProfilePanel(false)}
              />
              <motion.div
                variants={slideIn}
                initial="initial"
                animate="animate"
                exit="exit"
                className="fixed top-0 right-0 h-full bg-white p-8 shadow-2xl max-w-md w-full z-40 overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <FaUser className="w-6 h-6 text-pink-600" /> Edit Profile
                  </h2>
                  <button
                    onClick={() => setShowEditProfilePanel(false)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <FaTimes className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <motion.img
                        src={
                          profilePicturePreview instanceof File
                            ? URL.createObjectURL(profilePicturePreview)
                            : profile.profilePicture || agroLogo
                        }
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-2 border-pink-100 shadow-sm"
                        onError={(e) => (e.target.src = agroLogo)}
                        whileHover={{ scale: 1.05 }}
                      />
                      <label
                        htmlFor="profilePicture"
                        className="absolute bottom-0 right-0 bg-pink-600 text-white p-3 rounded-full cursor-pointer hover:bg-pink-700 transition-all duration-200"
                      >
                        <FaCamera className="w-5 h-5" />
                        <input
                          id="profilePicture"
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          className="hidden"
                          disabled={loading}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-600 focus:border-pink-600 outline-none transition-all duration-200"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-600 focus:border-pink-600 outline-none transition-all duration-200"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-600 focus:border-pink-600 outline-none transition-all duration-200"
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700">Addresses</label>
                    {profile.addresses.map((addr, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4 bg-gray-50 p-4 rounded-lg"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="Street"
                            value={addr.street}
                            onChange={(e) => {
                              const newAddresses = [...profile.addresses];
                              newAddresses[index].street = e.target.value;
                              setProfile({ ...profile, addresses: newAddresses });
                            }}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-600 focus:border-pink-600 outline-none transition-all duration-200"
                            disabled={loading}
                          />
                          <input
                            type="text"
                            placeholder="City"
                            value={addr.city}
                            onChange={(e) => {
                              const newAddresses = [...profile.addresses];
                              newAddresses[index].city = e.target.value;
                              setProfile({ ...profile, addresses: newAddresses });
                            }}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-600 focus:border-pink-600 outline-none transition-all duration-200"
                            disabled={loading}
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={addr.state}
                            onChange={(e) => {
                              const newAddresses = [...profile.addresses];
                              newAddresses[index].state = e.target.value;
                              setProfile({ ...profile, addresses: newAddresses });
                            }}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-600 focus:border-pink-600 outline-none transition-all duration-200"
                            disabled={loading}
                          />
                          <input
                            type="text"
                            placeholder="Postal Code"
                            value={addr.postalCode}
                            onChange={(e) => {
                              const newAddresses = [...profile.addresses];
                              newAddresses[index].postalCode = e.target.value;
                              setProfile({ ...profile, addresses: newAddresses });
                            }}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-600 focus:border-pink-600 outline-none transition-all duration-200"
                            disabled={loading}
                          />
                          <input
                            type="text"
                            placeholder="Country"
                            value={addr.country}
                            onChange={(e) => {
                              const newAddresses = [...profile.addresses];
                              newAddresses[index].country = e.target.value;
                              setProfile({ ...profile, addresses: newAddresses });
                            }}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-600 focus:border-pink-600 outline-none transition-all duration-200"
                            disabled={loading}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={addr.isDefault}
                              onChange={(e) => {
                                const newAddresses = profile.addresses.map((a, i) => ({
                                  ...a,
                                  isDefault: i === index ? e.target.checked : false,
                                }));
                                setProfile({ ...profile, addresses: newAddresses });
                              }}
                              className="w-4 h-4 text-pink-600 border-gray-200 rounded focus:ring-pink-600 transition-all duration-200"
                              disabled={loading}
                            />
                            Set as Default
                          </label>
                          {profile.addresses.length > 1 && (
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => removeAddress(index)}
                              className="text-red-600 hover:text-red-700 flex items-center gap-2 text-sm font-medium"
                              disabled={loading}
                            >
                              <FaTrash className="w-4 h-4" /> Remove
                            </motion.button>
                          )}
                        </div>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleAddCurrentLocation(index)}
                          className="text-pink-600 hover:text-pink-700 font-medium flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg transition-all duration-200 w-full"
                          disabled={loading}
                        >
                          <FaMapMarkerAlt className="w-4 h-4" /> Use Current Location
                        </motion.button>
                      </motion.div>
                    ))}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={addNewAddress}
                      className="w-full text-pink-600 hover:text-pink-700 font-medium flex items-center justify-center gap-2 bg-gray-100 px-4 py-2 rounded-lg transition-all duration-200"
                      disabled={loading}
                    >
                      <FaPlus className="w-4 h-4" /> Add New Address
                    </motion.button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Preferences</label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={profile.preferences.notifications}
                        onChange={(e) => setProfile({
                          ...profile,
                          preferences: { ...profile.preferences, notifications: e.target.checked },
                        })}
                        className="w-4 h-4 text-pink-600 border-gray-200 rounded focus:ring-pink-600 transition-all duration-200"
                        disabled={loading}
                      />
                      Receive Notifications
                    </label>
                  </div>
                  <div className="flex gap-4">
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={loading}
                      className={`flex-1 py-3 rounded-lg text-white font-medium transition-all duration-200 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700'}`}
                    >
                      {loading ? 'Saving...' : 'Save Profile'}
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowEditProfilePanel(false)}
                      className="flex-1 py-3 rounded-lg text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default UserDashboard;