import React, { useMemo, useRef, useContext } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { DataContext } from '../../App';

// Utility to debounce scroll events
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

const DEFAULT_IMAGE = 'https://your-server.com/generic-combo-placeholder.jpg';

const ComboOfferCard = React.memo(({ offer }) => {
  if (!offer?._id || !offer.products || offer.products.length < 2) {
    return null;
  }

  return (
    <Link to={`/combo/${offer._id}`} aria-label={`View combo offer ${offer.name}`}>
      <motion.div
        className="flex flex-col items-center w-52 bg-slate-200 rounded-2xl hover:scale-105 transition-transform duration-300"
        whileHover={{ scale: 1.05 }}
      >
        <div className="flex justify-center -space-x-2 mt-2 -mb-4">
          {offer.products.slice(0, 2).map((product, idx) => (
            <img
              key={product._id || idx}
              src={product.images?.[0] || DEFAULT_IMAGE}
              alt={product.name || 'Product'}
              className={`w-24 h-40 object-cover rounded-xl shadow-md border drop-shadow-lg border-purple-100 ${idx === 0 ? '-rotate-6' : 'rotate-6'}`}
              loading={idx === 0 ? 'eager' : 'lazy'}
              decoding="async"
              onError={(e) => {
                if (e.target.src !== DEFAULT_IMAGE) {
                  e.target.src = DEFAULT_IMAGE;
                }
              }}
            />
          ))}
        </div>
        <div className="bg-gradient-to-br z-10 from-violet-400 to-violet-500 text-white rounded-b-2xl h-12 text-center w-full flex flex-col justify-center">
          <h3 className="text-base font-semibold capitalize truncate">{offer.name || 'Unnamed Combo'}</h3>
          <div className="text-sm flex items-center justify-center gap-1">
            <span>{offer.discount || 0}% off</span>
            <span className="line-through opacity-70">₹{offer.originalPrice || 0}</span>
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
    return (cache.comboOffers?.data || [])
      .filter((offer) => offer?._id && !offer.disabled && offer.products?.length >= 2)
      .map((offer) => ({
        ...offer,
        products: (offer.products || []).filter((p) => p?.images?.length > 0).map((p) => ({
          ...p,
          images: p.images.map((img) => img || DEFAULT_IMAGE),
        })),
      }));
  }, [cache.comboOffers?.data]); // Optimized dependency

  const scrollLeft = debounce(() => {
    scrollRef.current?.scrollBy({ left: -224, behavior: 'smooth' });
  }, 100);

  const scrollRight = debounce(() => {
    scrollRef.current?.scrollBy({ left: 224, behavior: 'smooth' });
  }, 100);

  if (!normalizedOffers.length) {
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
              className="p-1 bg-gray-200 rounded-full hover:bg-gray-300 focus:outline-none"
              aria-label="Scroll left"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={scrollRight}
              className="p-1 bg-gray-200 rounded-full hover:bg-gray-300 focus:outline-none"
              aria-label="Scroll right"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
      <motion.div
        ref={scrollRef}
        className="flex gap-4 mt-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
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