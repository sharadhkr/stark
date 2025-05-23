import React, { useMemo, useContext } from 'react';
import ProductCard from '../ProductCard';
import GenderFilterBar from './GenderFilterBar';
import { DataContext } from '../../App';

const DEFAULT_IMAGE = 'https://your-server.com/generic-product-placeholder.jpg';

const ProductSkeleton = () => (
  <div className="w-full h-64 bg-gray-200 rounded-lg animate-pulse" />
);

const ProductSection = React.memo(({ selectedGender, onGenderChange }) => {
  const { cache } = useContext(DataContext);
  const products = cache.products?.data || [];

  const validFilteredProducts = useMemo(() => {
    const seenIds = new Set();
    const filtered = products
      .filter((product) => {
        if (!product || !product._id) return false;
        if (seenIds.has(product._id)) return false;
        seenIds.add(product._id);
        return selectedGender === 'all' || product.gender?.toLowerCase() === selectedGender.toLowerCase();
      })
      .map((product) => ({
        ...product,
        image: product.image && product.image !== 'https://via.placeholder.com/150' ? product.image : DEFAULT_IMAGE,
      }));
    if (process.env.NODE_ENV === 'development') {
      console.log('Valid Filtered Products:', filtered);
    }
    return filtered;
  }, [products, selectedGender]);

  if (!products.length) {
    return (
      <div className="w-full min-h-screen flex flex-col">
        <GenderFilterBar onGenderChange={onGenderChange} selectedGender={selectedGender} />
        <div className="grid gap-4 p-4 grid-cols-2">
          {Array(3)
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
        <GenderFilterBar onGenderChange={onGenderChange} selectedGender={selectedGender} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600" aria-live="polite">
            No products available.
          </p>
        </div>
      </div>
    );
  }

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
    </div>
  );
});

export default ProductSection;