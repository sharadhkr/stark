// import axios from 'axios';

// const instance = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL,
//   timeout: 30000,
// });

// instance.interceptors.request.use(
//   (config) => {
//     if (config.url.includes('/login') || config.url.includes('/register')) {
//       console.log('Skipping token for:', `${config.baseURL}${config.url}`);
//       return config;
//     }

//     const token =
//       localStorage.getItem('adminToken') ||
//       localStorage.getItem('sellerToken') ||
//       localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     console.log('Request:', {
//       method: config.method.toUpperCase(),
//       url: `${config.baseURL}${config.url}`,
//       token: token || 'No token',
//     });
//     return config;
//   },
//   (error) => {
//     console.error('Request Interceptor Error:', error);
//     return Promise.reject(error);
//   }
// );

// instance.interceptors.response.use(
//   (response) => {
//     console.log('Response:', {
//       url: `${response.config.baseURL}${response.config.url}`,
//       status: response.status,
//     });
//     return response;
//   },
//   (error) => {
//     console.error('Response Error:', {
//       url: error.config?.url ? `${error.config.baseURL}${error.config.url}` : 'Unknown URL',
//       status: error.response?.status,
//       data: error.response?.data,
//       message: error.message,
//     });
//     return Promise.reject(error);
//   }
// );

// export default instance;
import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
