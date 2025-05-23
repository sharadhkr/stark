import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useSwipeable } from 'react-swipeable';
import { DataContext } from '../../App';

const DEFAULT_IMAGE = 'https://your-server.com/generic-ad-placeholder.jpg';

const DoubleAdd = React.memo(() => {
  const { cache } = useContext(DataContext);
  const ads = cache.ads?.data || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  const normalizedImages = useMemo(() => {
    return ads
      .filter((ad) => ad && ad.url && !ad.disabled)
      .map((ad) => ({
        url: ad.url.replace(/^http:/, 'https:'),
        alt: `Ad ${ad._id || ad.url.split('/').pop()}`,
      }));
  }, [ads]);

  const pairs = useMemo(() => {
    if (normalizedImages.length === 0) return [];
    const groups = [];
    for (let i = 0; i < normalizedImages.length; i += 2) {
      groups.push(normalizedImages.slice(i, i + 2));
    }
    return [groups[groups.length - 1] || groups[0], ...groups, groups[0]];
  }, [normalizedImages]);

  const displayIndex = currentIndex + 1;

  useEffect(() => {
    if (normalizedImages.length <= 2) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev === pairs.length - 2) {
          setTimeout(() => setCurrentIndex(1), 0);
          return prev + 1;
        }
        return prev + 1;
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [pairs.length, normalizedImages.length]);

  useEffect(() => {
    if (currentIndex === 0) {
      setTimeout(() => setCurrentIndex(pairs.length - 2), 0);
    } else if (currentIndex === pairs.length - 1) {
      setTimeout(() => setCurrentIndex(1), 0);
    }
  }, [currentIndex, pairs.length]);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      setCurrentIndex((prev) => {
        if (prev === pairs.length - 2) {
          setTimeout(() => setCurrentIndex(1), 0);
          return prev + 1;
        }
        return prev + 1;
      });
    },
    onSwipedRight: () => {
      setCurrentIndex((prev) => {
        if (prev === 1) {
          setTimeout(() => setCurrentIndex(pairs.length - 2), 0);
          return prev - 1;
        }
        return prev - 1;
      });
    },
    trackMouse: true,
    delta: 10,
    preventDefaultTouchmoveEvent: true,
  });

  const goToPair = (index) => {
    setCurrentIndex(index + 1);
  };

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
          className="flex h-full transition-transform duration-500 ease-in-out will-change-transform"
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
                    fetchpriority={pairIndex === currentIndex + 1 ? 'high' : 'auto'}
                    onError={(e) => {
                      if (e.target.src !== DEFAULT_IMAGE) {
                        console.warn(`Failed to load ad image: ${e.target.src}`);
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
                displayIndex - 1 === index
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