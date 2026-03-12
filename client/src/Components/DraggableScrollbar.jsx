import React, { useRef, useEffect, useState } from 'react';

const DraggableScrollbar = ({ children, className = '' }) => {
  const scrollContainerRef = useRef(null);
  const thumbRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [thumbHeight, setThumbHeight] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Calculate thumb size, scroll height, and total pages
  useEffect(() => {
    const updateThumb = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const contentHeight = container.scrollHeight;
      const containerHeight = container.clientHeight;
      const thumbSize = (containerHeight / contentHeight) * containerHeight;
      setThumbHeight(thumbSize);
      setScrollHeight(contentHeight - containerHeight);

      // Estimate total pages: Assume each "page" is roughly the height of the viewport
      const pages = Math.ceil(contentHeight / containerHeight);
      setTotalPages(pages > 0 ? pages : 1);
    };

    updateThumb();
    window.addEventListener('resize', updateThumb);
    return () => window.removeEventListener('resize', updateThumb);
  }, []);

  // Update thumb position and current page on scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    const thumb = thumbRef.current;
    if (!container || !thumb) return;

    const onScroll = () => {
      if (!isDragging) {
        const scrollRatio = container.scrollTop / scrollHeight;
        const maxThumbTop = container.clientHeight - thumbHeight;
        thumb.style.top = `${scrollRatio * maxThumbTop}px`;

        // Calculate current page based on scroll position
        const pageHeight = container.clientHeight;
        const currentScroll = container.scrollTop;
        const page = Math.floor(currentScroll / pageHeight) + 1;
        setCurrentPage(page > 0 ? page : 1);
      }
    };

    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, [isDragging, scrollHeight, thumbHeight]);

  // Handle drag
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const container = scrollContainerRef.current;
    const thumb = thumbRef.current;
    if (!container || !thumb) return;

    const containerRect = container.getBoundingClientRect();
    const maxThumbTop = container.clientHeight - thumbHeight;
    let newThumbTop = e.clientY - containerRect.top - thumbHeight / 2;

    newThumbTop = Math.max(0, Math.min(newThumbTop, maxThumbTop));
    thumb.style.top = `${newThumbTop}px`;

    const scrollRatio = newThumbTop / maxThumbTop;
    container.scrollTop = scrollRatio * scrollHeight;

    // Update current page during drag
    const pageHeight = container.clientHeight;
    const currentScroll = container.scrollTop;
    const page = Math.floor(currentScroll / pageHeight) + 1;
    setCurrentPage(page > 0 ? page : 1);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, scrollHeight, thumbHeight]);

  return (
    <div className={`relative w-full ${className}`}>
      <div
        ref={scrollContainerRef}
        className="overflow-y-auto overflow-x-hidden scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <div className="absolute top-0 right-2 w-2 h-full bg-gray-200 rounded-full">
        <div
          ref={thumbRef}
          className={`absolute right-0 w-2 bg-gray-500 rounded-full cursor-grab transition-colors hover:bg-gray-600 ${isDragging ? 'cursor-grabbing' : ''}`}
          style={{ height: `${thumbHeight}px` }}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-lg">
            {currentPage}/{totalPages}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraggableScrollbar;