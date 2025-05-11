import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense, lazy, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { matchPath } from 'react-router-dom';
import BottomNavbar from './Components/Navbar';
import Bottom from './Components/botttommm';
import 'leaflet/dist/leaflet.css';
import axios from './useraxios';

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
const ComboOfferPage = lazy(() => import('./pages/ComboOfferPage.jsx'));

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
    const now = Date.now();
    const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    return now - timestamp > STALE_THRESHOLD;
  }, []);

  const updateCache = useCallback((key, data) => {
    setCache((prev) => {
      const newCache = { ...prev, [key]: { data, timestamp: Date.now() } };
      try {
        // Minimize stored product data
        if (key === 'products') {
          const slimData = data.map(({ _id, name, price, image, gender }) => ({
            _id,
            name,
            price,
            image,
            gender,
          }));
          localStorage.setItem(`cache_${key}`, JSON.stringify({ data: slimData, timestamp: newCache[key].timestamp }));
        } else {
          localStorage.setItem(`cache_${key}`, JSON.stringify(newCache[key]));
        }
      } catch (error) {
        console.warn(`Failed to save ${key} to localStorage:`, error);
        // Continue with in-memory cache
      }
      return newCache;
    });
  }, []);

  // Load from localStorage
  const loadFromStorage = useCallback((key) => {
    const stored = localStorage.getItem(`cache_${key}`);
    return stored ? JSON.parse(stored) : null;
  }, []);

  // Clear old cache on mount
  useEffect(() => {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith('cache_'));
    keys.forEach((key) => {
      const stored = JSON.parse(localStorage.getItem(key) || '{}');
      if (!stored.timestamp || isDataStale(stored.timestamp)) {
        localStorage.removeItem(key);
      }
    });
  }, [isDataStale]);

  // Track fetching to prevent duplicates
  const isFetchingRef = useRef(false);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const token = localStorage.getItem('token');
    const endpoints = [
      { key: 'products', url: '/api/user/auth/products', params: { limit: 2, page: 1 }, field: 'products', requiresAuth: false },
      { key: 'wishlist', url: '/api/user/auth/wishlist', params: {}, field: 'wishlist', requiresAuth: true },
      { key: 'cart', url: '/api/user/auth/cart', params: {}, field: 'cart', requiresAuth: true },
      { key: 'layout', url: '/api/admin/auth/layout', params: {}, field: 'components', requiresAuth: false },
      { key: 'sellers', url: '/api/user/auth/sellers', params: { limit: 5 }, field: 'sellers', requiresAuth: false },
      { key: 'categories', url: '/api/categories', params: { limit: 8 }, field: 'categories', requiresAuth: false },
      { key: 'comboOffers', url: '/api/admin/auth/combo-offers/active', params: { limit: 3 }, field: 'comboOffers', requiresAuth: false },
      { key: 'sponsoredProducts', url: '/api/user/auth/sponsored', params: { limit: 5 }, field: 'products', requiresAuth: false },
      { key: 'ads', url: '/api/admin/auth/ads', params: {}, field: 'ads', requiresAuth: false },
    ];

    // Load from storage first
    const cacheUpdates = {};
    endpoints.forEach(({ key }) => {
      const stored = loadFromStorage(key);
      if (stored && !isDataStale(stored.timestamp)) {
        cacheUpdates[key] = { data: stored.data, timestamp: stored.timestamp };
      }
    });

    // Apply cached data
    if (Object.keys(cacheUpdates).length > 0) {
      setCache((prev) => ({ ...prev, ...cacheUpdates }));
    }

    // Fetch only stale or missing data
    const promises = endpoints
      .filter(({ key, requiresAuth }) => {
        if (requiresAuth && !token) {
          cacheUpdates[key] = { data: [], timestamp: Date.now() }; // Default to empty for wishlist/cart
          return false;
        }
        return !cache[key].data.length || isDataStale(cache[key].timestamp);
      })
      .map(({ url, params, field }) =>
        axios.get(url, { params }).then((res) => ({ data: res.data[field] || res.data[field] || [], error: null }))
          .catch((err) => ({ data: [], error: err }))
      );

    // Apply defaults for wishlist/cart if no token
    if (!token) {
      cacheUpdates.wishlist = { data: [], timestamp: Date.now() };
      cacheUpdates.cart = { data: [], timestamp: Date.now() };
    }

    try {
      const results = await Promise.all(promises);
      let resultIndex = 0;

      endpoints.forEach(({ key, field, requiresAuth }) => {
        if (requiresAuth && !token) return; // Skip wishlist/cart if no token
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
            cacheUpdates[key] = { data: [], timestamp: Date.now() }; // Default on 401
          }
          resultIndex++;
        }
      });

      // Batch cache updates
      if (Object.keys(cacheUpdates).length > 0) {
        setCache((prev) => ({ ...prev, ...cacheUpdates }));
        Object.entries(cacheUpdates).forEach(([key, value]) => {
          try {
            if (key === 'products') {
              const slimData = value.data.map(({ _id, name, price, image, gender }) => ({
                _id,
                name,
                price,
                image,
                gender,
              }));
              localStorage.setItem(`cache_${key}`, JSON.stringify({ data: slimData, timestamp: value.timestamp }));
            } else {
              localStorage.setItem(`cache_${key}`, JSON.stringify(value));
            }
          } catch (error) {
            console.warn(`Failed to save ${key} to localStorage:`, error);
          }
        });
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [loadFromStorage, isDataStale]);

  // Run fetchInitialData only once on mount
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const value = useMemo(() => ({ cache, updateCache, isDataStale }), [cache, updateCache, isDataStale]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// Error Boundary
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

// Memoized Layout Component
const userRoutes = [
  { path: '/', exact: true },
  { path: '/cart', exact: true },
  { path: '/wishlist', exact: true },
  { path: '/dashboard', exact: true },
  { path: '/category/:categoryName', exact: false },
  { path: '/seller/:sellerId', exact: false },
  { path: '/product/:productId', exact: false },
  { path: '/seller/products', exact: true },
  { path: '/seller/orders', exact: true },
  { path: '/order/:orderId', exact: false },
  { path: '/search', exact: true },
  { path: '/combo/:id', exact: false },
];

const Layout = React.memo(({ children }) => {
  const { pathname } = useLocation();

  const showNavbar = useMemo(() => {
    if (typeof pathname !== 'string') return false;
    return userRoutes.some(({ path, exact }) =>
      matchPath({ path, end: exact }, pathname)
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

// Route Configuration
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
  { path: '/combo/:id', element: <ComboOfferPage />, layout: true },
];

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ErrorBoundary location={window.location.pathname}>
        <DataProvider>
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-screen">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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