import React, { useMemo, useRef, useContext } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { DataContext } from '../../App';

const DEFAULT_IMAGE = 'https://your-server.com/generic-combo-placeholder.jpg';

const ComboOfferCard = React.memo(({ offer }) => {
  if (!offer || !offer._id || !offer.products || offer.products.length < 2) {
    return null;
  }

  return (
    <Link to={`/combo/${offer._id}`} aria-label={`View combo offer ${offer.name}`}>
      <motion.div
        className="relative flex flex-col items-center flex-shrink-0 w-52 bg-slate-200 rounded-2xl transform transition duration-300 ease-in-out hover:scale-105"
        whileHover={{ scale: 1.05 }}
      >
        <div className="flex justify-center -space-x-2 mt-2 mb-1">
          {offer.products.slice(0, 2).map((product, idx) => (
            <img
              key={idx}
              src={product.images?.[0] || DEFAULT_IMAGE}
              alt={product.name || 'Product'}
              className={`w-24 h-40 object-cover rounded-xl drop-shadow-lg border-purple-100 border transform ${
                idx === 0 ? '-rotate-6' : 'rotate-6'
              }`}
              loading="lazy"
              onError={(e) => {
                if (e.target.src !== DEFAULT_IMAGE) {
                  console.warn(`Failed to load combo offer image: ${e.target.src}`);
                  e.target.src = DEFAULT_IMAGE;
                }
              }}
            />
          ))}
        </div>
        <div className="absolute bottom-0 bg-gradient-to-br from-violet-400 to-violet-500 text-white rounded-b-2xl h-12 text-center w-full">
          <h3 className="text-base font-semibold capitalize">{offer.name || 'Unnamed Combo'}</h3>
          <div className="text-sm">
            <span>{offer.discount || 0}% off </span>
            <span className="line-through mx-1 opacity-70">₹{offer.originalPrice || 0}</span>
            <span className="font-bold">₹{offer.price || 0}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
});

const ComboOfferSection = React.memo(() => {
  const { cache } = useContext(DataContext);
  const scrollRef = useRef(null);
  const normalizedOffers = useMemo(() => {
    const offers = cache.comboOffers?.data || [];
    if (process.env.NODE_ENV === 'development') {
      console.log('Raw offers from cache:', offers);
    }
    const filteredOffers = offers
      .filter((offer) => offer && offer._id && typeof offer._id === 'string' && offer._id.trim() !== '' && !offer.disabled)
      .map((offer) => ({
        ...offer,
        products: (offer.products || []).filter((p) => p && p.images?.length > 0).map((p) => ({
          ...p,
          images: p.images.map((img) => img || DEFAULT_IMAGE),
        })),
      }))
      .filter((offer) => offer.products.length >= 2);
    if (process.env.NODE_ENV === 'development') {
      console.log('Normalized offers:', filteredOffers);
    }
    return filteredOffers;
  }, [cache.comboOffers]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -224, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 224, behavior: 'smooth' });
    }
  };

  if (normalizedOffers.length === 0) {
    return (
      <div className="w-full px-2 mb-5 text-center">
        <p className="text-gray-500" aria-live="polite">
          No combo offers available
        </p>
      </div>
    );
  }

  return (
    <div className="w-full px-2 mb-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-700">Special Combo Offers</h2>
        {normalizedOffers.length > 1 && (
          <div className="flex gap-2">
            <button
              onClick={scrollLeft}
              className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"
              aria-label="Scroll left"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={scrollRight}
              className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"
              aria-label="Scroll right"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
      <motion.div
        ref={scrollRef}
        className="flex gap-4 mt-2 overflow-x-auto overflow-y-hidden scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {normalizedOffers.map((offer) => (
          <ComboOfferCard key={offer._id} offer={offer} />
        ))}
      </motion.div>
    </div>
  );
});

export default ComboOfferSection;