import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaEye, FaTimes, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from '../axios';
import ProductForm from '../seller/ProductForm';
import useAdminAuth from '../../hooks/useAdminAuth';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const AdminProducts = ({ products = [], setProducts, categories = [], loading }) => {
  const { isAdmin, error, checkAdmin } = useAdminAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDetails, setShowDetails] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      console.log(`Searching products with query: ${searchQuery}`);
      const response = await axios.get(`/api/admin/auth/products/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Search products response:', response.data);
      setFilteredProducts(response.data.products || []);
    } catch (error) {
      console.error('Search products error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(error.response?.data?.message || 'Failed to search products');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the product "${name}"?`)) return;
    try {
      const token = localStorage.getItem('adminToken');
      console.log(`Deleting product ${id}`);
      await axios.delete(`/api/admin/auth/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(products.filter((p) => p._id !== id));
      setFilteredProducts(filteredProducts.filter((p) => p._id !== id));
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Delete product error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const toggleDetails = (id) => {
    setShowDetails(showDetails === id ? null : id);
  };

  // Sync filtered products when products prop changes
  React.useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  // Validate props
  if (!Array.isArray(products) || !Array.isArray(categories)) {
    console.error('Invalid props:', { products, categories });
    return (
      <div className="text-red-600 p-6 bg-red-50 rounded-2xl shadow-md">
        Error: Invalid products or categories data. Please try refreshing the page.
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
        <h3 className="text-lg font-semibold text-red-700">Unable to Access Products</h3>
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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all duration-200"
              aria-label="Search products"
            />
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm"
            aria-label="Search products"
          >
            Search
          </motion.button>
        </form>
        <motion.button
          onClick={() => {
            setEditingProduct(null);
            setShowProductForm(true);
          }}
          whileHover={{ scale: 1.05 }}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all duration-200 shadow-sm"
          aria-label="Add new product"
          title="Add New Product"
        >
          <FaPlus /> Add Product
        </motion.button>
      </div>
      {filteredProducts.length === 0 ? (
        <div className="text-center text-gray-600 text-lg">No products found</div>
      ) : (
        filteredProducts.map((product) => {
          if (!product || !product._id) {
            console.warn('Invalid product detected:', product);
            return null;
          }
          return (
            <motion.div
              key={product._id}
              variants={fadeIn}
              className="bg-blue-50 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name || 'Product'}
                      className="w-16 h-16 object-cover rounded-xl border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                      No Image
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{product.name || 'Unnamed Product'}</h3>
                    <p className="text-sm text-gray-600">₹{(product.price || 0).toFixed(2)} | Qty: {product.quantity || 0}</p>
                    <p className="text-sm text-gray-600">Seller: {product.seller?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">
                      Status: <span className={product.status === 'approved' ? 'text-emerald-600' : 'text-red-600'}>{product.status || 'Unknown'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() => toggleDetails(product._id)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-all duration-200"
                    aria-label={`View details for ${product.name || 'product'}`}
                    title="View Details"
                  >
                    <FaEye size={16} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() => handleEditProduct(product)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-all duration-200"
                    aria-label={`Edit product ${product.name || 'product'}`}
                    title="Edit Product"
                  >
                    <FaEdit size={16} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() => handleDeleteProduct(product._id, product.name)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-all duration-200"
                    aria-label={`Delete product ${product.name || 'product'}`}
                    title="Delete Product"
                  >
                    <FaTrash size={16} />
                  </motion.button>
                </div>
              </div>
              {showDetails === product._id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-4 bg-white rounded-xl shadow-sm"
                >
                  <p className="text-sm text-gray-600">Category: {product.category?.name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Views: {product.views || 0}</p>
                  <p className="text-sm text-gray-600">Orders: {product.orders || 0}</p>
                  <p className="text-sm text-gray-600">Saves: {product.saves || 0}</p>
                  <p className="text-sm text-gray-600">Wishlists: {product.wishlists || 0}</p>
                  <p className="text-sm text-gray-600">Sizes: {product.sizes?.join(', ') || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Colors: {product.colors?.join(', ') || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Description: {product.description || 'N/A'}</p>
                </motion.div>
              )}
            </motion.div>
          );
        }).filter(Boolean)
      )}
      {showProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-2xl relative"
          >
            <motion.button
              onClick={() => setShowProductForm(false)}
              whileHover={{ scale: 1.1 }}
              className="absolute top-4 right-4 p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              aria-label="Close product form"
              title="Close"
            >
              <FaTimes size={16} />
            </motion.button>
            <ProductForm
              editingProduct={editingProduct}
              setProducts={setProducts}
              categories={categories}
              onClose={() => setShowProductForm(false)}
            />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminProducts;