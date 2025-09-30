'use client';

import { AdminRoute } from '../../../components/auth/ProtectedRoute';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { AdminSectionHeader } from '../../../components/admin/AdminSectionHeader';
import { DashboardConfigurationPanel } from '../../../components/admin/DashboardConfigurationPanel';
import { DashboardConfigurationRecord } from '../../../types';
import { useState } from 'react';

export default function ConfigurationPage() {
  return (
    <AdminRoute>
      <ConfigurationContent />
    </AdminRoute>
  );
}

function ConfigurationContent() {
  const [lastSavedConfig, setLastSavedConfig] = useState<DashboardConfigurationRecord | null>(null);

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Configuração de Dashboards', isActive: true }
  ];

  const handleConfigurationSaved = (config: DashboardConfigurationRecord) => {
    setLastSavedConfig(config);
    // You could add a toast notification here
    console.log('Configuration saved successfully:', config);
  };

  return (
    <AdminLayout currentSection="configuration" breadcrumbItems={breadcrumbItems}>
      {/* Page Header */}
      <AdminSectionHeader
        title="Configuração de Dashboards"
        description="Configure as métricas, boosts e comportamentos de cada dashboard do sistema"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
      />

      {/* Success Message */}
      {lastSavedConfig && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-green-800">Configuração salva com sucesso!</p>
              <p className="text-sm text-green-700">
                Versão {lastSavedConfig.version} salva em {new Date(lastSavedConfig.createdAt).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Panel */}
      <DashboardConfigurationPanel onConfigurationSaved={handleConfigurationSaved} />
    </AdminLayout>
  );
}