import React, { useState, useEffect, useCallback } from 'react';
import { IoHeart, IoCartOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import axios from '../axios';
import placeholderImage from '../assets/logo.png';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const WishlistProductCard = ({ product = {}, onRemove, onMoveToCart }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    name = 'Unnamed Product',
    price = 0,
    image = placeholderImage,
    discount = null,
    productId,
  } = product;

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  const handleRemoveFromWishlist = async (e) => {
    stopPropagation(e);
    setLoading(true);
    try {
      await onRemove(productId);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToCart = async (e) => {
    stopPropagation(e);
    setLoading(true);
    try {
      await onMoveToCart(productId, name, price);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = () => {
    navigate(`/product/${productId}`);
  };

  if (!productId) {
    return (
      <div className="w-40 h-65 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-500">
        Invalid Product
      </div>
    );
  }

  return (
    <motion.div
      onClick={handleProductClick}
      whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)' }}
      transition={{ duration: 0.3 }}
      className="w-40 h-65 bg-gradient-to-b from-blue-50 to-blue-50 rounded-3xl shadow-lg overflow-hidden border border-gray-200/50 flex flex-col cursor-pointer"
      aria-label={`Product: ${name}`}
    >
      <div className="relative w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-115"
          onError={(e) => (e.target.src = placeholderImage)}
          loading="lazy"
        />
        {discount && (
          <span className="absolute top-2 left-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-md">
            -{discount}%
          </span>
        )}
      </div>

      <div className="px-3 pt-2 flex-grow">
        <h3 className="text-sm font-semibold text-gray-800 truncate tracking-tight" title={name}>
          {name}
        </h3>
        <p className="text-lg p-0 font-extrabold text-emerald-700">₹{price.toFixed(2)}</p>
      </div>

      <div className="p-3 pt-0 flex justify-between items-center flex-shrink-0">
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleRemoveFromWishlist}
          disabled={loading}
          className={`p-1.5 rounded-full bg-gray-100/80 drop-shadow-lg transition-colors duration-200 text-red-500 hover:text-red-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Remove from Wishlist"
          aria-label="Remove from Wishlist"
        >
          <IoHeart size={18} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleMoveToCart}
          disabled={loading}
          className={`flex items-center drop-shadow-lg gap-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold py-1 px-2.5 rounded-full transition-all duration-300 shadow-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Move to Cart"
          aria-label="Move to Cart"
        >
          <IoCartOutline size={14} />
          <span>Move</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default WishlistProductCard;