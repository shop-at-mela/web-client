import React, { useState, useRef, useEffect } from 'react';

/**
 * Optimized Image component with lazy loading, WebP support, and performance optimizations
 */
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef();

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  // Generate WebP and fallback sources
  const getOptimizedSrc = (originalSrc) => {
    if (!originalSrc) return '';

    // If it's already a WebP or if it's an external URL, return as-is
    if (originalSrc.includes('.webp') || originalSrc.startsWith('http')) {
      return originalSrc;
    }

    // Convert to WebP if possible (assumes you have a image optimization service)
    const webpSrc = originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    return webpSrc;
  };

  const webpSrc = getOptimizedSrc(src);
  const fallbackSrc = src;

  return (
    <div
      ref={imgRef}
      className={className}
      style={{
        width: width || 'auto',
        height: height || 'auto',
        backgroundColor: isLoaded ? 'transparent' : '#f0f0f0',
        transition: 'background-color 0.3s ease'
      }}
    >
      {isInView && (
        <picture>
          {/* WebP source for modern browsers */}
          <source srcSet={webpSrc} type="image/webp" />

          {/* Fallback for older browsers */}
          <img
            src={fallbackSrc}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            style={{
              width: '100%',
              height: 'auto',
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
            {...props}
          />
        </picture>
      )}

      {/* Loading placeholder */}
      {!isLoaded && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(90deg, #f0f0f0 25%, transparent 37%, #f0f0f0 63%)',
          backgroundSize: '400% 100%',
          animation: 'shimmer 1.5s ease-in-out infinite'
        }}>
          <style>{`
            @keyframes shimmer {
              0% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;