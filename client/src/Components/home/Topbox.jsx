import React, { useContext } from 'react';
import { DataContext } from '../../App';

const DEFAULT_IMAGE = 'https://your-server.com/generic-banner-placeholder.jpg';

const Topbox = React.memo(() => {
  const { cache } = useContext(DataContext);
  const bannerImage = cache.banner?.data?.url || DEFAULT_IMAGE;

  return (
    <div className="relative w-full h-14 z-10 mb-4 flex items-end justify-end px-2">
      <div
        className="absolute flex items-center justify-center w-[58%] h-full opacity-75 bg-gray-50 bg-cover bg-center rounded-2xl shadow-[0px_0px_20px_-12px_rgba(0,0,0,1)]"
        role="img"
        aria-label="Promotional banner"
      >
        <img
          src={bannerImage}
          alt="Promotional banner"
          className="w-full h-full object-cover rounded-2xl"
          loading="lazy"
          onError={(e) => {
            if (e.target.src !== DEFAULT_IMAGE) {
              console.warn(`Failed to load banner image: ${e.target.src}`);
              e.target.src = DEFAULT_IMAGE;
            }
          }}
        />
      </div>
    </div>
  );
});

export default Topbox;