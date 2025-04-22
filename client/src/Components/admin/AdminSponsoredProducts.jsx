import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from '../axios';
import { FaSearch, FaTimes, FaStar, FaSpinner, FaSort } from 'react-icons/fa';
import useAdminAuth from '../../hooks/useAdminAuth';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const AdminSponsoredProducts = ({ products = [], loading: parentLoading }) => {
  const { isAdmin, error: authError, checkAdmin } = useAdminAuth();
  const [sponsoredProducts, setSponsoredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const searchInputRef = useRef(null);

  // Fetch sponsored products
  const fetchSponsoredProducts = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      console.log('Fetching sponsored products...');
      const response = await axios.get('/api/admin/auth/sponsored', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Sponsored products response:', response.data);
      setSponsoredProducts(response.data.products || []);
    } catch (error) {
      console.error('Fetch Sponsored Products Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(error.response?.data?.message || 'Failed to load sponsored products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchSponsoredProducts();
    }
  }, [isAdmin]);

  // Filter products for dropdown (exclude already sponsored)
  const filteredProducts = products
    .filter(
      (product) =>
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !sponsoredProducts.some((sp) => sp.productId?._id === product._id)
    )
    .slice(0, 10); // Limit to 10 suggestions

  // Handle adding a product to sponsored list
  const handleAddSponsoredProduct = async () => {
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      console.log(`Adding sponsored product: ${selectedProductId}`);
      await axios.post(
        '/api/admin/auth/sponsored',
        { productId: selectedProductId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Product added to sponsored list');
      setSearchQuery('');
      setSelectedProductId('');
      await fetchSponsoredProducts();
      searchInputRef.current?.focus();
    } catch (error) {
      console.error('Add Sponsored Product Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(error.response?.data?.message || 'Failed to add sponsored product');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle removing a product from sponsored list
  const handleRemoveSponsoredProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to remove "${productName || 'this product'}" from sponsored products?`))
      return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      console.log(`Removing sponsored product: ${productId}`);
      await axios.delete(`/api/admin/auth/sponsored/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Product removed from sponsored list');
      await fetchSponsoredProducts();
    } catch (error) {
      console.error('Remove Sponsored Product Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(error.response?.data?.message || 'Failed to remove sponsored product');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig((prev) => {
      const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
      return { key, direction };
    });
  };

  const sortedProducts = [...sponsoredProducts].sort((a, b) => {
    const aValue = sortConfig.key === 'name' ? a.productId?.name || '' : a.productId?.discountedPrice || a.productId?.price || 0;
    const bValue = sortConfig.key === 'name' ? b.productId?.name || '' : b.productId?.discountedPrice || b.productId?.price || 0;
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Validate props
  if (!Array.isArray(products)) {
    console.error('Invalid products prop:', products);
    return (
      <div className="text-red-600 p-6 bg-red-50 rounded-2xl shadow-md">
        Error: Invalid products data. Please try refreshing the page.
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
        <h3 className="text-lg font-semibold text-red-700">Unable to Access Sponsored Products</h3>
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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="bg-white p-6 rounded-2xl shadow-lg"
    >
      <h3 className="text-xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
        <FaStar className="text-yellow-500" /> Manage Sponsored Products
      </h3>

      {/* Add Product Form */}
      <div className="mb-8">
        <h4 className="text-lg font-medium text-gray-600 mb-4">Add Sponsored Product</h4>
        <div className="relative mb-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedProductId('');
                }}
                placeholder="Search products to sponsor..."
                className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all duration-200"
                disabled={isLoading}
                aria-label="Search products to sponsor"
              />
              {searchQuery && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedProductId('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                  aria-label="Clear search"
                  title="Clear"
                >
                  <FaTimes size={16} />
                </motion.button>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handleAddSponsoredProduct}
              disabled={isLoading || !selectedProductId}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm ${
                isLoading || !selectedProductId
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } transition-all duration-200 shadow-sm`}
              aria-label="Add selected product to sponsored list"
              title="Add to Sponsored"
            >
              {isLoading ? <FaSpinner className="animate-spin" /> : 'Add'}
            </motion.button>
          </div>
          {searchQuery && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <motion.div
                    key={product._id}
                    whileHover={{ backgroundColor: '#EFF6FF' }}
                    onClick={() => {
                      setSelectedProductId(product._id);
                      setSearchQuery(product.name);
                    }}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700"
                    role="option"
                    aria-selected={selectedProductId === product._id}
                  >
                    {product.name}
                  </motion.div>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500 text-sm">No matching products found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sponsored Products List */}
      <div>
        <h4 className="text-lg font-medium text-gray-600 mb-4">Current Sponsored Products</h4>
        {sponsoredProducts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No sponsored products added.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-blue-50">
                  <th className="p-3 text-sm font-semibold text-gray-700">Image</th>
                  <th className="p-3 text-sm font-semibold text-gray-700">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 hover:text-blue-600"
                      aria-label="Sort by name"
                    >
                      Name <FaSort />
                    </button>
                  </th>
                  <th className="p-3 text-sm font-semibold text-gray-700">
                    <button
                      onClick={() => handleSort('price')}
                      className="flex items-center gap-1 hover:text-blue-600"
                      aria-label="Sort by price"
                    >
                      Price <FaSort />
                    </button>
                  </th>
                  <th className="p-3 text-sm font-semibold text-gray-700">Added At</th>
                  <th className="p-3 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((sp) => {
                  if (!sp.productId) {
                    console.warn('Invalid sponsored product:', sp);
                    return null;
                  }
                  return (
                    <tr key={sp._id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <img
                          src={sp.productId?.images?.[0]?.url || 'https://via.placeholder.com/50'}
                          alt={sp.productId?.name || 'Product'}
                          className="w-12 h-12 object-cover rounded border border-gray-200"
                        />
                      </td>
                      <td className="p-3 text-sm text-gray-700">{sp.productId?.name || 'Unknown'}</td>
                      <td className="p-3 text-sm text-gray-700">
                        ₹{(sp.productId?.discountedPrice || sp.productId?.price || 0).toFixed(2)}
                      </td>
                      <td className="p-3 text-sm text-gray-700">
                        {sp.addedAt ? new Date(sp.addedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          onClick={() => handleRemoveSponsoredProduct(sp.productId._id, sp.productId.name)}
                          disabled={isLoading}
                          className={`px-3 py-1 rounded-xl flex items-center gap-2 text-sm ${
                            isLoading
                              ? 'bg-gray-300 cursor-not-allowed'
                              : 'bg-red-500 text-white hover:bg-red-600'
                          } transition-all duration-200 shadow-sm`}
                          aria-label={`Remove ${sp.productId?.name || 'product'} from sponsored list`}
                          title="Remove from Sponsored"
                        >
                          <FaTimes /> Remove
                        </motion.button>
                      </td>
                    </tr>
                  );
                }).filter(Boolean)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminSponsoredProducts;