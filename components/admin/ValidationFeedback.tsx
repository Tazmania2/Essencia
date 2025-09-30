'use client';

import React from 'react';
import { ValidationResult, ValidationError, ValidationWarning } from '../../types';

interface ValidationFeedbackProps {
  validationResult: ValidationResult;
  className?: string;
}

export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  validationResult,
  className = ''
}) => {
  if (!validationResult || (validationResult.errors.length === 0 && validationResult.warnings.length === 0)) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Errors */}
      {validationResult.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="font-semibold text-red-800">
              {validationResult.errors.filter(e => e.severity === 'error').length > 0 ? 'Erros' : 'Avisos'} de Validação
            </h4>
          </div>
          <ul className="space-y-2">
            {validationResult.errors.map((error, index) => (
              <ValidationErrorItem key={index} error={error} />
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {validationResult.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h4 className="font-semibold text-yellow-800">Avisos</h4>
          </div>
          <ul className="space-y-2">
            {validationResult.warnings.map((warning, index) => (
              <ValidationWarningItem key={index} warning={warning} />
            ))}
          </ul>
        </div>
      )}

      {/* Success State */}
      {validationResult.isValid && validationResult.errors.length === 0 && validationResult.warnings.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-green-800">Configuração válida</span>
          </div>
        </div>
      )}
    </div>
  );
};

interface ValidationErrorItemProps {
  error: ValidationError;
}

const ValidationErrorItem: React.FC<ValidationErrorItemProps> = ({ error }) => {
  const isError = error.severity === 'error';
  
  return (
    <li className="flex items-start">
      <div className={`w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0 ${
        isError ? 'bg-red-400' : 'bg-yellow-400'
      }`} />
      <div className="flex-1">
        <div className={`font-medium ${isError ? 'text-red-800' : 'text-yellow-800'}`}>
          {formatFieldName(error.field)}
        </div>
        <div className={`text-sm ${isError ? 'text-red-700' : 'text-yellow-700'}`}>
          {error.message}
        </div>
      </div>
      <div className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
        isError 
          ? 'bg-red-100 text-red-800' 
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        {isError ? 'Erro' : 'Aviso'}
      </div>
    </li>
  );
};

interface ValidationWarningItemProps {
  warning: ValidationWarning;
}

const ValidationWarningItem: React.FC<ValidationWarningItemProps> = ({ warning }) => {
  const getWarningIcon = (type: ValidationWarning['type']) => {
    switch (type) {
      case 'compatibility':
        return '🔗';
      case 'performance':
        return '⚡';
      case 'business_rule':
        return '📋';
      default:
        return '⚠️';
    }
  };

  const getWarningColor = (type: ValidationWarning['type']) => {
    switch (type) {
      case 'compatibility':
        return 'text-blue-700';
      case 'performance':
        return 'text-orange-700';
      case 'business_rule':
        return 'text-purple-700';
      default:
        return 'text-yellow-700';
    }
  };

  return (
    <li className="flex items-start">
      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0" />
      <div className="flex-1">
        <div className="font-medium text-yellow-800 flex items-center">
          <span className="mr-2">{getWarningIcon(warning.type)}</span>
          {formatFieldName(warning.field)}
        </div>
        <div className={`text-sm ${getWarningColor(warning.type)}`}>
          {warning.message}
        </div>
      </div>
      <div className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
        {warning.type === 'compatibility' && 'Compatibilidade'}
        {warning.type === 'performance' && 'Performance'}
        {warning.type === 'business_rule' && 'Regra de Negócio'}
        {!warning.type && 'Aviso'}
      </div>
    </li>
  );
};

/**
 * Format field names for better display
 */
function formatFieldName(field: string): string {
  const fieldMappings: Record<string, string> = {
    'primaryGoal.name': 'Meta Principal - Nome',
    'primaryGoal.displayName': 'Meta Principal - Nome de Exibição',
    'primaryGoal.challengeId': 'Meta Principal - Challenge ID',
    'primaryGoal.actionId': 'Meta Principal - Action ID',
    'primaryGoal.calculationType': 'Meta Principal - Tipo de Cálculo',
    'secondaryGoal1.name': 'Meta Secundária 1 - Nome',
    'secondaryGoal1.boost.catalogItemId': 'Meta Secundária 1 - Boost ID',
    'secondaryGoal2.name': 'Meta Secundária 2 - Nome',
    'secondaryGoal2.boost.catalogItemId': 'Meta Secundária 2 - Boost ID',
    'unlockConditions.catalogItemId': 'Condições de Desbloqueio - ID',
    'general': 'Geral'
  };

  return fieldMappings[field] || field;
}

export default ValidationFeedback;