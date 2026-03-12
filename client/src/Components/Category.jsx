import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer'; // ← fixed alias (most common)
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import axios from './useraxios'; // consider renaming to api/axiosInstance

const FALLBACK_ICON = 'https://via.placeholder.com/56?text=?';

const CategoryDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.get('/api/categories');
      // Add defensive check + optional chaining
      const validCategories = Array.isArray(data?.categories) ? data.categories : [];
      setCategories(validCategories);
    } catch (err) {
      console.error('Failed to fetch categories:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(err.response?.data?.message || 'Could not load categories');
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCategoryClick = useCallback((categoryId) => {
    navigate(`/category/${categoryId}`);
    onClose();
  }, [navigate, onClose]);

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[90vh] bg-gradient-to-b from-violet-50 to-white rounded-t-3xl">
        <DrawerHeader className="flex items-center justify-between border-b border-violet-100 px-6">
          <DrawerTitle className="text-2xl font-bold text-gray-900">
            Shop by Category
          </DrawerTitle>

          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-violet-100">
              <X className="h-5 w-5 text-gray-600" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 p-5 md:p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              Loading categories...
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-600">{error}</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No categories found</div>
          ) : (
            <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-4 sm:gap-5">
              {categories.map((category) => (
                <button
                  key={category._id}
                  type="button"
                  onClick={() => handleCategoryClick(category._id)}
                  className="flex flex-col items-center group focus:outline-none focus:ring-2 focus:ring-violet-400 rounded-xl transition"
                >
                  <motion.div
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className="bg-white shadow-sm rounded-full w-16 h-16 flex items-center justify-center mb-2.5 overflow-hidden border border-gray-100 group-hover:shadow-md transition-shadow"
                  >
                    <img
                      src={category.icon ?? FALLBACK_ICON}
                      alt={category.name || 'category'}
                      className="w-10 h-10 object-contain"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_ICON;
                      }}
                    />
                  </motion.div>

                  <span className="text-sm font-medium text-gray-800 text-center line-clamp-2 max-w-[72px]">
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CategoryDrawer;