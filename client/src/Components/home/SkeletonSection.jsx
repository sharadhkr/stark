import React, { useContext } from 'react';
import { DataContext } from '../../App';

const SkeletonSection = React.memo(({ sectionType = 'products' }) => {
  const { cache } = useContext(DataContext);
  const skeletonCount = cache[sectionType]?.skeletonCount || 4;

  const SkeletonCard = () => (
    <div
      className="min-w-[120px] h-40 rounded-lg bg-gray-200 animate-pulse m-2"
      aria-hidden="true"
    ></div>
  );

  return (
    <div className="w-full px-2 py-6">
      <div className="flex overflow-x-auto scrollbar-hide w-full justify-around scroll-smooth snap-x">
        {Array(skeletonCount)
          .fill()
          .map((_, i) => (
            <SkeletonCard key={`skeleton-${sectionType}-${i}`} />
          ))}
      </div>
    </div>
  );
});

export default SkeletonSection;