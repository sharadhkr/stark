// import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
// import BottomNavbar from "./Components/Navbar";
// import Bottom from "./Components/botttommm";

// import Home from "./pages/Home";
// import Cart from "./pages/Cart"; // Changed from Chat
// import LoginRegister from "./pages/LoginRegister";
// import SellerAuth from "./pages/SellerAuth";
// import SellerDashboard from "./pages/SellerDashboard";
// import UserDashboard from "./pages/UserDashboard";
// import AdminAuth from "./pages/AdminAuth";
// import AdminDashboard from "./pages/AdminDashboard";
// import WishlistPage from "./pages/WishlistPage";
// import CategoryPage from "./pages/CategoryPage";
// import OwnerProfilePage from "./pages/OwnerProfilePage";
// import ProductPage from "./pages/ProductPage";
// import CheckoutPage from "./pages/CheckoutPage";
// import OrderConfirmation from "./pages/OrderConfirmation";
// import OrderDetails from "./pages/OrderDetails";
// import SellerProducts from "./pages/SellerProducts";
// import SellerOrders from "./pages/sd"; // Consider renaming to SellerOrders.jsx
// import SearchResults from "./pages/SearchResults";

// const Layout = ({ children }) => {
//   const location = useLocation();


//   const userRoutes = [
//     "/",
//     "/cart",
//     "/wishlist",
//     "/dashboard",
//     "/category/:categoryName",
//     "/seller/:sellerId",
//     "/product/:productId",
//     "/seller/products",
//     "/seller/orders",
//     "/order/:orderId"
//   ];

//   const matchesRoutePattern = (path, pattern) => {
//     const pathSegments = path.split("/").filter(Boolean);
//     const patternSegments = pattern.split("/").filter(Boolean);

//     if (pathSegments.length !== patternSegments.length) return false;

//     return patternSegments.every((segment, index) => {
//       if (segment.startsWith(":")) return pathSegments[index] !== undefined;
//       return segment === pathSegments[index];
//     });
//   };

//   const showNavbar = userRoutes.some((route) =>
//     matchesRoutePattern(location.pathname, route)
//   );

//   return (
//     <>
//       {children}
//       {showNavbar && <BottomNavbar />}
//       {showNavbar && <Bottom />}
//     </>
//   );
// };

// function App() {
//   return (
//     <Router>
//       <Routes>
//         {/* Routes with Layout (BottomNavbar & Footer) */}
//         <Route path="/" element={<Layout><Home /></Layout>} />
//         <Route path="/cart" element={<Layout><Cart /></Layout>} />
//         <Route path="/wishlist" element={<Layout><WishlistPage /></Layout>} />
//         <Route path="/dashboard" element={<Layout><UserDashboard /></Layout>} />
//         <Route path="/seller/products" element={<Layout><SellerProducts /></Layout>} />
//         <Route path="/seller/orders" element={<Layout><SellerOrders /></Layout>} />
//         <Route path="/order/:orderId" element={<Layout><OrderDetails /></Layout>} />
//         <Route path="/category/:categoryName" element={<Layout><CategoryPage /></Layout>} />
//         <Route path="/seller/:sellerId" element={<Layout><OwnerProfilePage /></Layout>} />
//         <Route path="/order/:orderId" element={<Layout><OrderDetails/></Layout>} />
//         <Route path="/product/:productId" element={<Layout><ProductPage /></Layout>} />
//         <Route path="/search" element={<Layout><SearchResults/></Layout>} />

