import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaCheckSquare, FaSquare } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from '../axios';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const AdminCategories = ({ categories = [], setCategories, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCategories, setFilteredCategories] = useState(categories);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: null });
  const [categoryIconPreview, setCategoryIconPreview] = useState(null);
  const categoryIconInputRef = useRef(null);

  useEffect(() => {
    setFilteredCategories(categories);
  }, [categories]);

  useEffect(() => {
    return () => {
      if (categoryIconPreview) URL.revokeObjectURL(categoryIconPreview);
    };
  }, [categoryIconPreview]);

  const handleCategoryFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'icon') {
      const file = files[0];
      if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        toast.error('Only JPEG, PNG, or JPG files allowed');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Icon size must be less than 2MB');
        return;
      }
      setCategoryForm((prev) => ({ ...prev, icon: file }));
      if (categoryIconPreview) URL.revokeObjectURL(categoryIconPreview);
      setCategoryIconPreview(URL.createObjectURL(file));
    } else {
      setCategoryForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name) {
      toast.error('Category name is required');
      return;
    }
    if (!editingCategory && !categoryForm.icon) {
      toast.error('Category icon is required');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('name', categoryForm.name);
      formData.append('description', categoryForm.description);
      if (categoryForm.icon) formData.append('icon', categoryForm.icon);

      const token = localStorage.getItem('adminToken');
      let response;
      if (editingCategory) {
        response = await axios.put(`/api/categories/${editingCategory._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories(categories.map((cat) => (cat._id === editingCategory._id ? response.data.category : cat)));
        setFilteredCategories(filteredCategories.map((cat) => (cat._id === editingCategory._id ? response.data.category : cat)));
        toast.success('Category updated successfully');
      } else {
        response = await axios.post('/api/categories', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories([...categories, response.data.category]);
        setFilteredCategories([...filteredCategories, response.data.category]);
        toast.success('Category added successfully');
      }
      setCategoryForm({ name: '', description: '', icon: null });
      setCategoryIconPreview(null);
      setEditingCategory(null);
      setShowCategoryForm(false);
    } catch (error) {
      console.error('Category submit error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(error.response?.data?.message || (editingCategory ? 'Failed to update category' : 'Failed to add category'));
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, description: category.description || '', icon: null });
    setCategoryIconPreview(category.icon || null);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`/api/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(categories.filter((cat) => cat._id !== id));
      setFilteredCategories(filteredCategories.filter((cat) => cat._id !== id));
      setSelectedCategories(selectedCategories.filter((catId) => catId !== id));
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Delete category error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleBulkDeleteCategories = async () => {
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${selectedCategories.length} categories?`)) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete('/api/categories/bulk', {
        headers: { Authorization: `Bearer ${token}` },
        data: { categoryIds: selectedCategories },
      });
      setCategories(categories.filter((cat) => !selectedCategories.includes(cat._id)));
      setFilteredCategories(filteredCategories.filter((cat) => !selectedCategories.includes(cat._id)));
      setSelectedCategories([]);
      toast.success('Categories deleted successfully');
    } catch (error) {
      console.error('Bulk delete categories error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(error.response?.data?.message || 'Failed to delete categories');
    }
  };

  const handleCategorySearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setFilteredCategories(categories);
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`/api/ categories/search?name=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFilteredCategories(response.data.categories || []);
    } catch (error) {
      console.error('Search categories error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(error.response?.data?.message || 'Failed to search categories');
    }
  };

  const toggleCategorySelection = (id) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((catId) => catId !== id) : [...prev, id]
    );
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <form onSubmit={handleCategorySearch} className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all duration-200"
              aria-label="Search categories"
            />
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm"
          >
            Search
          </motion.button>
        </form>
        <div className="flex gap-2">
          <motion.button
            onClick={() => {
              setEditingCategory(null);
              setCategoryForm({ name: '', description: '', icon: null });
              setCategoryIconPreview(null);
              setShowCategoryForm(true);
            }}
            whileHover={{ scale: 1.05 }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all duration-200 shadow-sm"
            aria-label="Add new category"
          >
            <FaPlus /> Add Category
          </motion.button>
          <motion.button
            onClick={handleBulkDeleteCategories}
            whileHover={{ scale: 1.05 }}
            className="bg-red-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-red-700 transition-all duration-200 shadow-sm"
            disabled={selectedCategories.length === 0}
            aria-label="Delete selected categories"
          >
            <FaTrash /> Delete Selected
          </motion.button>
        </div>
      </div>
      {loading ? (
        <div className="text-center text-gray-600 animate-pulse text-lg">Loading categories...</div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center text-gray-600 text-lg">No categories found</div>
      ) : (
        filteredCategories.map((category) => (
          <motion.div
            key={category._id}
            variants={fadeIn}
            className="bg-blue-50 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={() => toggleCategorySelection(category._id)}
                className="text-blue-600"
                aria-label={`Select category ${category.name}`}
              >
                {selectedCategories.includes(category._id) ? <FaCheckSquare /> : <FaSquare />}
              </motion.button>
              {category.icon && (
                <img
                  src={category.icon}
                  alt={category.name}
                  className="w-8 h-8 object-contain rounded-full"
                  onError={(e) => {
                    console.error(`Failed to load category icon: ${category.icon}`);
                    e.target.src = 'https://via.placeholder.com/32?text=Icon';
                  }}
                />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.description || 'No description'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={() => handleEditCategory(category)}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-all duration-200"
                aria-label={`Edit category ${category.name}`}
              >
                <FaEdit />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={() => handleDeleteCategory(category._id)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-all duration-200"
                aria-label={`Delete category ${category.name}`}
              >
                <FaTrash />
              </motion.button>
            </div>
          </motion.div>
        ))
      )}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-blue-50 p-6 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-6">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h2>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  name="name"
                  value={categoryForm.name}
                  onChange={handleCategoryFormChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all duration-200"
                  required
                  aria-label="Category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={categoryForm.description}
                  onChange={handleCategoryFormChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all duration-200"
                  rows="3"
                  aria-label="Category description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Icon (JPEG, PNG, JPG, max 2MB) *
                </label>
                <motion.button
                  type="button"
                  onClick={() => categoryIconInputRef.current.click()}
                  whileHover={{ scale: 1.05 }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all duration-200 shadow-sm"
                >
                  <FaPlus /> Upload Icon
                </motion.button>
                <input
                  type="file"
                  name="icon"
                  ref={categoryIconInputRef}
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleCategoryFormChange}
                  className="hidden"
                  required={!editingCategory}
                />
                {categoryIconPreview && (
                  <div className="mt-4">
                    <img
                      src={categoryIconPreview}
                      alt="Category icon preview"
                      className="w-16 h-16 object-contain rounded-full border border-gray-200"
                      onError={(e) => {
                        console.error(`Failed to load icon preview: ${categoryIconPreview}`);
                        e.target.src = 'https://via.placeholder.com/64?text=Icon';
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-6">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm"
                  aria-label={editingCategory ? 'Update category' : 'Add category'}
                >
                  {editingCategory ? 'Update' : 'Add'}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setShowCategoryForm(false)}
                  whileHover={{ scale: 1.05 }}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-300 transition-all duration-200 shadow-sm"
                  aria-label="Cancel"
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminCategories;