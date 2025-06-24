import React, { useState } from 'react';
import { Image } from 'react-native';

/**
 * SafeImage component with error handling and fallback support
 */
const SafeImage = ({ 
  source, 
  style, 
  fallbackUri, 
  sportType, 
  postId,
  onError,
  ...props 
}) => {
  const [hasError, setHasError] = useState(false);
  
  // Generate fallback URL based on sport type
  const generateFallbackUri = () => {
    if (fallbackUri) return fallbackUri;
    
    const type = sportType || 'SPORT';
    const placeholderText = encodeURIComponent(type);
    return `https://via.placeholder.com/400x300/E91E63/FFFFFF?text=${placeholderText}`;
  };
  
  const handleError = (error) => {
    console.warn(`⚠️ SafeImage: Failed to load image for post ${postId}:`, error);
    setHasError(true);
    
    if (onError) {
      onError(error);
    }
  };
  
  // Use fallback if there was an error or if source URI is invalid
  const finalSource = hasError || !source?.uri 
    ? { uri: generateFallbackUri() }
    : source;
  
  return (
    <Image
      source={finalSource}
      style={style}
      onError={handleError}
      {...props}
    />
  );
};

export default SafeImage; 