import React, { createContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from './useraxios';

export const DataContext = createContext();

const CACHE_CONFIG = {
  STALE_TIME: 10 * 60 * 1000, 
};

export const DataProvider = ({ children }) => {
  const [cache, setCache] = useState({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const isFetchingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const abortControllerRef = useRef(null);

  const isDataStale = useCallback((timestamp) => {
    return !timestamp || Date.now() - timestamp > CACHE_CONFIG.STALE_TIME;
  }, []);

  const updateCache = useCallback((key, data) => {
    setCache(prev => ({ ...prev, [key]: { data, timestamp: Date.now() } }));
  }, []);

  const fetchCriticalData = useCallback(async (force = false) => {
    if (isFetchingRef.current || (hasInitializedRef.current && !force)) return;

    isFetchingRef.current = true;
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const { data } = await axios.get('/api/user/auth/initial-data', {
        signal: abortControllerRef.current.signal,
      });

      console.log('📦 Full initial-data response:', data);
      console.log('📦 Raw comboOffers from backend:', data.comboOffers);

      
      const singleAds = (data.ads || []).find(ad => ad.type === 'Single Ad')?.images || [];
      const doubleAds = (data.ads || []).find(ad => ad.type === 'Double Ad')?.images || [];
      const tripleAds = (data.ads || []).find(ad => ad.type === 'Triple Ad')?.images || [];

      console.log('🎯 Extracted ad images:', { singleAds, doubleAds, tripleAds });

      const DEFAULT_COMBO_IMAGE = 'https://your-server.com/generic-combo-placeholder.jpg';

      const normalizedData = {
        layout: data.layout?.components || [],
        products: (data.products || []).map(p => ({
          ...p,
          image: p.image && p.image !== 'https://via.placeholder.com/150' ? p.image : DEFAULT_COMBO_IMAGE
        })),
        comboOffers: (data.comboOffers || [])
          .filter(offer => offer?._id && Array.isArray(offer.products) && offer.products.length >= 2)
          .map(offer => ({
            ...offer,
            products: (offer.products || []).map(p => ({
              ...p,
              images: (p.images || []).map(img =>
                img && img !== 'https://via.placeholder.com/150' ? img : DEFAULT_COMBO_IMAGE
              )
            }))
          })),
        sellers: data.sellers || [],
        banner: data.banner || { url: DEFAULT_COMBO_IMAGE },
        searchSuggestions: data.searchSuggestions || {},
        trendingSearches: data.trendingSearches || {},
        categoryProducts: data.categoryProducts || {},
        recentlyViewed: data.recentlyViewed || [],
        sponsoredProducts: (data.sponsoredProducts || []).map(p => ({
          ...p,
          image: p.image && p.image !== 'https://via.placeholder.com/150' ? p.image : DEFAULT_COMBO_IMAGE
        })),
        trendingProducts: (data.trendingProducts || []).map(p => ({
          ...p,
          image: p.image && p.image !== 'https://via.placeholder.com/150' ? p.image : DEFAULT_COMBO_IMAGE
        })),
        singleAds,
        doubleAds,
        tripleAds,
      };

      console.log('✅ Normalized comboOffers before caching:', normalizedData.comboOffers);

      for (const [key, value] of Object.entries(normalizedData)) {
        const existing = cache[key];
        if (!existing || isDataStale(existing.timestamp) || force) {
          updateCache(key, value);
        }
      }

      hasInitializedRef.current = true;
    } catch (err) {
      if (err.name !== 'CanceledError') {
        console.error('❌ Initial data fetch failed:', err);
      }
    } finally {
      isFetchingRef.current = false;
      setIsInitialLoading(false);
    }
  }, [updateCache, cache, isDataStale]);

  useEffect(() => {
    fetchCriticalData();
    return () => abortControllerRef.current?.abort();
  }, [fetchCriticalData]);
  
  useEffect(() => {
    console.log('🧠 Final cached comboOffers:', cache.comboOffers);
  }, [cache.comboOffers]);

  const contextValue = useMemo(() => ({
    cache,
    updateCache,
    isDataStale,
    isLoading: isInitialLoading,
    refreshData: () => fetchCriticalData(true),
  }), [cache, updateCache, isDataStale, isInitialLoading, fetchCriticalData]);

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};