import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import BottomNavbar from "./Components/Navbar";
import Bottom from "./Components/botttommm";

import Home from "./pages/Home";
import Cart from "./pages/Cart"; // Changed from Chat
import LoginRegister from "./pages/LoginRegister";
import SellerAuth from "./pages/SellerAuth";
import SellerDashboard from "./pages/SellerDashboard";
import UserDashboard from "./pages/UserDashboard";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import WishlistPage from "./pages/WishlistPage";
import CategoryPage from "./pages/CategoryPage";
import OwnerProfilePage from "./pages/OwnerProfilePage";
import ProductPage from "./pages/ProductPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderDetails from "./pages/OrderDetails";
import SellerProducts from "./pages/SellerProducts";
import SellerOrders from "./pages/sd"; // Consider renaming to SellerOrders.jsx
import SearchResults from "./pages/SearchResults";

const Layout = ({ children }) => {
  const location = useLocation();

  
  const userRoutes = [
    "/",
    "/cart",
    "/wishlist",
    "/dashboard",
    "/category/:categoryName",
    "/seller/:sellerId",
    "/product/:productId",
    "/seller/products",
    "/seller/orders",
    "/order/:orderId"
  ];

  const matchesRoutePattern = (path, pattern) => {
    const pathSegments = path.split("/").filter(Boolean);
    const patternSegments = pattern.split("/").filter(Boolean);

    if (pathSegments.length !== patternSegments.length) return false;

    return patternSegments.every((segment, index) => {
      if (segment.startsWith(":")) return pathSegments[index] !== undefined;
      return segment === pathSegments[index];
    });
  };

  const showNavbar = userRoutes.some((route) =>
    matchesRoutePattern(location.pathname, route)
  );

  return (
    <>
      {children}
      {showNavbar && <BottomNavbar />}
      {showNavbar && <Bottom />}
    </>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes with Layout (BottomNavbar & Footer) */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/cart" element={<Layout><Cart /></Layout>} />
        <Route path="/wishlist" element={<Layout><WishlistPage /></Layout>} />
        <Route path="/dashboard" element={<Layout><UserDashboard /></Layout>} />
        <Route path="/seller/products" element={<Layout><SellerProducts /></Layout>} />
        <Route path="/seller/orders" element={<Layout><SellerOrders /></Layout>} />
        <Route path="/order/:orderId" element={<Layout><OrderDetails /></Layout>} />
        <Route path="/category/:categoryName" element={<Layout><CategoryPage /></Layout>} />
        <Route path="/seller/:sellerId" element={<Layout><OwnerProfilePage /></Layout>} />
        <Route path="/order/:orderId" element={<Layout><OrderDetails/></Layout>} />
        <Route path="/product/:productId" element={<Layout><ProductPage /></Layout>} />
        <Route path="/search" element={<Layout><SearchResults/></Layout>} />

        {/* Routes without Layout */}
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/:productId" element={<CheckoutPage />} />
        <Route path="/order-confirmation" element={<OrderConfirmation />} />
        <Route path="/login" element={<LoginRegister />} />
        <Route path="/seller/login" element={<SellerAuth />} /> {/* Fixed typo */}
        <Route path="/seller/dashboard" element={<SellerDashboard />} /> {/* Fixed typo */}
        <Route path="/admin/login" element={<AdminAuth />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;