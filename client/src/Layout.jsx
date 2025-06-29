// ✅ src/Layout.jsx
import React, { useMemo } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import BottomNavbar from './Components/Navbar';
import Bottom from './Components/botttommm';

const userRoutes = [
  '/', '/cart', '/wishlist', '/dashboard', '/category/:categoryName',
  '/seller/:sellerId', '/product/:productId', '/seller/products',
  '/seller/orders', '/order/:orderId', '/search', '/combo/:comboId',
];

export const Layout = React.memo(({ children }) => {
  const { pathname } = useLocation();

  const showNavbar = useMemo(() => {
    return userRoutes.some((path) => matchPath({ path, end: path === '/' }, pathname));
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
