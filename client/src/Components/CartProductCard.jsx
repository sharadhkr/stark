import React from 'react';
import { IoTrashOutline, IoSaveOutline, IoSave } from 'react-icons/io5';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import placeholderImage from '../assets/logo.png';

const CartProductCard = ({
  item = {},
  onUpdateQuantity,
  onRemove,
  onSaveForLater,
  isSavedForLater = false,
}) => {
  const navigate = useNavigate();
  const {
    productId,
    name = 'Unnamed Product',
    price = 0,
    quantity = 1,
    size = 'N/A',
    color = 'N/A',
    image = [],
    stock = 0,
    discount = 0,
  } = item;

  const stopPropagation = (e) => e.stopPropagation();

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) return;
    if (newQuantity > stock) {
      toast.error(`Only ${stock} items available!`);
      return;
    }
    onUpdateQuantity(productId, newQuantity, size, color);
  };

  const handleRemove = (e) => {
    stopPropagation(e);
    onRemove(productId, size, color);
    toast.success(`${name} removed ${isSavedForLater ? 'from saved' : 'from cart'}!`);
  };

  const handleSaveForLater = (e) => {
    stopPropagation(e);
    onSaveForLater(productId, quantity, size, color);
    toast.success(`${name} ${isSavedForLater ? 'moved to cart' : 'saved'}!`);
  };

  const handleProductClick = () => {
    if (productId) {
      navigate(`/products/${productId}`);
    }
  };

  if (!productId) {
    return (
      <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
        Invalid Item
      </div>
    );
  }

  const displayImage = Array.isArray(image) && image.length > 0 ? image[0] : placeholderImage;
  const originalPrice = discount > 0 ? (price / (1 - discount / 100)).toFixed(2) : price;
  const isLowStock = stock > 0 && stock <= 5;

  return (
    <motion.div
      onClick={handleProductClick}
      whileHover={{ scale: 1.01, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`w-full max-w-2xl h-36 bg-white rounded-lg border ${
        isSavedForLater ? 'border-amber-100' : 'border-gray-100'
      } flex cursor-pointer overflow-hidden`}
    >
      {/* Image Section */}
      <div className="w-24 h-full flex-shrink-0 bg-gray-50">
        <img
          src={displayImage}
          alt={name}
          className="w-full h-full object-cover rounded-l-lg transition-transform duration-300 hover:scale-105"
          onError={(e) => (e.target.src = placeholderImage)}
          loading="lazy"
        />
        {discount > 0 && (
          <span className="absolute top-1 left-1 bg-rose-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full">
            {discount}%
          </span>
        )}
      </div>

      {/* Content Section */}
      <div className="flex-grow flex flex-col p-3">
        <div className="flex flex-col h-full justify-between">
          {/* Top: Name and Price */}
          <div className="flex justify-between items-center">
            <h3
              className="text-sm font-medium text-gray-900 truncate max-w-[60%] hover:text-blue-500 transition-colors"
              title={name}
            >
              {name}
            </h3>
            <div className="flex items-center gap-1.5">
              <p className="text-base font-semibold text-teal-600">₹{price.toFixed(2)}</p>
              {discount > 0 && (
                <p className="text-xs text-gray-400 line-through">₹{originalPrice}</p>
              )}
            </div>
          </div>

          {/* Middle: Details */}
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span className="truncate">₹{(price * quantity).toFixed(2)}</span>
            <div className="flex items-center gap-1">
              <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-md">{size}</span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className="w-2.5 h-2.5 rounded-full border border-gray-200"
                style={{
                  backgroundColor: color === 'N/A' ? '#d1d5db' : color.toLowerCase(),
                }}
              />
              <span className="capitalize truncate">{color}</span>
            </div>
          </div>

          {/* Bottom: Stock and Controls */}
          <div className="flex justify-between items-center">
            <p
              className={`text-xs ${
                stock === 0 ? 'text-red-500' : isLowStock ? 'text-orange-500' : 'text-gray-500'
              }`}
            >
              {stock === 0 ? 'Out of Stock' : isLowStock ? `${stock} left` : `${stock} in stock`}
            </p>
            <div className="flex items-center gap-2">
              {!isSavedForLater && (
                <div className="flex items-center bg-gray-50 rounded-full border border-gray-100">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      stopPropagation(e);
                      handleQuantityChange(quantity - 1);
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                    disabled={quantity <= 1 || stock === 0}
                    aria-label="Decrease quantity"
                  >
                    -
                  </motion.button>
                  <span className="text-xs font-medium text-gray-800 w-8 text-center">
                    {quantity}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      stopPropagation(e);
                      handleQuantityChange(quantity + 1);
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                    disabled={stock === 0 || quantity >= stock}
                    aria-label="Increase quantity"
                  >
                    +
                  </motion.button>
                </div>
              )}
              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSaveForLater}
                  className={`w-7 h-7 flex items-center justify-center rounded-full bg-white border ${
                    isSavedForLater
                      ? 'text-amber-500 border-amber-100 hover:bg-amber-50'
                      : 'text-gray-500 border-gray-100 hover:bg-blue-50 hover:text-blue-500'
                  } transition-all`}
                  title={isSavedForLater ? 'Move to Cart' : 'Save for Later'}
                >
                  {isSavedForLater ? <IoSave size={14} /> : <IoSaveOutline size={14} />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1, color: '#ef4444' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleRemove}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-gray-500 border border-gray-100 hover:bg-red-50 transition-all"
                  title="Remove"
                >
                  <IoTrashOutline size={14} />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CartProductCard;