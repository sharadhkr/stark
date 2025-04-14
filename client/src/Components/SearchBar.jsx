import React, { useState, useEffect, useRef } from 'react';
import { FaArrowRight, FaSearch, FaTimes, FaFire, FaStar, FaTag, FaShoppingBag, FaTrash, FaUser } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from '../useraxios';
import toast from 'react-hot-toast';
import agroLogo from '../assets/logo.png';
import sLogo from '../assets/slogo.png';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const expandVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

const SearchBar = ({ placeholder = "Search for products, sellers, or categories..." }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState({
    recentSearches: [],
    categories: [],
    sellers: [],
    products: [],
  });
  const [trending, setTrending] = useState({
    trendingSearches: [],
    topSellers: [],
    topCategories: [],
    topProducts: [],
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch trending data on mount
  useEffect(() => {
    const fetchTrending = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await axios.get('/api/user/auth/search/trending', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTrending({
          trendingSearches: res.data.trendingSearches || [],
          topSellers: res.data.topSellers || [],
          topCategories: res.data.topCategories || [],
          topProducts: res.data.topProducts || [],
        });
      } catch (error) {
        console.error('Fetch Trending Error:', error);
        setTrending({ trendingSearches: [], topSellers: [], topCategories: [], topProducts: [] });
      }
    };
    fetchTrending();
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    const debounce = setTimeout(() => {
      const fetchSuggestions = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        setLoading(true);
        try {
          const endpoint = searchQuery.trim() 
            ? '/api/user/auth/search/suggestions' 
            : '/api/user/auth/search/recent';
          const res = await axios.get(endpoint, {
            params: searchQuery.trim() ? { q: searchQuery } : {},
            headers: { Authorization: `Bearer ${token}` },
          });
          setSuggestions({
            recentSearches: res.data.recentSearches || [],
            categories: res.data.categories || [],
            sellers: res.data.sellers || [],
            products: res.data.products || [],
          });
        } catch (error) {
          console.error('Fetch Suggestions Error:', error);
          toast.error('Search suggestions unavailable');
          setSuggestions({ recentSearches: [], categories: [], sellers: [], products: [] });
        } finally {
          setLoading(false);
        }
      };
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Handle outside clicks and keyboard
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    saveSearch();
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    setIsExpanded(false);
  };

  const saveSearch = () => {
    axios.post(
      '/api/user/auth/search/recent',
      { query: searchQuery },
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    ).catch((err) => console.error('Save Search Error:', err));
  };

  const handleQuickSearch = (type, item) => {
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
    if (query) saveSearch();
    setIsExpanded(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const clearAllRecent = () => {
    axios.post(
      '/api/user/auth/search/recent',
      { query: '' },
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    ).then(() => {
      setSuggestions((prev) => ({ ...prev, recentSearches: [] }));
      toast.success('Recent searches cleared');
    }).catch((err) => console.error('Clear Recent Error:', err));
  };

  const removeRecentSearch = (search) => {
    const updatedSearches = suggestions.recentSearches.filter((item) => item !== search);
    setSuggestions((prev) => ({ ...prev, recentSearches: updatedSearches }));
    axios.post(
      '/api/user/auth/search/recent',
      { query: search },
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    ).catch((err) => console.error('Remove Recent Error:', err));
  };

  const TagItem = ({ text, onRemove, onClick }) => (
    <div
      className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-200"
      onClick={onClick}
    >
      <span>{text}</span>
      {onRemove && (
        <FaTimes
          className="ml-2 text-gray-500 cursor-pointer hover:text-gray-700"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      )}
    </div>
  );

  const BlockItem = ({ icon, text, onClick }) => (
    <div
      className="flex items-center bg-gray-50 rounded-lg p-2 mb-2 cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={onClick}
    >
      <div className="w-8 h-8 flex items-center justify-center bg-white rounded-md mr-2">
        {icon}
      </div>
      <span className="text-sm text-gray-700 truncate">{text}</span>
    </div>
  );

  const hasResults = () =>
    (Array.isArray(suggestions.products) && suggestions.products.length > 0) ||
    (Array.isArray(suggestions.categories) && suggestions.categories.length > 0) ||
    (Array.isArray(suggestions.sellers) && suggestions.sellers.length > 0);

  return (
    <div ref={searchRef} className="relative mb-6 max-w-xl mx-auto z-20">
      <motion.form
        onSubmit={handleSearch}
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex w-full items-center bg-gray-50 rounded-2xl shadow-md px-4 py-3 border border-gray-200"
      >
        <div className="flex w-full items-center">
          <div className="flex p-2 bg-blue-100 rounded-full shadow-[inset_0px_3px_15px_-10px] mr-3">
            <FaSearch size={18} className="text-blue-500" />
          </div>
          <input
            ref={inputRef}
            className="flex-1 text-base font-medium text-gray-800 bg-transparent outline-none placeholder-gray-400"
            placeholder={placeholder}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsExpanded(true)}
          />
          {searchQuery && (
            <FaTimes
              className="text-gray-500 cursor-pointer mr-3"
              onClick={clearSearch}
            />
          )}
        </div>
        <button type="submit" className="text-blue-500 text-xl hover:text-blue-600">
          <FaArrowRight />
        </button>
      </motion.form>

      {isExpanded && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={expandVariants}
          className="absolute left-0 right-0 mt-2 bg-blue-50/40 backdrop-blur-xl rounded-2xl shadow-xl max-w-xl mx-auto z-20 p-6 max-h-[400px] overflow-y-auto border border-gray-100"
        >
          {loading && searchQuery.trim() ? (
            <p className="text-gray-500 text-center py-4">Searching...</p>
          ) : searchQuery.trim() ? (
            <>
              {Array.isArray(suggestions.products) && suggestions.products.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <FaShoppingBag className="mr-2 text-blue-500" /> Products
                  </h3>
                  {suggestions.products.map((product) => (
                    <div
                      key={product._id}
                      className="flex items-center gap-3 py-2 px-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                      onClick={() => handleQuickSearch('product', product)}
                    >
                      <img
                        src={product.image?.[0] || agroLogo}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded-md"
                        onError={(e) => (e.target.src = agroLogo)}
                      />
                      <span className="text-sm text-gray-700">{product.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {Array.isArray(suggestions.categories) && suggestions.categories.length > 0 && (
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

              {Array.isArray(suggestions.sellers) && suggestions.sellers.length > 0 && (
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

              {!hasResults() && !loading && (
                <p className="text-gray-500 text-center py-4">No results found</p>
              )}

              {hasResults() && (
                <>
                  {Array.isArray(suggestions.recentSearches) && suggestions.recentSearches.length > 0 && (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                          <FaSearch className="mr-2 text-gray-500" /> Recent Searches
                        </h3>
                        <button
                          className="text-xs text-red-500 hover:text-red-600 flex items-center"
                          onClick={clearAllRecent}
                        >
                          <FaTrash className="mr-1" /> Clear All
                        </button>
                      </div>
                      <div className="flex flex-wrap">
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

                  {Array.isArray(trending.trendingSearches) && trending.trendingSearches.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <FaFire className="mr-2 text-red-500" /> Trending Searches
                      </h3>
                      <div className="flex flex-wrap">
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

                  {Array.isArray(trending.topCategories) && trending.topCategories.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <FaTag className="mr2 text-green-500" /> Top Categories
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

                  {Array.isArray(trending.topSellers) && trending.topSellers.length > 0 && (
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

                  {Array.isArray(trending.topProducts) && trending.topProducts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <FaShoppingBag className="mr-2 text-blue-500" /> Top Products
                      </h3>
                      {trending.topProducts.map((product) => (
                        <div
                          key={product._id}
                          className="flex items-center gap-3 py-2 px-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                          onClick={() => handleQuickSearch('product', product)}
                        >
                          <img
                            src={product.image?.[0] || agroLogo}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded-md"
                            onError={(e) => (e.target.src = agroLogo)}
                          />
                          <span className="text-sm text-gray-700">{product.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              {Array.isArray(suggestions.recentSearches) && suggestions.recentSearches.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                      <FaSearch className="mr-2 text-gray-500" /> Recent Searches
                    </h3>
                    <button
                      className="text-xs text-red-500 hover:text-red-600 flex items-center"
                      onClick={clearAllRecent}
                    >
                      <FaTrash className="mr-1" /> Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap">
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

              {Array.isArray(trending.trendingSearches) && trending.trendingSearches.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <FaFire className="mr-2 text-red-500" /> Trending Searches
                  </h3>
                  <div className="flex flex-wrap">
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

              {Array.isArray(trending.topCategories) && trending.topCategories.length > 0 && (
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

              {Array.isArray(trending.topSellers) && trending.topSellers.length > 0 && (
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

              {Array.isArray(trending.topProducts) && trending.topProducts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <FaShoppingBag className="mr-2 text-blue-500" /> Top Products
                  </h3>
                  {trending.topProducts.map((product) => (
                    <div
                      key={product._id}
                      className="flex items-center gap-3 py-2 px-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                      onClick={() => handleQuickSearch('product', product)}
                    >
                      <img
                        src={product.image?.[0] || agroLogo}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded-md"
                        onError={(e) => (e.target.src = agroLogo)}
                      />
                      <span className="text-sm text-gray-700">{product.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default SearchBar;

// import React, { useState, useEffect, useRef } from 'react';
// import { FaArrowRight, FaSearch, FaTimes, FaFire, FaStar, FaTag, FaShoppingBag, FaTrash, FaUser } from 'react-icons/fa';
// import { motion } from 'framer-motion';
// import { useNavigate } from 'react-router-dom';
// import axios from '../useraxios';
// import toast from 'react-hot-toast';
// import agroLogo from '../assets/logo.png';
// import sLogo from '../assets/slogo.png';

// // Animation variants
// const fadeIn = {
//     hidden: { opacity: 0, y: 20 },
//     visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
// };

// const expandVariants = {
//     hidden: { opacity: 0, scale: 0.95 },
//     visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
// };

// const SearchBar = ({ placeholder = "Search for products, sellers, or categories..." }) => {
//     const [searchQuery, setSearchQuery] = useState('');
//     const [isExpanded, setIsExpanded] = useState(false);
//     const [suggestions, setSuggestions] = useState({
//         recentSearches: [],
//         categories: [],
//         sellers: [],
//         products: [],
//     });
//     const [trending, setTrending] = useState({
//         trendingSearches: [],
//         topSellers: [],
//         topCategories: [],
//         topProducts: [],
//     });
//     const [loading, setLoading] = useState(false);
//     const navigate = useNavigate();
//     const searchRef = useRef(null);
//     const inputRef = useRef(null);

//     // Fetch trending data on mount
//     useEffect(() => {
//         const fetchTrending = async () => {
//             const token = localStorage.getItem('token');
//             if (!token) return;
//             try {
//                 const res = await axios.get('/api/user/auth/search/trending', {
//                     headers: { Authorization: `Bearer ${token}` },
//                 });
//                 setTrending({
//                     trendingSearches: res.data.trendingSearches || [],
//                     topSellers: res.data.topSellers || [],
//                     topCategories: res.data.topCategories || [],
//                     topProducts: res.data.topProducts || [],
//                 });
//             } catch (error) {
//                 console.error('Fetch Trending Error:', error);
//                 setTrending({ trendingSearches: [], topSellers: [], topCategories: [], topProducts: [] });
//             }
//         };
//         fetchTrending();
//     }, []);

//     // Fetch suggestions with debounce
//     useEffect(() => {
//         const debounce = setTimeout(() => {
//             const fetchSuggestions = async () => {
//                 const token = localStorage.getItem('token');
//                 if (!token) return;
//                 setLoading(true);
//                 try {
//                     const endpoint = searchQuery.trim()
//                         ? '/api/user/auth/search/suggestions'
//                         : '/api/user/auth/search/recent';
//                     const res = await axios.get(endpoint, {
//                         params: searchQuery.trim() ? { q: searchQuery } : {},
//                         headers: { Authorization: `Bearer ${token}` },
//                     });
//                     setSuggestions({
//                         recentSearches: res.data.recentSearches || [],
//                         categories: res.data.categories || [],
//                         sellers: res.data.sellers || [],
//                         products: res.data.products || [],
//                     });
//                 } catch (error) {
//                     console.error('Fetch Suggestions Error:', error);
//                     toast.error('Search suggestions unavailable');
//                     setSuggestions({ recentSearches: [], categories: [], sellers: [], products: [] });
//                 } finally {
//                     setLoading(false);
//                 }
//             };
//             fetchSuggestions();
//         }, 300);

//         return () => clearTimeout(debounce);
//     }, [searchQuery]);

//     // Handle outside clicks and keyboard
//     useEffect(() => {
//         const handleClickOutside = (e) => {
//             if (searchRef.current && !searchRef.current.contains(e.target)) {
//                 setIsExpanded(false);
//             }
//         };
//         const handleEscape = (e) => {
//             if (e.key === 'Escape') setIsExpanded(false);
//         };
//         document.addEventListener('mousedown', handleClickOutside);
//         document.addEventListener('keydown', handleEscape);
//         return () => {
//             document.removeEventListener('mousedown', handleClickOutside);
//             document.removeEventListener('keydown', handleEscape);
//         };
//     }, []);

//     const handleSearch = (e) => {
//         e.preventDefault();
//         if (!searchQuery.trim()) return;
//         saveSearch();
//         navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
//         setIsExpanded(false);
//     };

//     const saveSearch = () => {
//         axios.post(
//             '/api/user/auth/search/recent',
//             { query: searchQuery },
//             { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
//         ).catch((err) => console.error('Save Search Error:', err));
//     };

//     const handleQuickSearch = (type, item) => {
//         let query = '';
//         switch (type) {
//             case 'recent':
//             case 'trending':
//                 query = item;
//                 setSearchQuery(item);
//                 navigate(`/search?q=${encodeURIComponent(item)}`);
//                 break;
//             case 'category':
//                 navigate(`/category/${item._id}`);
//                 break;
//             case 'seller':
//                 navigate(`/seller/${item._id}`);
//                 break;
//             case 'product':
//                 navigate(`/product/${item._id}`);
//                 break;
//             default:
//                 break;
//         }
//         if (query) saveSearch();
//         setIsExpanded(false);
//     };

//     const clearSearch = () => {
//         setSearchQuery('');
//         inputRef.current?.focus();
//     };

//     const clearAllRecent = () => {
//         axios.post(
//             '/api/user/auth/search/recent',
//             { query: '' },
//             { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
//         ).then(() => {
//             setSuggestions((prev) => ({ ...prev, recentSearches: [] }));
//             toast.success('Recent searches cleared');
//         }).catch((err) => console.error('Clear Recent Error:', err));
//     };

//     const removeRecentSearch = (search) => {
//         const updatedSearches = suggestions.recentSearches.filter((item) => item !== search);
//         setSuggestions((prev) => ({ ...prev, recentSearches: updatedSearches }));
//         axios.post(
//             '/api/user/auth/search/recent',
//             { query: search },
//             { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
//         ).catch((err) => console.error('Remove Recent Error:', err));
//     };

//     const TagItem = ({ text, onRemove, onClick }) => (
//         <div
//             className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-200"
//             onClick={onClick}
//         >
//             <span>{text}</span>
//             {onRemove && (
//                 <FaTimes
//                     className="ml-2 text-gray-500 cursor-pointer hover:text-gray-700"
//                     onClick={(e) => {
//                         e.stopPropagation();
//                         onRemove();
//                     }}
//                 />
//             )}
//         </div>
//     );

//     const BlockItem = ({ icon, text, onClick }) => (
//         <div
//             className="flex items-center bg-gray-50 rounded-lg p-2 mb-2 cursor-pointer hover:bg-gray-100 transition-colors"
//             onClick={onClick}
//         >
//             <div className="w-8 h-8 flex items-center justify-center bg-white rounded-md mr-2">
//                 {icon}
//             </div>
//             <span className="text-sm text-gray-700 truncate">{text}</span>
//         </div>
//     );

//     const hasResults = () =>
//         (Array.isArray(suggestions.products) && suggestions.products.length > 0) ||
//         (Array.isArray(suggestions.categories) && suggestions.categories.length > 0) ||
//         (Array.isArray(suggestions.sellers) && suggestions.sellers.length > 0);

//     return (
//         <div ref={searchRef} className="relative mb-6 max-w-xl mx-auto">
//             <motion.form
//                 onSubmit={handleSearch}
//                 initial="hidden"
//                 animate="visible"
//                 variants={fadeIn}
//                 className="flex w-full items-center bg-gray-50 rounded-2xl shadow-md px-4 py border border-gray-200"
//             >
//                 <div className="flex w-full items-center">
//                     <div className="relative w-[10%] flex bg-blue-100 rounded-full shadow-[inset_0px_3px_15px_-10px] mr-10">
//                         <div className='-top-2 z-10 -left-5 w-24 absolute'>
//                             <img className=' drop-shadow-lg w-24' src={sLogo} alt="" />
//                         </div>
//                     </div>
//                     <div className='bg-blue-200 h-14 w-[3px] mr-3 '></div>
//                     <input
//                         ref={inputRef}
//                         className="flex-1 text-base font-medium text-gray-800 bg-transparent outline-none placeholder-gray-400"
//                         placeholder={placeholder}
//                         type="text"
//                         value={searchQuery}
//                         onChange={(e) => setSearchQuery(e.target.value)}
//                         onFocus={() => setIsExpanded(true)}
//                     />
//                     {searchQuery && (
//                         <FaTimes
//                             className="text-gray-500 cursor-pointer mr-3"
//                             onClick={clearSearch}
//                         />
//                     )}
//                 </div>
//                 <button type="submit" className="text-purple-500 text-xl hover:text-purple-600">
//                     {/* <FaArrowRight /> */}
//                     <FaSearch/>
//                 </button>
//             </motion.form>

//             {isExpanded && (
//                 <motion.div
//                     initial="hidden"
//                     animate="visible"
//                     variants={expandVariants}
//                     className="absolute left-0 right-0 mt-2 bg-blue-50/40 backdrop-blur-xl rounded-2xl shadow-xl max-w-xl mx-auto z-20 p-6 max-h-[400px] overflow-y-auto border border-gray-100"
//                 >
//                     {loading && searchQuery.trim() ? (
//                         <p className="text-gray-500 text-center py-4">Searching...</p>
//                     ) : searchQuery.trim() ? (
//                         <>
//                             {Array.isArray(suggestions.products) && suggestions.products.length > 0 && (
//                                 <div className="mb-6">
//                                     <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
//                                         <FaShoppingBag className="mr-2 text-blue-500" /> Products
//                                     </h3>
//                                     {suggestions.products.map((product) => (
//                                         <div
//                                             key={product._id}
//                                             className="flex items-center gap-3 py-2 px-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
//                                             onClick={() => handleQuickSearch('product', product)}
//                                         >
//                                             <img
//                                                 src={product.image?.[0] || agroLogo}
//                                                 alt={product.name}
//                                                 className="w-10 h-10 object-cover rounded-md"
//                                                 onError={(e) => (e.target.src = agroLogo)}
//                                             />
//                                             <span className="text-sm text-gray-700">{product.name}</span>
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}

//                             {Array.isArray(suggestions.categories) && suggestions.categories.length > 0 && (
//                                 <div className="mb-6">
//                                     <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
//                                         <FaTag className="mr-2 text-green-500" /> Categories
//                                     </h3>
//                                     {suggestions.categories.map((cat) => (
//                                         <BlockItem
//                                             key={cat._id}
//                                             icon={<FaTag className="text-green-500" />}
//                                             text={cat.name}
//                                             onClick={() => handleQuickSearch('category', cat)}
//                                         />
//                                     ))}
//                                 </div>
//                             )}

//                             {Array.isArray(suggestions.sellers) && suggestions.sellers.length > 0 && (
//                                 <div className="mb-6">
//                                     <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
//                                         <FaStar className="mr-2 text-yellow-500" /> Sellers
//                                     </h3>
//                                     {suggestions.sellers.map((seller) => (
//                                         <BlockItem
//                                             key={seller._id}
//                                             icon={<FaUser className="text-yellow-500" />}
//                                             text={`${seller.name} ${seller.shopName ? `(${seller.shopName})` : ''}`}
//                                             onClick={() => handleQuickSearch('seller', seller)}
//                                         />
//                                     ))}
//                                 </div>
//                             )}

//                             {!hasResults() && !loading && (
//                                 <p className="text-gray-500 text-center py-4">No results found</p>
//                             )}

//                             {hasResults() && (
//                                 <>
//                                     {Array.isArray(suggestions.recentSearches) && suggestions.recentSearches.length > 0 && (
//                                         <div className="mb-6">
//                                             <div className="flex justify-between items-center mb-3">
//                                                 <h3 className="text-sm font-semibold text-gray-700 flex items-center">
//                                                     <FaSearch className="mr-2 text-gray-500" /> Recent Searches
//                                                 </h3>
//                                                 <button
//                                                     className="text-xs text-red-500 hover:text-red-600 flex items-center"
//                                                     onClick={clearAllRecent}
//                                                 >
//                                                     <FaTrash className="mr-1" /> Clear All
//                                                 </button>
//                                             </div>
//                                             <div className="flex flex-wrap">
//                                                 {suggestions.recentSearches.map((search, index) => (
//                                                     <TagItem
//                                                         key={index}
//                                                         text={search}
//                                                         onRemove={() => removeRecentSearch(search)}
//                                                         onClick={() => handleQuickSearch('recent', search)}
//                                                     />
//                                                 ))}
//                                             </div>
//                                         </div>
//                                     )}

//                                     {Array.isArray(trending.trendingSearches) && trending.trendingSearches.length > 0 && (
//                                         <div className="mb-6">
//                                             <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
//                                                 <FaFire className="mr-2 text-red-500" /> Trending Searches
//                                             </h3>
//                                             <div className="flex flex-wrap">
//                                                 {trending.trendingSearches.map((search, index) => (
//                                                     <TagItem
//                                                         key={index}
//                                                         text={search}
//                                                         onClick={() => handleQuickSearch('trending', search)}
//                                                     />
//                                                 ))}
//                                             </div>
//                                         </div>
//                                     )}

//                                     {Array.isArray(trending.topCategories) && trending.topCategories.length > 0 && (
//                                         <div className="mb-6">
//                                             <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
//                                                 <FaTag className="mr2 text-green-500" /> Top Categories
//                                             </h3>
//                                             {trending.topCategories.map((cat) => (
//                                                 <BlockItem
//                                                     key={cat._id}
//                                                     icon={<FaTag className="text-green-500" />}
//                                                     text={cat.name}
//                                                     onClick={() => handleQuickSearch('category', cat)}
//                                                 />
//                                             ))}
//                                         </div>
//                                     )}

//                                     {Array.isArray(trending.topSellers) && trending.topSellers.length > 0 && (
//                                         <div className="mb-6">
//                                             <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
//                                                 <FaStar className="mr-2 text-yellow-500" /> Top Sellers
//                                             </h3>
//                                             {trending.topSellers.map((seller) => (
//                                                 <BlockItem
//                                                     key={seller._id}
//                                                     icon={<FaUser className="text-yellow-500" />}
//                                                     text={`${seller.name} ${seller.shopName ? `(${seller.shopName})` : ''}`}
//                                                     onClick={() => handleQuickSearch('seller', seller)}
//                                                 />
//                                             ))}
//                                         </div>
//                                     )}

//                                     {Array.isArray(trending.topProducts) && trending.topProducts.length > 0 && (
//                                         <div>
//                                             <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
//                                                 <FaShoppingBag className="mr-2 text-blue-500" /> Top Products
//                                             </h3>
//                                             {trending.topProducts.map((product) => (
//                                                 <div
//                                                     key={product._id}
//                                                     className="flex items-center gap-3 py-2 px-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
//                                                     onClick={() => handleQuickSearch('product', product)}
//                                                 >
//                                                     <img
//                                                         src={product.image?.[0] || agroLogo}
//                                                         alt={product.name}
//                                                         className="w-10 h-10 object-cover rounded-md"
//                                                         onError={(e) => (e.target.src = agroLogo)}
//                                                     />
//                                                     <span className="text-sm text-gray-700">{product.name}</span>
//                                                 </div>
//                                             ))}
//                                         </div>
//                                     )}
//                                 </>
//                             )}
//                         </>
//                     ) : (
//                         <>
//                             {Array.isArray(suggestions.recentSearches) && suggestions.recentSearches.length > 0 && (
//                                 <div className="mb-6">
//                                     <div className="flex justify-between items-center mb-3">
//                                         <h3 className="text-sm font-semibold text-gray-700 flex items-center">
//                                             <FaSearch className="mr-2 text-gray-500" /> Recent Searches
//                                         </h3>
//                                         <button
//                                             className="text-xs text-red-500 hover:text-red-600 flex items-center"
//                                             onClick={clearAllRecent}
//                                         >
//                                             <FaTrash className="mr-1" /> Clear All
//                                         </button>
//                                     </div>
//                                     <div className="flex flex-wrap">
//                                         {suggestions.recentSearches.map((search, index) => (
//                                             <TagItem
//                                                 key={index}
//                                                 text={search}
//                                                 onRemove={() => removeRecentSearch(search)}
//                                                 onClick={() => handleQuickSearch('recent', search)}
//                                             />
//                                         ))}
//                                     </div>
//                                 </div>
//                             )}

//                             {Array.isArray(trending.trendingSearches) && trending.trendingSearches.length > 0 && (
//                                 <div className="mb-6">
//                                     <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
//                                         <FaFire className="mr-2 text-red-500" /> Trending Searches
//                                     </h3>
//                                     <div className="flex flex-wrap">
//                                         {trending.trendingSearches.map((search, index) => (
//                                             <TagItem
//                                                 key={index}
//                                                 text={search}
//                                                 onClick={() => handleQuickSearch('trending', search)}
//                                             />
//                                         ))}
//                                     </div>
//                                 </div>
//                             )}

//                             {Array.isArray(trending.topCategories) && trending.topCategories.length > 0 && (
//                                 <div className="mb-6">
//                                     <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
//                                         <FaTag className="mr-2 text-green-500" /> Top Categories
//                                     </h3>
//                                     {trending.topCategories.map((cat) => (
//                                         <BlockItem
//                                             key={cat._id}
//                                             icon={<FaTag className="text-green-500" />}
//                                             text={cat.name}
//                                             onClick={() => handleQuickSearch('category', cat)}
//                                         />
//                                     ))}
//                                 </div>
//                             )}

//                             {Array.isArray(trending.topSellers) && trending.topSellers.length > 0 && (
//                                 <div className="mb-6">
//                                     <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
//                                         <FaStar className="mr-2 text-yellow-500" /> Top Sellers
//                                     </h3>
//                                     {trending.topSellers.map((seller) => (
//                                         <BlockItem
//                                             key={seller._id}
//                                             icon={<FaUser className="text-yellow-500" />}
//                                             text={`${seller.name} ${seller.shopName ? `(${seller.shopName})` : ''}`}
//                                             onClick={() => handleQuickSearch('seller', seller)}
//                                         />
//                                     ))}
//                                 </div>
//                             )}

//                             {Array.isArray(trending.topProducts) && trending.topProducts.length > 0 && (
//                                 <div>
//                                     <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
//                                         <FaShoppingBag className="mr-2 text-blue-500" /> Top Products
//                                     </h3>
//                                     {trending.topProducts.map((product) => (
//                                         <div
//                                             key={product._id}
//                                             className="flex items-center gap-3 py-2 px-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
//                                             onClick={() => handleQuickSearch('product', product)}
//                                         >
//                                             <img
//                                                 src={product.image?.[0] || agroLogo}
//                                                 alt={product.name}
//                                                 className="w-10 h-10 object-cover rounded-md"
//                                                 onError={(e) => (e.target.src = agroLogo)}
//                                             />
//                                             <span className="text-sm text-gray-700">{product.name}</span>
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}
//                         </>
//                     )}
//                 </motion.div>
//             )}
//         </div>
//     );
// };

// export default SearchBar;