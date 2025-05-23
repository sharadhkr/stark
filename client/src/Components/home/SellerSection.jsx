import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { FaStore } from 'react-icons/fa';
import SellerCard from '../SellerCard';
import { DataContext } from '../../App';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const SellerSkeleton = () => (
  <div className="min-w-[80px] h-20 rounded-full bg-gray-200 animate-pulse m-2"></div>
);

const SellerSection = React.memo(() => {
  const { cache } = useContext(DataContext);
  const sellers = cache.sellers?.data || [];
  const loading = cache.sellers?.isLoading || false;

  return (
    <div className="w-full px-2 relative">
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="mb-5 top z-10 bg-white/85 rounded-2xl py-2 shadow-[0px_0px_20px_-12px_rgba(0,0,0,0.8)] overflow-hidden"
        role="region"
        aria-label="Top Sellers"
      >
        <h2 className="text-2xl font-bold text-gray-500 ml-2 py-2 flex items-center gap-4">
          <div className="flex p-2 bg-purple-100 rounded-full shadow-[inset_0px_3px_15px_-10px]">
            <FaStore aria-hidden="true" />
          </div>
          <span className="opacity-40 text-xl">TOP SELLERS</span>
        </h2>
        <div className="flex overflow-x-auto scrollbar-hide w-full justify-around scroll-smooth snap-x items-start">
          {loading ? (
            Array(3)
              .fill()
              .map((_, i) => <SellerSkeleton key={i} />)
          ) : sellers.length === 0 ? (
            <p className="text-gray-600" aria-live="polite">
              No sellers available.
            </p>
          ) : (
            sellers.map((seller) => (
              <div key={seller._id} className="px-3 snap-start">
                <SellerCard seller={seller} />
              </div>
            ))
          )}
        </div>
      </motion.section>
      <div className="absolute w-full -z-10 opacity-100 top-0 left-0 flex items-center justify-center blur-2xl">
        <div className="w-[30%] h-36 bg-purple-400"></div>
        <div className="w-[30%] h-36 bg-pink-400"></div>
        <div className="w-[30%] h-36 bg-orange-400"></div>
        <div className="w-[30%] h-36 bg-green-400"></div>
      </div>
    </div>
  );
});

export default SellerSection;