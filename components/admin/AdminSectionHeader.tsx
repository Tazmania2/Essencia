'use client';

import React from 'react';

interface AdminSectionHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export const AdminSectionHeader: React.FC<AdminSectionHeaderProps> = ({
  title,
  description,
  icon,
  actions
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {icon && (
            <div className="w-12 h-12 bg-gradient-to-r from-boticario-pink to-boticario-purple rounded-xl flex items-center justify-center text-white">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center space-x-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};