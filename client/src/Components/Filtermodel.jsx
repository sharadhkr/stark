// components/FilterModal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoFilter, IoPricetagOutline, IoGridOutline } from 'react-icons/io5';

interface FilterModalProps {
  showFilter: boolean;
  setShowFilter: (open: boolean) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  categories: Array<{ _id: string; name: string }>;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  applyFilters: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  showFilter,
  setShowFilter,
  selectedCategory,
  setSelectedCategory,
  categories,
  priceRange,
  setPriceRange,
  applyFilters,
}) => {
  // Optional: prevent body scroll when modal is open
  React.useEffect(() => {
    if (showFilter) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showFilter]);

  return (
    <AnimatePresence>
      {showFilter && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowFilter(false)} // close on backdrop click
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md border border-indigo-100/50 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            {/* Subtle gradient orbs */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-purple-400/10 rounded-full blur-3xl" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100/80">
              <div className="flex items-center gap-2.5">
                <IoFilter className="text-indigo-600" size={22} />
                <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
                  Filters
                </h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.15, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowFilter(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-indigo-700 transition-colors"
                aria-label="Close filter modal"
              >
                <IoClose size={24} />
              </motion.button>
            </div>

            <div className="p-6 space-y-7">
              {/* Category */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2.5">
                  <IoGridOutline className="text-indigo-500" size={18} />
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50/70 border border-indigo-100 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-300 transition-all"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-3">
                  <div className="flex items-center gap-2">
                    <IoPricetagOutline className="text-indigo-500" size={18} />
                    Price Range
                  </div>
                  <span className="text-indigo-700 font-medium">
                    ${priceRange[0]} – ${priceRange[1]}
                  </span>
                </label>

                <div className="space-y-5 px-1">
                  <input
                    type="range"
                    min={0}
                    max={1000}
                    step={10}
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="range-slider w-full accent-indigo-500"
                  />
                  <input
                    type="range"
                    min={0}
                    max={1000}
                    step={10}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="range-slider w-full accent-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-gray-100/80 flex justify-end gap-3 bg-gradient-to-r from-gray-50/80 to-white/50">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowFilter(false)}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-colors"
              >
                Cancel
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  applyFilters();
                  setShowFilter(false); // most users expect apply → close
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-medium rounded-xl shadow-md shadow-indigo-200/40 transition-all"
              >
                Apply
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FilterModal;