import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../useraxios';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FaHeart, FaShoppingCart, FaArrowLeft, FaPlus, FaMinus, FaChevronLeft, FaChevronRight, FaRuler, FaWeightHanging, FaTag, FaUser, FaBoxOpen, FaUndo, FaMoneyBillWave, FaCreditCard } from 'react-icons/fa';
import placeholderImage from '../assets/logo.png';
import RelatedProducts from '../Components/RelatedProducts';

// Animation Variants
const pageVariants = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const sectionVariants = { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.4 } } };
const buttonVariants = { hover: { scale: 1.05 }, tap: { scale: 0.95 } };

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row gap-6 animate-pulse">
    <div className="w-full md:w-1/2 h-[400px] bg-gray-200 rounded-xl" />
    <div className="w-full md:w-1/2 space-y-4">
      <div className="h-10 bg-gray-200 rounded w-3/4" />
      <div className="h-6 bg-gray-200 rounded w-1/2" />
      <div className="h-12 bg-gray-200 rounded w-full" />
      <div className="h-36 bg-gray-200 rounded w-full" />
    </div>
  </div>
);

const ProductPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [inWishlist, setInWishlist] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const objectIdPattern = /^[0-9a-fA-F]{24}$/;
        if (!objectIdPattern.test(productId)) throw new Error('Invalid product ID');

        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const endpoint = token ? `/api/user/auth/products/${productId}` : `/api/user/auth/products/${productId}`;
        const productResponse = await axios.get(endpoint, config);
        const fetchedProduct = productResponse.data.product;

        setProduct(fetchedProduct);
        setSelectedSize(fetchedProduct.sizes?.[0] || '');
        setSelectedColor(fetchedProduct.colors?.[0] || '');

        if (token) {
          // Fetch wishlist for authenticated users
          try {
            const wishlistResponse = await axios.get('/api/user/auth/wishlist', config);
            const wishlist = wishlistResponse.data.wishlist || [];
            const wishlistIds = wishlist.map((item) => item.productId?._id?.toString() || item.productId.toString());
            setInWishlist(wishlistIds.includes(productId));
          } catch (error) {
            console.error('Error fetching wishlist:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching product data:', error);
        if (token && error.response?.status === 401) {
          localStorage.removeItem('token');
          toast.error('Session expired, please login again');
          navigate('/login');
        } else {
          toast.error(error.response?.data?.message || 'Failed to load product');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [productId, navigate, token]);

  const handleAddToCart = async () => {
    if (!product) return;

    if (!selectedSize || !selectedColor) {
      toast.error('Please select a size and color');
      return;
    }
    if (quantity > product.quantity) {
      toast.error('Selected quantity exceeds available stock');
      return;
    }

    if (token) {
      // Add to server-side cart for authenticated users
      try {
        await axios.post(
          '/api/user/auth/cart/add',
          { productId, quantity, price: product.price, name: product.name, size: selectedSize, color: selectedColor },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Added to Cart');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to add to cart');
      }
    } else {
      // Store in local storage for guest users
      const cartItem = {
        productId,
        name: product.name,
        price: product.price,
        quantity,
        image: product.images || [placeholderImage],
        size: selectedSize,
        color: selectedColor,
      };
      const existingCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      const updatedCart = [...existingCart, cartItem];
      localStorage.setItem('guestCart', JSON.stringify(updatedCart));
      toast.success('Added to Cart');
    }
  };

  const handleBuyNow = () => {
    if (!product) return;

    if (!selectedSize || !selectedColor) {
      toast.error('Please select a size and color');
      return;
    }
    if (quantity > product.quantity) {
      toast.error('Selected quantity exceeds available stock');
      return;
    }

    const cartItem = {
      productId,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images || [placeholderImage],
      size: selectedSize,
      color: selectedColor,
    };
    navigate('/checkout', { state: { cart: [cartItem] } });
  };

  const handleToggleWishlist = async () => {
    if (!token) {
      toast.error('Please login to add to wishlist');
      return;
    }
    if (!product) return;

    try {
      await axios.put(`/api/user/auth/wishlist/${productId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setInWishlist((prev) => !prev);
      toast.success(inWishlist ? 'Removed from Wishlist' : 'Added to Wishlist');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update wishlist');
    }
  };

  const handleQuantityChange = (change) => {
    setQuantity((prev) => {
      const newQuantity = prev + change;
      if (newQuantity < 1) return 1;
      if (newQuantity > product.quantity) return product.quantity;
      return newQuantity;
    });
  };

  const handleImageSwipe = (direction) => {
    if (!product?.images?.length) return;
    setCurrentImageIndex((prev) => {
      const newIndex = prev + direction;
      if (newIndex < 0) return product.images.length - 1;
      if (newIndex >= product.images.length) return 0;
      return newIndex;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100  pt-6 pb-8">
        <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
        <div className="max-w-7xl mx-auto"><SkeletonLoader /></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
        <div className="text-gray-600 text-lg">Product not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100  pb-8">
      <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
      <motion.main initial="initial" animate="animate" variants={pageVariants} className="max-w-7xl mx-auto">

        {/* Product Details */}
        <motion.div variants={sectionVariants} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row gap-8">
          {/* Image Carousel */}
          <div className="w-full md:w-1/2 relative">
            <motion.img
              key={currentImageIndex}
              src={product.images?.[currentImageIndex] || placeholderImage}
              alt={`${product.name} - Image ${currentImageIndex + 1}`}
              className="w-full h-[400px] object-cover rounded-xl border border-gray-200 shadow-md transition-transform duration-300 hover:scale-105"
              onError={(e) => (e.target.src = placeholderImage)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              loading="lazy"
            />
            {product.images?.length > 1 && (
              <>
                <motion.button
                  onClick={() => handleImageSwipe(-1)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white text-gray-700 p-2.5 rounded-full shadow-md border border-gray-200 hover:bg-gray-50"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <FaChevronLeft size={18} />
                </motion.button>
                <motion.button
                  onClick={() => handleImageSwipe(1)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white text-gray-700 p-2.5 rounded-full shadow-md border border-gray-200 hover:bg-gray-50"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <FaChevronRight size={18} />
                </motion.button>
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {product.images.map((_, idx) => (
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

          {/* Product Info */}
          <div className="w-full md:w-1/2 space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-semibold text-teal-600">₹{product.price.toFixed(2)}</span>
              {product.discount > 0 && (
                <>
                  <span className="text-base text-gray-500 line-through">₹{(product.price / (1 - product.discount / 100)).toFixed(2)}</span>
                  <span className="text-sm text-white bg-gradient-to-r from-rose-500 to-orange-500 px-3 py-1 rounded-full font-medium shadow-sm">{product.discount}% Off</span>
                </>
              )}
            </div>

            {/* Selectors */}
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-700">Size:</span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes?.map((size) => (
                    <motion.button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all duration-200 ${
                        selectedSize === size ? 'bg-teal-500 text-white border-teal-500' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      {size}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-700">Color:</span>
                <div className="flex flex-wrap gap-2">
                  {product.colors?.map((color) => (
                    <motion.button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                        selectedColor === color ? 'bg-teal-500 text-white border-teal-500' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-gray-200"
                        style={{ backgroundColor: color.toLowerCase() }}
                      />
                      {color}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full shadow-sm">
                  <motion.button
                    onClick={() => handleQuantityChange(-1)}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-l-full"
                    disabled={quantity <= 1}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <FaMinus size={14} />
                  </motion.button>
                  <span className="px-4 py-2 text-gray-800 font-medium">{quantity}</span>
                  <motion.button
                    onClick={() => handleQuantityChange(1)}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-r-full"
                    disabled={quantity >= product.quantity}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <FaPlus size={14} />
                  </motion.button>
                </div>
                <span className="text-xs text-gray-500">({product.quantity} in stock)</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <motion.button
                onClick={handleBuyNow}
                className={`flex-1 bg-gradient-to-r from-green-400 to-green-500 text-white py-1 rounded-xl font-medium shadow-md ${product.quantity === 0 ? 'bg-gray-400 cursor-not-allowed' : 'hover:from-blue-600 hover:to-teal-600'}`}
                disabled={product.quantity === 0}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Buy Now
              </motion.button>
              <motion.button
                onClick={handleAddToCart}
                className={`flex-1 bg-gradient-to-r from-orange-400 to-orange-400 text-white py-1 rounded-xl font-medium shadow-md flex items-center justify-center gap-2 ${product.quantity === 0 ? 'bg-gray-400 cursor-not-allowed' : 'hover:from-yellow-500 hover:to-orange-500'}`}
                disabled={product.quantity === 0}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                 Add to <FaShoppingCart size={18} />
              </motion.button>
              <motion.button
                onClick={handleToggleWishlist}
                className={`p-3 bg-white border border-gray-200 rounded-xl shadow-md ${inWishlist && token ? 'text-red-500' : 'text-gray-600'} ${!token ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                disabled={!token}
                variants={buttonVariants}
                whileHover={token ? "hover" : {}}
                whileTap={token ? "tap" : {}}
                title={token ? (inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist') : 'Login to add to wishlist'}
              >
                <FaHeart size={20} fill={inWishlist && token ? 'currentColor' : 'none'} />
              </motion.button>
            </div>

            {/* Product Details */}
            <motion.div variants={sectionVariants} className="bg-gray-50 p-5 rounded-xl shadow-sm space-y-3 text-sm text-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <p className="flex items-center gap-2"><FaTag className="text-teal-500" /> <strong>Category:</strong> {product.category?.name || 'General'}</p>
                <p className="flex items-center gap-2"><FaBoxOpen className="text-teal-500" /> <strong>Stock:</strong> {product.quantity > 0 ? `${product.quantity} available` : 'Out of Stock'}</p>
                <p className="flex items-center gap-2"><FaTag className="text-teal-500" /> <strong>Sizes:</strong> {product.sizes?.join(', ') || 'N/A'}</p>
                <p className="flex items-center gap-2"><FaTag className="text-teal-500" /> <strong>Colors:</strong> {product.colors?.join(', ') || 'N/A'}</p>
                <p className="flex items-center gap-2"><FaTag className="text-teal-500" /> <strong>Material:</strong> {product.material || 'N/A'}</p>
                <p className="flex items-center gap-2"><FaTag className="text-teal-500" /> <strong>Gender:</strong> {product.gender || 'N/A'}</p>
                <p className="flex items-center gap-2"><FaTag className="text-teal-500" /> <strong>Brand:</strong> {product.brand || 'N/A'}</p>
                <p className="flex items-center gap-2"><FaTag className="text-teal-500" /> <strong>Fit:</strong> {product.fit || 'N/A'}</p>
                <p className="flex items-center gap-2"><FaTag className="text-teal-500" /> <strong>Care Instructions:</strong> {product.careInstructions || 'N/A'}</p>
                {product.dimensions && (
                  <p className="flex items-center gap-2"><FaRuler className="text-teal-500" /> <strong>Dimensions:</strong> Chest: {product.dimensions.chest || 'N/A'} in, Length: {product.dimensions.length || 'N/A'} in, Sleeve: {product.dimensions.sleeve || 'N/A'} in</p>
                )}
                <p className="flex items-center gap-2"><FaWeightHanging className="text-teal-500" /> <strong>Weight:</strong> {product.weight ? `${product.weight} g` : 'N/A'}</p>
                <p className="flex items-center gap-2"><FaUser className="text-teal-500" /> <strong>Seller:</strong> {product.sellerId ? `${product.sellerId.name || 'Unknown'} (${product.sellerId.shopName || 'Unnamed Shop'})` : 'Unknown Seller'}</p>
                {product.isReturnable && (
                  <p className="flex items-center gap-2"><FaUndo className="text-teal-500" /> <strong>Return Policy:</strong> Returnable within {product.returnPeriod} days</p>
                )}
                <p className="flex items-center gap-2">
                  <FaMoneyBillWave className="text-teal-500" /> 
                  <strong>Cash on Delivery:</strong> {product.isCashOnDeliveryAvailable ? 'Available' : 'Not Available'}
                </p>
                <p className="flex items-center gap-2">
                  <FaCreditCard className="text-teal-500" /> 
                  <strong>Payment Split:</strong> {product.onlinePaymentPercentage}% Online, {100 - product.onlinePaymentPercentage}% on Delivery
                </p>
              </div>
              <p className="text-gray-600 leading-relaxed pt-2 border-t border-gray-200"><strong>Description:</strong> {product.description || 'No description provided.'}</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Related Products */}
        <RelatedProducts product={product} />
      </motion.main>
    </div>
  );
};

export default ProductPage;