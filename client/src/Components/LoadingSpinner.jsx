// ✅ src/Components/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen bg-white">
    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default LoadingSpinner;
