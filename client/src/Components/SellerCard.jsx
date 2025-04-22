import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const SellerCard = ({ seller }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (seller?._id) {
      navigate(`/seller/${seller._id}`);
    } else {
      console.error('Seller ID is missing:', seller);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const cardVariants = {
    hover: { scale: 1.05, transition: { duration: 0.3 } },
    tap: { scale: 0.95, transition: { duration: 0.2 } },
  };

  if (!seller) {
    return (
      <div className="flex flex-col items-center p-4 bg-gray-100 rounded-lg shadow-md">
        <p className="text-sm text-gray-500">No seller data available</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      whileTap="tap"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className="flex flex-col items-center p-4 bg-white rounded-lg shadow-lg cursor-pointer hover:drop-shadow-lg transition-shadow duration-300"
    >
      <img
        src={seller.profilePicture || 'https://placehold.co/80x80?text=No+Image'}
        alt={seller.name || 'Seller'}
        className="w-20 h-20 rounded-full object-cover border-2 border-teal-500"
        onError={(e) => (e.target.src = 'https://placehold.co/80x80?text=No+Image')}
        loading="lazy"
      />
      <p className="mt-2 text-sm text-gray-600 text-center">
        @{seller.shopName || 'No Shop Name'}
      </p>
    </motion.div>
  );
};

export default SellerCard;