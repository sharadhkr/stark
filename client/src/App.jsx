import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { matchPath } from 'react-router-dom';
import BottomNavbar from './Components/Navbar';
import Bottom from './Components/botttommm';
import 'leaflet/dist/leaflet.css';
import axios from './useraxios';
import lzString from 'lz-string';

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

const DEFAULT_IMAGE = 'https://res.cloudinary.com/your-cloud/image/upload/v123/default-product.jpg';
const DEFAULT_AD_IMAGE = 'https://res.cloudinary.com/your-cloud/image/upload/v123/default-ad.jpg';
const DEFAULT_PROFILE_PICTURE = 'https://res.cloudinary.com/your-cloud/image/upload/v123/default-profile.jpg';

export const DataContext = createContext();

const isValidUrl = (() => {
  const urlRegex = /^https?:\/\/[\S]+$/i;
  const cache = new Map();
  return (url) => {
    if (!url || typeof url !== 'string') return false;
    if (cache.has(url)) return cache.get(url);
    const result = urlRegex.test(url);
    cache.set(url, result);
    return result;
  };
})();

const CACHE_CONFIG = {
  STALE_TIME: 10 * 60 * 1000,
  STORAGE_PREFIX: 'app_cache_v2_',
};

const DataProvider = ({ children }) => {
  const [cache, setCache] = useState({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const isFetchingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const abortControllerRef = useRef(null);

  const isDataStale = useCallback((timestamp) => {
    return !timestamp || Date.now() - timestamp > CACHE_CONFIG.STALE_TIME;
  }, []);

  const updateCache = useCallback((key, data) => {
    setCache(prev => ({
      ...prev,
      [key]: { data, timestamp: Date.now() },
    }));
  }, []);

  const fetchCriticalData = useCallback(async (force = false) => {
    if (isFetchingRef.current || (hasInitializedRef.current && !force)) return;
    isFetchingRef.current = true;
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const response = await axios.get('/api/user/auth/initial-data', {
        signal: abortControllerRef.current.signal,
      });
      const { layout, products, comboOffers, ads, tripleAds, sellers, banner, searchSuggestions, trendingSearches } = response.data;

      const updates = { layout, products, comboOffers, ads, tripleAds, sellers, banner, searchSuggestions, trendingSearches };
      Object.entries(updates).forEach(([key, data]) => {
        if (data) updateCache(key, data);
      });

      hasInitializedRef.current = true;
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    } finally {
      isFetchingRef.current = false;
      setIsInitialLoading(false);
    }
  }, [updateCache]);

  useEffect(() => {
    fetchCriticalData();
    return () => {
      abortControllerRef.current?.abort();
      isFetchingRef.current = false;
    };
  }, []);

  const contextValue = useMemo(() => ({
    cache,
    updateCache,
    isDataStale,
    isLoading: isInitialLoading,
    refreshData: () => fetchCriticalData(true),
  }), [cache, updateCache, isDataStale, isInitialLoading, fetchCriticalData]);

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};

class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return <div>Something went wrong</div>;
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
      {showNavbar && <><BottomNavbar /><Bottom /></>}
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

const LoadingSpinner = React.memo(() => (
  <div className="flex justify-center items-center h-screen bg-gray-50">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
                <Route key={path} path={path} element={layout ? <Layout>{element}</Layout> : element} />
              ))}
            </Routes>
          </Suspense>
        </DataProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
