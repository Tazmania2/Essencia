'use client';

import { AdminRoute } from '../../../components/auth/ProtectedRoute';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { StoreConfigPanel } from '../../../components/admin/StoreConfigPanel';
import { AdminSectionHeader } from '../../../components/admin';

export default function AdminStorePage() {
  return (
    <AdminRoute>
      <AdminStoreContent />
    </AdminRoute>
  );
}

function AdminStoreContent() {
  const breadcrumbItems = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Loja', isActive: true }
  ];

  return (
    <AdminLayout currentSection="store" breadcrumbItems={breadcrumbItems}>
      <AdminSectionHeader
        title="Configuração da Loja"
        description="Configure moedas, catálogos e opções de exibição da loja de recompensas"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        }
      />

      <StoreConfigPanel />
    </AdminLayout>
  );
}
