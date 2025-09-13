'use client';

import React from 'react';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface AdminBreadcrumbProps {
  items: BreadcrumbItem[];
}

export const AdminBreadcrumb: React.FC<AdminBreadcrumbProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {/* Home/Dashboard link */}
        <li>
          <Link 
            href="/admin" 
            className="text-gray-500 hover:text-boticario-pink transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="sr-only">Dashboard</span>
          </Link>
        </li>

        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {/* Separator */}
            <svg 
              className="w-4 h-4 text-gray-400 mx-2" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
                clipRule="evenodd" 
              />
            </svg>

            {/* Breadcrumb item */}
            {item.href && !item.isActive ? (
              <Link 
                href={item.href}
                className="text-sm font-medium text-gray-500 hover:text-boticario-pink transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span 
                className={`text-sm font-medium ${
                  item.isActive 
                    ? 'text-boticario-pink' 
                    : 'text-gray-900'
                }`}
                aria-current={item.isActive ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};