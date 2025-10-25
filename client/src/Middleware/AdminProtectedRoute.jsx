import React from 'react';
import { Navigate } from 'react-router-dom';

const isAdminAuthenticated = () => {
  // Replace with your admin auth logic
  return !!localStorage.getItem('adminToken');
};

const AdminProtectedRoute = ({ children }) => {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

export default AdminProtectedRoute;