import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import axios from '../useraxios';
import toast from 'react-hot-toast';
import ProductCard from '../ProductCard';
import GenderFilterBar from './GenderFilterBar';

// Skeleton component for loading state
const ProductSkeleton = () => (
  <div className="w-full h-64 bg-gray-200 rounded-lg animate-pulse" />
);

const ProductSection = React.memo(({ products = [], filteredProducts = [], setFilteredProducts, loading = false }) => {
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState(null);
  const [cartError, setCartError] = useState(null);
  const navigate = useNavigate();
  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  });

  const validFilteredProducts = useMemo(() => {
    const seenIds = new Set();
    const uniqueProducts = filteredProducts
      .filter((product) => {
        if (!product || !product._id) return false;
        if (seenIds.has(product._id)) {
          console.warn(`Duplicate product ID found: ${product._id}`, product);
          return false;
        }
        seenIds.add(product._id);
        return true;
      })
      .slice(0);
    console.log(`Unique products count: ${uniqueProducts.length}`);
    return uniqueProducts;
  }, [filteredProducts]);

  const fetchWithRetry = useCallback(
    async (url, setData, setLoading, setError, retries = 3, delay = 1000) => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn(`No token found for ${url}`);
        toast.error('Please login to access wishlist and cart');
        setLoading(false);
        setError(new Error('No token'));
        return;
      }

      console.log(`Fetching ${url} with token: ${token.substring(0, 10)}...`);
      setLoading(true);
      setError(null);

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const response = await axios.get(url);
          console.log(`Success for ${url}:`, response.data);
          if (url.includes('wishlist')) {
            const wishlistIds = Array.isArray(response.data.wishlist)
              ? response.data.wishlist.map((item) => item._id?.toString() || item.productId?.toString())
              : [];
            setData(wishlistIds);
          } else if (url.includes('cart')) {
            const cartIds = response.data.cart?.items
              ? response.data.cart.items.map((item) => item.product?._id?.toString() || item.productId?.toString())
              : [];
            setData(cartIds);
          }
          setLoading(false);
          return;
        } catch (error) {
          console.error(`Attempt ${attempt} failed for ${url}:`, error);
          if (error.response?.status === 401) {
            console.warn('Unauthorized error, redirecting to login');
            toast.error('Session expired, please login again');
            localStorage.removeItem('token');
            setLoading(false);
            setError(error);
            return;
          }
          if (attempt === retries) {
            setError(error);
            setLoading(false);
            toast.error(`Failed to load ${url.includes('wishlist') ? 'wishlist' : 'cart'}`);
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
      }
    },
    [navigate]
  );

  useEffect(() => {
    fetchWithRetry(
      'http://localhost:3000/api/user/auth/wishlist',
      setWishlist,
      setWishlistLoading,
      setWishlistError
    );
    fetchWithRetry(
      'http://localhost:3000/api/user/auth/cart',
      setCart,
      setCartLoading,
      setCartError
    );
  }, [fetchWithRetry]);

  const loadMoreProducts = useCallback(async () => {
    if (isFetching || !hasMore) return;
    setIsFetching(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const itemsPerPage = 50;
      const startIndex = (page - 1) * itemsPerPage;
      const newProducts = products.slice(startIndex, startIndex + itemsPerPage);
      if (newProducts.length === 0) {
        setHasMore(false);
      } else {
        setFilteredProducts((prev) => {
          const prevIds = new Set(prev.map((p) => p._id));
          const uniqueNewProducts = newProducts.filter((p) => !prevIds.has(p._id));
          console.log(`Appending ${uniqueNewProducts.length} new unique products`);
          return [...prev, ...uniqueNewProducts];
        });
        setPage((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      setIsFetching(false);
    }
  }, [isFetching, hasMore, page, products, setFilteredProducts]);

  useEffect(() => {
    if (inView && !isFetching && hasMore) {
      loadMoreProducts();
    }
  }, [inView, isFetching, hasMore, loadMoreProducts]);

  const observerRef = useRef(null);
  const [visibleProducts, setVisibleProducts] = useState([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleIds = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target.dataset.id);
        setVisibleProducts((prev) => [...new Set([...prev, ...visibleIds])]);
      },
      { rootMargin: '100px', threshold: 0.1 }
    );
    observerRef.current = observer;
    const elements = document.querySelectorAll('.product-card');
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [validFilteredProducts]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex flex-col">
        <GenderFilterBar products={products} setFilteredProducts={setFilteredProducts} />
        <div className="grid gap-4 p-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {Array(10)
            .fill()
            .map((_, i) => (
              <ProductSkeleton key={`skeleton-${i}`} />
            ))}
        </div>
      </div>
    );
  }

  if (validFilteredProducts.length === 0) {
    return (
      <div className="w-full min-h-screen flex flex-col">
        <GenderFilterBar products={products} setFilteredProducts={setFilteredProducts} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600 text-center">No products available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col">
      <GenderFilterBar products={products} setFilteredProducts={setFilteredProducts} />
      <div className="grid gap-4 p-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {validFilteredProducts.map((product) => (
          <div
            key={product._id}
            className="product-card min-h-[200px]"
            data-id={product._id}
          >
            <ProductCard
              product={product}
              wishlist={wishlist}
              cart={cart}
              wishlistLoading={wishlistLoading}
              cartLoading={cartLoading}
              wishlistError={wishlistError}
              cartError={cartError}
            />
          </div>
        ))}
      </div>
      <div ref={sentinelRef} className="h-10">
        {isFetching && (
          <div className="flex justify-center py-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {!hasMore && validFilteredProducts.length > 0 && (
          <p className="text-gray-600 text-center py-4">No more products to load.</p>
        )}
      </div>
    </div>
  );
});

export default ProductSection;