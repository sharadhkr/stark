// Optimized ProductCard Component (mobile-first, no hover/tap effects)
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoHeartOutline, IoHeart, IoCartOutline } from 'react-icons/io5';
import { FaCartPlus } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from '../useraxios';
import placeholderImage from '../assets/logo.png';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
  DrawerDescription,
} from '../../@/components/ui/drawer';
import { Button } from '../../@/components/ui/button';
import { cn } from '../lib/utils';

const ProductCard = React.memo(({ product = {}, wishlist = [], cart = [], onAddToCart = () => {} }) => {
  const [isWishlisted, setIsWishlisted] = useState(wishlist.includes(String(product._id)));
  const [isInCart, setIsInCart] = useState(cart.includes(String(product._id)));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [productDetails, setProductDetails] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const navigate = useNavigate();

  const { _id } = product;

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!_id) return;
      setLoading(true);
      try {
        const response = await axios.get(`/api/user/auth/products/${_id}`);
        setProductDetails(response.data.product);
      } catch (error) {
        setFetchError(error.response?.data?.message || 'Failed to load product details');
        toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [_id]);

  useEffect(() => {
    setIsWishlisted(wishlist.includes(String(_id)));
    setIsInCart(cart.includes(String(_id)));
  }, [wishlist, cart, _id]);

  const {
    name = 'Product',
    description = 'Lorem ipsum dolor sit amet',
    price = 225,
    images = [],
    sizes = ['L', 'X', 'XL'],
    colors = [],
    material = 'Polyester',
    discount = 0,
    discountPercentage = 0,
    quantityAvailable = 10,
  } = productDetails || product;

  const discountedPrice = discount > 0
    ? price - discount
    : discountPercentage > 0
    ? price * (1 - discountPercentage / 100)
    : price;

  const displayImage = Array.isArray(images) && images[0] ? images[0].replace(/^http:/, 'https:') : placeholderImage;

  const handleToggleWishlist = useCallback(async (e) => {
    e.stopPropagation();
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to update wishlist');
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      await axios.put(`/api/user/auth/wishlist/${_id}`);
      setIsWishlisted((prev) => !prev);
      toast.success(!isWishlisted ? 'Added to Wishlist' : 'Removed from Wishlist');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Wishlist update failed');
    } finally {
      setLoading(false);
    }
  }, [_id, isWishlisted, navigate]);

  const handleAddToCartClick = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to add to cart');
      navigate('/login');
      return;
    }
    if (isInCart) return navigate('/cart');
    setSelectedSize(sizes[0] || '');
    setSelectedColor(colors[0] || '');
    setIsDrawerOpen(true);
  }, [isInCart, navigate, sizes, colors]);

  const handleAddToCart = useCallback(async () => {
    if (!selectedSize || !selectedColor) return toast.error('Select size and color');
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    setLoading(true);
    try {
      const payload = { productId: _id, quantity, size: selectedSize, color: selectedColor };
      await axios.post('/api/user/auth/cart/add', payload);
      setIsInCart(true);
      setIsDrawerOpen(false);
      onAddToCart(_id);
      toast.success('Added to Cart');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setLoading(false);
    }
  }, [_id, quantity, selectedSize, selectedColor, navigate, onAddToCart]);

  const handleProductClick = useCallback(() => navigate(`/product/${_id}`), [_id, navigate]);

  if (!_id) return <div className="w-48 p-4 text-center text-sm text-gray-500">Invalid Product</div>;

  return (
    <div
      className="w-44 gap-3 sm:w-56 md:w-64 flex flex-col rounded-xl drop-shadow-sm"
      aria-label={`Product: ${name}`}
    >
      <div
        className="relative w-full h-40 sm:h-48 md:h-56 mb-3 rounded"
        onClick={handleProductClick}
      >
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <img
          src={displayImage}
          alt={name}
          className={cn(
            'w-full h-full rounded-xl drop-shadow-md object-cover transition-opacity duration-300',
            imageLoading ? 'opacity-0' : 'opacity-100'
          )}
          loading="lazy"
          onLoad={() => setImageLoading(false)}
          onError={(e) => {
            e.target.src = placeholderImage;
            setImageLoading(false);
          }}
        />
        <button
          onClick={handleToggleWishlist}
          className="absolute top-2 right-2 text-gray-500"
          disabled={loading}
          aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          {isWishlisted ? <IoHeart size={20} className="text-red-600" /> : <IoHeartOutline size={20} />}
        </button>
        <button
          onClick={handleAddToCartClick}
          className="absolute -bottom-3 right-0 bg-green-100 border border-green-300 flex items-center gap-1 rounded-md px-2 py-1 text-gray-500"
          disabled={loading}
          aria-label={isInCart ? 'Go to Cart' : 'Add to Cart'}
        >
          <span className="text-xs">{isInCart ? 'In Cart' : 'Add'}</span>
          {isInCart ? <IoCartOutline size={14} /> : <FaCartPlus size={14} />}
        </button>
      </div>
      <div className="flex-1 px-1 sm:px-2">
        <span className="inline-block bg-violet-100 text-violet-600 text-xs px-1.5 py-0.5 rounded-md mb-1">
          {material}
        </span>
        <h3 className="text-sm md:text-base font-semibold text-gray-800 truncate" title={name}>
          {name}
        </h3>
        <p className="text-xs md:text-sm text-gray-600 truncate">{description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-semibold text-sm md:text-base text-black">₹{Math.round(discountedPrice)}</span>
          {(discount > 0 || discountPercentage > 0) && (
            <>
              <span className="text-xs md:text-sm text-gray-500 line-through">₹{Math.round(price)}</span>
              <span className="text-xs md:text-sm text-green-600 font-medium">
                {discount > 0 ? `₹${Math.round(discount)} OFF` : `${discountPercentage}% OFF`}
              </span>
            </>
          )}
        </div>
        {sizes?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {sizes.map((s) => (
              <span key={s} className="bg-gray-100 text-xs md:text-sm text-gray-600 px-2 py-0.5 rounded">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="bg-white p-4 rounded-t-3xl max-h-[80vh] overflow-y-auto w-full sm:w-[400px] mx-auto">
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-lg font-semibold">Add {name} to Cart</DrawerTitle>
            <DrawerDescription className="text-sm text-gray-500">
              Select options to add {name} to your cart.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4">
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
                        selectedSize === size ? 'bg-blue-100 text-blue-600' : 'border-gray-300 bg-white'
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
                        selectedColor === color ? 'bg-blue-100 text-blue-600' : 'border-gray-300 bg-white'
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DrawerFooter className="flex justify-between mt-4">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1 text-sm">
                Cancel
              </Button>
            </DrawerClose>
            <Button
              onClick={handleAddToCart}
              className={cn(
                'flex-1 text-sm',
                !selectedSize || !selectedColor || loading ? 'opacity-50 cursor-not-allowed' : 'bg-green-400 hover:bg-green-600'
              )}
              disabled={loading || !selectedSize || !selectedColor}
            >
              {loading ? 'Adding...' : 'Add to Cart'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
});

export default ProductCard;
