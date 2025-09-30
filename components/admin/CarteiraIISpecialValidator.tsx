'use client';

import React from 'react';
import { DashboardConfig, TeamType } from '../../types';

interface CarteiraIISpecialValidatorProps {
  configuration: DashboardConfig;
  onValidationChange: (isValid: boolean, warnings: string[]) => void;
}

export const CarteiraIISpecialValidator: React.FC<CarteiraIISpecialValidatorProps> = ({
  configuration,
  onValidationChange
}) => {
  const [validationState, setValidationState] = React.useState({
    isValid: true,
    warnings: [] as string[],
    errors: [] as string[]
  });

  React.useEffect(() => {
    if (configuration.teamType !== TeamType.CARTEIRA_II) {
      return;
    }

    validateCarteiraIIConfiguration();
  }, [configuration]);

  const validateCarteiraIIConfiguration = () => {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check if primary goal is using local processing
    if (configuration.primaryGoal.calculationType !== 'local_processing') {
      errors.push('Meta principal deve usar "local_processing" para Carteira II');
    }

    // Check if secondary goals are using local processing
    if (configuration.secondaryGoal1.calculationType !== 'local_processing') {
      warnings.push('Meta secundária 1 deveria usar "local_processing" para consistência');
    }

    if (configuration.secondaryGoal2.calculationType !== 'local_processing') {
      warnings.push('Meta secundária 2 deveria usar "local_processing" para consistência');
    }

    // Check for specific metric compatibility
    if (configuration.primaryGoal.name !== 'reaisPorAtivo') {
      warnings.push('Carteira II tradicionalmente usa "Reais por Ativo" como meta principal');
    }

    // Check boost configurations
    if (!configuration.secondaryGoal1.boost.catalogItemId) {
      errors.push('Boost da meta secundária 1 deve ter um Catalog Item ID válido');
    }

    if (!configuration.secondaryGoal2.boost.catalogItemId) {
      errors.push('Boost da meta secundária 2 deve ter um Catalog Item ID válido');
    }

    // Check for special processing configuration
    if (!configuration.specialProcessing) {
      errors.push('Carteira II deve ter configuração de processamento especial');
    } else {
      if (configuration.specialProcessing.type !== 'carteira_ii_local') {
        errors.push('Tipo de processamento especial deve ser "carteira_ii_local"');
      }

      if (!configuration.specialProcessing.warnings || configuration.specialProcessing.warnings.length === 0) {
        warnings.push('Configuração de processamento especial deveria incluir avisos para o usuário');
      }
    }

    const newState = {
      isValid: errors.length === 0,
      warnings,
      errors
    };

    setValidationState(newState);
    onValidationChange(newState.isValid, [...warnings, ...errors]);
  };

  if (configuration.teamType !== TeamType.CARTEIRA_II) {
    return null;
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-orange-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h4 className="font-semibold text-orange-800 mb-2">
            Validação Especial - Carteira II
          </h4>
          
          {/* Errors */}
          {validationState.errors.length > 0 && (
            <div className="mb-3">
              <h5 className="font-medium text-red-800 mb-1">❌ Erros Críticos:</h5>
              <ul className="space-y-1">
                {validationState.errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700 flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {validationState.warnings.length > 0 && (
            <div className="mb-3">
              <h5 className="font-medium text-orange-800 mb-1">⚠️ Avisos:</h5>
              <ul className="space-y-1">
                {validationState.warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-orange-700 flex items-start">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Success State */}
          {validationState.isValid && validationState.warnings.length === 0 && (
            <div className="flex items-center text-green-700">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">Configuração da Carteira II válida</span>
            </div>
          )}

          {/* Local Processing Explanation */}
          <div className="mt-3 p-3 bg-orange-100 border border-orange-300 rounded">
            <h6 className="font-medium text-orange-800 mb-1">🔧 Sobre o Processamento Local:</h6>
            <p className="text-xs text-orange-700 mb-2">
              A Carteira II usa processamento local porque sua meta principal (Reais por Ativo) 
              é muito volátil e precisa de cálculos especiais baseados nos dados do CSV.
            </p>
            <div className="text-xs text-orange-600 space-y-1">
              <div>• Percentuais calculados localmente, não pela Funifier API</div>
              <div>• Boosts ativados e gerenciados pelo sistema local</div>
              <div>• Dados do CSV são a fonte primária de verdade</div>
              <div>• Lógica customizada no arquivo carteira-ii-processor.service.ts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};