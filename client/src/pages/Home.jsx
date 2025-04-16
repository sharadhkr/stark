
import React, { useState, useEffect } from 'react';
import agroLogo from '../assets/logo.png';
import agrotade from '../assets/logoname.png';
import { FaSearch, FaShoppingCart, FaFilter, FaStore } from 'react-icons/fa';
import ProductCard from '../Components/wdsefs';
import CategoryCard from '../components/CategoryCard';
import SellerCard from '../components/SellerCard';
import axios from '../useraxios'; // Using the custom axios instance
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SearchBar from '../components/SearchBar';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      setFilteredProducts(products);
      return;
    }
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
    toast.success(`Showing results for: ${searchQuery}`);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        // The axios instance will automatically add the token from localStorage
        const productsRes = await axios.get('/api/user/auth/products');
        if (isMounted) {
          setProducts(productsRes.data.products || []);
          setFilteredProducts(productsRes.data.products || []);
        }

        const sellersRes = await axios.get('/api/user/auth/sellers');
        if (isMounted) setSellers(sellersRes.data.sellers || []);

        const categoriesRes = await axios.get('/api/categories');
        if (isMounted) setCategories(categoriesRes.data.categories || []);
      } catch (error) {
        // Error details are already logged by the response interceptor
        toast.error('Failed to fetch data: ' + (error.response?.data?.message || error.message));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Apply filters
  const applyFilters = () => {
    let filtered = [...products];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    filtered = filtered.filter(product =>
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    filtered.sort((a, b) => a.price - b.price);
    setFilteredProducts(filtered);
    setShowFilter(false);
    toast.success('Filters applied!');
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const CategorySkeleton = () => (
    <div className="min-w-[70px] h-18 bg-gray-200 rounded-lg animate-pulse m-2"></div>
  );

  const SellerSkeleton = () => (
    <div className="min-w-[80px] h-24 rounded-full bg-gray-200 animate-pulse m-2"></div>
  );

  const ProductSkeleton = () => (
    <div className="w-full h-64 bg-gray-200 rounded-lg animate-pulse"></div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200">
      <Toaster position="top-center" toastOptions={{ duration: 1500 }} />

      <main className="max-w-7xl mx-auto py-4 px-4 sm:px-6">
        <SearchBar
          onSearch={handleSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          placeholder={`go for search ...`}
        />
        

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-blue-50 rounded-3xl drop-shadow-xl mb-6 px-3 overflow-x-auto scrollbar-hide items-center scroll-smooth flex snap-x"
          role="region"
          aria-label="Category list"
        >
          <div className="flex h-12 ml-2 mr-2 bg-blue-100 rounded-md p-[7px] shadow-[inset_0px_3px_15px_-10px]">
            <span className="w-[4px] rounded-2xl h-[95%] bg-gray-500"></span>
          </div>
          <div className="w-full justify-around overflow-x-auto scrollbar-hide items-center scroll-smooth flex snap-x">
            {loading ? (
              Array(5)
                .fill()
                .map((_, i) => <CategorySkeleton key={i} />)
            ) : categories?.length === 0 ? (
              <p className="text-gray-600">No categories available.</p>
            ) : (
              categories.map((category) => (
                <div key={category._id} className="snap-start min-w-fit flex-shrink-0 opacity-70 mr-4">
                  <CategoryCard category={category} />
                </div>
              ))
            )}
          </div>
        </motion.div>


        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mb-6 bg-blue-50 rounded-3xl py-3 shadow-xl overflow-hidden"
        >
          <h2 className="text-2xl font-bold text-gray-500 ml-3 mb-3 flex items-center gap-4 ">
            <div className='flex p-2 bg-blue-100 rounded-full shadow-[inset_0px_3px_15px_-10px]'>
              <FaStore className='' />
            </div>
            <span className='opacity-40 text-xl'>TOP SELLERS</span>
          </h2>
          <div className="flex overflow-x-auto scrollbar-hide w-full justify-around scroll-smooth snap-x items-start">
            {loading ? (
              Array(5).fill().map((_, i) => <SellerSkeleton key={i} />)
            ) : sellers.length === 0 ? (
              <p className="text-gray-600">No sellers available.</p>
            ) : (
              sellers.map((seller) => (
                <div key={seller._id} className="px-4 snap-start min-w-fit">
                  <SellerCard seller={seller} />
                </div>
              ))
            )}
          </div>
        </motion.section>

        <motion.section initial="hidden" animate="visible" variants={fadeIn}>
          <div className="flex items-center justify-between px-3 mb-6">
            <h2 className="text-xl font-bold text-gray-800">Popular Products</h2>
            <button
              className="p-2 rounded-full bg-gray-50 drop-shadow-lg hover:bg-gray-200 transition-colors duration-200"
              onClick={() => setShowFilter(!showFilter)}
            >
              <FaFilter className="text-gray-700 text-xl" />
            </button>
          </div>

          {showFilter && (
            <div className="fixed inset-0 bg-gray-600/10 backdrop-blur-lg bg-opacity-50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-blue-50 p-6 rounded-3xl shadow-xl w-80"
              >
                <h3 className="text-lg font-semibold mb-4">Filter Products</h3>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-fit p-3 border rounded-xl"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option className='p-3' key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

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

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowFilter(false)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Apply
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-5 grid-cols-2 overflow-x-auto pb-2 scrollbar-hidden">
            {loading ? (
              Array(4).fill().map((_, i) => <ProductSkeleton key={i} />)
            ) : filteredProducts.length === 0 ? (
              <p className="text-gray-600">No products available.</p>
            ) : (
              filteredProducts.map((product) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))
            )}
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default Home;