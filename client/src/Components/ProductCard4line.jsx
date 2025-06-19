import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoHeartOutline, IoHeart, IoCartOutline } from 'react-icons/io5';
import { FaCartPlus } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from '../useraxios';
import placeholderImage from '../assets/slogo.webp';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose, DrawerDescription } from '../../@/components/ui/drawer';
import { Button } from '../../@/components/ui/button';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import debounce from 'lodash/debounce';

// Animation Variants
const cardVariants = {
  hover: { scale: 1.05, boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)' },
  tap: { scale: 0.95 },
};

const buttonVariants = {
  hover: { scale: 1.15 },
  tap: { scale: 0.9 },
};

const ProductCard = React.memo(({ product = {}, wishlist = [], cart = [], onAddToCart = () => {} }) => {
  const { _id, name = 'Product', description = 'Lorem ipsum dolor sit amet', price = 225, images = [], sizes = ['L', 'X', 'XL'], colors = [], material = 'Polyester', discount = 0, discountPercentage = 0, quantityAvailable = 10 } = product;

  const [isWishlisted, setIsWishlisted] = useState(wishlist.includes(_id?.toString()));
  const [isInCart, setIsInCart] = useState(cart.includes(_id?.toString()));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState(sizes.length > 0 ? sizes[0] : '');
  const [selectedColor, setSelectedColor] = useState(colors.length > 0 ? colors[0] : '');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const navigate = useNavigate();

  if (!navigate) {
    console.error('useNavigate is not available. Ensure ProductCard is rendered within a BrowserRouter and react-router-dom is installed.');
  }

  // Memoized derived values
  const discountedPrice = useMemo(() => 
    discount > 0 ? price - discount : discountPercentage > 0 ? price * (1 - discountPercentage / 100) : price, 
    [price, discount, discountPercentage]
  );

  const displayImage = useMemo(() => 
    Array.isArray(images) && images[0] ? images[0].replace(/^http:/, 'https:') : placeholderImage, 
    [images]
  );

  // Define handleAddToCart first to avoid TDZ
  const handleAddToCart = useCallback(async () => {
    if (!_id) {
      toast.error('Invalid product ID');
      return;
    }
    // Validate size/color only if required
    if (sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (colors.length > 0 && !selectedColor) {
      toast.error('Please select a color');
      return;
    }
    // Validate size is in product.sizes
    if (sizes.length > 0 && !sizes.includes(selectedSize)) {
      toast.error('Selected size is not available');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to add to cart');
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        productId: _id,
        quantity,
        ...(sizes.length > 0 && { size: selectedSize }),
        ...(colors.length > 0 && { color: selectedColor }),
      };
      console.log('Add to cart payload:', payload);
      const response = await axios.post('/api/user/auth/cart/add', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsInCart(true);
      setIsDrawerOpen(false);
      toast.success('Added to Cart', {
        duration: 1500,
        style: {
          background: '#f3f4f6',
          color: '#10b981',
          borderRadius: '12px',
          padding: '8px 16px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
          fontSize: '14px',
          fontWeight: '500',
        },
      });
      onAddToCart(_id);
      console.log('Cart response:', response.data);
    } catch (error) {
      console.error('Cart error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Failed to add to cart. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [_id, quantity, selectedSize, selectedColor, navigate, sizes, colors, onAddToCart]);

  // Debounced wishlist handler
  const handleToggleWishlist = useCallback(debounce(async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to update wishlist');
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.put(`/api/user/auth/wishlist/${_id}`);
      setIsWishlisted(prev => !prev);
      toast.success(isWishlisted ? 'Removed from Wishlist' : 'Added to Wishlist', {
        duration: 1500,
        style: {
          background: '#f3f4f6',
          color: isWishlisted ? '#ef4444' : '#eab308',
          borderRadius: '12px',
          padding: '8px 16px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
          fontSize: '14px',
          fontWeight: '500',
        },
      });
      console.log('Wishlist response:', response.data);
    } catch (error) {
      console.error('Wishlist error:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Wishlist update failed');
    } finally {
      setLoading(false);
    }
  }, 300), [_id, isWishlisted, navigate]);

  const handleAddToCartClick = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to add to cart');
      navigate('/login');
      return;
    }
    if (isInCart) {
      navigate('/cart');
      return;
    }
    if (!sizes.length && !colors.length) {
      handleAddToCart();
    } else {
      setIsDrawerOpen(true);
    }
  }, [isInCart, navigate, sizes, colors, handleAddToCart]);

  const handleProductClick = useCallback(() => navigate(`/product/${_id}`), [_id, navigate]);

  if (!_id) {
    return (
      <div className="w-48 rounded-xl p-4 flex items-center justify-center text-gray-500 text-sm">
        Invalid Product
      </div>
    );
  }

  return (
    <>
      <motion.div
        onClick={handleProductClick}
        variants={cardVariants}
        whileHover="hover"
        whileTap="tap"
        className="w-[185px] bg-violet-50/80 shadow-[0px_0px_20px_-12px] shadow-violet-900/80 p-3 flex flex-col rounded-xl drop-shadow-sm cursor-pointer"
        aria-label={`Product: ${name}`}
        {...(isDrawerOpen ? { inert: '' } : {})}
      >
        <div className="relative w-full h-40 mb-3 rounded">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <img
            src={displayImage}
            alt={name}
            className={`w-full h-full rounded-xl drop-shadow-md object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
            loading="lazy"
            onLoad={() => setImageLoading(false)}
            onError={(e) => {
              e.target.src = placeholderImage;
              setImageLoading(false);
              console.warn(`Failed to load image: ${displayImage}`);
            }}
          />
          {(discount > 0 || discountPercentage > 0) && (
            <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm">
              {discount > 0 ? `₹${discount} OFF` : `${discountPercentage}% OFF`}
            </span>
          )}
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={handleToggleWishlist}
            className="absolute top-2 right-2 text-gray-500 hover:text-red-600"
            disabled={loading}
            aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            {isWishlisted ? <IoHeart size={20} className="text-red-600" /> : <IoHeartOutline size={20} />}
          </motion.button>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={handleAddToCartClick}
            className="absolute -bottom-3 right-0 bg-green-100 border border-green-300 flex items-center gap-1 rounded-md px-2 py-1 text-gray-500 hover:bg-green-200"
            disabled={loading}
            aria-label={isInCart ? 'Go to Cart' : 'Add to Cart'}
          >
            <span className="text-xs">{isInCart ? 'In Cart' : 'Add'}</span>
            {isInCart ? <IoCartOutline size={14} /> : <FaCartPlus size={14} />}
          </motion.button>
        </div>
        <div className="flex-1">
          <span className="inline-block bg-violet-100 text-violet-600 text-xs px-1.5 py-0.5 rounded-md mb-1">{material}</span>
          <h3 className="text-sm font-semibold text-gray-800 truncate" title={name}>{name}</h3>
          <p className="text-xs text-gray-600 truncate">{description}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-semibold text-sm">₹{discountedPrice.toFixed(2)}</span>
            {(discount > 0 || discountPercentage > 0) && (
              <span className="text-xs text-gray-500 line-through">₹{price.toFixed(2)}</span>
            )}
          </div>
        </div>
      </motion.div>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="bg-gray-100/70 backdrop-blur-xl shadow-[0px_15px_50px] max-h-[80vh] rounded-t-3xl">
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-lg font-semibold">Add {name} to Cart</DrawerTitle>
            <DrawerDescription className="text-sm text-gray-500">
              Select options to add {name} to your cart.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(quantityAvailable, Number(e.target.value) || 1)))}
                type="number"
                min="1"
                max={quantityAvailable}
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Available: {quantityAvailable}</p>
            </div>
            {sizes?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                <div className="flex gap-2 flex-wrap">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        'border rounded-md px-2 py-1 text-sm',
                        selectedSize === size ? 'bg-blue-100 text-blue-600' : 'border-gray-300 bg-white hover:bg-gray-100'
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {colors?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        'border rounded-md px-2 py-1 text-sm',
                        selectedColor === color ? 'bg-blue-100 text-blue-600' : 'border-gray-300 bg-white hover:bg-gray-100'
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DrawerFooter className="flex justify-between">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1 text-sm">Cancel</Button>
            </DrawerClose>
            <Button
              onClick={handleAddToCart}
              className={cn(
                'flex-1 text-sm',
                !selectedSize && sizes.length > 0 || !selectedColor && colors.length > 0 || loading ? 'opacity-50 cursor-not-allowed' : 'bg-green-400 hover:bg-green-700'
              )}
              disabled={loading || (sizes.length > 0 && !selectedSize) || (colors.length > 0 && !selectedColor)}
            >
              {loading ? 'Adding...' : 'Add to Cart'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
});

export default ProductCard;