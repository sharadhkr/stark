import React from 'react';

const CategoryCardSkeleton = () => {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg animate-pulse">
      <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
      <div className="h-2 bg-gray-200 rounded w-20"></div>
    </div>
  );
};

export default CategoryCardSkeleton;