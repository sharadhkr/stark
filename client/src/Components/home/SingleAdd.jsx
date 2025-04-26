import React, { useState, useEffect, useMemo } from 'react';
import { useSwipeable } from 'react-swipeable';

// Memoize to prevent unnecessary re-renders
const SingleAdd = React.memo(({ images = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Normalize images
  const normalizedImages = useMemo(() => {
    return images
      .filter((img) => img && img.url && !img.disabled)
      .map((img) => ({
        url: img.url.replace(/^http:/, 'https:'),
        alt: `Single Ad ${img._id || img.url.split('/').pop()}`,
      }));
  }, [images]);

  // Infinite sliding effect
  const extendedImages = useMemo(() => {
    if (normalizedImages.length === 0) return [];
    return [normalizedImages[normalizedImages.length - 1], ...normalizedImages, normalizedImages[0]];
  }, [normalizedImages]);

  const displayIndex = currentIndex + 1;

  // Automatic sliding
  useEffect(() => {
    if (normalizedImages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev === extendedImages.length - 2) {
          setTimeout(() => setCurrentIndex(1), 0);
          return prev + 1;
        }
        return prev + 1;
      });
    }, 6000);

    return () => clearInterval(timer);
  }, [extendedImages.length, normalizedImages.length]);

  // Reset index
  useEffect(() => {
    if (currentIndex === 0) {
      setTimeout(() => setCurrentIndex(extendedImages.length - 2), 0);
    } else if (currentIndex === extendedImages.length - 1) {
      setTimeout(() => setCurrentIndex(1), 0);
    }
  }, [currentIndex, extendedImages.length]);

  // Swipe handlers
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      setCurrentIndex((prev) => {
        if (prev === extendedImages.length - 2) {
          setTimeout(() => setCurrentIndex(1), 0);
          return prev + 1;
        }
        return prev + 1;
      });
    },
    onSwipedRight: () => {
      setCurrentIndex((prev) => {
        if (prev === 1) {
          setTimeout(() => setCurrentIndex(extendedImages.length - 2), 0);
          return prev - 1;
        }
        return prev - 1;
      });
    },
    trackMouse: true,
    delta: 10,
    preventDefaultTouchmoveEvent: true,
  });

  // Jump to specific image
  const goToImage = (index) => {
    setCurrentIndex(index + 1);
  };

  // Handle no images
  if (normalizedImages.length === 0) {
    return (
      <div className="w-full mb-5 text-center">
        <p className="text-muted-foreground">No single ad images available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-fit px-2 mb-5">
      <div className="relative w-full bg-transparent overflow-hidden drop-shadow-lg">
        <div
          className="flex w-full h-full transition-transform duration-500 ease-in-out will-change-transform"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
          {...handlers}
        >
          {extendedImages.map((image, index) => (
            <div
              key={`${image.url}-${index}`}
              className="min-w-full h-full flex items-center justify-center"
            >
              <img
                className="w-full h-full object-cover rounded-2xl scale-100 transition-transform duration-500 hover:scale-105"
                src={image.url}
                alt={image.alt}
                loading="lazy"
                fetchpriority={index === currentIndex + 1 ? 'high' : 'auto'}
              />
            </div>
          ))}
        </div>
      </div>
      {normalizedImages.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {normalizedImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 shadow-sm hover:scale-125 ${
                displayIndex - 1 === index
                  ? 'bg-purple-400 scale-125'
                  : 'bg-gray-300 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default SingleAdd;