import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from '../axios';
import ProductForm from '../seller/ProductForm'; // Reused from SellerDashboard

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const AdminProducts = ({ products, setProducts, categories, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDetails, setShowDetails] = useState(null);

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`/api/admin/auth/products/${id}`);
      setProducts(products.filter((p) => p._id !== id));
      toast.success('Product deleted successfully');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const toggleDetails = (id) => {
    setShowDetails(showDetails === id ? null : id);
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-64">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all duration-200"
            aria-label="Search products"
          />
        </div>
        <motion.button
          onClick={() => {
            setEditingProduct(null);
            setShowProductForm(true);
          }}
          whileHover={{ scale: 1.05 }}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all duration-200 shadow-sm"
          aria-label="Add new product"
        >
          <FaPlus /> Add Product
        </motion.button>
      </div>
      {loading ? (
        <div className="text-center text-gray-600 animate-pulse text-lg">Loading products...</div>
      ) : products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
        <div className="text-center text-gray-600 text-lg">No products found</div>
      ) : (
        products
          .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((product) => (
            <motion.div
              key={product._id}
              variants={fadeIn}
              className="bg-blue-50 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-xl border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                      No Image
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                    <p className="text-sm text-gray-600">₹{product.price} | Qty: {product.quantity}</p>
                    <p className="text-sm text-gray-600">Seller: {product.seller?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">
                      Status: <span className={product.status === 'approved' ? 'text-emerald-600' : 'text-red-600'}>{product.status}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() => toggleDetails(product._id)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-all duration-200"
                    aria-label={`View details for ${product.name}`}
                  >
                    <FaEye />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() => handleEditProduct(product)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-all duration-200"
                    aria-label={`Edit product ${product.name}`}
                  >
                    <FaEdit />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() => handleDeleteProduct(product._id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-all duration-200"
                    aria-label={`Delete product ${product.name}`}
                  >
                    <FaTrash />
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
          ))
      )}
      {showProductForm && (
        <ProductForm
          editingProduct={editingProduct}
          setProducts={setProducts}
          categories={categories}
          onClose={() => setShowProductForm(false)}
        />
      )}
    </motion.div>
  );
};

export default AdminProducts;