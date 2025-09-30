'use client';

import React from 'react';

interface CarteiraIIWarningModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const CarteiraIIWarningModal: React.FC<CarteiraIIWarningModalProps> = ({
  onConfirm,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-t-xl">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">⚠️ Atenção: Carteira II</h2>
              <p className="text-orange-100 mt-1">Processamento Especial Detectado</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Você está modificando a configuração da Carteira II
            </h3>
            <p className="text-gray-700 mb-4">
              A Carteira II utiliza processamento local especial devido à volatilidade de sua meta principal. 
              Mudanças na configuração podem afetar significativamente o comportamento do sistema.
            </p>
          </div>

          {/* Warning List */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-orange-800 mb-3">
              🚨 Implicações das Mudanças:
            </h4>
            <ul className="space-y-2 text-sm text-orange-700">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>
                  <strong>Cálculos Locais:</strong> Esta carteira não usa dados diretos da Funifier API. 
                  Os percentuais são calculados localmente com base nos dados do CSV.
                </span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>
                  <strong>Boosts Especiais:</strong> Os boosts são ativados e calculados localmente, 
                  não sendo sincronizados automaticamente com a Funifier.
                </span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>
                  <strong>Lógica Customizada:</strong> Mudanças nas métricas podem quebrar a lógica 
                  de processamento local existente.
                </span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>
                  <strong>Testes Necessários:</strong> Após mudanças, é essencial testar o comportamento 
                  com dados reais para garantir que tudo funciona corretamente.
                </span>
              </li>
            </ul>
          </div>

          {/* Technical Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-800 mb-3">
              🔧 Detalhes Técnicos:
            </h4>
            <div className="text-sm text-gray-700 space-y-2">
              <div>
                <strong>Arquivo de Processamento:</strong> 
                <code className="ml-1 px-2 py-1 bg-gray-200 rounded text-xs">
                  services/carteira-ii-processor.service.ts
                </code>
              </div>
              <div>
                <strong>Tipo de Cálculo:</strong> 
                <span className="ml-1 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                  local_processing
                </span>
              </div>
              <div>
                <strong>Dependências:</strong> CSV data, dashboard defaults, boost logic
              </div>
            </div>
          </div>

          {/* Impact Analysis */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-red-800 mb-3">
              🎯 Análise de Impacto:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-red-700 mb-2">Componentes Afetados:</h5>
                <ul className="space-y-1 text-red-600">
                  <li>• Dashboard do jogador</li>
                  <li>• Cálculo de percentuais</li>
                  <li>• Sistema de boosts</li>
                  <li>• Condições de desbloqueio</li>
                  <li>• Histórico de ciclos</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-red-700 mb-2">Arquivos de Código:</h5>
                <ul className="space-y-1 text-red-600 font-mono text-xs">
                  <li>• carteira-ii-processor.service.ts</li>
                  <li>• dashboard.service.ts</li>
                  <li>• team-processor-factory.service.ts</li>
                  <li>• CarteiraIIDashboard.tsx</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step-by-Step Process */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-purple-800 mb-3">
              📋 Processo Recomendado:
            </h4>
            <ol className="space-y-2 text-sm text-purple-700">
              <li className="flex items-start">
                <span className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                <span>Faça backup da configuração atual antes de salvar</span>
              </li>
              <li className="flex items-start">
                <span className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                <span>Salve as mudanças e monitore logs de erro</span>
              </li>
              <li className="flex items-start">
                <span className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                <span>Teste com dados reais de um jogador da Carteira II</span>
              </li>
              <li className="flex items-start">
                <span className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                <span>Verifique se os percentuais estão sendo calculados corretamente</span>
              </li>
              <li className="flex items-start">
                <span className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">5</span>
                <span>Confirme que os boosts estão funcionando como esperado</span>
              </li>
              <li className="flex items-start">
                <span className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">6</span>
                <span>Notifique a equipe sobre as mudanças implementadas</span>
              </li>
            </ol>
          </div>

          {/* Confirmation Checklist */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-800 mb-3">
              ✅ Antes de Continuar, Confirme:
            </h4>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>Entendo que esta carteira usa processamento local especial</span>
              </li>
              <li className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>Tenho backup da configuração atual para reverter se necessário</span>
              </li>
              <li className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>Vou testar as mudanças com dados reais após salvar</span>
              </li>
              <li className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>Vou monitorar logs de erro após implementar as mudanças</span>
              </li>
              <li className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>Notificarei a equipe sobre as mudanças na Carteira II</span>
              </li>
              <li className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>Entendo que posso precisar ajustar o código do processador local</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <button
              onClick={onCancel}
              className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancelar Mudanças
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all font-medium shadow-lg"
            >
              Confirmar e Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};