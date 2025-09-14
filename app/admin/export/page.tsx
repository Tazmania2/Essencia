'use client';

import { AdminRoute } from '../../../components/auth/ProtectedRoute';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { DataExport } from '../../../components/admin/DataExport';

export default function AdminExportPage() {
  return (
    <AdminRoute>
      <AdminExportContent />
    </AdminRoute>
  );
}

function AdminExportContent() {
  const breadcrumbItems = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Exportar Dados', isActive: true }
  ];

  return (
    <AdminLayout currentSection="export" breadcrumbItems={breadcrumbItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Exportar Dados</h1>
              <p className="text-gray-600">Exporte dados dos jogadores em diferentes formatos</p>
            </div>
          </div>
        </div>

        {/* Data Export Component */}
        <DataExport />
      </div>
    </AdminLayout>
  );
}