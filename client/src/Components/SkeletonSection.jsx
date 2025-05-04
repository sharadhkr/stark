import React from 'react';

const SkeletonSection = () => (
  <div className="w-full px-4 py-6">
    <div className="h-6 w-1/4 bg-gray-200 rounded mb-4 animate-pulse"></div>
    <div className="flex gap-4 overflow-x-auto">
      {Array(5)
        .fill()
        .map((_, i) => (
          <div key={i} className="w-52 h-64 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"></div>
        ))}
    </div>
  </div>
);

export default SkeletonSection;