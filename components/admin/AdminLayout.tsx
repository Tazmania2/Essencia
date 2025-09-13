'use client';

import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminBreadcrumb } from './AdminBreadcrumb';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentSection?: string;
  breadcrumbItems?: Array<{
    label: string;
    href?: string;
    isActive?: boolean;
  }>;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  currentSection = 'dashboard',
  breadcrumbItems = []
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar 
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        currentSection={currentSection}
      />

      {/* Main content area */}
      <div className="lg:pl-64" data-testid="main-content-area">
        {/* Admin Header */}
        <AdminHeader onMenuClick={toggleSidebar} />

        {/* Breadcrumb */}
        {breadcrumbItems.length > 0 && (
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <AdminBreadcrumb items={breadcrumbItems} />
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
};