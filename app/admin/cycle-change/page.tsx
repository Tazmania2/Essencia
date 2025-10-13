'use client';

import { AdminRoute } from '../../../components/auth/ProtectedRoute';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { CycleChangePanel } from '../../../components/admin/CycleChangePanel';
import { AdminSectionHeader } from '../../../components/admin';

export default function AdminCycleChangePage() {
  return (
    <AdminRoute>
      <AdminCycleChangeContent />
    </AdminRoute>
  );
}

function AdminCycleChangeContent() {
  const breadcrumbItems = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Trocar o Ciclo', isActive: true }
  ];

  return (
    <AdminLayout currentSection="cycle-change" breadcrumbItems={breadcrumbItems}>
      <AdminSectionHeader
        title="Trocar o Ciclo"
        description="Execute o processo de mudança de ciclo com validação automática"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        }
      />

      <CycleChangePanel />
    </AdminLayout>
  );
}