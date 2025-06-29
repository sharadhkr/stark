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
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const navigate = useNavigate();
  const { _id = '' } = product;

  useEffect(() => {
    setIsWishlisted(wishlist.includes(String(_id)));
    setIsInCart(cart.includes(String(_id)));
  }, [wishlist, cart, _id]);

  const normalized = {
    name: product.name || 'Product',
    description: product.description || 'Lorem ipsum dolor sit amet',
    price: product.price || 225,
    images: Array.isArray(product.images) ? product.images : [product.image || placeholderImage],
    sizes: Array.isArray(product.sizes) ? product.sizes : product.sizes === 'onesize' ? ['Free'] : [],
    colors: Array.isArray(product.colors) ? product.colors : [],
    material: product.material || 'Polyester',
    discount: product.discount || 0,
    discountPercentage: product.discountPercentage || 0,
    quantityAvailable: product.quantityAvailable || 10,
  };

  const discountedPrice = normalized.discount > 0
    ? normalized.price - normalized.discount
    : normalized.discountPercentage > 0
    ? normalized.price * (1 - normalized.discountPercentage / 100)
    : normalized.price;

  const displayImage = normalized.images[0]?.replace(/^http:/, 'https:') || placeholderImage;

  const handleToggleWishlist = useCallback(async (e) => {
    e.stopPropagation();
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    setLoading(true);
    try {
      const res = await axios.put(`/api/user/auth/wishlist/${_id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setIsWishlisted((prev) => !prev);
        toast.success(!isWishlisted ? 'Added to Wishlist' : 'Removed from Wishlist');
      }
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
    if (!token) return navigate('/login');
    if (isInCart) return navigate('/cart');
    setSelectedSize(normalized.sizes[0] || '');
    setSelectedColor(normalized.colors[0] || '');
    setIsDrawerOpen(true);
  }, [isInCart, navigate, normalized.sizes, normalized.colors]);

  const handleAddToCart = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!_id || !token) {
      toast.error('Invalid product data');
      return;
    }
    if ((normalized.sizes.length > 0 && !selectedSize) || (normalized.colors.length > 0 && !selectedColor)) {
      toast.error('Please select size and color');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        productId: _id,
        quantity,
        ...(selectedSize && { size: selectedSize }),
        ...(selectedColor && { color: selectedColor })
      };
      const res = await axios.post('/api/user/auth/cart/add', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setIsInCart(true);
        setIsDrawerOpen(false);
        onAddToCart(_id);
        toast.success('Added to Cart');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setLoading(false);
    }
  }, [_id, quantity, selectedSize, selectedColor, navigate, normalized.sizes, normalized.colors, onAddToCart]);

  const handleProductClick = useCallback(() => navigate(`/product/${_id}`), [_id, navigate]);

  if (!_id) return <div className="w-48 p-4 text-center text-sm text-gray-500">Invalid Product</div>;

  return (
    <div className="w-[185px] p-3 flex flex-col rounded-xl bg-violet-50 drop-shadow-md" aria-label={`Product: ${normalized.name}`}>
      <div className="relative w-full h-40 mb-3 rounded" onClick={handleProductClick}>
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <img
          src={displayImage}
          alt={normalized.name}
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
      <div className="flex-1">
        <span className="inline-block bg-violet-100 text-violet-600 text-xs px-1.5 py-0.5 rounded-md mb-1">
          {normalized.material}
        </span>
        <h3 className="text-sm font-semibold text-gray-800 truncate" title={normalized.name}>
          {normalized.name}
        </h3>
        <p className="text-xs text-gray-600 truncate">{normalized.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-semibold text-sm text-black">₹{Math.round(discountedPrice)}</span>
          {(normalized.discount > 0 || normalized.discountPercentage > 0) && (
            <>
              <span className="text-xs text-gray-500 line-through">₹{Math.round(normalized.price)}</span>
              <span className="text-xs text-green-600 font-medium">
                {normalized.discount > 0 ? `₹${Math.round(normalized.discount)} OFF` : `${normalized.discountPercentage}% OFF`}
              </span>
            </>
          )}
        </div>
        {normalized.sizes?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {normalized.sizes.map((s) => (
              <span key={s} className="bg-gray-100 text-xs text-gray-600 px-2 py-0.5 rounded">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="bg-white p-4 rounded-t-3xl max-h-[80vh] overflow-y-auto">
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-lg font-semibold">Add {normalized.name} to Cart</DrawerTitle>
            <DrawerDescription className="text-sm text-gray-500">
              Select options to add {normalized.name} to your cart.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(normalized.quantityAvailable, Number(e.target.value) || 1)))}
                type="number"
                min="1"
                max={normalized.quantityAvailable}
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Available: {normalized.quantityAvailable}</p>
            </div>
            {normalized.sizes?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                <div className="flex gap-2 flex-wrap">
                  {normalized.sizes.map((size) => (
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
            {normalized.colors?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {normalized.colors.map((color) => (
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
                loading || (normalized.sizes.length > 0 && !selectedSize) || (normalized.colors.length > 0 && !selectedColor)
                  ? 'opacity-50 cursor-not-allowed'
                  : 'bg-green-400 hover:bg-green-600'
              )}
              disabled={loading || (normalized.sizes.length > 0 && !selectedSize) || (normalized.colors.length > 0 && !selectedColor)}
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
