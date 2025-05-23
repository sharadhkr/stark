import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense, lazy, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { matchPath } from 'react-router-dom';
import BottomNavbar from './Components/Navbar';
import Bottom from './Components/botttommm';
import 'leaflet/dist/leaflet.css';
import axios from './useraxios';
import lzString from 'lz-string';

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
const ComboPage = lazy(() => import('./pages/ComboPage.jsx'));

// Default images
const FALLBACK_IMAGE = 'https://via.placeholder.com/150?text=No+Image';
const DEFAULT_IMAGE = 'https://your-server.com/generic-product-placeholder.jpg'; // Replace with your actual placeholder

// Data Context
export const DataContext = createContext();

// Simple URL validation
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const urlPattern = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i;
  return urlPattern.test(url) && !url.includes('placeholder.com');
};

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
      let invalidImageCount = 0;
      if (key === 'products' || key === 'sponsoredProducts') {
        validatedData = data.map((product) => {
          const image = product.image && isValidUrl(product.image) ? product.image : DEFAULT_IMAGE;
          if (!product.image || !isValidUrl(product.image)) {
            invalidImageCount++;
          }
          return { ...product, image };
        });
        if (invalidImageCount > 0 && process.env.NODE_ENV === 'development') {
          console.warn(`Found ${invalidImageCount} ${key} with invalid or placeholder images, using default image.`);
        }
        const validProducts = validatedData.filter(p => p.image !== DEFAULT_IMAGE);
        if (validProducts.length < validatedData.length) {
          console.warn(`Skipping caching of ${validatedData.length - validProducts.length} ${key} with invalid images`);
          validatedData = validProducts.length > 0 ? validProducts : validatedData;
        }
      } else if (key === 'comboOffers') {
        validatedData = data.map((offer) => {
          const image = offer.image && isValidUrl(offer.image) ? offer.image : DEFAULT_IMAGE;
          if (!offer.image || !isValidUrl(offer.image)) {
            invalidImageCount++;
          }
          return { ...offer, image };
        });
        if (invalidImageCount > 0 && process.env.NODE_ENV === 'development') {
          console.warn(`Found ${invalidImageCount} combo offers with invalid or placeholder images, using default image.`);
        }
      }
      const newCache = { ...prev, [key]: { data: validatedData, timestamp: Date.now() } };
      try {
        if (key === 'products' || key === 'layout' || key === 'comboOffers' || key === 'sponsoredProducts') {
          const slimData = key === 'products' || key === 'sponsoredProducts'
            ? validatedData.slice(0, 20).map(({ _id, name, price, image, gender }) => ({
                _id,
                name,
                price,
                image: image && isValidUrl(image) ? image : DEFAULT_IMAGE,
                gender,
              }))
            : validatedData;
          if ((key === 'products' || key === 'sponsoredProducts') && slimData.every(p => p.image === DEFAULT_IMAGE)) {
            console.warn(`All slimmed ${key} have default images, skipping localStorage save`);
            return newCache;
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
        if (key === 'products' || key === 'sponsoredProducts' || key === 'comboOffers') {
          const hasInvalidImages = parsed.data.some(p => !p.image || !isValidUrl(p.image));
          if (hasInvalidImages) {
            console.warn(`Cached ${key} contains invalid images, triggering refetch`);
            localStorage.removeItem(`cache_${key}`);
            return null;
          }
          parsed.data = parsed.data.map((item) => {
            const image = item.image && isValidUrl(item.image) ? item.image : DEFAULT_IMAGE;
            if (!item.image || !isValidUrl(item.image)) {
              console.warn(`Loaded ${key} item with invalid image, using default:`, item.image);
            }
            return { ...item, image };
          });
        }
        console.log(`Loaded ${key} from storage:`, parsed.data.map(p => (key === 'products' || key === 'sponsoredProducts') ? { _id: p._id, image: p.image } : p));
        return parsed;
      } catch (error) {
        console.warn(`Failed to load ${key} from localStorage:`, error);
        localStorage.removeItem(`cache_${key}`);
      }
    }
    return null;
  }, []);

  const isFetchingRef = useRef(false);

  const fetchInitialData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const token = localStorage.getItem('token');
    const params = { limit: 20, page: 1 };

    // Load cached data
    const cacheUpdates = {};
    const keys = ['layout', 'products', 'comboOffers', 'categories', 'sellers', 'sponsoredProducts', 'ads'];
    keys.forEach((key) => {
      const stored = loadFromStorage(key);
      if (stored && !isDataStale(stored.timestamp)) {
        cacheUpdates[key] = { data: stored.data, timestamp: stored.timestamp };
      }
    });

    if (Object.keys(cacheUpdates).length > 0) {
      setCache((prev) => ({ ...prev, ...cacheUpdates }));
    }

    try {
      // Fetch all data from single endpoint
      const response = await axios.get('/api/user/auth/initial-data', { params });
      const {
        layout,
        products,
        comboOffers,
        categories,
        sellers,
        sponsoredProducts,
        ads,
      } = response.data;

      console.log('Raw API response:', { layout, products, comboOffers, categories, sellers, sponsoredProducts, ads });

      // Update cache for each data type
      updateCache('layout', layout || []);
      updateCache('products', products || []);
      updateCache('comboOffers', comboOffers || []);
      updateCache('categories', categories || []);
      updateCache('sellers', sellers || []);
      updateCache('sponsoredProducts', sponsoredProducts || []);
      updateCache('ads', ads || []);

      // Fetch auth-dependent data (wishlist, cart)
      if (token) {
        const [wishlistRes, cartRes] = await Promise.all([
          axios.get('/api/user/auth/wishlist').catch(err => ({ data: { wishlist: [] }, error: err })),
          axios.get('/api/user/auth/cart').catch(err => ({ data: { items: [] }, error: err })),
        ]);

        if (!wishlistRes.error) {
          const wishlistIds = Array.isArray(wishlistRes.data.wishlist)
            ? wishlistRes.data.wishlist.map(item => item._id?.toString() || item.productId?.toString())
            : [];
          updateCache('wishlist', wishlistIds);
        }
        if (!cartRes.error) {
          const cartIds = cartRes.data.items
            ? cartRes.data.items.map(item => item.product?._id?.toString() || item.productId?.toString())
            : [];
          updateCache('cart', cartIds);
        }
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [loadFromStorage, isDataStale, updateCache]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const value = useMemo(() => ({ cache, updateCache, isDataStale }), [cache, updateCache, isDataStale]);

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
  { path: '/combo/:comboId', end: false },
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
  { path: '/combo/:comboId', element: <ComboPage />, layout: true },
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