import React, { useState, useEffect, useRef, useMemo, useCallback, useContext } from 'react';
import { FaArrowRight, FaSearch, FaTimes, FaFire, FaStar, FaTag, FaShoppingBag, FaTrash, FaUser } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from '../useraxios';
import toast from 'react-hot-toast';
import PropTypes from 'prop-types';
import { DataContext } from '../../App';
import logo from '../../assets/slogo.png';
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const slideDown = {
  hidden: { opacity: 0, y: -20, height: 0 },
  visible: { opacity: 1, y: 0, height: 'auto', transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, height: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

const DEFAULT_IMAGE = logo;

const SearchBar = React.memo(({ placeholder = "Search for products, sellers, or categories..." }) => {
  const { cache, updateCache } = useContext(DataContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const token = localStorage.getItem('token');

  const suggestions = useMemo(() => cache.searchSuggestions?.data || {
    recentSearches: [],
    categories: [],
    sellers: [],
    products: [],
  }, [cache.searchSuggestions]);

  const trending = useMemo(() => cache.trendingSearches?.data || {
    trendingSearches: [],
    topSellers: [],
    topCategories: [],
    topProducts: [],
  }, [cache.trendingSearches]);

  const validateSearches = useCallback((searches) => {
    if (!Array.isArray(searches)) return [];
    return searches
      .map((item) => (typeof item === 'string' ? item : item?.query))
      .filter((item) => typeof item === 'string');
  }, []);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (token) saveSearch();
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    setIsExpanded(false);
  }, [searchQuery, token, navigate]);

  const saveSearch = useCallback(() => {
    if (!token || !searchQuery.trim()) return;
    axios
      .post('/api/user/auth/search/recent', { query: searchQuery }, { headers: { Authorization: `Bearer ${token}` } })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Save Search Error:', err);
        }
      });
  }, [searchQuery, token]);

  const handleQuickSearch = useCallback((type, item) => {
    let query = '';
    switch (type) {
      case 'recent':
      case 'trending':
        query = item;
        setSearchQuery(item);
        navigate(`/search?q=${encodeURIComponent(item)}`);
        break;
      case 'category':
        navigate(`/category/${item._id}`);
        break;
      case 'seller':
        navigate(`/seller/${item._id}`);
        break;
      case 'product':
        navigate(`/product/${item._id}`);
        break;
      default:
        break;
    }
    if (query && token) saveSearch();
    setIsExpanded(false);
  }, [navigate, token, saveSearch]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    inputRef.current?.focus();
  }, []);

  const clearAllRecent = useCallback(() => {
    if (!token) return;
    axios
      .post('/api/user/auth/search/recent', { query: '' }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        updateCache('searchSuggestions', { ...suggestions, recentSearches: [] });
        toast.success('Recent searches cleared');
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Clear Recent Error:', err);
        }
      });
  }, [token, suggestions, updateCache]);

  const removeRecentSearch = useCallback((search) => {
    if (!token) return;
    const updatedSearches = suggestions.recentSearches.filter((item) => item !== search);
    updateCache('searchSuggestions', { ...suggestions, recentSearches: updatedSearches });
    axios
      .post('/api/user/auth/search/recent', { query: search }, { headers: { Authorization: `Bearer ${token}` } })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Remove Recent Error:', err);
        }
      });
  }, [token, suggestions, updateCache]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsExpanded(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const TagItem = React.memo(({ text, onRemove, onClick }) => {
    if (typeof text !== 'string') return null;
    return (
      <div
        className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
        onClick={onClick}
      >
        <span>{text}</span>
        {onRemove && (
          <FaTimes
            className="ml-2 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label={`Remove ${text} from recent searches`}
          />
        )}
      </div>
    );
  });

  TagItem.propTypes = {
    text: PropTypes.string.isRequired,
    onRemove: PropTypes.func,
    onClick: PropTypes.func,
  };

  const BlockItem = React.memo(({ icon, text, onClick }) => (
    <div
      className="flex items-center bg-gray-50 rounded-lg p-2 mb-2 cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={onClick}
      role="button"
      aria-label={`Select ${text}`}
    >
      <div className="w-8 h-8 flex items-center justify-center bg-white rounded-md mr-2">{icon}</div>
      <span className="text-sm text-gray-700 truncate">{text}</span>
    </div>
  ));

  BlockItem.propTypes = {
    icon: PropTypes.element.isRequired,
    text: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  };

  const hasResults = useMemo(
    () =>
      suggestions.products?.length > 0 ||
      suggestions.categories?.length > 0 ||
      suggestions.sellers?.length > 0,
    [suggestions]
  );

  return (
    <div className="relative w-full">
      <div ref={searchRef} className="relative mt-4 mb-5 px-2 mx-auto z-20">
        <motion.form
          onSubmit={handleSearch}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="flex w-full items-center bg-gray-50/85 rounded-2xl shadow-md px-8 py-3 border border-gray-200"
        >
          <div className="flex w-full items-center">
            <div className="relative w-15 flex h-full rounded-full shadow-inner">
              <div className="-top-[14px] z-10 -left-8 w-32 absolute">
                <img
                  className="drop-shadow-lg w-full"
                  src={DEFAULT_IMAGE}
                  alt="Logo"
                  loading="lazy"
                  onError={(e) => {
                    if (e.target.src !== DEFAULT_IMAGE) {
                      console.warn(`Failed to load logo image: ${e.target.src}`);
                      e.target.src = DEFAULT_IMAGE;
                    }
                  }}
                />
              </div>
            </div>
            <input
              ref={inputRef}
              className="flex-1 w-[60%] ml-16 text-base font-medium text-gray-800 bg-transparent outline-none placeholder-gray-400"
              placeholder={placeholder}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              aria-label="Search input"
            />
            {searchQuery && (
              <FaTimes
                className="text-gray-500 cursor-pointer mr-3 hover:text-gray-700 transition-colors"
                onClick={clearSearch}
                aria-label="Clear search"
              />
            )}
          </div>
          <button
            type="submit"
            className="text-purple-400 text-xl drop-shadow-lg hover:text-purple-500 transition-colors"
            aria-label="Submit search"
          >
            <FaArrowRight />
          </button>
        </motion.form>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={slideDown}
              className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl mx-2 z-20 p-6 max-h-[500px] overflow-y-auto border border-gray-100"
            >
              {searchQuery.trim() ? (
                <>
                  {suggestions.products?.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <FaShoppingBag className="mr-2 text-blue-500" /> Products
                      </h3>
                      {suggestions.products.map((product) => (
                        <motion.div
                          key={product._id}
                          className="flex items-center gap-3 py-2 px-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                          onClick={() => handleQuickSearch('product', product)}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <img
                            src={product.image?.[0] || DEFAULT_IMAGE}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded-md"
                            loading="lazy"
                            onError={(e) => {
                              if (e.target.src !== DEFAULT_IMAGE) {
                                console.warn(`Failed to load product image: ${e.target.src}`);
                                e.target.src = DEFAULT_IMAGE;
                              }
                            }}
                          />
                          <span className="text-sm text-gray-700">{product.name}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {suggestions.categories?.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <FaTag className="mr-2 text-green-500" /> Categories
                      </h3>
                      {suggestions.categories.map((cat) => (
                        <BlockItem
                          key={cat._id}
                          icon={<FaTag className="text-green-500" />}
                          text={cat.name}
                          onClick={() => handleQuickSearch('category', cat)}
                        />
                      ))}
                    </div>
                  )}

                  {suggestions.sellers?.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <FaStar className="mr-2 text-yellow-500" /> Sellers
                      </h3>
                      {suggestions.sellers.map((seller) => (
                        <BlockItem
                          key={seller._id}
                          icon={<FaUser className="text-yellow-500" />}
                          text={`${seller.name} ${seller.shopName ? `(${seller.shopName})` : ''}`}
                          onClick={() => handleQuickSearch('seller', seller)}
                        />
                      ))}
                    </div>
                  )}

                  {!hasResults && (
                    <p className="text-gray-500 text-center py-4" aria-live="polite">
                      No results found
                    </p>
                  )}

                  {hasResults && (
                    <>
                      {token && suggestions.recentSearches?.length > 0 && (
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                              <FaSearch className="mr-2 text-gray-500" /> Recent Searches
                            </h3>
                            <button
                              className="text-xs text-red-500 hover:text-red-600 flex items-center transition-colors"
                              onClick={clearAllRecent}
                              aria-label="Clear all recent searches"
                            >
                              <FaTrash className="mr-1" /> Clear All
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {suggestions.recentSearches.map((search, index) => (
                              <TagItem
                                key={index}
                                text={search}
                                onRemove={() => removeRecentSearch(search)}
                                onClick={() => handleQuickSearch('recent', search)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {trending.trendingSearches?.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                            <FaFire className="mr-2 text-red-500" /> Trending Searches
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {trending.trendingSearches.map((search, index) => (
                              <TagItem
                                key={index}
                                text={search}
                                onClick={() => handleQuickSearch('trending', search)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  {token && suggestions.recentSearches?.length > 0 && (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                          <FaSearch className="mr-2 text-gray-500" /> Recent Searches
                        </h3>
                        <button
                          className="text-xs text-red-500 hover:text-red-600 flex items-center transition-colors"
                          onClick={clearAllRecent}
                          aria-label="Clear all recent searches"
                        >
                          <FaTrash className="mr-1" /> Clear All
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.recentSearches.map((search, index) => (
                          <TagItem
                            key={index}
                            text={search}
                            onRemove={() => removeRecentSearch(search)}
                            onClick={() => handleQuickSearch('recent', search)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {trending.trendingSearches?.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <FaFire className="mr-2 text-red-500" /> Trending Searches
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {trending.trendingSearches.map((search, index) => (
                          <TagItem
                            key={index}
                            text={search}
                            onClick={() => handleQuickSearch('trending', search)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {trending.topCategories?.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <FaTag className="mr-2 text-green-500" /> Top Categories
                      </h3>
                      {trending.topCategories.map((cat) => (
                        <BlockItem
                          key={cat._id}
                          icon={<FaTag className="text-green-500" />}
                          text={cat.name}
                          onClick={() => handleQuickSearch('category', cat)}
                        />
                      ))}
                    </div>
                  )}

                  {trending.topSellers?.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <FaStar className="mr-2 text-yellow-500" /> Top Sellers
                      </h3>
                      {trending.topSellers.map((seller) => (
                        <BlockItem
                          key={seller._id}
                          icon={<FaUser className="text-yellow-500" />}
                          text={`${seller.name} ${seller.shopName ? `(${seller.shopName})` : ''}`}
                          onClick={() => handleQuickSearch('seller', seller)}
                        />
                      ))}
                    </div>
                  )}

                  {trending.topProducts?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <FaShoppingBag className="mr-2 text-blue-500" /> Top Products
                      </h3>
                      {trending.topProducts.map((product) => (
                        <motion.div
                          key={product._id}
                          className="flex items-center gap-3 py-2 px-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                          onClick={() => handleQuickSearch('product', product)}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <img
                            src={product.image?.[0] || DEFAULT_IMAGE}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded-md"
                            loading="lazy"
                            onError={(e) => {
                              if (e.target.src !== DEFAULT_IMAGE) {
                                console.warn(`Failed to load product image: ${e.target.src}`);
                                e.target.src = DEFAULT_IMAGE;
                              }
                            }}
                          />
                          <span className="text-sm text-gray-700">{product.name}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="absolute w-full z-0 opacity-40 top-0 left-0 flex items-center justify-center blur-xl">
        <div className="w-[30%] h-20 bg-purple-400"></div>
        <div className="w-[40%] h-20 skew-x-12 bg-pink-400"></div>
        <div className="w-[30%] h-20 bg-yellow-300"></div>
      </div>
    </div>
  );
});

SearchBar.propTypes = {
  placeholder: PropTypes.string,
};

export default SearchBar;