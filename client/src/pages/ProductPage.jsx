import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../useraxios';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FaHeart, FaShoppingCart, FaArrowLeft, FaPlus, FaMinus, FaChevronLeft, FaChevronRight, FaRuler, FaWeightHanging, FaTag, FaUser, FaBoxOpen, FaUndo, FaMoneyBillWave, FaCreditCard, FaTruck, FaExchangeAlt } from 'react-icons/fa';
import placeholderImage from '../assets/logo.png';
import RelatedProducts from '../Components/RelatedProducts';
import { Heart, ShoppingCart } from 'lucide-react';

// Animation Variants
const pageVariants = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const sectionVariants = { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.3 } } };
const buttonVariants = { hover: { scale: 1.05 }, tap: { scale: 0.95 } };

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col md:flex-row gap-4 animate-pulse">
    <div className="w-full md:w-1/2 h-80 bg-gray-200 rounded-lg" />
    <div className="w-full md:w-1/2 space-y-3">
      <div className="h-8 bg-gray-200 rounded w-3/4" />
      <div className="h-6 bg-gray-200 rounded w-1/2" />
      <div className="h-10 bg-gray-200 rounded w-full" />
      <div className="h-20 bg-gray-200 rounded w-full" />
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
        const endpoint = `/api/user/auth/products/${productId}`;
        const productResponse = await axios.get(endpoint, config);
        const fetchedProduct = productResponse.data.product;

        setProduct(fetchedProduct);
        setSelectedSize(fetchedProduct.sizes?.[0] || '');
        setSelectedColor(fetchedProduct.colors?.[0] || '');

        if (token) {
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
      <div className="min-h-screen bg-white pt-4 pb-8">
        <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
        <div className="max-w-5xl mx-auto px-4"><SkeletonLoader /></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
        <div className="text-gray-600 text-lg">Product not found</div>
      </div>
    );
  }

  const actualPrice = product.discount > 0 ? (product.price / (1 - product.discount / 100)).toFixed(2) : product.price.toFixed(2);
  const savings = product.discount > 0 ? (actualPrice - product.price).toFixed(2) : 0;

  return (
    <div className="min-h-screen bg-white pt-4 pb-20">
      <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
      <motion.main initial="initial" animate="animate" variants={pageVariants} className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Back Button */}
        <motion.button
          onClick={() => navigate(-1)}
          className="mb-3 flex items-center text-gray-600 hover:text-green-600 font-medium text-sm"
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <FaArrowLeft className="mr-2" /> Back to Products
          <ShoppingCart/>
          <img className='w-8 h-8' src="https://img.icons8.com/?size=48&id=0Na5Uhhuwejm&format=png" alt="" />
        </motion.button>

        {/* Product Details */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Image Carousel */}
          <motion.div variants={sectionVariants} className="md:col-span-3">
            <div className="relative bg-white rounded-lg shadow-sm p-3">
              <motion.img
                key={currentImageIndex}
                src={product.images?.[currentImageIndex] || placeholderImage}
                alt={`${product.name} - Image ${currentImageIndex + 1}`}
                className="w-full h-64 sm:h-80 md:h-96 object-contain rounded-lg"
                onError={(e) => (e.target.src = placeholderImage)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                loading="lazy"
              />
              {product.images?.length > 1 && (
                <>
                  <motion.button
                    onClick={() => handleImageSwipe(-1)}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white text-gray-600 p-2 rounded-full shadow-sm hover:bg-gray-100"
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    aria-label="Previous image"
                  >
                    <FaChevronLeft size={16} />
                  </motion.button>
                  <motion.button
                    onClick={() => handleImageSwipe(1)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white text-gray-600 p-2 rounded-full shadow-sm hover:bg-gray-100"
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    aria-label="Next image"
                  >
                    <FaChevronRight size={16} />
                  </motion.button>
                  <div className="flex gap-2 justify-center mt-3">
                    {product.images.map((img, idx) => (
                      <motion.img
                        key={idx}
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className={`w-12 h-12 object-cover rounded-md border ${idx === currentImageIndex ? 'border-green-500' : 'border-gray-200'} cursor-pointer`}
                        onClick={() => setCurrentImageIndex(idx)}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                        onError={(e) => (e.target.src = placeholderImage)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div variants={sectionVariants} className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              {/* Product Name and Brand */}
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-tight">{product.name}</h1>
              <p className="text-sm text-gray-500 mt-1">{product.brand || 'No Brand'}</p>

              {/* Price and Discount */}
              {!!product.discount && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">₹{product.price.toFixed(2)}</span>
                    <span className="text-sm text-gray-500 line-through">₹{actualPrice}</span>
                    <span className="text-xs font-medium text-white bg-orange-500 px-2 py-1 rounded-full">{product.discount}% OFF</span>
                  </div>
                  {savings > 0 && (
                    <p className="text-sm text-green-600 mt-1">You Save: ₹{savings}</p>
                  )}
                </div>
              )}
              {!product.discount && (
                <div className="mt-2">
                    <span className="text-xl font-bold text-gray-900">₹{product.price.toFixed(2)}</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>

              {/* Policies */}
              <div className="mt-4 bg-gray-50 rounded-lg p-3 space-y-2 text-sm text-gray-700">
                <p className="flex items-center gap-2">
                  <FaTruck className="text-green-500" />
                  <span><strong>Free Delivery</strong> by {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                </p>
                <p className="flex items-center gap-2">
                  <FaUndo className="text-green-500" />
                  <span><strong>7-Day Returns</strong> for eligible items</span>
                </p>
                <p className="flex items-center gap-2">
                  <FaExchangeAlt className="text-green-500" />
                  <span><strong>7-Day Exchange</strong> for eligible items</span>
                </p>
                <p className="flex items-center gap-2">
                  <FaMoneyBillWave className="text-green-500" />
                  <span><strong>Cash on Delivery</strong>: {product.isCashOnDeliveryAvailable ? 'Available' : 'Not Available'}</span>
                </p>
                {product.onlinePaymentPercentage && (
                  <p className="flex items-center gap-2">
                    <FaCreditCard className="text-green-500" />
                    <span><strong>Payment Split</strong>: {product.onlinePaymentPercentage}% Online, {100 - product.onlinePaymentPercentage}% on Delivery</span>
                  </p>
                )}
              </div>

              {/* Selectors */}
              <div className="space-y-3 mt-4">
                {product.sizes?.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-gray-700">Size</span>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <motion.button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-all duration-200 ${
                            selectedSize === size ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
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
                )}
                {product.colors?.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-gray-700">Color</span>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color) => (
                        <motion.button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                            selectedColor === color ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-gray-200"
                            style={{ backgroundColor: color.toLowerCase() }}
                          />
                          {color}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Qty</span>
                  <div className="flex items-center bg-white border border-gray-200 rounded-md">
                    <motion.button
                      onClick={() => handleQuantityChange(-1)}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-l-md"
                      disabled={quantity <= 1}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <FaMinus size={12} />
                    </motion.button>
                    <span className="px-3 py-2 text-gray-800 font-medium">{quantity}</span>
                    <motion.button
                      onClick={() => handleQuantityChange(1)}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-r-md"
                      disabled={quantity >= product.quantity}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <FaPlus size={12} />
                    </motion.button>
                  </div>
                  <span className="text-xs text-gray-500">({product.quantity} in stock)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4 sticky bottom-0 bg-white py-3 -mx-4 border-t border-gray-200 md:static md:border-t-0 md:p-0">
                <motion.button
                  onClick={handleAddToCart}
                  className={`flex-1 bg-green-500 text-white py-2.5 rounded-md font-medium flex items-center justify-center gap-2 ${product.quantity === 0 ? 'bg-gray-400 cursor-not-allowed' : 'hover:bg-green-600'}`}
                  disabled={product.quantity === 0}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  Add to Cart <FaShoppingCart size={16} />
                </motion.button>
                <motion.button
                  onClick={handleBuyNow}
                  className={`flex-1 bg-orange-500 text-white py-2.5 rounded-md font-medium ${product.quantity === 0 ? 'bg-gray-400 cursor-not-allowed' : 'hover:bg-orange-600'}`}
                  disabled={product.quantity === 0}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  Buy Now
                </motion.button>
                <motion.button
                  onClick={handleToggleWishlist}
                  className={`p-2.5 bg-white border border-gray-200 rounded-md ${inWishlist && token ? 'text-red-500' : 'text-gray-600'} ${!token ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                  disabled={!token}
                  variants={buttonVariants}
                  whileHover={token ? "hover" : {}}
                  whileTap={token ? "tap" : {}}
                  title={token ? (inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist') : 'Login to add to wishlist'}
                >
                  <FaHeart size={16} fill={inWishlist && token ? 'currentColor' : 'none'} />
                </motion.button>
              </div>
            </div>

            {/* Product Details */}
            <motion.div variants={sectionVariants} className="bg-white rounded-lg shadow-sm p-4 mt-4">
              <h2 className="text-base font-semibold text-gray-900">Product Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-sm text-gray-600">
                <p className="flex items-center gap-2"><FaTag className="text-green-500" /> <strong>Category:</strong> {product.category?.name || 'General'}</p>
                <p className="flex items-center gap-2"><FaBoxOpen className="text-green-500" /> <strong>Stock:</strong> {product.quantity > 0 ? `${product.quantity} available` : 'Out of Stock'}</p>
                <p className="flex items-center gap-2"><FaTag className="text-green-500" /> <strong>Sizes:</strong> {product.sizes?.join(', ') || 'N/A'}</p>
                <p className="flex items-center gap-2"><FaTag className="text-green-500" /> <strong>Colors:</strong> {product.colors?.join(', ') || 'N/A'}</p>
                <p className="flex items-center gap-2"><FaTag className="text-green-500" /> <strong>Material:</strong> {product.material || 'N/A'}</p>
                <p className="flex items-center gap-2"><FaTag className="text-green-500" /> <strong>Gender:</strong> {product.gender || 'N/A'}</p>
                <p className="flex items-center gap-2"><FaTag className="text-green-500" /> <strong>Brand:</strong> {product.brand || 'N/A'}</p>
                <p className="flex items-center gap-2"><FaTag className="text-green-500" /> <strong>Fit:</strong> {product.fit || 'N/A'}</p>
                <p className="flex items-center gap-2"><FaTag className="text-green-500" /> <strong>Care Instructions:</strong> {product.careInstructions || 'N/A'}</p>
                {product.dimensions && (
                  <p className="flex items-center gap-2"><FaRuler className="text-green-500" /> <strong>Dimensions:</strong> Chest: {product.dimensions.chest || 'N/A'} in, Length: {product.dimensions.length || 'N/A'} in, Sleeve: {product.dimensions.sleeve || 'N/A'} in</p>
                )}
                <p className="flex items-center gap-2"><FaWeightHanging className="text-green-500" /> <strong>Weight:</strong> {product.weight ? `${product.weight} g` : 'N/A'}</p>
                <p className="flex items-center gap-2"><FaUser className="text-green-500" /> <strong>Seller:</strong> {product.sellerId ? `${product.sellerId.name || 'Unknown'} (${product.sellerId.shopName || 'Unnamed Shop'})` : 'Unknown Seller'}</p>
              </div>
              <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-200"><strong>Description:</strong> {product.description || 'No description provided.'}</p>
            </motion.div>
          </motion.div>
        </div>

        {/* Related Products */}
        <motion.div variants={sectionVariants} className="mt-6">
          <RelatedProducts product={product} />
        </motion.div>
      </motion.main>
    </div>
  );
};

export default ProductPage;