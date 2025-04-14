import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import axios from '../axios';
import Modal from './Modal'; // We'll create this component

const SellerProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('sellerToken');
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get('/api/seller/auth/products', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/seller/auth/categories', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setProducts(productsRes.data.products || []);
        setCategories(categoriesRes.data.categories || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load products.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateProduct = () => {
    setEditProduct(null);
    setShowModal(true);
  };

  const handleEditProduct = (product) => {
    setEditProduct(product);
    setShowModal(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('sellerToken');
      await axios.delete(`/api/seller/auth/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setProducts(products.filter(p => p._id !== id));
      toast.success('Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      <Toaster position="top-right" />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-teal-700">Your Products</h1>
          <button
            onClick={handleCreateProduct}
            className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600"
          >
            <FaPlus /> Create Product
          </button>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : products.length === 0 ? (
          <p className="text-gray-600">No products found. Create one now!</p>
        ) : (
          <div className="space-y-4">
            {products.map(product => (
              <motion.div
                key={product._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={product.image?.[0] || 'https://via.placeholder.com/64'}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">{product.name}</h3>
                    <p className="text-sm text-gray-600">
                      Category: {product.category?.name || 'Unknown'} | Price: ₹{product.price} | Qty: {product.quantity}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditProduct(product)} className="text-teal-600 hover:text-teal-700">
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDeleteProduct(product._id)} className="text-red-600 hover:text-red-700">
                    <FaTrash />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {showModal && (
            <Modal
              categories={categories}
              editProduct={editProduct}
              onClose={() => setShowModal(false)}
              onSave={() => {
                setShowModal(false);
                setLoading(true);
                setTimeout(() => setLoading(false), 1000); // Simulate fetch
                // Fetch products again here
              }}
              fileInputRef={fileInputRef}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default SellerProducts;