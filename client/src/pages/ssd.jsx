import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaUpload } from 'react-icons/fa';
import axios from '../axios';

const Modal = ({ categories, editProduct, onClose, onSave, fileInputRef }) => {
  const [productData, setProductData] = useState({
    name: editProduct?.name || '',
    category: editProduct?.category?._id || (categories[0]?._id || ''),
    quantity: editProduct?.quantity || '',
    price: editProduct?.price || '',
    description: editProduct?.description || '',
    image: null,
    isReturnable: editProduct?.isReturnable || false,
    returnPeriod: editProduct?.returnPeriod || 0,
  });
  const [imagePreview, setImagePreview] = useState(editProduct?.image?.[0] || null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('name', productData.name);
    formData.append('category', productData.category);
    formData.append('quantity', productData.quantity);
    formData.append('price', productData.price);
    formData.append('description', productData.description);
    formData.append('isReturnable', productData.isReturnable);
    formData.append('returnPeriod', productData.isReturnable ? productData.returnPeriod : 0);
    if (productData.image && !editProduct) formData.append('image', productData.image);

    try {
      const token = localStorage.getItem('sellerToken');
      const url = editProduct ? `/api/seller/auth/products/${editProduct._id}` : '/api/seller/auth/products/create';
      const method = editProduct ? 'put' : 'post';

      await axios[method](url, editProduct ? productData : formData, {
        headers: { Authorization: `Bearer ${token}`, ...(editProduct ? {} : { 'Content-Type': 'multipart/form-data' }) },
      });

      toast.success(editProduct ? 'Product updated!' : 'Product created!');
      onSave();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white rounded-lg p-6 w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-teal-700 mb-4">
          {editProduct ? 'Edit Product' : 'Create Product'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={productData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              name="category"
              value={productData.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            >
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={productData.quantity}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
            <input
              type="number"
              name="price"
              value={productData.price}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={productData.description}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                name="isReturnable"
                checked={productData.isReturnable}
                onChange={handleChange}
              />
              Returnable
            </label>
            {productData.isReturnable && (
              <input
                type="number"
                name="returnPeriod"
                value={productData.returnPeriod}
                onChange={handleChange}
                placeholder="Return Period (days)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2"
                required
              />
            )}
          </div>
          {!editProduct && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Image</label>
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-lg"
              >
                <FaUpload /> Upload Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded-md" />}
            </div>
          )}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600"
            >
              {loading ? 'Saving...' : editProduct ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default Modal;