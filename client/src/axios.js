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
  baseURL: import.meta.env.VITE_API_BASE_URL, 
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token && !config.url.includes('/api/admin/auth/login')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default instance;