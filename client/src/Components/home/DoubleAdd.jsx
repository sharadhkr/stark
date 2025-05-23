import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useSwipeable } from 'react-swipeable';
import { DataContext } from '../../App';

const DEFAULT_IMAGE = 'https://via.placeholder.com/300x150?text=Ad+Placeholder';

const DoubleAdd = React.memo(() => {
  const { cache } = useContext(DataContext);
  // Extract Double Ad images from ads array
  const ads = useMemo(() => {
    const doubleAd = (cache.ads?.data || []).find((ad) => ad.type === 'Double Ad');
    return doubleAd?.images || [];
  }, [cache.ads?.data]);
  const [currentIndex, setCurrentIndex] = useState(1);

  // Normalize and validate ad images
  const normalizedImages = useMemo(() => {
    return ads
      .filter((ad) => ad?.url && typeof ad.url === 'string')
      .map((ad) => ({
        url: ad.url && ad.url.trim() !== '' && !ad.disabled ? ad.url : DEFAULT_IMAGE,
        alt: ad._id ? `Ad ${ad._id}` : `Ad ${ad.url.split('/').pop()}`,
      }));
  }, [ads]);

  // Create pairs with padding for seamless looping
  const pairs = useMemo(() => {
    if (normalizedImages.length === 0) return [];
    const groups = [];
    for (let i = 0; i < normalizedImages.length; i += 2) {
      groups.push(normalizedImages.slice(i, i + 2));
    }
    if (groups.length === 0) return [];
    return [groups[groups.length - 1], ...groups, groups[0]];
  }, [normalizedImages]);

  // Debug ad data
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('DoubleAdd Ads:', {
        rawAds: cache.ads?.data?.length,
        doubleAdImages: ads.length,
        normalizedImages: normalizedImages.length,
        pairs: pairs.length,
      });
    }
  }, [cache.ads?.data, ads, normalizedImages, pairs]);

  // Auto-rotation
  useEffect(() => {
    if (normalizedImages.length <= 2) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === pairs.length - 2 ? 1 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, [pairs.length, normalizedImages.length]);

  // Seamless looping
  useEffect(() => {
    if (currentIndex === 0) {
      setTimeout(() => setCurrentIndex(pairs.length - 2), 0);
    } else if (currentIndex === pairs.length - 1) {
      setTimeout(() => setCurrentIndex(1), 0);
    }
  }, [currentIndex, pairs.length]);

  // Swipe handlers
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      setCurrentIndex((prev) => (prev === pairs.length - 2 ? 1 : prev + 1));
    },
    onSwipedRight: () => {
      setCurrentIndex((prev) => (prev === 1 ? pairs.length - 2 : prev - 1));
    },
    trackMouse: true,
    delta: 10,
    preventDefaultTouchmoveEvent: true,
  });

  const goToPair = (index) => {
    setCurrentIndex(index + 1);
  };

  // Loading state
  if (normalizedImages.length === 0 && ads.length > 0) {
    return (
      <div className="w-full px-2 mb-5 flex gap-2">
        <div className="w-1/2 h-32 bg-gray-200 rounded-lg animate-pulse" />
        <div className="w-1/2 h-32 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  // No ads fallback
  if (normalizedImages.length === 0) {
    return (
      <div className="w-full px-2 mb-5 text-center">
        <p className="text-gray-500" aria-live="polite">
          No ad images available
        </p>
      </div>
    );
  }

  return (
    <div className="w-full mb-5">
      <div className="relative w-full bg-transparent overflow-hidden drop-shadow-lg">
        <div
          className="flex h-full transition-transform duration-500 ease-in-out will-change-transform touch-pan-x"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
          {...handlers}
        >
          {pairs.map((pair, pairIndex) => (
            <div
              key={`pair-${pairIndex}`}
              className="min-w-full h-full flex gap-2 px-1"
            >
              {pair.map((image, imgIndex) => (
                <div
                  key={`${image.url}-${imgIndex}`}
                  className="w-1/2 h-full flex items-center justify-center"
                >
                  <img
                    className="w-full h-full object-cover shadow-[0px_0px_20px_-12px_rgba(0,0,0,0.9)] rounded-lg scale-100 transition-transform duration-500 hover:scale-105"
                    src={image.url}
                    alt={image.alt}
                    loading="lazy"
                    fetchpriority={pairIndex === currentIndex ? 'high' : 'auto'}
                    onError={(e) => {
                      if (e.target.src !== DEFAULT_IMAGE) {
                        e.target.src = DEFAULT_IMAGE;
                      }
                    }}
                  />
                </div>
              ))}
              {pair.length < 2 && (
                <div className="w-1/2 h-full flex items-center justify-center bg-gray-100 rounded-lg" />
              )}
            </div>
          ))}
        </div>
      </div>
      {normalizedImages.length > 2 && (
        <div className="flex justify-center gap-2 mt-2">
          {Array.from({ length: Math.ceil(normalizedImages.length / 2) }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToPair(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 shadow-sm hover:scale-125 ${
                currentIndex - 1 === index
                  ? 'bg-purple-400 scale-125'
                  : 'bg-gray-300 hover:bg-gray-500/50'
              }`}
              aria-label={`Go to ad pair ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default DoubleAdd;