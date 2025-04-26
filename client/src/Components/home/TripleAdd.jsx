import React, { useState, useEffect, useMemo } from 'react';
import { useSwipeable } from 'react-swipeable';

// Memoize to prevent unnecessary re-renders
const TripleAdd = React.memo(({ images = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Normalize images (already done in Home.jsx, but ensure format)
  const normalizedImages = useMemo(() => {
    return images
      .filter((img) => img && img.url && !img.disabled)
      .map((img) => ({
        url: img.url.replace(/^http:/, 'https:'),
        alt: `Triple Ad ${img._id || img.url.split('/').pop()}`,
      }));
  }, [images]);

  // Group images into triplets for sliding
  const triplets = useMemo(() => {
    if (normalizedImages.length === 0) return [];
    const groups = [];
    for (let i = 0; i < normalizedImages.length; i += 3) {
      groups.push(normalizedImages.slice(i, i + 3));
    }
    // Duplicate for infinite effect
    return [groups[groups.length - 1] || groups[0], ...groups, groups[0]];
  }, [normalizedImages]);

  const displayIndex = currentIndex + 1;

  // Automatic sliding
  useEffect(() => {
    if (normalizedImages.length <= 3) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev === triplets.length - 2) {
          setTimeout(() => setCurrentIndex(1), 0);
          return prev + 1;
        }
        return prev + 1;
      });
    }, 6000);

    return () => clearInterval(timer);
  }, [triplets.length, normalizedImages.length]);

  // Reset index for infinite effect
  useEffect(() => {
    if (currentIndex === 0) {
      setTimeout(() => setCurrentIndex(triplets.length - 2), 0);
    } else if (currentIndex === triplets.length - 1) {
      setTimeout(() => setCurrentIndex(1), 0);
    }
  }, [currentIndex, triplets.length]);

  // Swipe handlers
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      setCurrentIndex((prev) => {
        if (prev === triplets.length - 2) {
          setTimeout(() => setCurrentIndex(1), 0);
          return prev + 1;
        }
        return prev + 1;
      });
    },
    onSwipedRight: () => {
      setCurrentIndex((prev) => {
        if (prev === 1) {
          setTimeout(() => setCurrentIndex(triplets.length - 2), 0);
          return prev - 1;
        }
        return prev - 1;
      });
    },
    trackMouse: true,
    delta: 10,
    preventDefaultTouchmoveEvent: true, // Improve touch responsiveness
  });

  // Jump to specific triplet
  const goToTriplet = (index) => {
    setCurrentIndex(index + 1);
  };

  // Handle no images
  if (normalizedImages.length === 0) {
    return (
      <div className="w-full px-2 mb-5 text-center">
        <p className="text-muted-foreground">No triple ad images available</p>
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
          {triplets.map((triplet, tripletIndex) => (
            <div
              key={`triplet-${tripletIndex}`}
              className="min-w-full h-full flex gap-1 px-1"
            >
              {triplet.map((image, imgIndex) => (
                <div
                  key={`${image.url}-${imgIndex}`}
                  className="w-1/3 h-full flex items-center justify-center"
                >
                  <img
                    className="w-full h-full object-cover rounded-lg scale-100 transition-transform duration-500 hover:scale-105"
                    src={image.url}
                    alt={image.alt}
                    loading="lazy"
                    // Preload next images
                    fetchpriority={tripletIndex === currentIndex + 1 ? 'high' : 'auto'}
                  />
                </div>
              ))}
              {triplet.length < 3 &&
                Array.from({ length: 3 - triplet.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="w-1/3 h-full flex items-center justify-center bg-background rounded-lg"
                  />
                ))}
            </div>
          ))}
        </div>
      </div>
      {normalizedImages.length > 3 && (
        <div className="flex justify-center gap-2 mt-2">
          {Array.from({ length: Math.ceil(normalizedImages.length / 3) }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToTriplet(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 shadow-sm hover:scale-125 ${
                displayIndex - 1 === index
                  ? 'bg-purple-400 scale-125'
                  : 'bg-gray-300 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to triplet ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default TripleAdd;