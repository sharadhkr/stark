// components/SellerCard.jsx
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

  const cardVariants = {
    hover: { scale: 1, transition: { duration: 0.3 } },
    tap: { scale: 1, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      whileTap="tap"
      onClick={handleClick}
      className="flex flex-col items-center rounded-lg drop-shadow-lg cursor-pointer hover:dargo p-shadow-lg transition-drop-shadow duration-300"
    >
      <img
        src={seller?.profilePicture || 'https://placehold.co/80x80'}
        alt={seller?.name || 'Seller'}
        className="w-16 h-16 rounded-full object-cover border-2 border-teal-500"
      />
      <p className="text-sm text-gray-600 text-center">
        @{seller?.shopName || 'No Shop Name'}
      </p>
    </motion.div>
  );
};

export default SellerCard;