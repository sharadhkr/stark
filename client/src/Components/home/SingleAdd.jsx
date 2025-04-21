import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { useSwipeable } from 'react-swipeable';

function SingleAdd() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Automatic slider
  useEffect(() => {
    if (images.length <= 1) return; // No auto-slide for 0 or 1 image

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 6000); // Slide every 5 seconds

    return () => clearInterval(timer); // Cleanup on unmount
  }, [images.length]);

  // Swipe handlers
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    },
    onSwipedRight: () => {
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    },
    trackMouse: true, // Allow mouse dragging for desktop
    delta: 10, // Minimum swipe distance
  });

  // Jump to specific image
  const goToImage = (index) => {
    setCurrentIndex(index);
  };

  // Handle loading state
  if (loading) {
    return (
     <div className="w-full px-2">
         <div className="w-full px-2 mb-5 flex justify-center items-center h-30 bg-gray-50/75 rounded-2xl shadow-[0px_0px_20px_-12px_rgba(0,0,0,1)]">
        <div className="animate-spin rounded-full drop-shadow-lg h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
     </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="w-full px-2 mb-5 text-center">
        <p className="text-red-600">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
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
        <p className="text-gray-600">No single ad images available</p>
      </div>
    );
  }

  return (
    <div className="w-full px-2 mb-5">
      <div
        className="relative w-full overflow-hidden rounded-2xl shadow-[0px_0px_20px_-10px_rgba(0,0,0,0.8)]"
        {...handlers}
      >
        <div
          className="flex w-full h-full transition-opacity duration-500 drop-shadow-2xl"
          style={{ opacity: 1 }}
        >
          <img
            className="w-full h-full object-cover shadow-2xl"
            src={images[currentIndex].url}
            alt={images[currentIndex].alt}
            loading="lazy"
          />
        </div>
        {/* Dots Pagination */}
        {images.length > 1 && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`w-2 h-2 rounded-full transition drop-shadow-lg ${
                  index === currentIndex ? 'bg-purple-600' : 'bg-gray-400'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SingleAdd;