//         {/* Routes without Layout */}
//         <Route path="/checkout" element={<CheckoutPage />} />
//         <Route path="/checkout/:productId" element={<CheckoutPage />} />
//         <Route path="/order-confirmation" element={<OrderConfirmation />} />
//         <Route path="/login" element={<LoginRegister />} />
//         <Route path="/seller/login" element={<SellerAuth />} /> {/* Fixed typo */}
//         <Route path="/seller/dashboard" element={<SellerDashboard />} /> {/* Fixed typo */}
//         <Route path="/admin/login" element={<AdminAuth />} />
//         <Route path="/admin/dashboard" element={<AdminDashboard />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;
import React, { useMemo, createContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import pathToRegexp from 'path-to-regexp';
import BottomNavbar from './Components/Navbar';
import Bottom from './Components/botttommm';

import Home from './pages/Home';
import Cart from './pages/Cart';
import LoginRegister from './pages/LoginRegister';
import SellerAuth from './pages/SellerAuth';
import SellerDashboard from './pages/SellerDashboard';
import UserDashboard from './pages/UserDashboard';
import AdminAuth from './pages/AdminAuth';
import AdminDashboard from './pages/AdminDashboard';
import WishlistPage from './pages/WishlistPage';
import CategoryPage from './pages/CategoryPage';
import OwnerProfilePage from './pages/OwnerProfilePage';
import ProductPage from './pages/ProductPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderDetails from './pages/OrderDetails';
import SellerProducts from './pages/SellerProducts';
import SellerOrders from './pages/sd';
import SearchResults from './pages/SearchResults';

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
    recentlyViewed: { data: [], timestamp: 0 }, // Added
  });

  const isDataStale = (timestamp) => Date.now() - timestamp > 5 * 60 * 1000; // 5 minutes

  const updateCache = (key, data) => {
    setCache((prev) => ({ ...prev, [key]: { data, timestamp: Date.now() } }));
  };

  const value = useMemo(() => ({ cache, updateCache, isDataStale }), [cache]);

  useEffect(() => {
    console.log('DataProvider cache updated:', cache);
  }, [cache]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// Error Boundary
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-8 text-red-500">
          <p>Something went wrong. Please try again.</p>
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

// Memoized Layout component
const Layout = React.memo(({ children }) => {
  const location = useLocation();
  console.log('Layout rendered, pathname:', location.pathname);

  const userRoutes = [
    '/',
    '/cart',
    '/wishlist',
    '/dashboard',
    '/category/:categoryName',
    '/seller/:sellerId',
    '/product/:productId',
    '/seller/products',
    '/seller/orders',
    '/order/:orderId',
    '/search',
  ];

  const showNavbar = useMemo(() => {
    const pathRegexes = userRoutes.map((route) => ({
      regex: pathToRegexp(route),
      route,
    }));

    return pathRegexes.some(({ regex }) => regex.test(location.pathname));
  }, [location.pathname]);

  return (
    <>
      {children}
      {showNavbar && <BottomNavbar />}
      {showNavbar && <Bottom />}
    </>
  );
});

// Route configuration
const routes = [
  { path: '/', element: <Home /> },
  { path: '/cart', element: <Cart /> },
  { path: '/wishlist', element: <WishlistPage /> },
  { path: '/dashboard', element: <UserDashboard /> },
  { path: '/seller/products', element: <SellerProducts /> },
  { path: '/seller/orders', element: <SellerOrders /> },
  { path: '/order/:orderId', element: <OrderDetails /> },
  { path: '/category/:categoryName', element: <CategoryPage /> },
  { path: '/seller/:sellerId', element: <OwnerProfilePage /> },
  { path: '/product/:productId', element: <ProductPage /> },
  { path: '/search', element: <SearchResults /> },
  { path: '/checkout', element: <CheckoutPage /> },
  { path: '/checkout/:productId', element: <CheckoutPage /> },
  { path: '/order-confirmation', element: <OrderConfirmation /> },
  { path: '/login', element: <LoginRegister /> },
  { path: '/seller/login', element: <SellerAuth /> },
  { path: '/seller/dashboard', element: <SellerDashboard /> },
  { path: '/admin/login', element: <AdminAuth /> },
  { path: '/admin/dashboard', element: <AdminDashboard /> },
];

function App() {
  console.log('App rendered');

  return (
    <Router>
      <ErrorBoundary>
        <DataProvider>
          <Routes>
            {routes.map(({ path, element }) => (
              <Route
                key={path}
                path={path}
                element={
                  path.includes('/checkout') ||
                    path.includes('/order-confirmation') ||
                    path.includes('/login') ||
                    path.includes('/seller/dashboard') ||
                    path.includes('/admin/dashboard') ? (
                    element
                  ) : (
                    <Layout>{element}</Layout>
                  )
                }
              />
            ))}
          </Routes>
        </DataProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;