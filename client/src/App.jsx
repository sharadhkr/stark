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

// Simple URL validation
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /^https?:\/\/[^\s$.?#].[^\s]*$/i.test(url);
};

const DataProvider = ({ children }) => {
  const [cache, setCache] = useState({
    products: { data: [], timestamp: 0 },
    wishlist: { data: [], timestamp: 0 },
    cart: { data: [], timestamp: 0 },
    comboOffers: { data: [], timestamp: 0 },
    layout: { data: [], timestamp: 0 },
    ads: { data: [], timestamp: 0 },
    tripleAds: { data: [], timestamp: 0 },
    sellers: { data: [], timestamp: 0 }, // Added sellers
    nonArrayData: { banner: null, searchSuggestions: null, trendingSearches: null, timestamp: 0 },
  });

  const isDataStale = useCallback((timestamp) => {
    if (!timestamp) return true;
    return Date.now() - timestamp > 15 * 60 * 1000; // 15 minutes
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

      let validatedData = data;
      if (key === 'products' || key === 'comboOffers' || key.startsWith('category_')) {
        validatedData = data.map((item) => ({
          ...item,
          image: item?.image && isValidUrl(item.image) ? item.image : DEFAULT_IMAGE,
        }));
      } else if (key === 'ads' || key === 'tripleAds') {
        validatedData = data.map((item) => ({
          ...item,
          images: Array.isArray(item?.images)
            ? item.images.map((img) => ({
                ...img,
                url: img?.url && isValidUrl(img.url) ? img.url : DEFAULT_AD_IMAGE,
              }))
            : [],
        }));
      } else if (key === 'layout') {
        validatedData = data;
      } else if (key === 'sellers') {
        validatedData = data.map((item) => ({
          ...item,
          profilePicture: item?.profilePicture && isValidUrl(item.profilePicture) ? item.profilePicture : DEFAULT_PROFILE_PICTURE,
        }));
      }

      const newCache = { ...prev, [key]: { data: validatedData, timestamp: Date.now() } };
      if (key === 'products' || key === 'comboOffers' || key === 'layout' || key === 'ads' || key === 'tripleAds' || key.startsWith('category_') || key === 'sellers') {
        try {
          const slimData = key === 'products'
            ? validatedData.slice(0, 10).map(({ _id, name, price, image, gender }) => ({
                _id, name, price, image, gender,
              }))
            : key === 'ads' || key === 'tripleAds'
            ? validatedData.slice(0, 10).map(({ type, images }) => ({ type, images: images.slice(0, 10) }))
            : key.startsWith('category_')
            ? validatedData.slice(0, 10).map(({ _id, name, price, image, gender, category }) => ({
                _id, name, price, image, gender, category,
              }))
            : key === 'sellers'
            ? validatedData.slice(0, 10).map(({ _id, name, shopName, profilePicture }) => ({
                _id, name, shopName, profilePicture,
              }))
            : validatedData;
          const compressed = lzString.compressToUTF16(JSON.stringify({ data: slimData, timestamp: newCache[key].timestamp }));
          localStorage.setItem(`cache_${key}`, compressed);
        } catch (error) {
          console.warn(`Failed to cache ${key} in localStorage:`, error);
        }
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
        if (key === 'products' || key === 'comboOffers' || key.startsWith('category_')) {
          parsed.data = Array.isArray(parsed.data)
            ? parsed.data.map((item) => ({
                ...item,
                image: item?.image && isValidUrl(item.image) ? item.image : DEFAULT_IMAGE,
              }))
            : [];
        } else if (key === 'ads' || key === 'tripleAds') {
          parsed.data = Array.isArray(parsed.data)
            ? parsed.data.map((item) => ({
                ...item,
                images: Array.isArray(item?.images)
                  ? item.images.map((img) => ({
                      ...img,
                      url: img?.url && isValidUrl(img.url) ? img.url : DEFAULT_AD_IMAGE,
                    }))
                  : [],
              }))
            : [];
        } else if (key === 'sellers') {
          parsed.data = Array.isArray(parsed.data)
            ? parsed.data.map((item) => ({
                ...item,
                profilePicture: item?.profilePicture && isValidUrl(item.profilePicture) ? item.profilePicture : DEFAULT_PROFILE_PICTURE,
              }))
            : [];
        }
        return parsed;
      } catch (error) {
        localStorage.removeItem(`cache_${key}`);
      }
    }
    return null;
  }, []);

  const isFetchingRef = useRef(false);

  const fetchCriticalData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const token = localStorage.getItem('token');
    const params = { limit: 10, fields: 'layout,products,comboOffers,ads,tripleAds,categoryProducts,banner,searchSuggestions,trendingSearches,sellers' };

    try {
      // Load cached data
      const cacheUpdates = {};
      ['layout', 'products', 'comboOffers', 'ads', 'tripleAds', 'sellers'].forEach((key) => {
        const stored = loadFromStorage(key);
        if (stored && !isDataStale(stored.timestamp)) {
          cacheUpdates[key] = { data: stored.data, timestamp: stored.timestamp };
        }
      });
      if (Object.keys(cacheUpdates).length > 0) {
        setCache((prev) => ({ ...prev, ...cacheUpdates }));
      }

      // Fetch critical data
      const response = await axios.get('/api/user/auth/initial-data', { params });
      const { layout, products, comboOffers, ads, tripleAds, categoryProducts, banner, searchSuggestions, trendingSearches, sellers } = response.data;

      console.log('API Response:', {
        products: products?.length,
        comboOffers: comboOffers?.length,
        ads: ads?.length,
        tripleAds: tripleAds?.length,
        sellers: sellers?.length,
        categoryProducts: categoryProducts
          ? Object.entries(categoryProducts).map(([catId, prods]) => ({
              category: catId,
              products: Array.isArray(prods) ? prods.length : 0,
            }))
          : null,
        banner: banner?.url,
        searchSuggestions: searchSuggestions ? {
          recentSearches: searchSuggestions.recentSearches?.length,
          categories: searchSuggestions.categories?.length,
          sellers: searchSuggestions.sellers?.length,
          products: searchSuggestions.products?.length,
        } : null,
        trendingSearches: trendingSearches ? {
          trendingSearches: trendingSearches.trendingSearches?.length,
          topSellers: trendingSearches.topSellers?.length,
          topCategories: trendingSearches.topCategories?.length,
          topProducts: trendingSearches.topProducts?.length,
        } : null,
      });

      // Validate and cache data
      updateCache('layout', Array.isArray(layout?.components) ? layout.components : []);
      updateCache('products', Array.isArray(products) ? products : []);
      updateCache('comboOffers', Array.isArray(comboOffers) ? comboOffers : []);
      updateCache('ads', Array.isArray(ads) ? ads : []);
      updateCache('tripleAds', Array.isArray(tripleAds) ? tripleAds : []);
      updateCache('sellers', Array.isArray(sellers) ? sellers : []);
      updateCache('banner', banner || { url: DEFAULT_AD_IMAGE });
      updateCache('searchSuggestions', searchSuggestions || {});
      updateCache('trendingSearches', trendingSearches || {});

      // Cache category-specific products
      if (categoryProducts && typeof categoryProducts === 'object') {
        Object.entries(categoryProducts).forEach(([catId, prods]) => {
          if (!Array.isArray(prods)) {
            console.warn(`Invalid categoryProducts for category ${catId}:`, prods);
            updateCache(`category_${catId}`, []);
          } else {
            console.log(`Caching category ${catId} with ${prods.length} products`);
            updateCache(`category_${catId}`, prods);
          }
        });
      } else {
        console.warn('Invalid categoryProducts:', categoryProducts);
      }

      // Fetch auth-dependent data
      if (token) {
        const [wishlistRes, cartRes] = await Promise.all([
          axios.get('/api/user/auth/wishlist').catch(() => ({ data: { wishlist: [] } })),
          axios.get('/api/user/auth/cart').catch(() => ({ data: { items: [] } })),
        ]);

        updateCache('wishlist', Array.isArray(wishlistRes.data.wishlist)
          ? wishlistRes.data.wishlist.map(item => item._id?.toString() || item.productId?.toString()) || []
          : []);
        updateCache('cart', Array.isArray(cartRes.data.items)
          ? cartRes.data.items.map(item => item.product?._id?.toString() || item.productId?.toString()) || []
          : []);
      }
    } catch (error) {
      console.error('Error fetching critical data:', error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [loadFromStorage, isDataStale, updateCache]);

  useEffect(() => {
    fetchCriticalData();
  }, [fetchCriticalData]);

  // Debug cache data
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Cache Data:', {
        products: cache.products?.data?.length || 0,
        comboOffers: cache.comboOffers?.data?.length || 0,
        layout: cache.layout?.data?.length || 0,
        ads: cache.ads?.data?.length || 0,
        tripleAds: cache.tripleAds?.data?.length || 0,
        sellers: cache.sellers?.data?.length || 0,
        categories: Object.keys(cache).filter(key => key.startsWith('category_')).length,
        banner: cache.nonArrayData?.banner?.url || null,
        searchSuggestions: cache.nonArrayData?.searchSuggestions ? {
          recentSearches: cache.nonArrayData.searchSuggestions.recentSearches?.length || 0,
          categories: cache.nonArrayData.searchSuggestions.categories?.length || 0,
        } : null,
        trendingSearches: cache.nonArrayData?.trendingSearches ? {
          trendingSearches: cache.nonArrayData.trendingSearches.trendingSearches?.length || 0,
          topCategories: cache.nonArrayData.trendingSearches.topCategories?.length || 0,
        } : null,
      });
    }
  }, [cache]);

  const contextValue = useMemo(() => ({ cache, updateCache, isDataStale }), [cache, updateCache, isDataStale]);

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-8 text-red-500">
          <p>Something went wrong: {this.state.error?.message || 'Unknown error'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
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
  '/', '/cart', '/wishlist', '/dashboard', '/category/:categoryName', '/seller/:sellerId',
  '/product/:productId', '/seller/products', '/seller/orders', '/order/:orderId', '/search',
  '/combo/:comboId',
];

const Layout = React.memo(({ children }) => {
  const { pathname } = useLocation();
  const showNavbar = useMemo(() => userRoutes.some(path => matchPath({ path, end: path === '/' }, pathname)), [pathname]);

  return (
    <div className="flex flex-col min-h-screen">
      {children}
      {showNavbar && (
        <>
          <BottomNavbar />
          <Bottom />
        </>
      )}
    </div>
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

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <DataProvider>
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-screen">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="ml-2 text-gray-500">Loading...</p>
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