import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../useraxios';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FaHeart, FaShoppingBag, FaArrowLeft, FaPlus, FaMinus, FaStar, FaCheckCircle, FaTruck, FaUndo, FaExchangeAlt, FaMoneyBillWave } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import placeholderImage from '../assets/logo.png';
import RelatedProducts from '../Components/RelatedProducts';

// Animation Variants for a smoother feel
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
};
const sectionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
};
const itemVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const buttonVariants = {
  hover: { scale: 1.03 },
  tap: { scale: 0.97 },
};

// Skeleton Loader Component - Myntra Style
const SkeletonLoader = () => (
  <motion.div variants={pageVariants} initial="initial" animate="animate" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 animate-pulse">
      {/* Image Skeleton */}
      <div className="lg:col-span-3">
        <div className="w-full h-[550px] bg-gray-200 rounded-lg"></div>
        <div className="flex gap-4 mt-4">
          <div className="w-24 h-24 bg-gray-200 rounded-md"></div>
          <div className="w-24 h-24 bg-gray-200 rounded-md"></div>
          <div className="w-24 h-24 bg-gray-200 rounded-md"></div>
          <div className="w-24 h-24 bg-gray-200 rounded-md"></div>
        </div>
      </div>
      {/* Info Skeleton */}
      <div className="lg:col-span-2 space-y-6">
        <div className="h-10 bg-gray-200 rounded w-4/5"></div>
        <div className="h-6 bg-gray-200 rounded w-3/5"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <hr />
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="flex gap-4">
          <div className="h-12 w-16 bg-gray-200 rounded-md"></div>
          <div className="h-12 w-16 bg-gray-200 rounded-md"></div>
          <div className="h-12 w-16 bg-gray-200 rounded-md"></div>
        </div>
        <div className="h-14 bg-gray-200 rounded-lg w-full"></div>
        <div className="h-14 bg-gray-200 rounded-lg w-full"></div>
      </div>
    </div>
  </motion.div>
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
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      try {
        const objectIdPattern = /^[0-9a-fA-F]{24}$/;
        if (!objectIdPattern.test(productId)) throw new Error('Invalid product ID');

        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const productResponse = await axios.get(`/api/user/auth/products/${productId}`, config);
        const fetchedProduct = productResponse.data.product;

        setProduct(fetchedProduct);
        if (fetchedProduct.sizes?.length > 0) setSelectedSize(fetchedProduct.sizes[0]);
        if (fetchedProduct.colors?.length > 0) setSelectedColor(fetchedProduct.colors[0]);

        if (token) {
          try {
            const wishlistResponse = await axios.get('/api/user/auth/wishlist', config);
            const wishlistIds = (wishlistResponse.data.wishlist || []).map(item => item.productId?._id?.toString() || item.productId.toString());
            setInWishlist(wishlistIds.includes(productId));
          } catch (error) {
            console.error('Error fetching wishlist:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching product data:', error);
        toast.error(error.response?.data?.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
    window.scrollTo(0, 0);
  }, [productId, token]);

  const handleAddToCart = async () => {
    if (!product) return;

    if (!selectedSize && product.sizes?.length > 0) {
      toast.error('Please select a size');
      return;
    }
     if (!selectedColor && product.colors?.length > 0) {
      toast.error('Please select a color');
      return;
    }
    if (quantity > product.quantity) {
      toast.error('Selected quantity exceeds available stock');
      return;
    }

    const cartItem = { 
      productId, 
      quantity, 
      price: product.price, 
      name: product.name, 
      size: selectedSize, 
      color: selectedColor,
      image: product.images?.[0] || placeholderImage,
    };

    if (token) {
      try {
        await axios.post('/api/user/auth/cart/add', cartItem, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Added to Bag!');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to add to bag');
      }
    } else {
      const existingCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      const updatedCart = [...existingCart, cartItem];
      localStorage.setItem('guestCart', JSON.stringify(updatedCart));
      toast.success('Added to Bag!');
    }
  };

  const handleToggleWishlist = async () => {
    if (!token) {
      toast.error('Please login to use your wishlist');
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
      if (newQuantity > product.quantity) {
        toast.error('Maximum stock quantity reached');
        return product.quantity;
      }
      return newQuantity;
    });
  };

  if (loading) return <SkeletonLoader />;

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-4">
        <Toaster position="top-center" toastOptions={{ duration: 2000 }} />
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h2>
        <p className="text-gray-500 mb-6">We couldn't find the product you're looking for.</p>
        <motion.button
          onClick={() => navigate('/')}
          className="flex items-center bg-rose-500 text-white py-2 px-6 rounded-lg font-semibold shadow-md hover:bg-rose-600"
          variants={buttonVariants} whileHover="hover" whileTap="tap"
        >
          <FaArrowLeft className="mr-2" /> Go to Homepage
        </motion.button>
      </div>
    );
  }

  const actualPrice = product.discount > 0 ? (product.price / (1 - product.discount / 100)) : product.price;
  const savings = actualPrice - product.price;

  return (
    <div className="bg-white">
      <Toaster position="top-center" toastOptions={{ duration: 2000 }} />
      <motion.main
        initial="initial" animate="animate" variants={pageVariants}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Left Column: Image Gallery */}
          <motion.div variants={sectionVariants} className="lg:col-span-3">
            <Swiper
              modules={[Navigation, Pagination, Thumbs, FreeMode]}
              spaceBetween={10}
              navigation
              pagination={{ clickable: true }}
              thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
              className="w-full h-[400px] md:h-[550px] rounded-lg overflow-hidden border border-gray-200"
            >
              {product.images?.length > 0 ? (
                product.images.map((img, idx) => (
                  <SwiperSlide key={idx}>
                    <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-contain" onError={(e) => (e.target.src = placeholderImage)} />
                  </SwiperSlide>
                ))
              ) : (
                <SwiperSlide><img src={placeholderImage} alt={product.name} className="w-full h-full object-contain" /></SwiperSlide>
              )}
            </Swiper>
            {/* Thumbnails */}
            <Swiper
              onSwiper={setThumbsSwiper}
              spaceBetween={10}
              slidesPerView={4}
              freeMode={true}
              watchSlidesProgress={true}
              modules={[FreeMode, Navigation, Thumbs]}
              className="mt-4 h-24"
            >
              {product.images?.map((img, idx) => (
                 <SwiperSlide key={idx} className="cursor-pointer rounded-md overflow-hidden border-2 border-transparent hover:border-rose-400 focus:ring-2 focus:ring-rose-500 focus:ring-offset-2">
                   <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" onError={(e) => (e.target.src = placeholderImage)} />
                 </SwiperSlide>
              ))}
            </Swiper>
          </motion.div>

          {/* Right Column: Product Info & Actions */}
          <motion.div variants={sectionVariants} className="lg:col-span-2 flex flex-col gap-6">
            <motion.div variants={itemVariants}>
              <h1 className="text-2xl font-bold text-gray-800">{product.name}</h1>
              <p className="text-lg text-gray-500 mt-1">{product.brand || "Generic Brand"}</p>
              {/* Add a placeholder for ratings */}
              <div className="flex items-center gap-2 mt-2">
                <FaStar className="text-amber-400" />
                <span className="font-semibold text-gray-700">4.5</span>
                <span className="text-gray-400">|</span>
                <span className="text-sm text-gray-500">2.3k Ratings</span>
              </div>
            </motion.div>
            
            <hr/>

            <motion.div variants={itemVariants}>
                <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-gray-900">₹{product.price.toFixed(2)}</span>
                    {product.discount > 0 && (
                        <span className="text-xl text-gray-400 line-through">₹{actualPrice.toFixed(2)}</span>
                    )}
                </div>
                 {product.discount > 0 && (
                    <div className="flex items-baseline gap-3 mt-1">
                        <span className="text-lg font-semibold text-orange-500">{product.discount}% OFF</span>
                        <span className="text-sm font-semibold text-green-600">You save ₹{savings.toFixed(2)}</span>
                    </div>
                )}
                <p className="text-xs text-gray-500 mt-1">inclusive of all taxes</p>
            </motion.div>

            {/* Size Selector */}
            {product.sizes?.length > 0 && (
              <motion.div variants={itemVariants}>
                <h3 className="text-sm font-bold uppercase text-gray-800 mb-2">Select Size</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => (
                    <motion.button
                      key={size} onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-md border text-sm font-semibold transition-all ${selectedSize === size ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'}`}
                      variants={buttonVariants} whileHover="hover" whileTap="tap"
                    >
                      {size}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
             
            {/* Color Selector */}
            {product.colors?.length > 0 && (
                <motion.div variants={itemVariants}>
                    <h3 className="text-sm font-bold uppercase text-gray-800 mb-2">Select Color</h3>
                    <div className="flex flex-wrap gap-3">
                        {product.colors.map(color => (
                            <motion.button
                                key={color} onClick={() => setSelectedColor(color)}
                                className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${selectedColor === color ? 'border-rose-500' : 'border-gray-300 hover:border-gray-500'}`}
                                style={{ backgroundColor: color.toLowerCase() }}
                                variants={buttonVariants} whileHover="hover" whileTap="tap"
                                title={color}
                            >
                                {selectedColor === color && <FaCheckCircle className="text-white text-lg" />}
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col gap-4 mt-4">
              <motion.button
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-3 bg-rose-500 text-white py-3.5 rounded-lg font-bold text-lg shadow-md hover:bg-rose-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={product.quantity === 0}
                variants={buttonVariants} whileHover="hover" whileTap="tap"
              >
                <FaShoppingBag /> {product.quantity > 0 ? 'ADD TO BAG' : 'OUT OF STOCK'}
              </motion.button>
              <motion.button
                onClick={handleToggleWishlist}
                className={`w-full flex items-center justify-center gap-3 border-2 py-3 rounded-lg font-bold transition-colors ${inWishlist ? 'bg-gray-100 border-gray-400 text-gray-800' : 'border-gray-300 text-gray-700 hover:border-gray-500'}`}
                variants={buttonVariants} whileHover="hover" whileTap="tap"
              >
                <FaHeart className={`${inWishlist ? 'text-rose-500' : 'text-gray-500'}`} /> WISHLIST
              </motion.button>
            </motion.div>
            
            <hr/>
            
            {/* Delivery & Services */}
            <motion.div variants={itemVariants} className="space-y-4 text-sm">
                <h3 className="text-sm font-bold uppercase text-gray-800">Delivery Options <FaTruck className="inline-block ml-1" /></h3>
                <div className="flex border border-gray-300 rounded-md p-2">
                    <input type="text" placeholder="Enter pincode" className="flex-grow focus:outline-none"/>
                    <button className="font-semibold text-rose-500 hover:text-rose-700">CHECK</button>
                </div>
                <p className="text-gray-600">Please enter pincode to check delivery availability.</p>
                <ul className="space-y-2">
                    <li className="flex items-center gap-2"><FaUndo className="text-gray-600"/> 7-day return policy</li>
                    <li className="flex items-center gap-2"><FaExchangeAlt className="text-gray-600"/> 7-day exchange policy</li>
                    <li className="flex items-center gap-2"><FaMoneyBillWave className="text-gray-600"/> Cash on Delivery {product.isCashOnDeliveryAvailable ? 'available' : 'not available'}</li>
                </ul>
            </motion.div>

          </motion.div>
        </div>
        
        {/* Product Details Section */}
        <motion.div variants={sectionVariants} className="mt-16">
            <h2 className="text-xl font-bold text-gray-800 border-b-2 border-rose-500 pb-2 inline-block">Product Details</h2>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-700">
                <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                    <p>{product.description || 'No description provided.'}</p>
                </div>
                 <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Specifications</h3>
                    <ul className="space-y-1 list-disc list-inside">
                        <li><strong>Category:</strong> {product.category?.name || 'General'}</li>
                        <li><strong>Material:</strong> {product.material || 'N/A'}</li>
                        <li><strong>Fit:</strong> {product.fit || 'N/A'}</li>
                        <li><strong>Care:</strong> {product.careInstructions || 'Machine Wash'}</li>
                        <li><strong>Sold by:</strong> {product.sellerId?.shopName || 'Anonymous Seller'}</li>
                    </ul>
                </div>
            </div>
        </motion.div>


        {/* Related Products */}
        <motion.div variants={sectionVariants} className="mt-16">
          <h2 className="text-xl font-bold text-gray-800 border-b-2 border-rose-500 pb-2 inline-block mb-6">Similar Products</h2>
          <RelatedProducts product={product} />
        </motion.div>
      </motion.main>
    </div>
  );
};

export default ProductPage;