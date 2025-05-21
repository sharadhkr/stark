import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense, lazy, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { matchPath } from 'react-router-dom';
import BottomNavbar from './Components/Navbar';
import Bottom from './Components/botttommm';
import 'leaflet/dist/leaflet.css';
import axios from './useraxios';
import lzString from 'lz-string';
import ComboPage from './pages/ComboPage.jsx';

// Lazy-loaded page components
const Home = lazy(() => import('./pages/Home.jsx'));
const Cart = lazy(() => import('./pages/Cart.jsx'));
const LoginRegister = lazy(() => import('./pages/LoginRegister.jsx'));
const SellerAuth = lazy(() => import('./pages/SellerAuth.jsx'));
const SellerDashboard = lazy(() => import('./pages/SellerDashboard.jsx'));
const UserDashboard = lazy(() => import('./pages/UserDashboard.jsx'));
const AdminAuth = lazy(() => import('./pages/AdminAuth.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const WishlistPage = lazy(() => import('./pages/WishlistPage.jsx'));
const WrappedCategoryPage = lazy(() => import('./pages/CategoryPage.jsx'));
const OwnerProfilePage = lazy(() => import('./pages/OwnerProfilePage.jsx'));
const ProductPage = lazy(() => import('./pages/ProductPage.jsx'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation.jsx'));
const OrderDetails = lazy(() => import('./pages/OrderDetails.jsx'));
const SellerProducts = lazy(() => import('./pages/SellerProducts.jsx'));
const SellerOrders = lazy(() => import('./pages/SellerOrders.jsx'));
const SearchResults = lazy(() => import('./pages/SearchResults.jsx'));
const ComboOfferPage = lazy(() => import('./pages/ComboPage.jsx'));

// Default images
const FALLBACK_IMAGE = 'https://via.placeholder.com/150?text=No+Image';
const DEFAULT_IMAGE = 'http://your-server.com/images/default-product.jpg'; // Replace with your actual default image URL

// Data Context
export const DataContext = createContext();

const DataProvider = ({ children }) => {
  const [cache, setCache] = useState({
    products: { data: [], timestamp: 0 },
    wishlist: { data: [], timestamp: 0 },
    cart: { data: [], timestamp: 0 },
    sellers: { data: [], timestamp: 0 },
    categories: { data: [], timestamp: 0 },
    layout: { data: [], timestamp: 0 },
    comboOffers: { data: [], timestamp: 0 },
    sponsoredProducts: { data: [], timestamp: 0 },
    ads: { data: [], timestamp: 0 },
    recentlyViewed: { data: [], timestamp: 0 },
    trendingProducts: { data: [], timestamp: 0 },
    searchSuggestions: { data: { recentSearches: [], categories: [], sellers: [], products: [] }, timestamp: 0 },
    trendingSearches: { data: { trendingSearches: [], topSellers: [], topCategories: [], topProducts: [] }, timestamp: 0 },
  });

  const isDataStale = useCallback((timestamp) => {
    if (!timestamp) return true;
    const STALE_THRESHOLD = 30 * 60 * 1000; // 30 minutes
    return Date.now() - timestamp > STALE_THRESHOLD;
  }, []);

  const updateCache = useCallback((key, data) => {
    setCache((prev) => {
      let validatedData = data;
      if (key === 'products') {
        validatedData = data.map((product) => {
          const image = product.image && typeof product.image === 'string' && product.image.trim() !== '' && !product.image.includes('placeholder.com')
            ? product.image
            : DEFAULT_IMAGE;
          if (!product.image || product.image.includes('placeholder.com')) {
            console.warn(`Product ${product._id} has invalid or placeholder image, using default:`, product.image);
          }
          return { ...product, image };
        });
        // Only cache products with valid images
        const validProducts = validatedData.filter(p => p.image !== DEFAULT_IMAGE);
        if (validProducts.length < validatedData.length) {
          console.warn(`Skipping caching of ${validatedData.length - validProducts.length} products with invalid images`);
          validatedData = validProducts.length > 0 ? validProducts : validatedData;
        }
        console.log(`Updating cache for ${key}:`, validatedData.map(p => ({ _id: p._id, image: p.image })));
      }
      const newCache = { ...prev, [key]: { data: validatedData, timestamp: Date.now() } };
      try {
        if (key === 'products' || key === 'layout') {
          const slimData = key === 'products'
            ? validatedData.slice(0, 20).map(({ _id, name, price, image, gender }) => {
              const validatedImage = image && typeof image === 'string' && image.trim() !== '' && !image.includes('placeholder.com')
                ? image
                : DEFAULT_IMAGE;
              if (!image || image.includes('placeholder.com')) {
                console.warn(`Slimming product ${_id} with invalid or placeholder image, using default:`, image);
              }
              return { _id, name, price, image: validatedImage, gender };
            })
            : validatedData;
          if (key === 'products' && slimData.every(p => p.image === DEFAULT_IMAGE)) {
            console.warn('All slimmed products have default images, skipping localStorage save');
            return newCache; // Skip saving to localStorage
          }
          const compressed = lzString.compressToUTF16(JSON.stringify({ data: slimData, timestamp: newCache[key].timestamp }));
          localStorage.setItem(`cache_${key}`, compressed);
        }
      } catch (error) {
        console.warn(`Failed to save ${key} to localStorage:`, error);
      }
      return newCache;
    });
  }, []);

  const loadFromStorage = useCallback((key) => {
    const stored = localStorage.getItem(`cache_${key}`);
    if (stored) {
      try {
        const decompressed = lzString.decompressFromUTF16(stored);
        const parsed = JSON.parse(decompressed);
        if (key === 'products') {
          const hasInvalidImages = parsed.data.some(p => !p.image || p.image.includes('placeholder.com') || p.image === FALLBACK_IMAGE);
          if (hasInvalidImages) {
            console.warn(`Cached ${key} contains invalid or placeholder images, triggering refetch`);
            localStorage.removeItem(`cache_${key}`);
            return null; // Force refetch
          }
          parsed.data = parsed.data.map((product) => {
            const image = product.image && typeof product.image === 'string' && product.image.trim() !== '' && !product.image.includes('placeholder.com')
              ? product.image
              : DEFAULT_IMAGE;
            if (!product.image || product.image.includes('placeholder.com')) {
              console.warn(`Loaded product ${product._id} with invalid or placeholder image, using default:`, product.image);
            }
            return { ...product, image };
          });
        }
        console.log(`Loaded ${key} from storage:`, parsed.data.map(p => key === 'products' ? { _id: p._id, image: p.image } : p));
        return parsed;
      } catch (error) {
        console.warn(`Failed to load ${key} from localStorage:`, error);
        localStorage.removeItem(`cache_${key}`);
      }
    }
    return null;
  }, []);

  useEffect(() => {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith('cache_'));
    keys.forEach((key) => {
      const stored = loadFromStorage(key.replace('cache_', ''));
      if (!stored || isDataStale(stored.timestamp)) {
        localStorage.removeItem(key);
      }
    });
  }, [loadFromStorage, isDataStale]);

  const isFetchingRef = useRef(false);

  const fetchInitialData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const token = localStorage.getItem('token');
    const criticalEndpoints = [
      { key: 'layout', url: '/api/admin/auth/layout', params: {}, field: 'components', requiresAuth: false },
      { key: 'products', url: '/api/user/auth/products', params: { limit: 20, page: 1 }, field: 'products', requiresAuth: false },
    ];
    const secondaryEndpoints = [
      { key: 'wishlist', url: '/api/user/auth/wishlist', params: {}, field: 'wishlist', requiresAuth: true },
      { key: 'cart', url: '/api/user/auth/cart', params: {}, field: 'cart', requiresAuth: true },
      { key: 'sellers', url: '/api/user/auth/sellers', params: { limit: 5 }, field: 'sellers', requiresAuth: false },
      { key: 'categories', url: '/api/categories', params: { limit: 8 }, field: 'categories', requiresAuth: false },
      { key: 'comboOffers', url: '/api/admin/auth/combo-offers/active', params: { limit: 3 }, field: 'comboOffers', requiresAuth: false },
      { key: 'sponsoredProducts', url: '/api/user/auth/sponsored', params: { limit: 5 }, field: 'products', requiresAuth: false },
      { key: 'ads', url: '/api/admin/auth/ads', params: {}, field: 'ads', requiresAuth: false },
    ];

    const cacheUpdates = {};
    [...criticalEndpoints, ...secondaryEndpoints].forEach(({ key }) => {
      const stored = loadFromStorage(key);
      if (stored && !isDataStale(stored.timestamp)) {
        cacheUpdates[key] = { data: stored.data, timestamp: stored.timestamp };
      }
    });

    if (Object.keys(cacheUpdates).length > 0) {
      setCache((prev) => ({ ...prev, ...cacheUpdates }));
    }

    const fetchEndpoints = async (endpoints) => {
      const promises = endpoints
        .filter(({ key, requiresAuth }) => {
          if (requiresAuth && !token) {
            cacheUpdates[key] = { data: [], timestamp: Date.now() };
            return false;
          }
          return !cache[key].data.length || isDataStale(cache[key].timestamp);
        })
        .map(({ url, params, field, key }) =>
          axios.get(url, { params })
            .then((res) => {
              let data = res.data[field] || res.data[field] || [];
              if (key === 'products') {
                console.log(`Raw API response for ${key} (page=${params.page}, limit=${params.limit}):`, res.data[field]);
                data = data.map((product) => {
                  const image = product.image && typeof product.image === 'string' && product.image.trim() !== '' && !product.image.includes('placeholder.com')
                    ? product.image
                    : DEFAULT_IMAGE;
                  if (!product.image || product.image.includes('placeholder.com')) {
                    console.warn(`Fetched product ${product._id} with invalid or placeholder image, using default:`, product.image);
                  }
                  return { ...product, image };
                });
              }
              console.log(`Processed ${key}:`, data.map(p => key === 'products' ? { _id: p._id, image: p.image } : p));
              return { data, error: null };
            })
            .catch((err) => {
              console.error(`Error fetching ${key}:`, err);
              return { data: [], error: err };
            })
        );

      const results = await Promise.all(promises);
      let resultIndex = 0;

      endpoints.forEach(({ key, field, requiresAuth }) => {
        if (requiresAuth && !token) return;
        if (!cache[key].data.length || isDataStale(cache[key].timestamp)) {
          const { data, error } = results[resultIndex];
          if (!error) {
            if (key === 'wishlist') {
              const wishlistIds = Array.isArray(data) ? data.map((item) => item._id?.toString() || item.productId?.toString()) : [];
              cacheUpdates[key] = { data: wishlistIds, timestamp: Date.now() };
            } else if (key === 'cart') {
              const cartIds = data?.items ? data.items.map((item) => item.product?._id?.toString() || item.productId?.toString()) : [];
              cacheUpdates[key] = { data: cartIds, timestamp: Date.now() };
            } else {
              cacheUpdates[key] = { data, timestamp: Date.now() };
            }
          } else if (requiresAuth && error.response?.status === 401) {
            cacheUpdates[key] = { data: [], timestamp: Date.now() };
          }
          resultIndex++;
        }
      });
    };

    try {
      await fetchEndpoints(criticalEndpoints);
      if (Object.keys(cacheUpdates).length > 0) {
        setCache((prev) => ({ ...prev, ...cacheUpdates }));
        Object.entries(cacheUpdates).forEach(([key, value]) => {
          if (key === 'products' || key === 'layout') {
            try {
              const slimData = key === 'products'
                ? value.data.slice(0, 20).map(({ _id, name, price, image, gender }) => {
                  const validatedImage = image && typeof image === 'string' && image.trim() !== '' && !image.includes('placeholder.com')
                    ? image
                    : DEFAULT_IMAGE;
                  if (!image || image.includes('placeholder.com')) {
                    console.warn(`Slimming product ${_id} with invalid or placeholder image, using default:`, image);
                  }
                  return { _id, name, price, image: validatedImage, gender };
                })
                : value.data;
              if (key === 'products' && slimData.every(p => p.image === DEFAULT_IMAGE)) {
                console.warn('All slimmed products have default images, skipping localStorage save');
                return;
              }
              const compressed = lzString.compressToUTF16(JSON.stringify({ data: slimData, timestamp: value.timestamp }));
              localStorage.setItem(`cache_${key}`, compressed);
            } catch (error) {
              console.warn(`Failed to save ${key} to localStorage:`, error);
            }
          }
        });
      }
      fetchEndpoints(secondaryEndpoints); // Fetch secondary in background
    } finally {
      isFetchingRef.current = false;
    }
  }, [loadFromStorage, isDataStale]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const value = useMemo(() => ({ cache, updateCache, isDataStale }), [cache]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location !== this.props.location && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-8 text-red-500">
          <p>Something went wrong: {this.state.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const userRoutes = [
  { path: '/', end: true },
  { path: '/cart', end: true },
  { path: '/wishlist', end: true },
  { path: '/dashboard', end: true },
  { path: '/category/:categoryName', end: false },
  { path: '/seller/:sellerId', end: false },
  { path: '/product/:productId', end: false },
  { path: '/seller/products', end: true },
  { path: '/seller/orders', end: true },
  { path: '/order/:orderId', end: false },
  { path: '/search', end: true },
  { path: '/combo/:id', end: false },
];

const Layout = React.memo(({ children }) => {
  const { pathname } = useLocation();

  const showNavbar = useMemo(() => {
    if (typeof pathname !== 'string') return false;
    return userRoutes.some(({ path, end }) =>
      matchPath({ path, end }, pathname)
    );
  }, [pathname]);

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

const routes = [
  { path: '/', element: <Home />, layout: true },
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
  { path: '/checkout', element: <CheckoutPage />, layout: false },
  { path: '/checkout/:productId', element: <CheckoutPage />, layout: false },
  { path: '/order-confirmation', element: <OrderConfirmation />, layout: false },
  { path: '/login', element: <LoginRegister />, layout: false },
  { path: '/seller/login', element: <SellerAuth />, layout: false },
  { path: '/seller/dashboard', element: <SellerDashboard />, layout: false },
  { path: '/admin/login', element: <AdminAuth />, layout: false },
  { path: '/admin/dashboard', element: <AdminDashboard />, layout: false },
  { path: '/combo/:comboId', element: <ComboPage />, layout: false },
  // { path: '/combo/:id', element: <ComboOfferPage />, layout: true },
];

function App() {
  return (
    <Router>
      <ErrorBoundary location={window.location.pathname}>
        <DataProvider>
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-screen">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
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