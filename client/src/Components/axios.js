// import axios from 'axios';

// const instance = axios.create({
//   baseURL: 'http://localhost:3000', // your backend URL
// });

// // Automatically attach token
// instance.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export default instance;

// import axios from 'axios';

// const instance = axios.create({
//   baseURL: 'http://localhost:3000', // Change this to your actual backend URL
// });

// // Automatically attach the correct token based on user role
// instance.interceptors.request.use((config) => {
//   let token = localStorage.getItem('adminToken') || 
//               localStorage.getItem('sellerToken') || 
//               localStorage.getItem('token'); // Default user token

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// }, (error) => {
//   return Promise.reject(error);
// });

// // export default instance;
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000,
});

instance.interceptors.request.use(
  (config) => {
    // Skip token for login and register endpoints
    if (config.url.includes('/login') || config.url.includes('/register')) {
      console.log('Skipping token for:', config.url);
      return config;
    }

    const token =
      localStorage.getItem('adminToken') ||
      localStorage.getItem('sellerToken') ||
      localStorage.getItem('token');
    console.log('Token being sent:', token); // Debug
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

export default instance;
