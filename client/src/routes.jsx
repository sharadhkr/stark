// ✅ src/routes.js
import React from 'react';

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
const FAQs = React.lazy(() => import('./pages/FAQs.jsx'));
const AboutUs = React.lazy(() => import('./pages/AboutUs.jsx'));
const TermsOfUse = React.lazy(() => import('./pages/TermsOfUse.jsx'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy.jsx'));
const ShippingDelivery = React.lazy(() => import('./pages/ShippingDelivery.jsx'));
const CancellationReturn = React.lazy(() => import('./pages/CancellationReturn.jsx'));

export const routes = [
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
  { path: '/faq', element: <FAQs />, layout: true },
  { path: '/about', element: <AboutUs />, layout: true },
  { path: '/terms', element: <TermsOfUse />, layout: true },
  { path: '/privacy', element: <PrivacyPolicy />, layout: true },
  { path: '/CancellationReturn', element: <CancellationReturn />, layout: true },
  { path: '/Shipping&Delivery', element: <ShippingDelivery />, layout: true },
];
