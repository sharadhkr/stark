// import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
// import { motion } from 'framer-motion';
// import { Link } from 'react-router-dom';
// import axios from '../useraxios';
// import toast from 'react-hot-toast';
// import { DataContext } from '../../App';

// // ComboOfferCard Component
// const ComboOfferCard = React.memo(({ offer }) => {
//   return (
//     <Link to={`/combo/${offer._id}`}>
//       <motion.div
//         className="relative flex flex-col items-center flex-shrink-0 w-52 bg-slate-200 rounded-2xl transform transition duration-300 ease-in-out hover:scale-105"
//         whileHover={{ scale: 1.05 }}
//       >
//         <div className="flex justify-center -space-x-2 mt-2 mb-1">
//           {offer.products.slice(0, 2).map((product, idx) => (
//             <img
//               key={idx}
//               src={product.images[0] || 'https://via.placeholder.com/150'}
//               alt={product.name}
//               className={`w-24 h-40 object-cover rounded-xl drop-shadow-lg border-purple-100 border transform ${
//                 idx === 0 ? '-rotate-6' : 'rotate-6'
//               }`}
//               loading="lazy"
//             />
//           ))}
//         </div>
//         <div className="absolute bottom-0 bg-gradient-to-br from-violet-400 to-violet-500 text-white rounded-b-2xl h-12 text-center w-full">
//           <h3 className="text-base font-semibold capitalize">{offer.name}</h3>
//           <div className="text-sm">
//             <span>{offer.discount}% off </span>
//             <span className="line-through mx-1 opacity-70">₹{offer.originalPrice}</span>
//             <span className="font-bold">₹{offer.price}</span>
//           </div>
//         </div>
//       </motion.div>
//     </Link>
//   );
// });

// // Main ComboOfferSection Component
// const ComboOfferSection = React.memo(() => {
//   const { cache, updateCache, isDataStale } = useContext(DataContext);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const scrollRef = useRef(null);

//   // Normalize combo offers
//   const normalizedOffers = useMemo(() => {
//     const offers = cache.comboOffers?.data || [];
//     return offers
//       .filter((offer) => offer && offer._id && !offer.disabled)
//       .map((offer) => ({
//         ...offer,
//         products: offer.products.filter((p) => p && p.images?.length > 0),
//       }))
//       .filter((offer) => offer.products.length > 0);
//   }, [cache.comboOffers]);

//   // Fetch combo offers if cache is stale or empty
//   useEffect(() => {
//     const fetchComboOffers = async () => {
//       if (!isDataStale(cache.comboOffers?.timestamp) && normalizedOffers.length > 0) {
//         return; // Use cached data if fresh
//       }

//       setLoading(true);
//       setError(null);
//       try {
//         const response = await axios.get('/api/admin/auth/combo-offers/active');
//         const comboOffers = response.data.comboOffers || [];
//         updateCache('comboOffers', comboOffers);
//       } catch (error) {
//         console.error('Error fetching combo offers:', error);
//         const errorMsg = error.response?.data?.message || 'Failed to load combo offers';
//         setError(errorMsg);
//         toast.error(errorMsg);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchComboOffers();
//   }, [cache.comboOffers?.timestamp, isDataStale, updateCache]);

//   // Scroll navigation
//   const scrollLeft = () => {
//     if (scrollRef.current) {
//       scrollRef.current.scrollBy({ left: -224, behavior: 'smooth' }); // 208px (w-52) + 16px (gap-4)
//     }
//   };

//   const scrollRight = () => {
//     if (scrollRef.current) {
//       scrollRef.current.scrollBy({ left: 224, behavior: 'smooth' });
//     }
//   };

//   // Handle no offers
//   if (!loading && normalizedOffers.length === 0 && !error) {
//     return (
//       <div className="w-full px-2 mb-5 text-center">
//         <p className="text-gray-500">No combo offers available</p>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full px-2 mb-5">
//       <div className="flex justify-between items-center">
//         <h2 className="text-xl font-bold text-gray-700">Special Combo Offers</h2>
//         {normalizedOffers.length > 1 && (
//           <div className="flex gap-2">
//             <button
//               onClick={scrollLeft}
//               className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"
//               aria-label="Scroll left"
//             >
//               <svg
//                 className="w-5 h-5"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//                 xmlns="http://www.w3.org/2000/svg"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M15 19l-7-7 7-7"
//                 />
//               </svg>
//             </button>
//             <button
//               onClick={scrollRight}
//               className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"
//               aria-label="Scroll right"
//             >
//               <svg
//                 className="w-5 h-5"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//                 xmlns="http://www.w3.org/2000/svg"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M9 5l7 7-7 7"
//                 />
//               </svg>
//             </button>
//           </div>
//         )}
//       </div>

