import React from 'react';
import { motion } from 'framer-motion';
import { FaStore } from 'react-icons/fa';
import SellerCard from '../SellerCard';

const SellerSection = ({ sellers = [], loading }) => {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const SellerSkeleton = () => (
    <div
      className="min-w-[96px] h-24 rounded-lg bg-gray-200 animate-pulse mx-2"
      role="presentation"
      aria-hidden="true"
    ></div>
  );

  return (
    <div className="w-full px-4">
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        role="region"
        aria-label="Top Sellers"
        className="mb-6 bg-white bg-opacity-85 rounded-2xl py-4 shadow-glow overflow-hidden"
      >
        <h2 className="text-2xl font-bold text-gray-500 ml-4 mb-4 flex items-center gap-4">
          <div className="flex p-2 bg-purple-100 rounded-full shadow-inner-sm">
            <FaStore aria-hidden="true" />
          </div>
          <span className="opacity-40 text-xl">TOP SELLERS</span>
        </h2>
        <div
          className="flex overflow-x-auto scroll-smooth snap-x scrollbar-hide justify-start items-start"
          role="list"
        >
          {loading ? (
            [0, 1, 2, 3, 4].map((i) => <SellerSkeleton key={i} />)
          ) : sellers.length === 0 ? (
            <p className="text-gray-600 px-4" role="status">
              No sellers available.
            </p>
          ) : (
            sellers.map((seller) => (
              <div key={seller._id} className="px-2 snap-start w-24" role="listitem">
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