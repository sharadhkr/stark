import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '../../@/components/ui/drawer';
import { Button } from '../../@/components/ui/button';
import { cn } from '../lib/utils';
import axios from './useraxios';
import { X } from 'lucide-react';

const CategoryDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        try {
          setLoading(true);
          const response = await axios.get('/api/categories');
          console.log('API Response:', response.data); // Debug raw response
          const validCategories = response.data.categories; // Remove filter for testing
          setCategories(validCategories);
          setLoading(false);
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to load categories');
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

  const handleNavigate = (categoryId) => {
    navigate(`/category/${categoryId}`);
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[90vh] bg-gradient-to-b from-violet-50 to-white rounded-t-3xl">
        <DrawerHeader className="flex justify-between items-center border-b border-violet-100">
          <DrawerTitle className="text-2xl font-bold text-gray-900">Shop by Category</DrawerTitle>
          <DrawerDescription className="sr-only">
            Browse and select a category to view related products.
          </DrawerDescription>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-violet-100">
              <X className="h-5 w-5 text-gray-600" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex flex-col h-full p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Categories</h3>
          {loading ? (
            <p className="text-gray-600">Loading categories...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : categories.length === 0 ? (
            <p className="text-gray-600">No categories available</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((category) => (
                <motion.div
                  key={category._id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleNavigate(category._id)}
                >
                  {category.icon && (
                    <img
                      src={category.icon}
                      alt={`${category.name} icon`}
                      className="w-full h-24 object-cover"
                      onError={(e) => (e.target.src = 'https://via.placeholder.com/150?text=Category')}
                    />
                  )}
                  <div className="p-4">
                    <h4 className="text-md font-semibold text-gray-900 truncate">{category.name}</h4>
                    {category.description && (
                      <p className="text-sm text-gray-600 mt-1 truncate">{category.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">Products: {category.productCount}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CategoryDrawer;