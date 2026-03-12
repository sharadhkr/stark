// components/CategoryCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const CategoryCard = ({ category }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/category/${category.name}`);
  };

  // Better fallback icon handling + more reasonable sizes
  const iconSrc = category.icon || 'https://placehold.co/64x64?text=?';

  const cardVariants = {
    initial: { scale: 1 },
    hover:   { scale: 1.06, transition: { duration: 0.25, ease: 'easeOut' } },
    tap:     { scale: 0.97,  transition: { duration: 0.18 } },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      onClick={handleClick}
      className={`
        group flex w-28 flex-col items-center 
        rounded-xl bg-white/80 backdrop-blur-sm 
        px-3 py-4 shadow-md hover:shadow-xl 
        cursor-pointer transition-all duration-300
        border border-gray-200/60 hover:border-gray-300
      `}
    >
      <div className="mb-2.5 h-14 w-14 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 p-2.5 shadow-inner">
        <img
          src={iconSrc}
          alt={category.name}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = 'https://placehold.co/64x64?text=?';
            e.currentTarget.onerror = null; // prevent infinite loop
          }}
        />
      </div>

      <h3 className="text-center text-sm font-medium text-gray-800 line-clamp-2">
        {category.name}
      </h3>
    </motion.div>
  );
};

export default CategoryCard;