import React from 'react';

const ProductCardSkeleton = () => {
  return (
    <div className="w-full max-w-[600px] bg-white rounded-xl border border-gray-200 flex items-center p-3 sm:p-4 shadow-sm animate-pulse">
      {/* Image Section */}
      <div className="relative w-[100px] h-[100px] flex-shrink-0">
        <div className="w-full h-full bg-gray-200 rounded-xl"></div>
        <div className="absolute top-2 left-2 bg-gray-200 text-transparent text-xs font-semibold px-2 py-0.5 rounded-full">
          Placeholder
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-grow ml-3 sm:ml-4 flex flex-col justify-between h-full">
        {/* Name and Actions */}
        <div className="flex justify-between items-start">
          <div className="h-5 bg-gray-200 rounded w-3/5"></div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-gray-200 border border-gray-200 w-8 h-8"></div>
            <div className="p-2 rounded-full bg-gray-200 border border-gray-200 w-8 h-8"></div>
          </div>
        </div>

        {/* Price Details */}
        <div className="flex items-center gap-2 sm:gap-3 mt-1">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>

        {/* Quantity, Size, Stock */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="h-4 bg-gray-200 rounded w-12"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 bg-gray-200 rounded w-12"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;