import React from 'react';

const SellerCardSkeleton = () => {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-md min-w-[200px] animate-pulse">
      <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
      <div className="space-y-2">
        <div className="h-2 bg-gray-200 rounded w-24"></div>
        <div className="h-3 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  );
};

export default SellerCardSkeleton;