import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../useraxios';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FaHeart, FaShoppingCart, FaPlus, FaMinus, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import placeholderImage from '../assets/logo.png';

// Animation Variants
const pageVariants = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const sectionVariants = { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.4 } } };
const buttonVariants = { hover: { scale: 1.05 }, tap: { scale: 0.95 } };

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-6 animate-pulse">
    <div className="flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-1/2 h-[400px] bg-gray-200 rounded-xl" />
      <div className="w-full md:w-1/2 space-y-4">
        <div className="h-10 bg-gray-200 rounded w-3/4" />
        <div className="h-6 bg-gray-200 rounded w-1/2" />
        <div className="h-12 bg-gray-200 rounded w-full" />
        <div className="h-36 bg-gray-200 rounded w-full" />
      </div>
    </div>
  </div>
);

const ComboPage = () => {
  const { comboId } = useParams();
  const navigate = useNavigate();
  const [combo, setCombo] = useState(null);
  const [productsDetails, setProductsDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [wishlistStatus, setWishlistStatus] = useState({});
  const [currentImageIndices, setCurrentImageIndices] = useState({});
  const token = localStorage.getItem('token');

  // Fetch combo offer data
  useEffect(() => {
    const fetchComboData = async () => {
      if (!comboId) {
        toast.error('Combo ID is missing. Redirecting to home...');
        setTimeout(() => navigate('/'), 1500);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`/api/admin/auth/combo-offers/${comboId}`);
        const fetchedCombo = response.data.comboOffer;

        if (!fetchedCombo) throw new Error('Combo offer not found');

        console.log('Fetched combo offer:', fetchedCombo);
        setCombo(fetchedCombo);

        // Initialize quantities and image indices for each product
        const initialQuantities = {};
        const initialImageIndices = {};
        fetchedCombo.products.forEach((product) => {
          initialQuantities[product._id] = 1;
          initialImageIndices[product._id] = 0;
        });
        setQuantities(initialQuantities);
        setCurrentImageIndices(initialImageIndices);

        // Fetch product details for each product in the combo
        const productPromises = fetchedCombo.products.map(async (product) => {
          try {
            const productResponse = await axios.get(`/api/user/auth/products/${product._id}`);
            return productResponse.data.product;
          } catch (error) {
            console.error(`Error fetching product ${product._id}:`, error);
            return null;
          }
        });

        const productsData = await Promise.all(productPromises);
        setProductsDetails(productsData.filter((product) => product !== null));

        // Check wishlist status if user is logged in
        if (token) {
          try {
            const wishlistResponse = await axios.get('/api/user/auth/wishlist', {
              headers: { Authorization: `Bearer ${token}` },
            });
            const wishlist = wishlistResponse.data.wishlist || [];
            const wishlistIds = wishlist
              .filter((item) => !item.isCombo)
              .map((item) => item.productId?._id?.toString() || item.productId.toString());
            const initialWishlistStatus = {};
            fetchedCombo.products.forEach((product) => {
              initialWishlistStatus[product._id] = wishlistIds.includes(product._id.toString());
            });
            setWishlistStatus(initialWishlistStatus);
          } catch (error) {
            console.error('Error fetching wishlist:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching combo data:', error);
        if (token && error.response?.status === 401) {
          localStorage.removeItem('token');
          toast.error('Session expired, please login again');
          navigate('/login');
        } else {
          toast.error(error.response?.data?.message || error.message || 'Failed to load combo offer');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchComboData();
  }, [comboId, navigate, token]);

  const handleAddToCart = async (product) => {
    const quantity = quantities[product._id] || 1;

    if (quantity > (product.quantity || 0)) {
      toast.error('Selected quantity exceeds available stock');
      return;
    }

    if (token) {
      try {
        await axios.post(
          '/api/user/auth/cart/add',
          {
            productId: product._id,
            quantity,
            price: product.price || 0,
            name: product.name,
            isCombo: false,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Added to Cart');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to add to cart');
      }
    } else {
      const cartItem = {
        productId: product._id,
        name: product.name,
        price: product.price || 0,
        quantity,
        image: product.images?.[0] || placeholderImage,
        isCombo: false,
      };
      const existingCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      const updatedCart = [...existingCart, cartItem];
      localStorage.setItem('guestCart', JSON.stringify(updatedCart));
      toast.success('Added to Cart');
    }
  };

  const handleBuyNow = (product) => {
    const quantity = quantities[product._id] || 1;

    if (quantity > (product.quantity || 0)) {
      toast.error('Selected quantity exceeds available stock');
      return;
    }

    const cartItem = {
      productId: product._id,
      name: product.name,
      price: product.price || 0,
      quantity,
      image: product.images?.[0] || placeholderImage,
      isCombo: false,
    };
    navigate('/checkout', { state: { cart: [cartItem] } });
  };

  const handleBuyComboNow = () => {
    if (!combo || !productsDetails.length) return;

    const cartItems = productsDetails.map((product) => ({
      productId: product._id,
      name: product.name,
      price: product.price || 0,
      quantity: 1, // Default quantity of 1 for each product
      image: product.images?.[0] || placeholderImage,
      isCombo: false,
    }));

    navigate('/checkout', { state: { cart: cartItems, comboId: combo._id, comboPrice: combo.price } });
  };

  const handleToggleWishlist = async (productId) => {
    if (!token) {
      toast.error('Please login to add to wishlist');
      return;
    }

    try {
      await axios.put(
        `/api/user/auth/wishlist/${productId}`,
        { isCombo: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWishlistStatus((prev) => ({
        ...prev,
        [productId]: !prev[productId],
      }));
      toast.success(wishlistStatus[productId] ? 'Removed from Wishlist' : 'Added to Wishlist');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update wishlist');
    }
  };

  const handleQuantityChange = (productId, change) => {
    setQuantities((prev) => {
      const newQuantity = (prev[productId] || 1) + change;
      const product = productsDetails.find((p) => p._id === productId);
      if (newQuantity < 1) return { ...prev, [productId]: 1 };
      if (newQuantity > (product.quantity || 0)) return { ...prev, [productId]: product.quantity || 0 };
      return { ...prev, [productId]: newQuantity };
    });
  };

  const handleImageSwipe = (productId, direction) => {
    const product = productsDetails.find((p) => p._id === productId);
    if (!product || !product.images) return;
    const images = product.images || [];
    if (!images.length) return;
    setCurrentImageIndices((prev) => {
      const currentIndex = prev[productId] || 0;
      const newIndex = currentIndex + direction;
      if (newIndex < 0) return { ...prev, [productId]: images.length - 1 };
      if (newIndex >= images.length) return { ...prev, [productId]: 0 };
      return { ...prev, [productId]: newIndex };
    });
  };

  if (!comboId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
        <div className="text-gray-600 text-lg">
          Combo ID is missing.{' '}
          <Link to="/" className="text-blue-600 hover:underline">
            Return to combo offers
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 pt-6 pb-8">
        <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
        <div className="max-w-7xl mx-auto">
          <SkeletonLoader />
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  if (!combo || productsDetails.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
        <div className="text-gray-600 text-lg">Combo offer or products not found</div>
      </div>
    );
  }

  // Calculate total individual price
  const totalIndividualPrice = productsDetails.reduce((sum, product) => sum + (product.price || 0), 0);
  const savings = totalIndividualPrice - (combo.price || 0);

  return (
    <div className="min-h-screen bg-gray-100 pb-8">
      <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
      <motion.main initial="initial" animate="animate" variants={pageVariants} className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 text-center my-6">{combo.name}</h1>

        {/* Individual Product Sections */}
        {productsDetails.map((product) => {
          const images = product.images || [];
          const currentImageIndex = currentImageIndices[product._id] || 0;

          return (
            <motion.div
              key={product._id}
              variants={sectionVariants}
              className="bg-white rounded-2xl shadow-lg p-6 mb-6 flex flex-col md:flex-row gap-8"
            >
              <div className="w-full md:w-1/2 relative">
                <motion.img
                  key={currentImageIndex}
                  src={images[currentImageIndex] || placeholderImage}
                  alt={`${product.name} - Image ${currentImageIndex + 1}`}
                  className="w-full h-[400px] object-cover rounded-xl border border-gray-200 shadow-md transition-transform duration-300 hover:scale-105"
                  onError={(e) => (e.target.src = placeholderImage)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  loading="lazy"
                />
                {images.length > 1 && (
                  <>
                    <motion.button
                      onClick={() => handleImageSwipe(product._id, -1)}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white text-gray-700 p-2.5 rounded-full shadow-md border border-gray-200 hover:bg-gray-50"
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <FaChevronLeft size={18} />
                    </motion.button>
                    <motion.button
                      onClick={() => handleImageSwipe(product._id, 1)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white text-gray-700 p-2.5 rounded-full shadow-md border border-gray-200 hover:bg-gray-50"
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <FaChevronRight size={18} />
                    </motion.button>
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {images.map((_, idx) => (
                        <motion.div
                          key={idx}
                          className={`w-2.5 h-2.5 rounded-full ${idx === currentImageIndex ? 'bg-blue-600' : 'bg-gray-300'}`}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: idx === currentImageIndex ? 1.2 : 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="w-full md:w-1/2 space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-semibold text-teal-600">₹{(product.price || 0).toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Quantity:</span>
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full shadow-sm">
                    <motion.button
                      onClick={() => handleQuantityChange(product._id, -1)}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-l-full"
                      disabled={quantities[product._id] <= 1}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <FaMinus size={14} />
                    </motion.button>
                    <span className="px-4 py-2 text-gray-800 font-medium">{quantities[product._id]}</span>
                    <motion.button
                      onClick={() => handleQuantityChange(product._id, 1)}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-r-full"
                      disabled={quantities[product._id] >= (product.quantity || 0)}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <FaPlus size={14} />
                    </motion.button>
                  </div>
                  <span className="text-xs text-gray-500">({product.quantity || 0} in stock)</span>
                </div>

                <div className="flex gap-4">
                  <motion.button
                    onClick={() => handleBuyNow(product)}
                    className={`flex-1 bg-gradient-to-r from-green-400 to-green-500 text-white py-1 rounded-xl font-medium shadow-md ${(product.quantity || 0) === 0 ? 'bg-gray-400 cursor-not-allowed' : 'hover:from-blue-600 hover:to-teal-600'}`}
                    disabled={(product.quantity || 0) === 0}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    Buy Now
                  </motion.button>
                  <motion.button
                    onClick={() => handleAddToCart(product)}
                    className={`flex-1 bg-gradient-to-r from-orange-400 to-orange-400 text-white py-1 rounded-xl font-medium shadow-md flex items-center justify-center gap-2 ${(product.quantity || 0) === 0 ? 'bg-gray-400 cursor-not-allowed' : 'hover:from-yellow-500 hover:to-orange-500'}`}
                    disabled={(product.quantity || 0) === 0}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    Add to <FaShoppingCart size={18} />
                  </motion.button>
                  <motion.button
                    onClick={() => handleToggleWishlist(product._id)}
                    className={`p-3 bg-white border border-gray-200 rounded-xl shadow-md ${wishlistStatus[product._id] && token ? 'text-red-500' : 'text-gray-600'} ${!token ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                    disabled={!token}
                    variants={buttonVariants}
                    whileHover={token ? "hover" : {}}
                    whileTap={token ? "tap" : {}}
                    title={token ? (wishlistStatus[product._id] ? 'Remove from Wishlist' : 'Add to Wishlist') : 'Login to add to wishlist'}
                  >
                    <FaHeart size={20} fill={wishlistStatus[product._id] && token ? 'currentColor' : 'none'} />
                  </motion.button>
                </div>

                <p className="text-gray-600 leading-relaxed">
                  <strong>Description:</strong> {product.description || 'No description provided.'}
                </p>
              </div>
            </motion.div>
          );
        })}

        {/* Combo Offer Summary */}
        <motion.div variants={sectionVariants} className="bg-gray-50 rounded-2xl shadow-lg p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Combo Offer Summary</h2>
          <div className="space-y-2 text-gray-700">
            <p>
              <span className="font-semibold">Total Individual Price: </span>
              ₹{(totalIndividualPrice || 0).toFixed(2)}
            </p>
            <p>
              <span className="font-semibold">Combo Price: </span>
              <span className="text-teal-600">₹{(combo.price || 0).toFixed(2)}</span>
            </p>
            {combo.discount > 0 && (
              <>
                <p>
                  <span className="font-semibold">Discount: </span>
                  <span className="text-white bg-gradient-to-r from-rose-500 to-orange-500 px-2 py-1 rounded-full">{combo.discount || 0}%</span>
                </p>
                <p>
                  <span className="font-semibold">You Save: </span>
                  <span className="text-green-600">₹{(savings || 0).toFixed(2)}</span>
                </p>
              </>
            )}
          </div>
          <motion.button
            onClick={handleBuyComboNow}
            className="mt-6 bg-gradient-to-r from-green-400 to-green-500 text-white py-2 px-6 rounded-xl font-medium shadow-md hover:from-blue-600 hover:to-teal-600 flex items-center gap-2 mx-auto"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            Buy Combo Now <FaShoppingCart size={18} />
          </motion.button>
        </motion.div>
      </motion.main>
    </div>
  );
};

export default ComboPage;