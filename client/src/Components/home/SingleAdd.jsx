import React, { useState, useEffect, useMemo } from 'react';
import axios from '../axios';
import { useSwipeable } from 'react-swipeable';

function SingleAdd() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch images from API
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get('/api/admin/auth/ads');
        console.log('SingleAdd fetch response:', response.data); // Debug

        const singleaddImages = response.data.ads
          ?.find((ad) => ad.type === 'Single Ad')?.images || [];
        const validImages = singleaddImages
          .filter((img) => img && img.url && !img.disabled)
          .map((img) => ({
            url: img.url.replace(/^http:/, 'https:'),
            alt: `Single Ad ${img._id || img.url.split('/').pop()}`,
          }));

        console.log('Normalized images:', validImages); // Debug
        setImages(validImages);
      } catch (err) {
        console.error('Error fetching singleadd images:', err);
        setError(err.message || 'Failed to load images');
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  // Infinite sliding effect
  const extendedImages = useMemo(() => {
    if (images.length === 0) return [];
    // Duplicate first and last images for infinite effect
    return [images[images.length - 1], ...images, images[0]];
  }, [images]);

  const displayIndex = currentIndex + 1; // Adjust for extendedImages

  // Automatic sliding
  useEffect(() => {
    if (images.length <= 1) return; // No auto-slide for 0 or 1 image

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev === extendedImages.length - 2) {
          // Jump to first real image (index 1) without animation
          setTimeout(() => setCurrentIndex(1), 0);
          return prev + 1;
        }
        return prev + 1;
      });
    }, 6000); // Slide every 6 seconds

    return () => clearInterval(timer); // Cleanup on unmount
  }, [extendedImages.length, images.length]);

  // Reset index when reaching duplicate images
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
    trackMouse: true, // Allow mouse dragging for desktop
    delta: 10, // Minimum swipe distance
  });

  // Jump to specific image
  const goToImage = (index) => {
    setCurrentIndex(index + 1); // Adjust for extendedImages
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
      <div className="w-full mb-5 text-center">
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
      <div className="w-full mb-5 text-center">
        <p className="text-muted-foreground">No single ad images available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-fit px-2 mb-5">
      <div className="relative w-full bg-transparent overflow-hidden drop-shadow-lg">
        <div
          className="flex w-full h-full transition-transform duration-500 ease-in-out"
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
                className="w-full h-full object-cover rounded-2xl scale-100 transition-transform duration-500 group-hover:scale-105"
                src={image.url}
                alt={image.alt}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
      {/* Dots Navigation (Below Slider) */}
      {images.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 shadow-sm hover:scale-125 ${displayIndex - 1 === index
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
}

export default SingleAdd;