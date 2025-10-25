import React from "react";

const ProductCardSkeleton = () => {
  return (
    <div className="w-full max-w-[600px] bg-white rounded-xl border border-gray-200 flex items-center p-3 sm:p-4 shadow-sm overflow-hidden">
      {/* Image Section */}
      <div className="relative w-[100px] h-[100px] flex-shrink-0">
        <div className="w-full h-full bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="absolute top-2 left-2 w-14 h-4 bg-gray-200 rounded-full animate-pulse"></div>
      </div>

      {/* Content Section */}
      <div className="flex-grow ml-3 sm:ml-4 flex flex-col justify-between h-full">
        {/* Name and Actions */}
        <div className="flex justify-between items-start">
          <div className="h-5 bg-gray-200 rounded-md w-3/5 animate-pulse"></div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div> */}
            {/* <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div> */}
          </div>
        </div>

        {/* Price Details */}
        <div className="flex items-center gap-3 mt-2">
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
          {/* <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div> */}
        </div>

        {/* Quantity, Size, Stock */}
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <div className="flex items-center gap-2">
            <div className="h-4 bg-gray-200 rounded w-10 animate-pulse"></div>
            {/* <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div> */}
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 bg-gray-200 rounded w-10 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
