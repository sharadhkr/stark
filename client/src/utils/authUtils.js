// src/utils/authUtils.js
export const isUserLoggedIn = () => {
  const userToken = localStorage.getItem('token'); // Changed from 'userToken' to 'token'
  console.log('isUserLoggedIn - Raw token:', userToken);
  console.log('isUserLoggedIn - Boolean check:', !!userToken);
  return !!userToken;
};

export const userLogout = (navigate) => {
  localStorage.removeItem('token'); // Changed from 'userToken' to 'token'
  console.log('User logged out, token removed');
  navigate('/login');
};

// Seller utils remain unchanged
export const isSellerLoggedIn = () => {
  const sellerToken = localStorage.getItem('sellerToken');
  console.log('isSellerLoggedIn - Raw sellerToken:', sellerToken);
  return !!sellerToken;
};

export const sellerLogout = (navigate) => {
  localStorage.removeItem('sellerToken');
  navigate('/login');
};