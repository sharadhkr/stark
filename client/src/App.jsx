import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { matchPath } from 'react-router-dom';
import BottomNavbar from './Components/Navbar';
import Bottom from './Components/botttommm';

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
      console.log(`DataProvider: Updated cache for ${key}:`, newCache[key].data.length, 'items');
      return newCache;
    });
  }, []);

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
    <Router>
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