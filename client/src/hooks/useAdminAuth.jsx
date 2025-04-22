import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from '../axios';

const useAdminAuth = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(null); // null = checking, true = admin, false = not admin
  const [error, setError] = useState(null);

  const checkAdmin = async () => {
    setIsAdmin(null);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No admin token found. Please log in.');
      }
      console.log('Verifying admin token:', token);
      const verifyRes = await axios.get('/api/admin/auth/verify-token');
      console.log('Verify token response:', verifyRes.data);
      if (!verifyRes.data.success || verifyRes.data.admin?.role !== 'admin') {
        throw new Error('Admin access required');
      }
      setIsAdmin(true);
    } catch (error) {
      console.error('Admin verification error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setError(error.response?.data?.message || error.message || 'Failed to verify admin access');
      setIsAdmin(false);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      } else if (error.message.includes('Network Error')) {
        toast.error('Cannot connect to the server. Please check if the backend is running.');
      } else {
        toast.error(error.response?.data?.message || error.message);
      }
    }
  };

  useEffect(() => {
    checkAdmin();
  }, [navigate]);

  return { isAdmin, error, checkAdmin };
};

export default useAdminAuth;