import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../axios';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner, FaInfoCircle, FaSignOutAlt, FaUpload, FaEdit, FaTrash, FaLock, FaRedo } from 'react-icons/fa';
import sellerLogo from '../assets/logo.png';
import { isSellerLoggedIn, sellerLogout } from '../utils/authUtils';

// Animation variants
const formVariants = {
  initial: { opacity: 0, y: 30, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
  exit: { opacity: 0, y: -30, scale: 0.95, transition: { duration: 0.4 } },
};

// Skeleton Loader Component
const ProductSkeleton = () => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 bg-gray-200 rounded-md"></div>
      <div className="space-y-2">
        <div className="h-5 w-32 bg-gray-200 rounded"></div>
        <div className="h-4 w-48 bg-gray-200 rounded"></div>
        <div className="h-4 w-40 bg-gray-200 rounded"></div>
      </div>
    </div>
    <div className="flex gap-2">
      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
    </div>
  </div>
);

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [productData, setProductData] = useState({
    name: '',
    category: '', // Will store the category ID
    quantity: '',
    price: '',
    description: '',
    image: null,
  });
  const [categories, setCategories] = useState([]); // Store the fetched categories
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [sellerStatus, setSellerStatus] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/seller/auth/categories');
        console.log('Fetched Categories:', res.data.categories);
        setCategories(res.data.categories || []);
        // Set the default category to the first one (if available)
        if (res.data.categories.length > 0 && !editProduct) {
          setProductData((prev) => ({ ...prev, category: res.data.categories[0]._id }));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to fetch categories: ' + (error.response?.data?.message || error.message));
      }
    };

    fetchCategories();
  }, [editProduct]);

  // Check authentication and fetch seller status on mount
  useEffect(() => {
    const checkAuthAndStatus = async () => {
      const token = localStorage.getItem('sellerToken');
      const loggedIn = isSellerLoggedIn();
      setIsAuthenticated(loggedIn);

      if (!loggedIn) {
        toast.error('You are not authenticated. Please log in.');
        return;
      }

      try {
        const res = await axios.get('/api/seller/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSellerStatus(res.data.seller.status);
        if (res.data.seller.status === 'enabled') {
          fetchProducts();
        }
      } catch (error) {
        console.error('Error fetching seller status:', error);
        toast.error('Failed to verify seller status: ' + (error.response?.data?.message || error.message));
        setSellerStatus('unknown');
      }
    };

    const timer = setTimeout(checkAuthAndStatus, 100);
    return () => clearTimeout(timer);
  }, []);

  // Fetch seller's products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const token = localStorage.getItem('sellerToken');
    try {
      const res = await axios.get('/api/seller/auth/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched Products:', res.data.products);
      setProducts(res.data.products || []);
    } catch (error) {
      console.error('fetchProducts - Error:', error);
      setFetchError(error.response?.data?.message || 'Failed to fetch products');
      if (error.response?.status === 401 || error.response?.status === 403) {
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Validate product form fields
  const validateProduct = useCallback((data = productData) => {
    const newErrors = {};
    if (!data.name.trim()) newErrors.name = 'Product name is required';
    if (!data.category) newErrors.category = 'Product category is required';
    if (!data.quantity || isNaN(data.quantity) || Number(data.quantity) <= 0) newErrors.quantity = 'Enter a valid quantity';
    if (!data.price || isNaN(data.price) || Number(data.price) <= 0) newErrors.price = 'Enter a valid price';
    if (!editProduct && !data.image) newErrors.image = 'Product image is required';
    return newErrors;
  }, [productData, editProduct]);

  // Handle product input change
  const handleProductChange = useCallback((e) => {
    const { name, value } = e.target;
    const newData = {
      ...(editProduct ? editProduct : productData),
      [name]: name === 'quantity' || name === 'price' ? value.replace(/[^0-9.]/g, '') : value,
    };
    setEditProduct(editProduct ? newData : null);
    setProductData(editProduct ? productData : newData);
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }, [editProduct, productData]);

  // Handle image upload
  const handleImageUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match(/image\/(jpeg|png|jpg)/)) {
        setErrors((prev) => ({ ...prev, image: 'Only JPEG, PNG, and JPG files are allowed' }));
        setImagePreview(null);
        setProductData((prev) => ({ ...prev, image: null }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: 'Image size must be less than 5MB' }));
        setImagePreview(null);
        setProductData((prev) => ({ ...prev, image: null }));
        return;
      }
      setProductData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, image: '' }));
    }
  }, []);

  // Handle product creation or update
  const handleSubmitProduct = useCallback(
    async (e) => {
      e.preventDefault();
      if (!isAuthenticated) {
        toast.error('Unauthorized. Please log in.');
        return;
      }
      if (sellerStatus !== 'enabled') {
        toast.error('Your account is disabled. Contact admin.');
        return;
      }

      const data = editProduct || productData;
      const newErrors = validateProduct(data);
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        Object.values(newErrors).forEach((error) => toast.error(error));
        return;
      }

      setLoading(true);
      const loadingToast = toast.loading(editProduct ? 'Updating...' : 'Creating...');
      const token = localStorage.getItem('sellerToken');

      try {
        if (!token) throw new Error('No authentication token found.');

        const formData = new FormData();
        formData.append('name', data.name.trim());
        formData.append('category', data.category); // Send the category ID
        formData.append('quantity', Number(data.quantity));
        formData.append('price', Number(data.price));
        formData.append('description', data.description.trim() || '');
        if (data.image && !editProduct) {
          formData.append('image', data.image);
        }

        console.log('Submitting FormData:');
        for (let pair of formData.entries()) {
          console.log(`${pair[0]}: ${pair[1]}`);
        }

        const url = editProduct ? `/api/seller/auth/products/${editProduct._id}` : '/api/seller/auth/products/create';
        const method = editProduct ? 'put' : 'post';

        console.log(`Making ${method.toUpperCase()} request to: ${url}`);
        console.log('Authorization Token:', token);

        const res = await axios[method](url, editProduct ? data : formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            ...(editProduct ? { 'Content-Type': 'application/json' } : { 'Content-Type': 'multipart/form-data' }),
          },
        });

        console.log('API Response:', res.data);

        if (res.data.success) {
          toast.dismiss(loadingToast);
          toast.success(res.data.message || (editProduct ? 'Updated!' : 'Created!'));
          setProductData({
            name: '',
            category: categories.length > 0 ? categories[0]._id : '', // Reset to the first category
            quantity: '',
            price: '',
            description: '',
            image: null,
          });
          setEditProduct(null);
          setImagePreview(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          fetchProducts();
        } else {
          throw new Error(res.data.message || 'Failed to create/update product');
        }
      } catch (error) {
        console.error('Error in handleSubmitProduct:', error);
        console.log('Error Response:', error.response?.data);
        console.log('Error Status:', error.response?.status);
        console.log('Error Headers:', error.response?.headers);
        toast.dismiss(loadingToast);
        const errorMessage = error.response?.data?.message || error.message || 'Network error';
        toast.error(errorMessage);
        if (error.response?.status === 401 || error.response?.status === 403) {
          setIsAuthenticated(false);
        }
      } finally {
        setLoading(false);
      }
    },
    [editProduct, productData, fetchProducts, isAuthenticated, sellerStatus, categories]
  );

  // Handle edit product
  const handleEditProduct = (product) => {
    if (!isAuthenticated) {
      toast.error('Unauthorized. Please log in.');
      return;
    }
    if (sellerStatus !== 'enabled') {
      toast.error('Your account is disabled. Contact admin.');
      return;
    }
    setEditProduct(product);
    setImagePreview(product.image?.[0] || null);
  };

  // Handle delete product
  const handleDeleteProduct = useCallback(
    async (id) => {
      if (!isAuthenticated) {
        toast.error('Unauthorized. Please log in.');
        return;
      }
      if (sellerStatus !== 'enabled') {
        toast.error('Your account is disabled. Contact admin.');
        return;
      }
      if (!window.confirm('Are you sure you want to delete this product?')) return;

      setLoading(true);
      const loadingToast = toast.loading('Deleting...');
      const token = localStorage.getItem('sellerToken');

      try {
        await axios.delete(`/api/seller/auth/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        toast.dismiss(loadingToast);
        toast.success('Deleted!');
        fetchProducts();
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error(error.response?.data?.message || 'Failed to delete');
        if (error.response?.status === 401 || error.response?.status === 403) {
          setIsAuthenticated(false);
        }
      } finally {
        setLoading(false);
      }
    },
    [fetchProducts, isAuthenticated, sellerStatus]
  );

  // Handle logout
  const handleLogout = useCallback(() => {
    sellerLogout(navigate);
    toast.success('Logged out!');
  }, [navigate]);

  // Trigger file input click
  const handleUploadClick = () => {
    if (!isAuthenticated) {
      toast.error('Unauthorized. Please log in.');
      return;
    }
    if (sellerStatus !== 'enabled') {
      toast.error('Your account is disabled. Contact admin.');
      return;
    }
    fileInputRef.current.click();
  };

  // Render loading state while checking authentication
  if (isAuthenticated === null || sellerStatus === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-100 to-lime-50">
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="text-teal-600"
        >
          <FaSpinner className="text-4xl" />
        </motion.div>
        <p className="ml-4 text-gray-600">Checking authentication...</p>
      </div>
    );
  }

  // Render unauthorized state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-100 to-lime-50 flex items-center justify-center px-4">
        <Toaster position="top-right" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <FaLock className="text-red-500 text-5xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Unauthorized</h1>
          <p className="text-gray-600 mb-6">You are not logged in. Please log in to access the seller dashboard.</p>
          <button
            onClick={() => navigate('/seller/login')}
            className="flex items-center gap-2 mx-auto px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200"
          >
            <FaSignOutAlt /> Login
          </button>
        </motion.div>
      </div>
    );
  }

  // Render disabled state
  if (sellerStatus === 'disabled') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-100 to-lime-50 flex items-center justify-center px-4">
        <Toaster position="top-right" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <FaLock className="text-red-500 text-5xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Account Disabled</h1>
          <p className="text-gray-600 mb-6">Your seller account is disabled. Contact the admin to get authorized.</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 mx-auto px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200"
          >
            <FaSignOutAlt /> Logout
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-100 to-lime-50 px-4 py-10 sm:px-6 md:px-8 lg:px-12">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#f3f4f6',
            color: '#10b981',
            borderRadius: '12px',
            padding: '6px 12px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            fontSize: '13px',
            fontWeight: '500',
          },
          error: { style: { color: '#ef4444' } },
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10 border border-teal-200 overflow-hidden"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex justify-center mb-6"
        >
          <img
            src={sellerLogo}
            alt="AgroTrade Logo"
            className="h-20 w-20 object-contain drop-shadow-md"
            onError={(e) => (e.target.style.display = 'none')}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center mb-4"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-teal-700 tracking-wide">AgroTrade</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Seller Dashboard</p>
        </motion.div>
        <div className="flex justify-end mb-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-teal-600 font-medium py-2 px-4 rounded-lg hover:bg-teal-100 transition-all duration-200"
            aria-label="Logout"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>

        {/* Product Creation/Update Form */}
        <motion.div
          variants={formVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="space-y-6 mb-8"
        >
          <h2 className="text-2xl font-semibold text-teal-600">
            {editProduct ? 'Update Product' : 'Create Product'}
          </h2>
          <form onSubmit={handleSubmitProduct} className="space-y-6" noValidate>
            <div className="grid gap-2">
              <label htmlFor="productName" className="flex items-center text-sm font-medium text-gray-700">
                Product Name <FaInfoCircle className="ml-1 text-gray-400 hover:text-gray-600 cursor-help" title="Enter the name of the product" />
              </label>
              <input
                id="productName"
                type="text"
                name="name"
                value={editProduct ? editProduct.name : productData.name}
                onChange={handleProductChange}
                placeholder="e.g., Wheat Seeds"
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 focus:outline-none transition-all duration-200 ${
                  errors.name ? 'border-red-500' : ''
                }`}
                required
                aria-label="Product name"
                disabled={loading}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div className="grid gap-2">
              <label htmlFor="productCategory" className="flex items-center text-sm font-medium text-gray-700">
                Product Category <FaInfoCircle className="ml-1 text-gray-400 hover:text-gray-600 cursor-help" title="Select the category of the product" />
              </label>
              <select
                id="productCategory"
                name="category"
                value={editProduct ? editProduct.category?._id || '' : productData.category}
                onChange={handleProductChange}
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 focus:outline-none transition-all duration-200 ${
                  errors.category ? 'border-red-500' : ''
                }`}
                aria-label="Product category"
                disabled={loading || categories.length === 0}
              >
                {categories.length === 0 ? (
                  <option value="">No categories available</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))
                )}
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>
            <div className="grid gap-2">
              <label htmlFor="quantity" className="flex items-center text-sm font-medium text-gray-700">
                Quantity <FaInfoCircle className="ml-1 text-gray-400 hover:text-gray-600 cursor-help" title="Enter the quantity" />
              </label>
              <input
                id="quantity"
                type="number"
                name="quantity"
                value={editProduct ? editProduct.quantity : productData.quantity}
                onChange={handleProductChange}
                placeholder="e.g., 100"
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 focus:outline-none transition-all duration-200 ${
                  errors.quantity ? 'border-red-500' : ''
                }`}
                required
                aria-label="Product quantity"
                disabled={loading}
              />
              {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
            </div>
            <div className="grid gap-2">
              <label htmlFor="price" className="flex items-center text-sm font-medium text-gray-700">
                Price (per unit) <FaInfoCircle className="ml-1 text-gray-400 hover:text-gray-600 cursor-help" title="Enter the price per unit" />
              </label>
              <input
                id="price"
                type="number"
                name="price"
                value={editProduct ? editProduct.price : productData.price}
                onChange={handleProductChange}
                placeholder="e.g., 50"
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 focus:outline-none transition-all duration-200 ${
                  errors.price ? 'border-red-500' : ''
                }`}
                required
                aria-label="Product price"
                disabled={loading}
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>
            <div className="grid gap-2">
              <label htmlFor="description" className="flex items-center text-sm font-medium text-gray-700">
                Description (Optional) <FaInfoCircle className="ml-1 text-gray-400 hover:text-gray-600 cursor-help" title="Provide a brief description" />
              </label>
              <textarea
                id="description"
                name="description"
                value={editProduct ? editProduct.description : productData.description}
                onChange={handleProductChange}
                placeholder="e.g., High-quality wheat seeds"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 focus:outline-none transition-all duration-200"
                rows="3"
                aria-label="Product description"
                disabled={loading}
              />
            </div>
            {!editProduct && (
              <div className="grid gap-2">
                <label htmlFor="image" className="flex items-center text-sm font-medium text-gray-700">
                  Product Image <FaInfoCircle className="ml-1 text-gray-400 hover:text-gray-600 cursor-help" title="Upload an image (max 5MB, JPEG/PNG/JPG)" />
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    <FaUpload /> Upload Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="image"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={loading}
                  />
                  <AnimatePresence>
                    {imagePreview && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                      >
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-16 h-16 object-cover rounded-md border-2 border-gray-200 shadow-sm"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
              </div>
            )}
            <motion.button
              type="submit"
              disabled={loading || categories.length === 0}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex justify-center items-center gap-2 py-3 rounded-xl text-white font-medium transition-all duration-200 bg-teal-500 hover:bg-teal-600 shadow-md focus:ring-2 focus:ring-teal-400 focus:outline-none disabled:bg-gray-300 disabled:cursor-not-allowed ${
                loading ? 'animate-pulse' : ''
              }`}
              aria-label={editProduct ? 'Update Product' : 'Create Product'}
            >
              {loading && <FaSpinner className="animate-spin" />}
              {loading ? (editProduct ? 'Updating...' : 'Creating...') : (editProduct ? 'Update Product' : 'Create Product')}
            </motion.button>
            {editProduct && (
              <motion.button
                type="button"
                onClick={() => {
                  setEditProduct(null);
                  setImagePreview(null);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl text-teal-600 font-medium transition-all duration-200 hover:bg-teal-100 focus:outline-none"
                aria-label="Cancel Edit"
              >
                Cancel Edit
              </motion.button>
            )}
          </form>
        </motion.div>

        {/* Product List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-teal-600">Your Products</h2>
          {loading && !products.length ? (
            <div className="space-y-4">
              {Array(3)
                .fill()
                .map((_, index) => (
                  <ProductSkeleton key={index} />
                ))}
            </div>
          ) : fetchError ? (
            <div className="text-center">
              <p className="text-red-500 mb-4">{fetchError}</p>
              <motion.button
                onClick={fetchProducts}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200"
              >
                <FaRedo /> Retry
              </motion.button>
            </div>
          ) : products.length === 0 ? (
            <p className="text-gray-600">No products found. Create one above!</p>
          ) : (
            <div className="grid gap-4">
              {products.map((product) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center gap-4">
                    {product.image?.length > 0 ? (
                      <img
                        src={product.image[0]}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-md border border-gray-200"
                        onError={(e) => (e.target.src = 'https://via.placeholder.com/64')}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                        No Image
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-medium text-gray-800">{product.name}</h3>
                      <p className="text-sm text-gray-600">
                        Category: {product.category?.name || 'Unknown'} | Quantity: {product.quantity} | Price: ${product.price}
                      </p>
                      <p className="text-sm text-gray-600">{product.description || 'No description'}</p>
                      <p className="text-sm text-gray-500">Status: {product.status || 'pending'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => handleEditProduct(product)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-teal-600 hover:bg-teal-100 rounded-full transition-colors duration-200"
                      aria-label="Edit Product"
                    >
                      <FaEdit />
                    </motion.button>
                    <motion.button
                      onClick={() => handleDeleteProduct(product._id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200"
                      aria-label="Delete Product"
                    >
                      <FaTrash />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SellerDashboard;