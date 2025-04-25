import React, { useState, useEffect, useMemo } from 'react';
import axios from '../axios';
import { useSwipeable } from 'react-swipeable';

function DoubleAdd() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch doubleadd images
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get('/api/admin/auth/ads');
        console.log('DoubleAdd fetch response:', response.data); // Debug

        const doubleaddImages = response.data.ads
          ?.find((ad) => ad.type === 'Double Ad')?.images || [];
        const validImages = doubleaddImages
          .filter((img) => img && img.url && !img.disabled)
          .map((img) => ({
            url: img.url.replace(/^http:/, 'https:'),
            alt: `Double Ad ${img._id || img.url.split('/').pop()}`,
          }));

        console.log('Normalized images:', validImages); // Debug
        setImages(validImages);
      } catch (err) {
        console.error('Error fetching doubleadd images:', err);
        setError(err.message || 'Failed to load images');
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  // Infinite sliding effect: Group images into pairs
  const pairs = useMemo(() => {
    if (images.length === 0) return [];
    const groups = [];
    for (let i = 0; i < images.length; i += 2) {
      groups.push(images.slice(i, i + 2));
    }
    // Duplicate last and first pairs for infinite effect
    return [groups[groups.length - 1] || groups[0], ...groups, groups[0]];
  }, [images]);

  const displayIndex = currentIndex + 1; // Adjust for extended pairs

  // Automatic sliding
  useEffect(() => {
    if (images.length <= 2) return; // No auto-slide for 0–2 images

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev === pairs.length - 2) {
          // Jump to first real pair (index 1) without animation
          setTimeout(() => setCurrentIndex(1), 0);
          return prev + 1;
        }
        return prev + 1;
      });
    }, 6000); // Slide every 6 seconds

    return () => clearInterval(timer); // Cleanup on unmount
  }, [pairs.length, images.length]);

  // Reset index when reaching duplicate pairs
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
    trackMouse: true, // Allow mouse dragging for desktop
    delta: 10, // Minimum swipe distance
  });

  // Jump to specific pair
  const goToPair = (index) => {
    setCurrentIndex(index + 1); // Adjust for extended pairs
  };

  // Handle loading state
  if (loading) {
    return (
      <div className="w-full px-2 mb-5 h-20">
        <div className="w-full h-18 bg-background rounded-2xl shadow-lg flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="w-full px-2 mb-5 text-center">
        <p className="text-destructive font-medium">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Handle no images
  if (images.length === 0) {
    return (
      <div className="w-full px-2 mb-5 text-center">
        <p className="text-muted-foreground">No double ad images available</p>
      </div>
    );
  }

  return (
    <div className="w-full mb-5">
      <div className="relative w-full bg-transparent overflow-hidden drop-shadow-lg ">
        <div
          className="flex h-full transition-transform duration-500 ease-in-out"
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
                    className="w-full h-full object-cover shadow-[0px_0px_20px_-12px_rgba(0,0,0,0.9)] rounded-lg scale-100 transition-transform duration-500 group-hover:scale-105"
                    src={image.url}
                    alt={image.alt}
                    loading="lazy"
                  />
                </div>
              ))}
              {/* Fill empty slot if pair has only one image */}
              {pair.length < 2 && (
                <div className="w-1/2 h-full flex items-center justify-center bg-background rounded-lg" />
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Dots Navigation (Below Slider) */}
      {images.length > 2 && (
        <div className="flex justify-center gap-2 mt-2">
          {Array.from({ length: Math.ceil(images.length / 2) }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToPair(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 shadow-sm hover:scale-125 ${
                displayIndex - 1 === index
                  ? 'bg-purple-400 scale-125'
                  : 'bg-gray-300 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to pair ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default DoubleAdd;