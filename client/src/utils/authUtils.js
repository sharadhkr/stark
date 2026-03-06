export const isUserLoggedIn = () => {
  const userToken = localStorage.getItem('token'); 
  console.log('isUserLoggedIn - Raw token:', userToken);
  console.log('isUserLoggedIn - Boolean check:', !!userToken);
  return !!userToken;
};

export const userLogout = (navigate) => {
  localStorage.removeItem('token'); 
  console.log('User logged out, token removed');
  navigate('/login');
};

export const isSellerLoggedIn = () => {
  const sellerToken = localStorage.getItem('sellerToken');
  console.log('isSellerLoggedIn - Raw sellerToken:', sellerToken);
  return !!sellerToken;
};

export const sellerLogout = (navigate) => {
  localStorage.removeItem('sellerToken');
  navigate('/login');
};
