import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3000', // Adjust to your backend URL
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sellerToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;