//       {loading ? (
//         <div className="flex justify-center items-center h-36">
//           <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
//         </div>
//       ) : error ? (
//         <p className="text-gray-500 text-center py-8">{error}</p>
//       ) : (
//         <motion.div
//           ref={scrollRef}
//           className="flex gap-4 mt-2 overflow-x-auto overflow-y-hidden scrollbar-hide"
//           style={{ scrollBehavior: 'smooth' }}
//         >
//           {normalizedOffers.map((offer) => (
//             <ComboOfferCard key={offer._id} offer={offer} />
//           ))}
//         </motion.div>
//       )}
//     </div>
//   );
// });

// export default ComboOfferSection;
import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from '../useraxios';
import toast from 'react-hot-toast';
import { DataContext } from '../../App';

// ComboOfferCard Component
const ComboOfferCard = React.memo(({ offer }) => {
  if (!offer || !offer._id || !offer.products || offer.products.length < 2) {
    return null; // Skip rendering if offer is invalid or lacks enough products
  }

  return (
    <Link to={`/combo/${offer._id}`}>
      <motion.div
        className="relative flex flex-col items-center flex-shrink-0 w-52 bg-slate-200 rounded-2xl transform transition duration-300 ease-in-out hover:scale-105"
        whileHover={{ scale: 1.05 }}
      >
        <div className="flex justify-center -space-x-2 mt-2 mb-1">
          {offer.products.slice(0, 2).map((product, idx) => (
            <img
              key={idx}
              src={product.images?.[0] || 'https://via.placeholder.com/150'}
              alt={product.name || 'Product'}
              className={`w-24 h-40 object-cover rounded-xl drop-shadow-lg border-purple-100 border transform ${
                idx === 0 ? '-rotate-6' : 'rotate-6'
              }`}
              loading="lazy"
              onError={(e) => (e.target.src = 'https://via.placeholder.com/150')}
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

// Main ComboOfferSection Component
const ComboOfferSection = React.memo(() => {
  const { cache, updateCache, isDataStale } = useContext(DataContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  // Normalize combo offers
  const normalizedOffers = useMemo(() => {
    const offers = cache.comboOffers?.data || [];
    console.log('Raw offers from cache:', offers);
    const filteredOffers = offers
      .filter((offer) => {
        if (!offer || !offer._id || typeof offer._id !== 'string' || offer._id.trim() === '') {
          return false;
        }
        return offer.disabled !== true; // Default to false if disabled is undefined
      })
      .map((offer) => ({
        ...offer,
        products: (offer.products || []).filter((p) => p && p.images?.length > 0),
      }))
      .filter((offer) => offer.products.length > 0);
    console.log('Normalized offers:', filteredOffers);
    return filteredOffers;
  }, [cache.comboOffers]);

  // Fetch combo offers if cache is stale or empty
  useEffect(() => {
    const fetchComboOffers = async () => {
      if (!isDataStale(cache.comboOffers?.timestamp) && normalizedOffers.length > 0) {
        return; // Use cached data if fresh
      }

      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('/combo-offers/active');
        const comboOffers = response.data.comboOffers || [];
        console.log('Fetched combo offers:', comboOffers);
        updateCache('comboOffers', comboOffers);
      } catch (error) {
        console.error('Error fetching combo offers:', error);
        const errorMsg = error.response?.data?.message || 'Failed to load combo offers';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchComboOffers();
  }, [cache.comboOffers?.timestamp, isDataStale, updateCache]);

  // Scroll navigation
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -224, behavior: 'smooth' }); // 208px (w-52) + 16px (gap-4)
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 224, behavior: 'smooth' });
    }
  };

  // Handle no offers
  if (!loading && normalizedOffers.length === 0 && !error) {
    return (
      <div className="w-full px-2 mb-5 text-center">
        <p className="text-gray-500">No combo offers available</p>
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

      {loading ? (
        <div className="flex justify-center items-center h-36">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <p className="text-gray-500 text-center py-8">{error}</p>
      ) : (
        <motion.div
          ref={scrollRef}
          className="flex gap-4 mt-2 overflow-x-auto overflow-y-hidden scrollbar-hide"
          style={{ scrollBehavior: 'smooth' }}
        >
          {normalizedOffers.map((offer) => (
            <ComboOfferCard key={offer._id} offer={offer} />
          ))}
        </motion.div>
      )}
    </div>
  );
});

export default ComboOfferSection;