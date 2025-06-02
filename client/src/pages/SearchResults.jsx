import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../useraxios';
import toast, { Toaster } from 'react-hot-toast';
import SearchBar from '../Components/SearchBar';
import ProductCard from '../Components/ProductCard';
import ProductCardSkeleton from '../Components/ProductCardSkeleton';
import agroLogo from '../assets/logo.png';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaShoppingBag, FaTag, FaStar } from 'react-icons/fa';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const SearchResults = () => {
  const [results, setResults] = useState({ products: [], categories: [], sellers: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Extract query from URL
  const query = new URLSearchParams(location.search).get('q') || '';

  // Update search query state when URL query changes
  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  // Fetch search results
  useEffect(() => {
    const fetchSearchResults = async () => {
      const token = localStorage.getItem('token');
      if (!token || !query) {
        setResults({ products: [], categories: [], sellers: [] });
        setLoading(false);
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

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

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

  const CategoryCard = ({ item }) => (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="bg-white rounded-3xl shadow-xl p-4 flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-300"
      onClick={() => handleItemClick('category', item)}
    >
      <h3 className="text-sm font-semibold text-gray-800 text-center truncate w-full">
        {item.name}
      </h3>
    </motion.div>
  );

  const SellerCard = ({ item }) => (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="bg-white rounded-3xl shadow-xl p-4 flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-300"
      onClick={() => handleItemClick('seller', item)}
    >
      <img
        src={item.profilePicture || agroLogo}
        alt={item.name}
        className="w-20 h-20 rounded-full object-cover border-2 border-blue-300 mb-3"
        onError={(e) => (e.target.src = agroLogo)}
      />
      <h3 className="text-sm font-semibold text-gray-800 text-center truncate w-full">
        {item.name} {item.shopName && `(${item.shopName})`}
      </h3>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-2 py-6">
        <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
        <main className="max-w-7xl mx-auto">
          <SearchBar
            onSearch={() => {}}
            searchQuery=""
            setSearchQuery={() => {}}
            placeholder="Search products..."
          />
          <div className="flex items-center gap-4 mt-4">
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
            {Array(5)
              .fill()
              .map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-2 py-6">
      <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
      <main className="max-w-7xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          {/* Header and Search Bar */}
          <div className="w-full max-w-md mb-8">
            <SearchBar
              onSearch={handleSearch}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              placeholder="Search products, categories, or sellers..."
            />
          </div>

          {/* No Results */}
          {results.products.length === 0 &&
            results.categories.length === 0 &&
            results.sellers.length === 0 && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="text-center py-10 bg-white rounded-3xl shadow-xl"
              >
                <p className="text-gray-600 text-lg mb-4">
                  No results found for "{query}"
                </p>
                <p className="text-gray-500 mb-4">
                  Try a different search term.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/')}
                  className="bg-blue-500 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-600 transition-all duration-300"
                >
                  Back to Home
                </motion.button>
              </motion.div>
            )}

          {/* Products Section */}
          {results.products.length > 0 && (
            <motion.section
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="mb-10"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {results.products.map((product) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    whileHover={{ scale: 1.03 }}
                    className="w-full"
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Categories Section */}
          {results.categories.length > 0 && (
            <motion.section
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="mb-10"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {results.categories.map((category) => (
                  <CategoryCard key={category._id} item={category} />
                ))}
              </div>
            </motion.section>
          )}

          {/* Sellers Section */}
          {results.sellers.length > 0 && (
            <motion.section
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="mb-10"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {results.sellers.map((seller) => (
                  <SellerCard key={seller._id} item={seller} />
                ))}
              </div>
            </motion.section>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default SearchResults;