import React, { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { useInView } from 'react-intersection-observer';
import axios from '../useraxios';
import toast from 'react-hot-toast';
import ProductCard from '../ProductCard';
import GenderFilterBar from './GenderFilterBar';
import { DataContext } from '../../App';

// Skeleton component
const ProductSkeleton = () => (
  <div className="w-full h-64 bg-gray-200 rounded-lg animate-pulse" />
);

const ProductSection = React.memo(({ products = [], filteredProducts = [], setFilteredProducts, onGenderChange, selectedGender }) => {
  const { cache, updateCache } = useContext(DataContext);
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  });

  // Deduplicate products
  const validFilteredProducts = useMemo(() => {
    const seenIds = new Set();
    return filteredProducts.filter((product) => {
      if (!product || !product._id) return false;
      if (seenIds.has(product._id)) return false;
      seenIds.add(product._id);
      return true;
    });
  }, [filteredProducts]);

  // Infinite scroll
  const loadMoreProducts = useCallback(async () => {
    if (isFetching || !hasMore) return;
    setIsFetching(true);
    try {
      const response = await axios.get('/api/user/auth/products', {
        params: { page: page + 1, limit: 5 },
      });
      const newProducts = response.data.products || [];
      if (newProducts.length < 5) {
        setHasMore(false);
      }
      updateCache('products', [...cache.products.data, ...newProducts]);
      setFilteredProducts((prev) => {
        const prevIds = new Set(prev.map((p) => p._id));
        const uniqueNewProducts = newProducts.filter((p) => p._id && !prevIds.has(p._id));
        return [...prev, ...uniqueNewProducts];
      });
      setPage((prev) => prev + 1);
    } catch (error) {
      toast.error('Failed to load more products');
    } finally {
      setIsFetching(false);
    }
  }, [isFetching, hasMore, page, cache.products.data, updateCache, setFilteredProducts]);

  useEffect(() => {
    if (inView && !isFetching && hasMore) {
      loadMoreProducts();
    }
  }, [inView, isFetching, hasMore, loadMoreProducts]);

  // Loading state
  if (!cache.products.data.length) {
    return (
      <div className="w-full min-h-screen flex flex-col">
        <GenderFilterBar onGenderChange={onGenderChange} selectedGender={selectedGender} />
        <div className="grid gap-4 p-4 grid-cols-2">
          {Array(3).fill().map((_, i) => (
            <ProductSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (validFilteredProducts.length === 0) {
    return (
      <div className="w-full min-h-screen flex flex-col">
        <GenderFilterBar onGenderChange={onGenderChange} selectedGender={selectedGender} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600 text-center">No products available.</p>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="w-full min-h-screen flex flex-col">
      <GenderFilterBar onGenderChange={onGenderChange} selectedGender={selectedGender} />
      <div className="grid gap-4 p-4 grid-cols-2">
        {validFilteredProducts.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            wishlist={cache.wishlist.data}
            cart={cache.cart.data}
            wishlistLoading={false}
            cartLoading={false}
            wishlistError={null}
            cartError={null}
          />
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