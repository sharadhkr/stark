import React from 'react';
import { Navigate } from 'react-router-dom';

// Helper to check if JWT is expired
function isTokenValid(token) {
  if (!token) return false;
  try {
    const [, payload] = token.split('.');
    if (!payload) return false;
    const decoded = JSON.parse(atob(payload));
    if (!decoded.exp) return false;
    // exp is in seconds, Date.now() in ms
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token || !isTokenValid(token)) {
    localStorage.removeItem('token');
    return false; 
  }
  return true;
};

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;