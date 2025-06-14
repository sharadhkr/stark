import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { matchPath } from 'react-router-dom';
import BottomNavbar from './Components/Navbar';
import Bottom from './Components/botttommm';
import 'leaflet/dist/leaflet.css';
import axios from './useraxios';
import lzString from 'lz-string';

// Lazy-loaded page components
const Home = React.lazy(() => import('./pages/Home.jsx'));
const ProductPage = React.lazy(() => import('./pages/ProductPage.jsx'));
const ComboPage = React.lazy(() => import('./pages/ComboPage.jsx'));
const Cart = React.lazy(() => import('./pages/Cart.jsx'));
const LoginRegister = React.lazy(() => import('./pages/LoginRegister.jsx'));
const SellerAuth = React.lazy(() => import('./pages/SellerAuth.jsx'));
const SellerDashboard = React.lazy(() => import('./pages/SellerDashboard.jsx'));
const UserDashboard = React.lazy(() => import('./pages/UserDashboard.jsx'));
const AdminAuth = React.lazy(() => import('./pages/AdminAuth.jsx'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard.jsx'));
const WishlistPage = React.lazy(() => import('./pages/WishlistPage.jsx'));
const WrappedCategoryPage = React.lazy(() => import('./pages/CategoryPage.jsx'));
const OwnerProfilePage = React.lazy(() => import('./pages/OwnerProfilePage.jsx'));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage.jsx'));
const OrderConfirmation = React.lazy(() => import('./pages/OrderConfirmation.jsx'));
const OrderDetails = React.lazy(() => import('./pages/OrderDetails.jsx'));
const SellerProducts = React.lazy(() => import('./pages/SellerProducts.jsx'));
const SellerOrders = React.lazy(() => import('./pages/SellerOrders.jsx'));
const SearchResults = React.lazy(() => import('./pages/SearchResults.jsx'));

// Default images
const DEFAULT_IMAGE = 'https://res.cloudinary.com/your-cloud/image/upload/v123/default-product.jpg';
const DEFAULT_AD_IMAGE = 'https://res.cloudinary.com/your-cloud/image/upload/v123/default-ad.jpg';
const DEFAULT_PROFILE_PICTURE = 'https://res.cloudinary.com/your-cloud/image/upload/v123/default-profile.jpg';

// Data Context
export const DataContext = createContext();

// Simple URL validation - memoized for performance
const isValidUrl = (() => {
  const urlRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/i;
  const cache = new Map();
  
  return (url) => {
    if (!url || typeof url !== 'string') return false;
    if (cache.has(url)) return cache.get(url);
    const result = urlRegex.test(url);
    cache.set(url, result);
    return result;
  };
})();

// Cache configuration
const CACHE_CONFIG = {
  STALE_TIME: 10 * 60 * 1000, // Reduced from 15 to 10 minutes
  MAX_CACHE_SIZE: 100, // Limit cache size
  STORAGE_PREFIX: 'app_cache_v2_', // Versioned cache
};

const DataProvider = ({ children }) => {
  const [cache, setCache] = useState(() => {
    // Initialize with empty cache structure
    return {
      products: { data: [], timestamp: 0 },
      wishlist: { data: [], timestamp: 0 },
      cart: { data: [], timestamp: 0 },
      comboOffers: { data: [], timestamp: 0 },
      layout: { data: [], timestamp: 0 },
      ads: { data: [], timestamp: 0 },
      tripleAds: { data: [], timestamp: 0 },
      sellers: { data: [], timestamp: 0 },
      nonArrayData: { banner: null, searchSuggestions: null, trendingSearches: null, timestamp: 0 },
    };
  });

  const isDataStale = useCallback((timestamp) => {
    return !timestamp || Date.now() - timestamp > CACHE_CONFIG.STALE_TIME;
  }, []);

  // Optimized image validation functions
  const validateProductData = useCallback((data) => {
    return data.map((item, index) => {
      // Only validate first few items for performance
      if (index < 20) {
        return {
          ...item,
          image: item?.image && isValidUrl(item.image) ? item.image : DEFAULT_IMAGE,
        };
      }
      return item;
    });
  }, []);

  const validateAdData = useCallback((data) => {
    return data.map((item) => ({
      ...item,
      images: Array.isArray(item?.images)
        ? item.images.slice(0, 5).map((img) => ({ // Limit images per ad
            ...img,
            url: img?.url && isValidUrl(img.url) ? img.url : DEFAULT_AD_IMAGE,
          }))
        : [],
    }));
  }, []);

  const validateSellerData = useCallback((data) => {
    return data.map((item) => ({
      ...item,
      profilePicture: item?.profilePicture && isValidUrl(item.profilePicture) 
        ? item.profilePicture 
        : DEFAULT_PROFILE_PICTURE,
    }));
  }, []);

  const updateCache = useCallback((key, data) => {
    setCache((prev) => {
      // Handle non-array data
      if (['banner', 'searchSuggestions', 'trendingSearches'].includes(key)) {
        return {
          ...prev,
          nonArrayData: {
            ...prev.nonArrayData,
            [key]: data,
            timestamp: Date.now(),
          },
        };
      }

      // Validate array data
      if (!Array.isArray(data)) {
        console.warn(`Invalid data for cache key ${key}:`, data);
        return { ...prev, [key]: { data: [], timestamp: Date.now() } };
      }

      let validatedData;
      // Optimize validation based on data type
      if (key === 'products' || key === 'comboOffers' || key.startsWith('category_')) {
        validatedData = validateProductData(data);
      } else if (key === 'ads' || key === 'tripleAds') {
        validatedData = validateAdData(data);
      } else if (key === 'sellers') {
        validatedData = validateSellerData(data);
      } else {
        validatedData = data;
      }

      const newCache = { 
        ...prev, 
        [key]: { data: validatedData, timestamp: Date.now() } 
      };

      // Async localStorage operation to avoid blocking
      if (['products', 'comboOffers', 'layout', 'ads', 'tripleAds', 'sellers'].includes(key) || key.startsWith('category_')) {
        setTimeout(() => {
          try {
            const slimData = getSlimData(key, validatedData);
            const compressed = lzString.compressToUTF16(JSON.stringify({ 
              data: slimData, 
              timestamp: newCache[key].timestamp 
            }));
            localStorage.setItem(`${CACHE_CONFIG.STORAGE_PREFIX}${key}`, compressed);
          } catch (error) {
            console.warn(`Failed to cache ${key} in localStorage:`, error);
          }
        }, 0);
      }

      return newCache;
    });
  }, [validateProductData, validateAdData, validateSellerData]);

  // Helper function to create slim data for storage
  const getSlimData = (key, data) => {
    const limit = key === 'products' ? 20 : 10; // More products for main cache
    
    if (key === 'products') {
      return data.slice(0, limit).map(({ _id, name, price, image, gender }) => ({
        _id, name, price, image, gender,
      }));
    } else if (key === 'ads' || key === 'tripleAds') {
      return data.slice(0, limit).map(({ type, images }) => ({ 
        type, 
        images: images.slice(0, 3) // Limit images
      }));
    } else if (key.startsWith('category_')) {
      return data.slice(0, limit).map(({ _id, name, price, image, gender, category }) => ({
        _id, name, price, image, gender, category,
      }));
    } else if (key === 'sellers') {
      return data.slice(0, limit).map(({ _id, name, shopName, profilePicture }) => ({
        _id, name, shopName, profilePicture,
      }));
    }
    return data;
  };

  const loadFromStorage = useCallback((key) => {
    try {
      const stored = localStorage.getItem(`${CACHE_CONFIG.STORAGE_PREFIX}${key}`);
      if (!stored) return null;

      const decompressed = lzString.decompressFromUTF16(stored);
      const parsed = JSON.parse(decompressed);
      
      // Quick validation without heavy processing
      if (parsed?.data && Array.isArray(parsed.data)) {
        return parsed;
      }
    } catch (error) {
      localStorage.removeItem(`${CACHE_CONFIG.STORAGE_PREFIX}${key}`);
    }
    return null;
  }, []);

  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef(null);

  const fetchCriticalData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // Load only essential cached data first
      const essentialKeys = ['products', 'layout'];
      const cacheUpdates = {};
      
      essentialKeys.forEach((key) => {
        const stored = loadFromStorage(key);
        if (stored && !isDataStale(stored.timestamp)) {
          cacheUpdates[key] = { data: stored.data, timestamp: stored.timestamp };
        }
      });

      if (Object.keys(cacheUpdates).length > 0) {
        setCache((prev) => ({ ...prev, ...cacheUpdates }));
      }

      const token = localStorage.getItem('token');
      
      // Optimized API call - request only essential data first
      const essentialParams = { 
        limit: 20, 
        fields: 'layout,products,banner',
        priority: 'high'
      };

      const response = await axios.get('/api/user/auth/initial-data', { 
        params: essentialParams,
        signal: abortControllerRef.current.signal,
        timeout: 5000 // 5 second timeout
      });

      const { layout, products, banner } = response.data;

      // Update essential data immediately
      updateCache('layout', Array.isArray(layout?.components) ? layout.components : []);
      updateCache('products', Array.isArray(products) ? products : []);
      updateCache('banner', banner || { url: DEFAULT_AD_IMAGE });

      // Fetch non-essential data in background
      setTimeout(async () => {
        try {
          const backgroundParams = {
            limit: 10,
            fields: 'comboOffers,ads,tripleAds,sellers,searchSuggestions,trendingSearches',
            priority: 'low'
          };

          const bgResponse = await axios.get('/api/user/auth/initial-data', { 
            params: backgroundParams,
            timeout: 10000
          });

          const { comboOffers, ads, tripleAds, sellers, searchSuggestions, trendingSearches } = bgResponse.data;

          updateCache('comboOffers', Array.isArray(comboOffers) ? comboOffers : []);
          updateCache('ads', Array.isArray(ads) ? ads : []);
          updateCache('tripleAds', Array.isArray(tripleAds) ? tripleAds : []);
          updateCache('sellers', Array.isArray(sellers) ? sellers : []);
          updateCache('searchSuggestions', searchSuggestions || {});
          updateCache('trendingSearches', trendingSearches || {});

        } catch (bgError) {
          console.warn('Background data fetch failed:', bgError);
        }
      }, 100);

      // Fetch auth-dependent data if token exists
      if (token) {
        setTimeout(async () => {
          try {
            const [wishlistRes, cartRes] = await Promise.allSettled([
              axios.get('/api/user/auth/wishlist', { timeout: 3000 }),
              axios.get('/api/user/auth/cart', { timeout: 3000 }),
            ]);

            if (wishlistRes.status === 'fulfilled') {
              const wishlistIds = Array.isArray(wishlistRes.value.data.wishlist)
                ? wishlistRes.value.data.wishlist.map(item => 
                    item._id?.toString() || item.productId?.toString()
                  ).filter(Boolean)
                : [];
              updateCache('wishlist', wishlistIds);
            }

            if (cartRes.status === 'fulfilled') {
              const cartIds = Array.isArray(cartRes.value.data.items)
                ? cartRes.value.data.items.map(item => 
                    item.product?._id?.toString() || item.productId?.toString()
                  ).filter(Boolean)
                : [];
              updateCache('cart', cartIds);
            }
          } catch (authError) {
            console.warn('Auth-dependent data fetch failed:', authError);
          }
        }, 200);
      }

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching critical data:', error);
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [loadFromStorage, isDataStale, updateCache]);

  // Optimized initialization
  useEffect(() => {
    // Start data fetching immediately
    fetchCriticalData();
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Remove fetchCriticalData from dependencies to prevent re-runs

  const contextValue = useMemo(() => ({ 
    cache, 
    updateCache, 
    isDataStale,
    // Add loading states
    isLoading: isFetchingRef.current
  }), [cache, updateCache, isDataStale]);

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4 text-sm">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const userRoutes = [
  '/', '/cart', '/wishlist', '/dashboard', '/category/:categoryName', '/seller/:sellerId',
  '/product/:productId', '/seller/products', '/seller/orders', '/order/:orderId', '/search',
  '/combo/:comboId',
];

const Layout = React.memo(({ children }) => {
  const { pathname } = useLocation();
  const showNavbar = useMemo(() => 
    userRoutes.some(path => matchPath({ path, end: path === '/' }, pathname)), 
    [pathname]
  );

  return (
    <>
      {children}
      {showNavbar && (
        <>
          <BottomNavbar />
          <Bottom />
        </>
      )}
    </>
  );
});

// Optimized route configuration
const routes = [
  { path: '/', element: <Home />, layout: true, preload: true },
  { path: '/cart', element: <Cart />, layout: true },
  { path: '/wishlist', element: <WishlistPage />, layout: true },
  { path: '/dashboard', element: <UserDashboard />, layout: true },
  { path: '/seller/products', element: <SellerProducts />, layout: true },
  { path: '/seller/orders', element: <SellerOrders />, layout: true },
  { path: '/order/:orderId', element: <OrderDetails />, layout: true },
  { path: '/category/:categoryName', element: <WrappedCategoryPage />, layout: true },
  { path: '/seller/:sellerId', element: <OwnerProfilePage />, layout: true },
  { path: '/product/:productId', element: <ProductPage />, layout: true },
  { path: '/search', element: <SearchResults />, layout: true },
  { path: '/combo/:comboId', element: <ComboPage />, layout: true },
  { path: '/checkout', element: <CheckoutPage />, layout: false },
  { path: '/checkout/:productId', element: <CheckoutPage />, layout: false },
  { path: '/order-confirmation', element: <OrderConfirmation />, layout: false },
  { path: '/login', element: <LoginRegister />, layout: false },
  { path: '/seller/login', element: <SellerAuth />, layout: false },
  { path: '/seller/dashboard', element: <SellerDashboard />, layout: false },
  { path: '/admin/login', element: <AdminAuth />, layout: false },
  { path: '/admin/dashboard', element: <AdminDashboard />, layout: false },
];

// Optimized loading component
const LoadingSpinner = React.memo(() => (
  <div className="flex justify-center items-center h-screen bg-gray-50">
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-600 text-sm">Loading...</p>
    </div>
  </div>
));

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <DataProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {routes.map(({ path, element, layout }) => (
                <Route
                  key={path}
                  path={path}
                  element={layout ? <Layout>{element}</Layout> : element}
                />
              ))}
            </Routes>
          </Suspense>
        </DataProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;