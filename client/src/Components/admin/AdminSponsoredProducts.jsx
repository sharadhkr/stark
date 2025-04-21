import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from '../axios';
import { FaSearch, FaTimes, FaStar } from 'react-icons/fa';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const AdminSponsoredProducts = ({ products = [], loading }) => {
  const [sponsoredProducts, setSponsoredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch sponsored products
  const fetchSponsoredProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/admin/auth/sponsored');
      setSponsoredProducts(response.data.products || []);
    } catch (error) {
      console.error('Fetch Sponsored Products Error:', error);
      setError(error.response?.data?.message || 'Failed to load sponsored products');
      toast.error(error.response?.data?.message || 'Failed to load sponsored products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSponsoredProducts();
  }, []);

  // Filter products for dropdown (exclude already sponsored)
  const filteredProducts = products
    .filter((product) => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !sponsoredProducts.some((sp) => sp.productId?._id === product._id)
    )
    .slice(0, 10); // Limit to 10 suggestions for performance

  // Add a product to sponsored list
  const handleAddSponsoredProduct = async () => {
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('/api/admin/auth/sponsored', { productId: selectedProductId });
      toast.success('Product added to sponsored list');
      setSearchQuery('');
      setSelectedProductId('');
      await fetchSponsoredProducts(); // Refresh list
    } catch (error) {
      console.error('Add Sponsored Product Error:', error);
      toast.error(error.response?.data?.message || 'Failed to add sponsored product');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove a product from sponsored list
  const handleRemoveSponsoredProduct = async (productId) => {
    setIsLoading(true);
    try {
      await axios.delete(`/api/admin/auth/sponsored/${productId}`);
      toast.success('Product removed from sponsored list');
      await fetchSponsoredProducts(); // Refresh list
    } catch (error) {
      console.error('Remove Sponsored Product Error:', error);
      toast.error(error.response?.data?.message || 'Failed to remove sponsored product');
    } finally {
      setIsLoading(false);
    }
  };

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
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products to sponsor..."
            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <FaSearch className="absolute right-3 top-3 text-gray-400" />
          {searchQuery && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    onClick={() => {
                      setSelectedProductId(product._id);
                      setSearchQuery(product.name);
                    }}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                  >
                    {product.name}
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500">No matching products found</div>
              )}
            </div>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={handleAddSponsoredProduct}
          disabled={isLoading || !selectedProductId}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 ${
            isLoading || !selectedProductId
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
          ) : (
            'Add to Sponsored'
          )}
        </motion.button>
      </div>

      {/* Sponsored Products List */}
      <div>
        <h4 className="text-lg font-medium text-gray-600 mb-4">Current Sponsored Products</h4>
        {isLoading && !sponsoredProducts.length ? (
          <div className="flex justify-center items-center h-48">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <p className="text-red-500 text-center py-8">{error}</p>
        ) : sponsoredProducts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No sponsored products added.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-blue-50">
                  <th className="p-3 text-sm font-semibold text-gray-700">Image</th>
                  <th className="p-3 text-sm font-semibold text-gray-700">Name</th>
                  <th className="p-3 text-sm font-semibold text-gray-700">Price</th>
                  <th className="p-3 text-sm font-semibold text-gray-700">Added At</th>
                  <th className="p-3 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sponsoredProducts.map((sp) => (
                  <tr key={sp._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <img
                        src={sp.productId?.images?.[0]?.url || 'https://via.placeholder.com/50'}
                        alt={sp.productId?.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    </td>
                    <td className="p-3 text-sm text-gray-700">{sp.productId?.name || 'Unknown'}</td>
                    <td className="p-3 text-sm text-gray-700">
                      ₹{sp.productId?.discountedPrice || sp.productId?.price || 0}
                    </td>
                    <td className="p-3 text-sm text-gray-700">
                      {new Date(sp.addedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => handleRemoveSponsoredProduct(sp.productId?._id)}
                        disabled={isLoading}
                        className={`px-3 py-1 rounded-xl flex items-center gap-2 ${
                          isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                        <FaTimes /> Remove
                      </motion.button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminSponsoredProducts;