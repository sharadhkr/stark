import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../useraxios';
import toast from 'react-hot-toast';
import agroLogo from '../assets/logo.png';
import { FaShoppingBag, FaTag, FaStar, FaArrowLeft } from 'react-icons/fa';

const SearchResults = () => {
  const [results, setResults] = useState({ products: [] }); // Only products for now, can expand later
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Extract query from URL
  const query = new URLSearchParams(location.search).get('q') || '';

  // Fetch search results
  useEffect(() => {
    const fetchSearchResults = async () => {
      const token = localStorage.getItem('token');
      if (!token || !query) {
        setResults({ products: [] });
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
        });
      } catch (error) {
        console.error('Search Results Error:', error);
        toast.error('Failed to fetch search results');
        setResults({ products: [] });
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
      case 'seller':
        navigate(`/seller/${item.sellerId._id}`);
        break;
      default:
        break;
    }
  };

  const ResultCard = ({ item, type }) => (
    <div
      className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => handleItemClick(type, item)}
    >
      <img
        src={item.image?.[0] || agroLogo}
        alt={item.name}
        className="w-32 h-32 object-cover rounded-md mb-3"
        onError={(e) => (e.target.src = agroLogo)}
      />
      <h3 className="text-sm font-semibold text-gray-800 text-center truncate w-full">{item.name}</h3>
      {item.sellerId && (
        <p className="text-xs text-gray-500 mt-1 flex items-center">
          <FaStar className="mr-1 text-yellow-500" />
          {item.sellerId.name} {item.sellerId.shopName ? `(${item.sellerId.shopName})` : ''}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-800 mr-4"
            >
              <FaArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              Search Results for "{query}"
            </h1>
          </div>
          <p className="text-sm text-gray-600">
            {loading ? 'Loading...' : `${results.products.length} results found`}
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Loading results...</p>
          </div>
        ) : (
          <>
            {/* No Results */}
            {results.products.length === 0 && !loading && (
              <div className="text-center py-10">
                <p className="text-gray-500 text-lg">No results found for "{query}"</p>
                <p className="text-gray-400 mt-2">Try a different search term.</p>
              </div>
            )}

            {/* Results Grid */}
            {results.products.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {results.products.map((product) => (
                  <ResultCard key={product._id} item={product} type="product" />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;