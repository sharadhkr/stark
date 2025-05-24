import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import axios from './useraxios';

const CategoryModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        try {
          setLoading(true);
          const response = await axios.get('/api/categories/categories'); // Fixed endpoint
          // Filter categories with products
          const validCategories = response.data.categories.filter(cat => cat.productCount > 0);
          setCategories(validCategories);
          setSelectedCategory(validCategories[0]?.name || null);
          setLoading(false);
        } catch (err) {
          setError('Failed to load categories');
          setLoading(false);
          console.error('Fetch categories error:', {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
          });
        }
      };
      fetchCategories();
    }
  }, [isOpen]);

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed inset-x-0 bottom-0 h-[92vh] bg-violet-50/80 backdrop-blur-md rounded-t-3xl shadow-[0px_-10px_20px_rgba(0,0,0,0.1)] z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-violet-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Shop by Category
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 p-2 rounded-full bg-violet-100"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col md:flex-row overflow-y-auto">
          {/* Categories Sidebar */}
          <div className="w-full md:w-1/3 bg-violet-100 p-4 border-b md:border-b-0 md:border-r border-violet-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Categories
            </h3>
            {loading ? (
              <p className="text-gray-600">Loading categories...</p>
            ) : error ? (
              <p className="text-red-600">{error}</p>
            ) : categories.length === 0 ? (
              <p className="text-gray-600">No categories available</p>
            ) : (
              <div className="flex flex-wrap md:flex-col gap-2">
                {categories.map((category) => (
                  <button
                    key={category._id}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`text-left px-3 py-2 rounded-md transition-all flex items-center gap-2 ${
                      selectedCategory === category.name
                        ? 'bg-violet-300 text-violet-800 font-medium'
                        : 'text-gray-700 hover:bg-violet-200'
                    }`}
                    aria-label={`Select ${category.name}`}
                  >
                    {category.icon && (
                      <img
                        src={category.icon}
                        alt={`${category.name} icon`}
                        className="w-5 h-5 object-contain"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/20?text=Icon';
                        }}
                      />
                    )}
                    {category.name}
                    <span className="ml-2 text-xs text-gray-500">
                      ({category.productCount})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subcategories */}
          <div className="flex-1 p-4 overflow-y-auto">
            {loading ? (
              <p className="text-gray-600">Loading subcategories...</p>
            ) : error ? (
              <p className="text-red-600">{error}</p>
            ) : (
              categories.map(
                (category) =>
                  selectedCategory === category.name && (
                    <div key={category._id} className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-gray-600">
                          {category.description}
                        </p>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {category.subcategories && category.subcategories.length > 0 ? (
                          category.subcategories.map((sub) => (
                            <motion.div
                              key={sub.name}
                              whileHover={{ scale: 1.05 }}
                              className="bg-white rounded-2xl overflow-hidden cursor-pointer"
                              onClick={() => handleNavigate(sub.path)}
                            >
                              {sub.icon && (
                                <img
                                  src={sub.icon}
                                  alt={sub.name}
                                  className="w-full h-20 object-cover"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/150?text=Subcategory';
                                  }}
                                />
                              )}
                              <div className="p-2 text-center">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {sub.name}
                                </p>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <p className="text-gray-600">No subcategories available</p>
                        )}
                      </div>
                    </div>
                  )
              )
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CategoryModal;