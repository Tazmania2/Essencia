'use client';

import React, { Suspense, lazy } from 'react';
import Image from 'next/image';
import { SkeletonLoader } from './SkeletonLoader';
import { useIntersectionObserver } from '../../hooks/usePerformance';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '50px',
  className = '',
}) => {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold,
    rootMargin,
  });

  return (
    <div ref={ref} className={className}>
      {isIntersecting ? (
        <Suspense fallback={fallback || <SkeletonLoader height="200px" />}>
          {children}
        </Suspense>
      ) : (
        fallback || <SkeletonLoader height="200px" />
      )}
    </div>
  );
};

// Higher-order component for lazy loading
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));

  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <Suspense fallback={fallback || <SkeletonLoader height="200px" />}>
      <LazyComponent {...props} ref={ref} />
    </Suspense>
  ));

  WrappedComponent.displayName = `withLazyLoading(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
};

// Lazy image component with intersection observer
interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  className = '',
  width,
  height,
  fill = false,
}) => {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
  });

  return (
    <div ref={ref} className={`${className} ${fill ? 'relative' : ''}`}>
      {isIntersecting ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          fill={fill}
          className="object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder ? (
            <Image
              src={placeholder}
              alt={alt}
              width={width}
              height={height}
              fill={fill}
              className="object-cover opacity-50"
            />
          ) : (
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>
      )}
    </div>
  );
};