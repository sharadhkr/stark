// components/CategoryCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const CategoryCard = ({ category }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/category/${category.name}`);
  };

  const cardVariants = {
    hover: { scale: 1., transition: { duration: 0.3 } },
    tap: { scale: 1, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      whileTap="tap"
      onClick={handleClick}
      className="flex w-13 z-20 flex-col items-center rounded-lg drop-shadow-lg  py-2 cursor-pointer hover:drop-shadow-2xl transition-shadow duration-300"
    >
      {category.icon ? (
        <img
          src={category.icon}
          alt={`${category.name} icon`}
          className="w-8 h-8 object-contain"
          onError={(e) => (e.target.src = 'https://placehold.co/48x48')} // Fallback if icon fails to load
        />
      ) : (
        <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-gray-500">No Icon</span>
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-800 text-center truncate w-full">
        {category.name}
      </h3>
    </motion.div>
  );
};

export default CategoryCard;