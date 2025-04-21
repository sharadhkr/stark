import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from '../useraxios';
import toast from 'react-hot-toast';
import { IoChevronForward } from 'react-icons/io5';

const ComboOfferSection = () => {
  const [comboOffers, setComboOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  // Fetch active combo offers
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
    <div className="py-6 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Special Combo Offers</h2>
          <Link
            to="/combo-offers"
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors duration-200"
            aria-label="View All Combo Offers"
          >
            <IoChevronForward size={20} className="text-gray-600" />
          </Link>
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
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 cursor-grab active:cursor-grabbing"
            style={{ scrollBehavior: 'smooth' }}
          >
            {comboOffers.map((offer) => (
              <div key={offer._id} className="flex-shrink-0 w-64 bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold text-gray-800">{offer.name}</h3>
                <div className="flex gap-2 mt-2">
                  {offer.products.map((product) => (
                    <img
                      key={product._id}
                      src={product.images[0] || 'https://via.placeholder.com/100'}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                  ))}
                </div>
                <p className="text-gray-600 mt-2">
                  Price: ${offer.price}{' '}
                  {offer.discount > 0 && (
                    <span className="text-green-500">({offer.discount}% off)</span>
                  )}
                </p>
                <Link
                  to={`/combo/${offer._id}`}
                  className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  View Offer
                </Link>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ComboOfferSection;