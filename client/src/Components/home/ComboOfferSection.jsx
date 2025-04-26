import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from '../useraxios';
import toast from 'react-hot-toast';

// ComboOfferCard Component
const ComboOfferCard = ({ offer }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="relative flex flex-col items-center flex-shrink-0 w-56 bg-gray-200 overflow-hidden rounded-2xl shadow-xl mb-2 transform transition duration-300 ease-in-out"
    >
      <div className="flex justify-center space-x-1 my-2">
        {offer.products.slice(0, 2).map((product, idx) => (
          <img
            key={idx}
            src={product.images[0] || 'https://via.placeholder.com/150'}
            alt={product.name}
            className={`w-24 h-40 object-cover rounded-xl shadow-xl transform ${idx === 0 ? '-rotate-6' : 'rotate-6'
              }`}
          />
        ))}
      </div>
      <div className="absolute bottom-0 bg-[#8168ff] text-white rounded-b-2xl h-14 text-center w-full">
        <h3 className="text-base font-semibold capitalize">{offer.name}</h3>
        <div className="mt-1 text-sm">
          <span>{offer.discount}% off </span>
          <span className="line-through mx-1 opacity-70">₹{offer.originalPrice}</span>
          <span className="font-bold">₹{offer.price}</span>
        </div>
      </div>
    </motion.div>
  );
};

// Main ComboOfferSection Component
const ComboOfferSection = () => {
  const [comboOffers, setComboOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchComboOffers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('/api/admin/auth/combo-offers/active');
        setComboOffers(response.data.comboOffers || []);
      } catch (error) {
        console.error('Error fetching combo offers:', error);
        setError(error.response?.data?.message || 'Failed to load combo offers');
        toast.error(error.response?.data?.message || 'Failed to load combo offers');
      } finally {
        setLoading(false);
      }
    };
    fetchComboOffers();
  }, []);

  return (
    <div className="my-4 px-2 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-700">Special Combo Offers</h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <p className="text-gray-500 text-center py-8">{error}</p>
        ) : comboOffers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No combo offers available.</p>
        ) : (
          <motion.div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide cursor-grab active:cursor-grabbing"
            style={{ scrollBehavior: 'smooth' }}
          >
            {comboOffers.map((offer) => (
              <ComboOfferCard key={offer._id} offer={offer} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ComboOfferSection;
