import React, { useState, useCallback } from 'react';
import { TbCategory } from 'react-icons/tb';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy-load CategoryModal
const CategoryModal = React.lazy(() => import('../Category'));

const GenderFilterBar = ({ onGenderChange, selectedGender = 'all' }) => {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Memoize gender options
  const genderOptions = ['All', 'men', 'women', 'kids'];

  return (
    <div className="w-full px-2 relative">
      <div className="w-full  relative bg-white/85 drop-shadow-lg rounded-2xl z-10">
        <div className="w-full mx-auto px-8 py-4 flex items-center">
          <div className="w-full flex justify-between">
            <div className="w-[76%] flex justify-between">
              {genderOptions.map((gender) => (
                <button
                  key={gender}
                  onClick={() => onGenderChange(gender)}
                  className={`flex items-center text-sm font-semibold uppercase rounded-lg transition-all duration-300 ${
                    selectedGender === gender
                      ? 'bg-gray-500/0 text-violet-700 drop-shadow-md'
                      : 'bg-gray-100/0 text-gray-600'
                  } hover:scale-95`}
                  aria-label={`Filter by ${gender === 'all' ? 'All Genders' : gender}`}
                >
                  {gender === 'all' ? 'All' : gender.charAt(0).toUpperCase() + gender.slice(1)}
                </button>
              ))}
            </div>
            <div className="w-[10%] flex items-end">
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className={`flex items-center text-sm font-semibold uppercase rounded-lg transition-all duration-300 ${
                  isCategoryModalOpen
                    ? 'bg-blue-500/0 text-violet-700 drop-shadow-md'
                    : 'bg-gray-100/0 text-gray-600'
                } hover:scale-95`}
                aria-label="Open category modal"
              >
                <TbCategory className="w-6 h-6 text-purple-700" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop for the modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/10 z-40 backdrop-blur-sm"
            onClick={() => setIsCategoryModalOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Modal */}
      {isCategoryModalOpen && (
        <React.Suspense fallback={<div className="text-center  py-4">Loading...</div>}>
          <CategoryModal
            isOpen={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
          />
        </React.Suspense>
      )}

      <div className="absolute w-full z-1 opacity-40 top-0 left-0 flex items-center justify-center blur-xl">
        <div className="w-[30%] h-14 bg-purple-400"></div>
        <div className="w-[40%] h-14 skew-x-12 bg-pink-400"></div>
        <div className="w-[30%] h-14 bg-green-300"></div>
      </div>
    </div>
  );
};

export default GenderFilterBar;