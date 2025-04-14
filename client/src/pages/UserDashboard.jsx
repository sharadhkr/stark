import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FaSignOutAlt, FaBox, FaUserEdit, FaCamera, FaTrash, FaPlus, FaMapMarkerAlt, FaFilter } from 'react-icons/fa';
import { isUserLoggedIn, userLogout } from '../utils/authUtils';
import axios from '../useraxios';
import agroLogo from '../assets/logo.png';
import agrotade from '../assets/logoname.png';

// Animation Variants
const dashboardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const sectionVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    profilePicture: '',
    addresses: [],
    preferences: { notifications: true },
  });
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = isUserLoggedIn();
      setIsAuthenticated(loggedIn);
      if (!loggedIn) {
        toast.error('Please log in to access the dashboard.');
        navigate('/login', { replace: true });
      } else {
        await fetchUserData();
      }
    };
    checkAuth();
  }, [navigate]);

  const fetchUserData = useCallback(async (retryCount = 0) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [profileRes, ordersRes] = await Promise.all([
        axios.get('/api/user/auth/profile', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/user/auth/orders', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const user = profileRes.data.user;
      const newProfile = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        profilePicture: user.profilePicture || '',
        addresses: user.addresses || [],
        preferences: user.preferences || { notifications: true },
      };
      setProfile(newProfile);
      setProfilePicturePreview(newProfile.profilePicture || null);
      const fetchedOrders = ordersRes.data.orders || [];
      setOrders(fetchedOrders);
      handleOrderFilter(orderFilter, fetchedOrders);
    } catch (error) {
      if (error.response?.status === 401) {
        if (retryCount < 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return fetchUserData(retryCount + 1);
        }
        userLogout(navigate);
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to load dashboard data.');
      }
    } finally {
      setLoading(false);
    }
  }, [orderFilter]);

  const handleLogout = () => {
    userLogout(navigate);
    toast.success('Logged out successfully!');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!profile.email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      toast.error('Please enter a valid email.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('firstName', profile.firstName);
    formData.append('lastName', profile.lastName);
    formData.append('email', profile.email);
    formData.append('preferences', JSON.stringify(profile.preferences));
    if (profilePicturePreview instanceof File) {
      formData.append('file', profilePicturePreview);
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('/api/user/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setProfile(prev => ({ ...prev, ...res.data.user }));
      setProfilePicturePreview(res.data.user.profilePicture || null);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile.');
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

  const handleAddNewAddress = async () => {
    if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.postalCode) {
      toast.error('Please fill in all address fields.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/user/auth/add-address', newAddress, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(prev => ({
        ...prev,
        addresses: [...prev.addresses, res.data.address],
      }));
      setNewAddress({ street: '', city: '', state: '', postalCode: '', country: 'India' });
      setShowNewAddressForm(false);
      toast.success('Address added successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add address');
    }
  };

  const handleAddCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const apiKey = process.env.REACT_APP_OPENCAGE_API_KEY || 'YOUR_OPENCAGE_API_KEY';
          const res = await axios.get(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`);
          const { components } = res.data.results[0];
          const newAddr = {
            street: components.road || 'Unknown Street',
            city: components.city || components.town || 'Unknown City',
            state: components.state || 'Unknown State',
            postalCode: components.postcode || '000000',
            country: components.country || 'India',
          };
          setNewAddress(newAddr);
          setUseCurrentLocation(false);
          toast.success('Location fetched successfully! Please review and save.');
        } catch (error) {
          toast.error('Failed to fetch location data. Please enter manually.');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        toast.error('Unable to retrieve your location. Please allow location access.');
      }
    );
  };

  const handleRemoveAddress = async (addressId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/user/auth/remove-address/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(prev => ({
        ...prev,
        addresses: prev.addresses.filter(addr => addr._id !== addressId),
      }));
      toast.success('Address removed successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove address');
    }
  };

  const handleOrderFilter = (filter, orderList = orders) => {
    setOrderFilter(filter);
    if (filter === 'all') {
      setFilteredOrders(orderList);
    } else {
      setFilteredOrders(orderList.filter(order => order.status.toLowerCase() === filter));
    }
  };

  const renderOrderItem = (order) => {
    const total = order.total || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return (
      <motion.div
        key={order._id} // Use _id as React key
        whileHover={{ scale: 1.02 }}
        className="p-4 bg-blue-50 rounded-3xl shadow-md flex items-center justify-between hover:shadow-lg transition-shadow duration-300 cursor-pointer"
        onClick={() => navigate(`/order/${order.orderId}`)} // Navigate with orderId
      >
        <div className="flex items-center gap-4">
          <img
            src={agroLogo} // Placeholder since items don’t include images
            alt={order.items[0]?.name || 'Product'}
            className="w-16 h-16 object-cover rounded-md"
            onError={(e) => (e.target.src = agroLogo)}
          />
          <div>
            <p className="text-lg font-semibold text-gray-800">
              {order.items[0]?.name || 'Unknown Product'}
            </p>
            {order?.orderId ? (
              <p className="text-sm text-gray-500">
                Order ID: {order.orderId.slice(0, 15) + "###"}
              </p>
            ) : null}

            <p className="text-sm text-gray-600">Total: ₹{total.toFixed(2)}</p>
            <p className="text-sm text-blue-600 font-medium capitalize">Status: {order.status}</p>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'orders':
        return (
          <motion.div variants={sectionVariants} initial="initial" animate="animate" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="flex p-3 bg-blue-50 rounded-full shadow-inner">
                  <FaBox className="text-lg text-gray-500" />
                </div>
                <span className="opacity-70 text-sm">YOUR ORDERS</span>
              </h2>
              <div className="flex items-center gap-3">
                <FaFilter className="text-gray-500" />
                <select
                  value={orderFilter}
                  onChange={(e) => handleOrderFilter(e.target.value)}
                  className="bg-blue-50 rounded-xl px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-blue-50 rounded-3xl animate-pulse" />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <p className="text-gray-600 text-center py-10">No orders found.</p>
            ) : (
              <div className="space-y-4">{filteredOrders.map(renderOrderItem)}</div>
            )}
          </motion.div>
        );
      case 'profile':
        return (
          <motion.div variants={sectionVariants} initial="initial" animate="animate" className="space-y-6">
            <form onSubmit={handleProfileUpdate} className="space-y-6 bg-blue-50 p-6 rounded-3xl shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-4">
                <div className="flex items-center justify-center p-2 bg-blue-100 rounded-full shadow-inner">
                  <FaUserEdit />
                </div>
                <span className="opacity-70">EDIT PROFILE</span>
              </h2>
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <img
                    src={
                      profilePicturePreview instanceof File
                        ? URL.createObjectURL(profilePicturePreview)
                        : profile.profilePicture || agroLogo
                    }
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover shadow-md"
                  />
                  <label
                    htmlFor="profilePictureInput"
                    className="absolute bottom-2 right-2 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors duration-200 shadow-sm"
                  >
                    <FaCamera />
                    <input
                      id="profilePictureInput"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400 transition-all duration-200"
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
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                  disabled={loading}
                  required
                />
              </div>
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Your Addresses</h4>
                {profile.addresses.length > 0 ? (
                  <ul className="space-y-3">
                    {profile.addresses.map((addr) => (
                      <li
                        key={addr._id}
                        className="p-4 bg-white rounded-3xl flex justify-between items-center shadow-md hover:bg-gray-50 transition-colors duration-200"
                      >
                        <p className="text-gray-700 text-sm">{`${addr.street}, ${addr.city}, ${addr.state}, ${addr.postalCode}, ${addr.country}`}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAddress(addr._id);
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors duration-200"
                        >
                          <FaTrash size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 text-center py-4">No addresses found.</p>
                )}
                <div className="mt-6 flex flex-col items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewAddressForm(!showNewAddressForm);
                      setUseCurrentLocation(false);
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl shadow-md transition-colors duration-200"
                  >
                    <FaPlus /> {showNewAddressForm && !useCurrentLocation ? 'Cancel' : 'Add Manual Address'}
                  </button>
                  <div className="flex items-center gap-2 w-full justify-center">
                    <span className="w-[20%] h-[1px] bg-gray-400"></span>
                    <span className="text-gray-500 text-sm">Or</span>
                    <span className="w-[20%] h-[1px] bg-gray-400"></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewAddressForm(true);
                      setUseCurrentLocation(true);
                      handleAddCurrentLocation();
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl shadow-md transition-colors duration-200"
                  >
                    <FaMapMarkerAlt /> Use Current Location
                  </button>
                </div>
                {showNewAddressForm && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl shadow-md">
                    <input
                      type="text"
                      placeholder="Street"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                      disabled={useCurrentLocation && loading}
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                      disabled={useCurrentLocation && loading}
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                      disabled={useCurrentLocation && loading}
                    />
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={newAddress.postalCode}
                      onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                      disabled={useCurrentLocation && loading}
                    />
                    <button
                      type="button"
                      onClick={handleAddNewAddress}
                      className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-colors duration-200 shadow-sm col-span-full"
                      disabled={loading}
                    >
                      {loading && useCurrentLocation ? 'Fetching...' : 'Save Address'}
                    </button>
                  </div>
                )}
              </div>
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Preferences</h4>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={profile.preferences.notifications}
                    onChange={(e) => setProfile({
                      ...profile,
                      preferences: { ...profile.preferences, notifications: e.target.checked },
                    })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={loading}
                  />
                  Receive Notifications
                </label>
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl text-white font-medium transition-all duration-200 shadow-md ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  }`}
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </motion.div>
        );
      default:
        return null;
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 px-4 pt-5 pb-10">
      <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
      <motion.header
        variants={dashboardVariants}
        initial="initial"
        animate="animate"
        className="w-full max-w-7xl mx-auto flex items-center justify-between pt-5 px-4 sm:px-6"
      >
        <div className="flex items-center gap-3">
          <img
            className="w-14 h-14 object-contain shadow-md hover:scale-110 transition-transform duration-300"
            src={agroLogo}
            alt="AgroTrade Logo"
            onError={(e) => (e.target.style.display = 'none')}
          />
          <div className="hover:scale-110 transition-transform duration-300">
            <img className="w-[80%]" src={agrotade} alt="AgroTrade" />
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 shadow-md bg-blue-50 px-4 py-2 rounded-xl"
        >
          <FaSignOutAlt /> Logout
        </button>
      </motion.header>

      <main className="max-w-7xl mx-auto py-4 px-4 sm:px-6">
        <motion.div
          variants={dashboardVariants}
          initial="initial"
          animate="animate"
          className="bg-blue-50 rounded-3xl shadow-lg mb-6 px-3 py-2 flex justify-center gap-4"
        >
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${activeTab === 'orders' ? 'bg-blue-500 text-white shadow-md' : 'text-blue-600 hover:bg-blue-100'
              }`}
          >
            <FaBox /> Orders
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${activeTab === 'profile' ? 'bg-blue-500 text-white shadow-md' : 'text-blue-600 hover:bg-blue-100'
              }`}
          >
            <FaUserEdit /> Profile
          </button>
        </motion.div>

        <div className="min-h-[400px]">{renderTabContent()}</div>
      </main>
    </div>
  );
};

export default UserDashboard;