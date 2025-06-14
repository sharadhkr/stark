import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Page Cache Context
const PageCacheContext = createContext();

// Cache configuration
const CACHE_CONFIG = {
  MAX_CACHED_PAGES: 5, // Limit number of cached pages
  CACHE_TIMEOUT: 10 * 60 * 1000, // 10 minutes
  PRESERVE_SCROLL: true,
};

// Page cache provider to prevent reloads
export const PageCacheProvider = ({ children }) => {
  const [pageCache, setPageCache] = useState(new Map());
  const [pageStates, setPageStates] = useState(new Map());
  const scrollPositions = useRef(new Map());
  const location = useLocation();
  const currentPath = location.pathname;

  // Save scroll position before navigation
  const saveScrollPosition = useCallback((path) => {
    if (CACHE_CONFIG.PRESERVE_SCROLL) {
      const scrollY = window.scrollY;
      scrollPositions.current.set(path, scrollY);
    }
  }, []);

  // Restore scroll position after navigation
  const restoreScrollPosition = useCallback((path) => {
    if (CACHE_CONFIG.PRESERVE_SCROLL) {
      const savedPosition = scrollPositions.current.get(path);
      if (savedPosition !== undefined) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          window.scrollTo({ top: savedPosition, behavior: 'instant' });
        });
      }
    }
  }, []);

  // Cache page data and state
  const cachePage = useCallback((path, data, state = {}) => {
    setPageCache(prev => {
      const newCache = new Map(prev);
      
      // Remove oldest entries if cache is full
      if (newCache.size >= CACHE_CONFIG.MAX_CACHED_PAGES) {
        const firstKey = newCache.keys().next().value;
        newCache.delete(firstKey);
        scrollPositions.current.delete(firstKey);
      }

      newCache.set(path, {
        data,
        timestamp: Date.now(),
        state
      });
      
      return newCache;
    });

    setPageStates(prev => {
      const newStates = new Map(prev);
      newStates.set(path, state);
      return newStates;
    });
  }, []);

  // Get cached page data
  const getCachedPage = useCallback((path) => {
    const cached = pageCache.get(path);
    if (!cached) return null;

    // Check if cache is still valid
    const isExpired = Date.now() - cached.timestamp > CACHE_CONFIG.CACHE_TIMEOUT;
    if (isExpired) {
      // Clean up expired cache
      setPageCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(path);
        return newCache;
      });
      setPageStates(prev => {
        const newStates = new Map(prev);
        newStates.delete(path);
        return newStates;
      });
      scrollPositions.current.delete(path);
      return null;
    }

    return cached;
  }, [pageCache]);

  // Get page state
  const getPageState = useCallback((path) => {
    return pageStates.get(path) || {};
  }, [pageStates]);

  // Update page state
  const updatePageState = useCallback((path, stateUpdate) => {
    setPageStates(prev => {
      const newStates = new Map(prev);
      const currentState = newStates.get(path) || {};
      newStates.set(path, { ...currentState, ...stateUpdate });
      return newStates;
    });
  }, []);

  // Clear cache for specific page
  const clearPageCache = useCallback((path) => {
    setPageCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(path);
      return newCache;
    });
    setPageStates(prev => {
      const newStates = new Map(prev);
      newStates.delete(path);
      return newStates;
    });
    scrollPositions.current.delete(path);
  }, []);

  // Clear all cache
  const clearAllCache = useCallback(() => {
    setPageCache(new Map());
    setPageStates(new Map());
    scrollPositions.current.clear();
  }, []);

  // Check if page is cached
  const isPageCached = useCallback((path) => {
    const cached = pageCache.get(path);
    if (!cached) return false;
    
    const isExpired = Date.now() - cached.timestamp > CACHE_CONFIG.CACHE_TIMEOUT;
    return !isExpired;
  }, [pageCache]);

  // Context value
  const contextValue = {
    cachePage,
    getCachedPage,
    getPageState,
    updatePageState,
    clearPageCache,
    clearAllCache,
    isPageCached,
    saveScrollPosition,
    restoreScrollPosition,
    currentPath
  };

  return (
    <PageCacheContext.Provider value={contextValue}>
      {children}
    </PageCacheContext.Provider>
  );
};

// Hook to use page cache
export const usePageCache = () => {
  const context = useContext(PageCacheContext);
  if (!context) {
    throw new Error('usePageCache must be used within a PageCacheProvider');
  }
  return context;
};

// HOC to wrap pages with caching functionality
export const withPageCache = (WrappedComponent, cacheKey) => {
  return React.memo((props) => {
    const { 
      getCachedPage, 
      cachePage, 
      getPageState, 
      updatePageState,
      saveScrollPosition,
      restoreScrollPosition,
      currentPath 
    } = usePageCache();
    
    const [isLoading, setIsLoading] = useState(true);
    const [cachedData, setCachedData] = useState(null);
    const componentRef = useRef();
    const mountedRef = useRef(true);

    // Use current path as cache key if not provided
    const pageCacheKey = cacheKey || currentPath;

    useEffect(() => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
        // Save scroll position when component unmounts
        saveScrollPosition(pageCacheKey);
      };
    }, [pageCacheKey, saveScrollPosition]);

    useEffect(() => {
      // Check for cached data first
      const cached = getCachedPage(pageCacheKey);
      if (cached && mountedRef.current) {
        setCachedData(cached.data);
        setIsLoading(false);
        // Restore scroll position
        setTimeout(() => restoreScrollPosition(pageCacheKey), 100);
        return;
      }

      // If no cache, show loading and let component fetch data
      setIsLoading(false);
    }, [pageCacheKey, getCachedPage, restoreScrollPosition]);

    // Enhanced props with caching functions
    const enhancedProps = {
      ...props,
      isLoading,
      cachedData,
      cacheData: (data) => cachePage(pageCacheKey, data),
      getState: () => getPageState(pageCacheKey),
      updateState: (stateUpdate) => updatePageState(pageCacheKey, stateUpdate),
      pageCacheKey
    };

    return (
      <div ref={componentRef}>
        <WrappedComponent {...enhancedProps} />
      </div>
    );
  });
};

// Component to handle route transitions
export const RouteTransition = ({ children }) => {
  const location = useLocation();
  const { saveScrollPosition } = usePageCache();
  const previousPath = useRef(location.pathname);

  useEffect(() => {
    // Save scroll position of previous route
    if (previousPath.current !== location.pathname) {
      saveScrollPosition(previousPath.current);
      previousPath.current = location.pathname;
    }
  }, [location.pathname, saveScrollPosition]);

  return children;
};