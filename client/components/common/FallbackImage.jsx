// /components/common/FallbackImage.jsx
import React, { useState } from 'react';
import fallback from '../../assets/fallback.jpg'; // Make sure to have a fallback image in this path

const FallbackImage = ({ src, alt = '', className = '', ...props }) => {
  const [error, setError] = useState(false);

  return (
    <img
      src={error || !src ? fallback : src}
      alt={alt}
      onError={() => setError(true)}
      loading="lazy"
      className={`object-cover ${className}`}
      {...props}
    />
  );
};

export default FallbackImage;
