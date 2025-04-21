import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { useSwipeable } from 'react-swipeable';

function DoubleAdd() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Automatic slider
  useEffect(() => {
    if (images.length <= 2) return; // No auto-slide for 0, 1, or 2 images

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = Math.ceil(images.length / 2) - 1;
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 6000); // Slide every 6 seconds

    return () => clearInterval(timer); // Cleanup on unmount
  }, [images.length]);

  // Swipe handlers
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      setCurrentIndex((prev) => {
        const maxIndex = Math.ceil(images.length / 2) - 1;
        return prev >= maxIndex ? 0 : prev + 1;
      });
    },
    onSwipedRight: () => {
      setCurrentIndex((prev) => (prev === 0 ? Math.ceil(images.length / 2) - 1 : prev - 1));
    },
    trackMouse: true, // Allow mouse dragging for desktop
    delta: 10, // Minimum swipe distance
  });

  // Jump to specific pair
  const goToPair = (index) => {
    setCurrentIndex(index);
  };

  // Handle loading state
  if (loading) {
    return (
      <div className="w-full px-2">
        <div className="w-full px-2 mb-5 flex justify-center items-center h-30 bg-gray-50/70 shadow-[0px_0px_20px_-12px_rgba(0,0,0,0.8)] rounded-2xl">
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
        <p className="text-gray-600">No double ad images available</p>
      </div>
    );
  }

  // Get current pair of images
  const currentImages = [
    images[currentIndex * 2] || null,
    images[currentIndex * 2 + 1] || null,
  ].filter(Boolean); // Remove nulls if second image is missing

  return (
    <div className="relative w-full">
      <div className="w-full px-2 mb-5">
        <div className="relative w-full" {...handlers}>
          <div className="flex w-full h-full transition-opacity gap-2 duration-500">
            {currentImages.map((image, index) => (
              <div key={index} className="w-1/2 h-full">
                <img
                  className="w-full h-full object-cover rounded-xl shadow-[0px_0px_20px_-13px_rgba(0,0,0,0.7)]"
                  src={image.url}
                  alt={image.alt}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
        {/* Line Pagination */}
        {images.length > 2 && (
          <div className="flex justify-center mt-3 drop-shadow-lg">
            <div className="flex gap-2">
              {Array.from({ length: Math.ceil(images.length / 2) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToPair(index)}
                  className={`w-3 h-[2px] transition drop-shadow-lg ${index === currentIndex ? 'bg-purple-600' : 'bg-gray-400'
                    }`}
                  aria-label={`Go to image pair ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="absolute w-full -z-10 opacity-40 top-0 left-0 flex items-center justify-center blur-2xl">
        <div className='w-[30%] h-22 bg-purple-400'></div>
        <div className='w-[30%] h-22 bg-green-400'></div>
        <div className='w-[30%] h-22 bg-yellow-400'></div>
        <div className='w-[30%] h-22 bg-pink-400'></div>
      </div>
    </div>
  );
}

export default DoubleAdd;