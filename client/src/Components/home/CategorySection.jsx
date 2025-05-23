import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import CategoryCard from '../CategoryCard';
import { DataContext } from '../../App';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const CategorySkeleton = () => (
  <div className="min-w-[60px] h-15 rounded-full bg-gray-200 animate-pulse m-2"></div>
);

const CategorySection = React.memo(() => {
  const { cache } = useContext(DataContext);
  const categories = cache.categories?.data || [];
  const loading = cache.categories?.isLoading || false;

  return (
    <div className="w-full px-2 relative">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="w-full bg-white/85 rounded-2xl shadow-[0px_0px_20px_-12px_rgba(0,0,0,0.8)] mb-4 gap-2 pl-2 overflow-x-auto items-center scroll-smooth flex snap-x"
        role="region"
        aria-label="Category list"
      >
        <div className="flex h-12 ml-2 mr-2 bg-purple-100 rounded-md p-[7px] shadow-[inset_0px_3px_15px_-10px]">
          <span className="w-[4px] rounded-2xl h-[95%] bg-gray-500"></span>
        </div>
        <div className="w-full justify-around overflow-x-auto scrollbar-hide items-center scroll-smooth flex snap-x">
          {loading ? (
            Array(3)
              .fill()
              .map((_, i) => <CategorySkeleton key={i} />)
          ) : categories.length === 0 ? (
            <p className="text-gray-600" aria-live="polite">
              No categories available.
            </p>
          ) : (
            categories.map((category) => (
              <div key={category._id} className="snap-start min-w-fit flex-shrink-0 opacity-70 px-4">
                <CategoryCard category={category} />
              </div>
            ))
          )}
        </div>
      </motion.div>
      <div className="absolute w-full -z-10 opacity-100 top-0 left-0 flex items-center justify-center blur-2xl">
        <div className="w-[30%] h-10 bg-red-400"></div>
        <div className="w-[30%] h-10 bg-purple-400"></div>
        <div className="w-[30%] h-10 bg-pink-400"></div>
        <div className="w-[30%] h-10 bg-green-400"></div>
      </div>
    </div>
  );
});

export default CategorySection;