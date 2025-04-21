import React, { useState, useEffect } from 'react';
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

  // Automatic slider
  useEffect(() => {
    if (images.length <= 3) return; // No auto-slide for 0, 1, 2, or 3 images

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = Math.ceil(images.length / 3) - 1;
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 6000); // Slide every 6 seconds

    return () => clearInterval(timer); // Cleanup on unmount
  }, [images.length]);

  // Swipe handlers
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      setCurrentIndex((prev) => {
        const maxIndex = Math.ceil(images.length / 3) - 1;
        return prev >= maxIndex ? 0 : prev + 1;
      });
    },
    onSwipedRight: () => {
      setCurrentIndex((prev) => (prev === 0 ? Math.ceil(images.length / 3) - 1 : prev - 1));
    },
    trackMouse: true, // Allow mouse dragging for desktop
    delta: 10, // Minimum swipe distance
  });

  // Jump to specific triplet
  const goToTriplet = (index) => {
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
        <p className="text-gray-600">No triple ad images available</p>
      </div>
    );
  }

  // Get current triplet of images
  const currentImages = [
    images[currentIndex * 3] || null,
    images[currentIndex * 3 + 1] || null,
    images[currentIndex * 3 + 2] || null,
  ].filter(Boolean); // Remove nulls if images are missing

  return (
    <div className="w-full relative">
      <div className="w-full px-2 mb-5">
        <div className="relative w-full " {...handlers}>
          <div className="flex w-full h-full transition-opacity gap-1 duration-500">
            {currentImages.map((image, index) => (
              <div key={index} className="w-1/3 h-full">
                <img
                  className="w-full h-full object-cover rounded-lg shadow-[0px_0px_20px_-12px_rgba(0,0,0,1)]"
                  src={image.url}
                  alt={image.alt}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
        {/* Line Pagination */}
        {images.length > 3 && (
          <div className="flex justify-center mt-3 drop-shadow-lg">
            <div className="flex gap-2">
              {Array.from({ length: Math.ceil(images.length / 3) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToTriplet(index)}
                  className={`w-3 h-[2px] transition drop-shadow-lg ${index === currentIndex ? 'bg-purple-600' : 'bg-gray-400'
                    }`}
                  aria-label={`Go to image triplet ${index + 1}`}
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

export default TripleAdd;