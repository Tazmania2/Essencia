'use client';

import { AdminRoute } from '../../../components/auth/ProtectedRoute';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { FileUpload } from '../../../components/admin/FileUpload';
import { useState } from 'react';

export default function AdminReportsPage() {
  return (
    <AdminRoute>
      <AdminReportsContent />
    </AdminRoute>
  );
}

function AdminReportsContent() {
  const [uploadResults, setUploadResults] = useState<any[]>([]);

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Upload de Relatórios', isActive: true }
  ];

  const handleFileUpload = async (files: File[], parseResults: any[]) => {
    setUploadResults(parseResults);
  };

  const handleSubmissionComplete = (result: any) => {
    // Submission completed successfully
    // You can add additional handling here if needed
  };

  return (
    <AdminLayout currentSection="reports" breadcrumbItems={breadcrumbItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Upload de Relatórios</h1>
              <p className="text-gray-600">Faça upload dos relatórios de performance dos jogadores</p>
            </div>
          </div>

          {/* Expected Format Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-blue-900">📋 Formato Esperado do CSV</h3>
              <button
                onClick={() => {
                  // Import and use the sample generator
                  import('../../../utils/sample-csv-generator').then(({ downloadSampleCSV }) => {
                    downloadSampleCSV(['123456'], 'exemplo-relatorio.csv');
                  });
                }}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
              >
                📥 Baixar Exemplo
              </button>
            </div>
            <p className="text-sm text-blue-800 mb-3">O arquivo CSV deve conter as seguintes colunas na ordem exata:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-blue-700">
              <div>1. Player ID (Funifier ID)</div>
              <div>2. Dia do Ciclo</div>
              <div>3. Total Dias Ciclo</div>
              <div>4. Faturamento Meta</div>
              <div>5. Faturamento Atual</div>
              <div>6. Faturamento %</div>
              <div>7. Reais por Ativo Meta</div>
              <div>8. Reais por Ativo Atual</div>
              <div>9. Reais por Ativo %</div>
              <div>10. Multimarcas por Ativo Meta</div>
              <div>11. Multimarcas por Ativo Atual</div>
              <div>12. Multimarcas por Ativo %</div>
              <div>13. Atividade Meta</div>
              <div>14. Atividade Atual</div>
              <div>15. Atividade %</div>
            </div>
          </div>
        </div>

        {/* File Upload Component */}
        <FileUpload
          onFileUpload={handleFileUpload}
          onSubmissionComplete={handleSubmissionComplete}
          acceptedTypes={['.csv']}
          multiple={false}
          maxFileSize={10} // 10MB
        />

        {/* Upload Results */}
        {uploadResults.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Resultados do Upload</h2>
            <div className="space-y-4">
              {uploadResults.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{result.fileName}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.success ? 'Sucesso' : 'Erro'}
                    </span>
                  </div>
                  {result.processedRecords && (
                    <p className="text-sm text-gray-600">
                      {result.processedRecords} registros processados
                    </p>
                  )}
                  {result.error && (
                    <p className="text-sm text-red-600">{result.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}