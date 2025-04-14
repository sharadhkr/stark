import React from 'react';

const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 w-full max-w-[220px] animate-pulse">
      <div className="w-full h-40 bg-gray-200 rounded-lg mb-4"></div>
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    </div>
  );
};

export default ProductCardSkeleton;