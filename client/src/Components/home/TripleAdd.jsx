import React, { useState, useEffect, useMemo } from 'react';
import axios from '../axios';
import { useSwipeable } from 'react-swipeable';

function TripleAdd() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch tripleadd images
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get('/api/admin/auth/ads');
        console.log('TripleAdd fetch response:', response.data); // Debug

        const tripleaddImages = response.data.ads
          ?.find((ad) => ad.type === 'Triple Ad')?.images || [];
        const validImages = tripleaddImages
          .filter((img) => img && img.url && !img.disabled)
          .map((img) => ({
            url: img.url.replace(/^http:/, 'https:'),
            alt: `Triple Ad ${img._id || img.url.split('/').pop()}`,
          }));

        console.log('Normalized images:', validImages); // Debug
        setImages(validImages);
      } catch (err) {
        console.error('Error fetching tripleadd images:', err);
        setError(err.message || 'Failed to load images');
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  // Infinite sliding effect: Group images into triplets
  const triplets = useMemo(() => {
    if (images.length === 0) return [];
    const groups = [];
    for (let i = 0; i < images.length; i += 3) {
      groups.push(images.slice(i, i + 3));
    }
    // Duplicate last and first triplets for infinite effect
    return [groups[groups.length - 1] || groups[0], ...groups, groups[0]];
  }, [images]);

  const displayIndex = currentIndex + 1; // Adjust for extended triplets

  // Automatic sliding
  useEffect(() => {
    if (images.length <= 3) return; // No auto-slide for 0–3 images

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev === triplets.length - 2) {
          // Jump to first real triplet (index 1) without animation
          setTimeout(() => setCurrentIndex(1), 0);
          return prev + 1;
        }
        return prev + 1;
      });
    }, 6000); // Slide every 6 seconds

    return () => clearInterval(timer); // Cleanup on unmount
  }, [triplets.length, images.length]);

  // Reset index when reaching duplicate triplets
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
    trackMouse: true, // Allow mouse dragging for desktop
    delta: 10, // Minimum swipe distance
  });

  // Jump to specific triplet
  const goToTriplet = (index) => {
    setCurrentIndex(index + 1); // Adjust for extended triplets
  };

  // Handle loading state
  if (loading) {
    return (
      <div className="w-full px-2 mb-5">
        <div className="w-full h-64 bg-background rounded-2xl shadow-lg flex items-center justify-center">
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
        <p className="text-muted-foreground">No triple ad images available</p>
      </div>
    );
  }

  return (
    <div className="w-full mb-5">
      <div className="relative w-full bg-transparent overflow-hidden drop-shadow-lg">
        <div
          className="flex h-full transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
          {...handlers}
        >
          {triplets.map((triplet, tripletIndex) => (
            <div
              key={`triplet-${tripletIndex}`}
              className="min-w-full h-full flex gap-1 px-1 "
            >
              {triplet.map((image, imgIndex) => (
                <div
                  key={`${image.url}-${imgIndex}`}
                  className="w-1/3 h-full flex items-center justify-center"
                >
                  <img
                    className="w-full h-full object-cover rounded-lg scale-100  transition-transform duration-500 group-hover:scale-105"
                    src={image.url}
                    alt={image.alt}
                    loading="lazy"
                  />
                </div>
              ))}
              {/* Fill empty slots if triplet has fewer than 3 images */}
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
      {/* Dots Navigation (Below Slider) */}
      {images.length > 3 && (
        <div className="flex justify-center gap-2 mt-2">
          {Array.from({ length: Math.ceil(images.length / 3) }).map((_, index) => (
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
}

export default TripleAdd;