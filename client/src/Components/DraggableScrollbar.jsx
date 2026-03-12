// DraggableScrollbar.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface DraggableScrollbarProps {
  children: React.ReactNode;
  className?: string;
  thumbClassName?: string;
  trackClassName?: string;
}

const DraggableScrollbar: React.FC<DraggableScrollbarProps> = ({
  children,
  className = '',
  thumbClassName = '',
  trackClassName = '',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [thumbHeight, setThumbHeight] = useState(20); // min size fallback
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ── Measurements ────────────────────────────────────────────────
  const updateMeasurements = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollHeight, clientHeight } = container;

    if (scrollHeight <= clientHeight) {
      // No scrolling needed
      setThumbHeight(clientHeight);
      setTotalPages(1);
      setCurrentPage(1);
      return;
    }

    const ratio = clientHeight / scrollHeight;
    const calculatedThumbHeight = Math.max(20, ratio * clientHeight); // min 20px

    setThumbHeight(calculatedThumbHeight);
    setTotalPages(Math.ceil(scrollHeight / clientHeight));
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateMeasurements();

    // Watch for content size changes
    const resizeObserver = new ResizeObserver(updateMeasurements);
    resizeObserver.observe(container);

    // Also watch window resize (orientation change, etc.)
    window.addEventListener('resize', updateMeasurements);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateMeasurements);
    };
  }, [updateMeasurements]);

  // ── Passive scroll → update thumb + page ───────────────────────
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !thumbRef.current) return;

    const handleScroll = () => {
      if (isDragging) return; // Skip during drag (already controlled)

      const scrollTop = container.scrollTop;
      const scrollable = container.scrollHeight - container.clientHeight;

      if (scrollable <= 0) return;

      const progress = scrollTop / scrollable;
      const maxThumbTop = container.clientHeight - thumbHeight;

      thumbRef.current.style.top = `${progress * maxThumbTop}px`;

      // Page calculation
      const page = Math.floor(scrollTop / container.clientHeight) + 1;
      setCurrentPage(Math.min(page, totalPages));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isDragging, thumbHeight, totalPages]);

  // ── Drag logic ──────────────────────────────────────────────────
  const startDragging = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);

      // Better: use pointer capture
      if (thumbRef.current) {
        thumbRef.current.setPointerCapture(e.pointerId);
      }
    },
    []
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging) return;

      const container = scrollContainerRef.current;
      const thumb = thumbRef.current;
      if (!container || !thumb) return;

      const rect = container.getBoundingClientRect();
      const maxThumbTop = container.clientHeight - thumbHeight;

      // Center thumb on cursor
      let newTop = e.clientY - rect.top - thumbHeight / 2;
      newTop = Math.max(0, Math.min(newTop, maxThumbTop));

      thumb.style.top = `${newTop}px`;

      const progress = newTop / maxThumbTop;
      container.scrollTop = progress * (container.scrollHeight - container.clientHeight);

      // Update page indicator live
      const page = Math.floor(container.scrollTop / container.clientHeight) + 1;
      setCurrentPage(Math.min(page, totalPages));
    },
    [isDragging, thumbHeight, totalPages]
  );

  const stopDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', stopDragging);
      window.addEventListener('pointercancel', stopDragging);
      document.body.style.userSelect = 'none'; // Prevent text selection
    }

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
      document.body.style.userSelect = '';
    };
  }, [isDragging, onPointerMove, stopDragging]);

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      {/* Scrollable content */}
      <div
        ref={scrollContainerRef}
        className="h-full overflow-y-auto overflow-x-hidden scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {/* Custom scrollbar track */}
      <div
        className={`absolute top-0 right-1.5 w-2.5 h-full pointer-events-none select-none ${trackClassName}`}
      >
        <div
          ref={thumbRef}
          className={`
            absolute right-0 w-full bg-gray-500/70 rounded-full cursor-grab active:cursor-grabbing
            transition-opacity duration-200 hover:bg-gray-600/90
            ${isDragging ? 'opacity-100 bg-gray-700 shadow-md' : 'opacity-70'}
            ${thumbClassName}
          `}
          style={{ height: `${thumbHeight}px`, minHeight: '20px' }}
          onPointerDown={startDragging}
        >
          {/* Page indicator tooltip */}
          {totalPages > 1 && (
            <div
              className={`
                absolute -left-14 top-1/2 -translate-y-1/2 
                bg-gray-900/95 text-white text-xs font-medium 
                px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap
                transition-opacity duration-150
                ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-80'}
              `}
            >
              {currentPage} / {totalPages}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DraggableScrollbar;