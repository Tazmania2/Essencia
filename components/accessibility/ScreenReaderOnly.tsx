'use client';

import React from 'react';

interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  id?: string;
}

export const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({
  children,
  as: Component = 'span',
  className = '',
  id,
}) => {
  return (
    <Component
      id={id}
      className={`
        sr-only
        absolute
        w-px
        h-px
        p-0
        -m-px
        overflow-hidden
        whitespace-nowrap
        border-0
        ${className}
      `}
    >
      {children}
    </Component>
  );
};