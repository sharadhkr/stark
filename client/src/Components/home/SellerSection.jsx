import React from 'react';
import { motion } from 'framer-motion';
import { FaStore } from 'react-icons/fa';
import SellerCard from '../SellerCard';

const SellerSection = ({ sellers, loading }) => {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const SellerSkeleton = () => (
    <div className="min-w-[80px] h-20 rounded-full bg-gray-200 animate-pulse m-2"></div>
  );

  return (
    <div className="w-full px-2">
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="mb-5 top z-10 bg-white/85 rounded-2xl py-3 shadow-[0px_0px_20px_-10px_rgba(255,0,150,1),0px_0px_40px_-20px_rgba(0,200,255,1)] overflow-hidden"
      >
        <h2 className="text-2xl font-bold text-gray-500 ml-3 mb-3 flex items-center gap-4">
          <div className="flex p-2 bg-purple-100 rounded-full shadow-[inset_0px_3px_15px_-10px]">
            <FaStore />
          </div>
          <span className="opacity-40 text-xl">TOP SELLERS</span>
        </h2>
        <div className="flex overflow-x-auto scrollbar-hide w-full justify-around scroll-smooth snap-x items-start">
          {loading ? (
            Array(5)
              .fill()
              .map((_, i) => <SellerSkeleton key={i} />)
          ) : sellers.length === 0 ? (
            <p className="text-gray-600">No sellers available.</p>
          ) : (
            sellers.map((seller) => (
              <div key={seller._id} className="px-4 snap-start w-15">
                <SellerCard seller={seller} />
              </div>
            ))
          )}
        </div>
      </motion.section>
    </div>
  );
};

export default SellerSection;