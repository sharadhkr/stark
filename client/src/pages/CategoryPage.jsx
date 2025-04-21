import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../axios';
import toast, { Toaster } from 'react-hot-toast';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import SearchBar from '../Components/SearchBar';
import agroLogo from '../assets/logo.png';
import agrotade from '../assets/logoname.png'; // Assuming you have this asset
import { motion } from 'framer-motion';
import { MdArrowBack, MdFilterList, MdLogout } from 'react-icons/md';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const filterModalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.3 } },
};

const CategoryPage = () => {
  const { categoryName } = useParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000]); // Default price range
  const [sortOption, setSortOption] = useState('default'); // Sorting option
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`/api/user/auth/products?category=${categoryName}`);
        const fetchedProducts = response.data.products || [];
        setProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products: ' + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryName]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      applyFilters(products); // Reset to all products with current filters
      return;
    }

    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    applyFilters(filtered);
    toast.success(`Showing results for: ${searchQuery}`);
  };

  // Apply filters and sorting
  const applyFilters = (baseProducts = products) => {
    let filtered = [...baseProducts];

    // Apply price filter
    filtered = filtered.filter(
      (product) => product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Apply sorting
    switch (sortOption) {
      case 'price-low-high':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high-low':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name-a-z':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-z-a':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
    setShowFilter(false);
    toast.success('Filters applied!');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200">
      <Toaster position="top-center" toastOptions={{ duration: 1500 }} />


      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          {/* Search and Filter Bar */}
          <div className="flex h-fit gap-2 items-center justify-center ">
            <SearchBar
              onSearch={handleSearch}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              placeholder={`Search in ${categoryName}...`}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilter(true)}
              className=" p-4 mb-6 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors duration-200 shadow-md"
            >
              <MdFilterList size={20} />
            </motion.button>
          </div>

          {/* Category Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6 capitalize flex items-center gap-2">
            <span className="opacity-40">{categoryName} Products</span>
            <span className="text-blue-600 text-lg">({filteredProducts.length})</span>
          </h1>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {Array(5)
                .fill()
                .map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-10 bg-blue-50 rounded-3xl shadow-lg">
              <p className="text-gray-600 text-lg">No products found in this category.</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-600 transition-all duration-300 shadow-md"
              >
                Back to Home
              </motion.button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {filteredProducts.map((product) => (
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
          )}
        </motion.div>

        {/* Filter Modal */}
        {showFilter && (
          <motion.div
            variants={filterModalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 bg-gray-600/10 backdrop-blur-lg bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-blue-50 p-6 rounded-3xl shadow-xl w-80">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter Products</h3>

              {/* Price Range Filter */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
                  className="w-full mb-2"
                />
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
                  className="w-full"
                />
              </div>

              {/* Sort Options */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-400"
                >
                  <option value="default">Default</option>
                  <option value="price-low-high">Price: Low to High</option>
                  <option value="price-high-low">Price: High to Low</option>
                  <option value="name-a-z">Name: A to Z</option>
                  <option value="name-z-a">Name: Z to A</option>
                </select>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFilter(false)}
                  className="px-4 py-2 bg-gray-200 rounded-full hover:bg-gray-300 text-gray-700"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => applyFilters()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                >
                  Apply
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default CategoryPage;