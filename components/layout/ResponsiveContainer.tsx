'use client';

import React from 'react';
import { useResponsive } from '../../hooks/useAccessibility';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  mobileLayout?: React.ReactNode;
  tabletLayout?: React.ReactNode;
  desktopLayout?: React.ReactNode;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  mobileLayout,
  tabletLayout,
  desktopLayout,
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // If specific layouts are provided, use them
  if (mobileLayout && isMobile) {
    return <div className={className}>{mobileLayout}</div>;
  }
  
  if (tabletLayout && isTablet) {
    return <div className={className}>{tabletLayout}</div>;
  }
  
  if (desktopLayout && isDesktop) {
    return <div className={className}>{desktopLayout}</div>;
  }

  // Default responsive behavior with CSS classes
  const responsiveClasses = `
    ${className}
    ${isMobile ? 'px-4 py-4 space-y-4' : ''}
    ${isTablet ? 'px-6 py-6 space-y-6 max-w-4xl mx-auto' : ''}
    ${isDesktop ? 'px-8 py-8 space-y-8 max-w-7xl mx-auto' : ''}
  `;

  return (
    <div className={responsiveClasses}>
      {children}
    </div>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = '',
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = { mobile: 4, tablet: 6, desktop: 8 },
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getGridClasses = () => {
    let classes = 'grid ';

    // Columns
    if (isMobile) {
      classes += `grid-cols-${cols.mobile} `;
    } else if (isTablet) {
      classes += `grid-cols-${cols.tablet} `;
    } else {
      classes += `grid-cols-${cols.desktop} `;
    }

    // Gap
    if (isMobile) {
      classes += `gap-${gap.mobile} `;
    } else if (isTablet) {
      classes += `gap-${gap.tablet} `;
    } else {
      classes += `gap-${gap.desktop} `;
    }

    return classes + className;
  };

  return (
    <div className={getGridClasses()}>
      {children}
    </div>
  );
};

interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  size?: {
    mobile?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
    tablet?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
    desktop?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  };
  as?: keyof JSX.IntrinsicElements;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  className = '',
  size = { mobile: 'base', tablet: 'lg', desktop: 'xl' },
  as: Component = 'p',
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getTextClasses = () => {
    let classes = '';

    if (isMobile) {
      classes += `text-${size.mobile} `;
    } else if (isTablet) {
      classes += `text-${size.tablet} `;
    } else {
      classes += `text-${size.desktop} `;
    }

    return classes + className;
  };

  return (
    <Component className={getTextClasses()}>
      {children}
    </Component>
  );
};

interface ResponsiveSpacingProps {
  children: React.ReactNode;
  className?: string;
  padding?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  margin?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

export const ResponsiveSpacing: React.FC<ResponsiveSpacingProps> = ({
  children,
  className = '',
  padding = { mobile: 4, tablet: 6, desktop: 8 },
  margin = { mobile: 2, tablet: 4, desktop: 6 },
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getSpacingClasses = () => {
    let classes = '';

    // Padding
    if (isMobile) {
      classes += `p-${padding.mobile} `;
    } else if (isTablet) {
      classes += `p-${padding.tablet} `;
    } else {
      classes += `p-${padding.desktop} `;
    }

    // Margin
    if (isMobile) {
      classes += `m-${margin.mobile} `;
    } else if (isTablet) {
      classes += `m-${margin.tablet} `;
    } else {
      classes += `m-${margin.desktop} `;
    }

    return classes + className;
  };

  return (
    <div className={getSpacingClasses()}>
      {children}
    </div>
  );
};