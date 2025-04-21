import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import axios from '../axios';
import AdminNavBar from '../Components/admin/AdminNavBar';
import AdminOverview from '../Components/admin/AdminOverview';
import AdminSellers from '../Components/admin/AdminSellers';
import AdminProducts from '../Components/admin/AdminProducts';
import AdminOrders from '../Components/admin/AdminOrders';
import AdminUsers from '../Components/admin/AdminUsers';
import AdminCategories from '../Components/admin/AdminCategories';
import AdminAds from '../Components/admin/AdminAds';
import AdminComboOffer from '../Components/admin/AdminComboOffer'; // Fixed incorrect import
import AdminSponsoredProducts from '../Components/admin/AdminSponsoredProducts';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught in boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center p-6 bg-red-50 rounded-2xl shadow-md">
          <h3 className="text-lg font-semibold text-red-700">Something went wrong</h3>
          <p className="text-sm text-red-600">{this.state.error?.message || 'Unknown error'}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [comboOffers, setComboOffers] = useState([]);
  const [ads, setAds] = useState({
    singleadd: { images: [] },
    doubleadd: { images: [] },
    tripleadd: { images: [] },
  });
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      if (!isMounted) return;
      setLoading(true);
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          throw new Error('No admin token found. Please log in.');
        }

        // Verify token first
        const verifyRes = await axios.get('/api/admin/auth/verify-token');
        if (verifyRes.data.admin?.role !== 'admin') {
          throw new Error('Admin access required');
        }

        const [
          sellersRes,
          productsRes,
          ordersRes,
          usersRes,
          categoriesRes,
          comboOffersRes,
          adsRes,
        ] = await Promise.all([
          axios.get('/api/admin/auth/sellers'),
          axios.get('/api/admin/auth/products'),
          axios.get('/api/admin/auth/orders'),
          axios.get('/api/admin/auth/users'),
          axios.get('/api/categories'),
          axios.get('/api/admin/auth/combo-offers'),
          axios.get('/api/admin/auth/ads'),
        ]);

        // Normalize ads data
        const normalizeImages = (images) => {
          if (!Array.isArray(images)) return [];
          return images
            .map((img) => {
              if (!img) return null;
              if (typeof img === 'string') {
                return { url: img.replace(/^http:/, 'https:'), disabled: false };
              }
              if (typeof img === 'object' && img.url) {
                return { url: img.url.replace(/^http:/, 'https:'), disabled: !!img.disabled };
              }
              if (typeof img === 'object') {
                const url = Object.keys(img)
                  .filter((key) => !['disabled', '_id'].includes(key))
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map((key) => img[key])
                  .join('');
                if (url) {
                  return { url: url.replace(/^http:/, 'https:'), disabled: !!img.disabled };
                }
              }
              console.warn('Invalid image data in normalizeImages:', img);
              return null;
            })
            .filter((img) => img && img.url);
        };

        if (isMounted) {
          setAds({
            singleadd: { images: normalizeImages(adsRes.data.singleadd?.images) },
            doubleadd: { images: normalizeImages(adsRes.data.doubleadd?.images) },
            tripleadd: { images: normalizeImages(adsRes.data.tripleadd?.images) },
          });
          setSellers(sellersRes.data.sellers || []);
          setProducts(productsRes.data.products || []);
          setOrders(ordersRes.data.orders || []);
          setUsers(usersRes.data.users || []);
          setCategories(categoriesRes.data.categories || []);
          setComboOffers(comboOffersRes.data.comboOffers || []);
        }
      } catch (error) {
        console.error('Dashboard fetch error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          stack: error.stack,
        });
        if (isMounted) {
          toast.error(error.response?.data?.message || error.message || 'Failed to load dashboard data');
          if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('adminToken');
            navigate('/admin/login');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 font-inter">
      <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
      <AdminNavBar activeSection={activeSection} setActiveSection={setActiveSection} handleLogout={handleLogout} />
      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-blue-50 flex items-center justify-center p-4 sm:p-6 rounded-2xl shadow-lg mb-6"
        >
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700">
            {activeSection === 'combo-offers'
              ? 'Combo Offers'
              : activeSection === 'sponsored-products'
              ? 'Sponsored Products'
              : activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
          </h2>
        </motion.div>
        <ErrorBoundary>
          {activeSection === 'overview' && (
            <AdminOverview
              sellers={sellers}
              products={products}
              orders={orders}
              users={users}
              categories={categories}
              setActiveSection={setActiveSection}
              loading={loading}
            />
          )}
          {activeSection === 'sellers' && (
            <AdminSellers
              sellers={sellers}
              setSellers={setSellers}
              setActiveSection={setActiveSection}
              loading={loading}
            />
          )}
          {activeSection === 'products' && (
            <AdminProducts products={products} setProducts={setProducts} categories={categories} loading={loading} />
          )}
          {activeSection === 'orders' && (
            <AdminOrders orders={orders} setOrders={setOrders} loading={loading} />
          )}
          {activeSection === 'users' && (
            <AdminUsers users={users} setUsers={setUsers} loading={loading} />
          )}
          {activeSection === 'categories' && (
            <AdminCategories categories={categories} setCategories={setCategories} loading={loading} />
          )}
          {activeSection === 'ads' && (
            <AdminAds ads={ads} setAds={setAds} loading={loading} />
          )}
          {activeSection === 'combo-offers' && (
            <AdminComboOffer
              comboOffers={comboOffers}
              setComboOffers={setComboOffers}
              products={products}
              setProducts={setProducts}
              loading={loading}
            />
          )}
          {activeSection === 'sponsored-products' && (
            <AdminSponsoredProducts products={products} loading={loading} />
          )}
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default AdminDashboard;