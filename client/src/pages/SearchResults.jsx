import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../useraxios';
import toast from 'react-hot-toast';
import agroLogo from '../assets/logo.png';
import { FaArrowLeft, FaShoppingBag, FaTag, FaStar } from 'react-icons/fa';
import { motion } from 'framer-motion';

const SearchResults = () => {
  const [results, setResults] = useState({ products: [], categories: [], sellers: [] });
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  // Extract query from URL
  const query = new URLSearchParams(location.search).get('q') || '';

  // Fetch search results
  useEffect(() => {
    const fetchSearchResults = async () => {
      const token = localStorage.getItem('token');
      if (!token || !query) {
        setResults({ products: [], categories: [], sellers: [] });
        return;
      }

      setLoading(true);
      try {
        const res = await axios.get('/api/user/auth/search', {
          params: { q: query },
          headers: { Authorization: `Bearer ${token}` },
        });
        setResults({
          products: res.data.products || [],
          categories: res.data.categories || [],
          sellers: res.data.sellers || [],
        });
      } catch (error) {
        console.error('Search Results Error:', error);
        toast.error('Failed to fetch search results');
        setResults({ products: [], categories: [], sellers: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchSearchResults();
  }, [query]);

  const handleItemClick = (type, item) => {
    switch (type) {
      case 'product':
        navigate(`/product/${item._id}`);
        break;
      case 'category':
        navigate(`/category/${item._id}`);
        break;
      case 'seller':
        navigate(`/seller/${item._id}`);
        break;
      default:
        break;
    }
  };

  const ResultCard = ({ item, type }) => (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="bg-blue-50 rounded-3xl shadow-xl p-4 flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-300"
      onClick={() => handleItemClick(type, item)}
    >
      {type === 'product' && (
        <img
          src={item.image?.[0] || agroLogo}
          alt={item.name}
          className="w-36 h-36 object-cover rounded-xl mb-3 drop-shadow-md"
          onError={(e) => (e.target.src = agroLogo)}
        />
      )}
      <h3 className="text-sm font-semibold text-gray-800 text-center truncate w-full opacity-80">
        {item.name}
        {type === 'seller' && item.shopName && ` (${item.shopName})`}
      </h3>
      {type === 'product' && item.sellerId && (
        <p className="text-xs text-gray-500 mt-1 flex items-center opacity-60">
          <FaStar className="mr-1 text-yellow-500" />
          {item.sellerId.name} {item.sellerId.shopName ? `(${item.sellerId.shopName})` : ''}
        </p>
      )}
    </motion.div>
  );

  const SectionSkeleton = () => (
    <div className="mb-8">
      <div className="h-8 w-1/4 bg-gray-200 rounded animate-pulse mb-4"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array(4)
          .fill()
          .map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 rounded-3xl h-48 animate-pulse"
            ></div>
          ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="p-2 bg-blue-100 rounded-full shadow-[inset_0px_3px_15px_-10px] text-gray-600 hover:text-gray-800 mr-4 transition-colors"
            >
              <FaArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold text-gray-800 opacity-80">
              Search Results for "{query}"
            </h1>
          </div>
          <p className="text-sm text-gray-600 opacity-70">
            {loading
              ? 'Loading...'
              : `${results.products.length + results.categories.length + results.sellers.length} results found`}
          </p>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-8">
            <SectionSkeleton />
            <SectionSkeleton />
            <SectionSkeleton />
          </div>
        ) : (
          <>
            {/* No Results */}
            {results.products.length === 0 &&
              results.categories.length === 0 &&
              results.sellers.length === 0 && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                  className="text-center py-16 bg-blue-50 rounded-3xl shadow-xl"
                >
                  <p className="text-gray-500 text-xl opacity-80">
                    No results found for "{query}"
                  </p>
                  <p className="text-gray-400 mt-2 opacity-70">
                    Try a different search term.
                  </p>
                </motion.div>
              )}

            {/* Results Sections */}
            {results.products.length > 0 && (
              <motion.section
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="mb-10"
              >
                <h2 className="text-2xl font-bold text-gray-500 mb-6 flex items-center gap-4">
                  <div className="flex p-2 bg-blue-100 rounded-full shadow-[inset_0px_3px_15px_-10px]">
                    <FaShoppingBag className="text-blue-500" />
                  </div>
                  <span className="opacity-40">PRODUCTS</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {results.products.map((product) => (
                    <ResultCard key={product._id} item={product} type="product" />
                  ))}
                </div>
              </motion.section>
            )}

            {results.categories.length > 0 && (
              <motion.section
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="mb-10"
              >
                <h2 className="text-2xl font-bold text-gray-500 mb-6 flex items-center gap-4">
                  <div className="flex p-2 bg-blue-100 rounded-full shadow-[inset_0px_3px_15px_-10px]">
                    <FaTag className="text-green-500" />
                  </div>
                  <span className="opacity-40">CATEGORIES</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {results.categories.map((category) => (
                    <ResultCard key={category._id} item={category} type="category" />
                  ))}
                </div>
              </motion.section>
            )}

            {results.sellers.length > 0 && (
              <motion.section
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="mb-10"
              >
                <h2 className="text-2xl font-bold text-gray-500 mb-6 flex items-center gap-4">
                  <div className="flex p-2 bg-blue-100 rounded-full shadow-[inset_0px_3px_15px_-10px]">
                    <FaStar className="text-yellow-500" />
                  </div>
                  <span className="opacity-40">SELLERS</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {results.sellers.map((seller) => (
                    <ResultCard key={seller._id} item={seller} type="seller" />
                  ))}
                </div>
              </motion.section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;