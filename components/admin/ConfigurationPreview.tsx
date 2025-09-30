'use client';

import React from 'react';
import { DashboardConfig, TeamType } from '../../types';

interface ConfigurationPreviewProps {
  configuration: DashboardConfig;
}

export const ConfigurationPreview: React.FC<ConfigurationPreviewProps> = ({
  configuration
}) => {
  const isCarteiraII = configuration.teamType === TeamType.CARTEIRA_II;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h4 className="text-lg font-semibold text-gray-900">
          {configuration.displayName}
        </h4>
        {isCarteiraII && (
          <div className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full mt-1">
            ⚠️ Processamento Local
          </div>
        )}
      </div>

      {/* Primary Goal Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-800">Meta Principal</span>
          <span className="text-2xl">{configuration.primaryGoal.emoji}</span>
        </div>
        <h5 className="font-semibold text-blue-900 mb-1">
          {configuration.primaryGoal.displayName}
        </h5>
        <div className="text-sm text-blue-700 space-y-1">
          <div>Unidade: {configuration.primaryGoal.unit}</div>
          <div>Challenge ID: {configuration.primaryGoal.challengeId}</div>
          <div>Action ID: {configuration.primaryGoal.actionId}</div>
          <div className="flex items-center">
            Tipo: 
            <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
              configuration.primaryGoal.calculationType === 'local_processing'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {configuration.primaryGoal.calculationType === 'local_processing' 
                ? 'Local' 
                : 'Funifier'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Goal 1 Preview */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-green-800">Meta Secundária 1</span>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{configuration.secondaryGoal1.emoji}</span>
            <span className="text-lg">🚀</span>
          </div>
        </div>
        <h5 className="font-semibold text-green-900 mb-1">
          {configuration.secondaryGoal1.displayName}
        </h5>
        <div className="text-sm text-green-700 space-y-1 mb-3">
          <div>Unidade: {configuration.secondaryGoal1.unit}</div>
          <div>Challenge ID: {configuration.secondaryGoal1.challengeId}</div>
          <div>Action ID: {configuration.secondaryGoal1.actionId}</div>
        </div>
        
        {/* Boost Info */}
        <div className="bg-green-100 border border-green-300 rounded p-2">
          <div className="text-xs font-medium text-green-800 mb-1">
            🚀 {configuration.secondaryGoal1.boost.name}
          </div>
          <div className="text-xs text-green-700">
            {configuration.secondaryGoal1.boost.description}
          </div>
          <div className="text-xs text-green-600 mt-1">
            ID: {configuration.secondaryGoal1.boost.catalogItemId}
          </div>
        </div>
      </div>

      {/* Secondary Goal 2 Preview */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-purple-800">Meta Secundária 2</span>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{configuration.secondaryGoal2.emoji}</span>
            <span className="text-lg">🚀</span>
          </div>
        </div>
        <h5 className="font-semibold text-purple-900 mb-1">
          {configuration.secondaryGoal2.displayName}
        </h5>
        <div className="text-sm text-purple-700 space-y-1 mb-3">
          <div>Unidade: {configuration.secondaryGoal2.unit}</div>
          <div>Challenge ID: {configuration.secondaryGoal2.challengeId}</div>
          <div>Action ID: {configuration.secondaryGoal2.actionId}</div>
        </div>
        
        {/* Boost Info */}
        <div className="bg-purple-100 border border-purple-300 rounded p-2">
          <div className="text-xs font-medium text-purple-800 mb-1">
            🚀 {configuration.secondaryGoal2.boost.name}
          </div>
          <div className="text-xs text-purple-700">
            {configuration.secondaryGoal2.boost.description}
          </div>
          <div className="text-xs text-purple-600 mt-1">
            ID: {configuration.secondaryGoal2.boost.catalogItemId}
          </div>
        </div>
      </div>

      {/* Unlock Conditions Preview */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-yellow-800">Condições de Desbloqueio</span>
          <span className="text-2xl">🔓</span>
        </div>
        <div className="text-sm text-yellow-700 space-y-1">
          <div>{configuration.unlockConditions.description}</div>
          <div className="text-xs text-yellow-600">
            ID: {configuration.unlockConditions.catalogItemId}
          </div>
        </div>
      </div>

      {/* Special Processing Info for Carteira II */}
      {isCarteiraII && configuration.specialProcessing && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-orange-800">Processamento Especial</span>
            <span className="text-2xl">⚙️</span>
          </div>
          <div className="text-sm text-orange-700 mb-2">
            {configuration.specialProcessing.description}
          </div>
          <div className="space-y-1">
            {configuration.specialProcessing.warnings.map((warning, index) => (
              <div key={index} className="text-xs text-orange-600 flex items-start">
                <span className="mr-1">•</span>
                <span>{warning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mock Dashboard Preview */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-sm font-medium text-gray-800 mb-3 text-center">
          📱 Visualização do Dashboard
        </div>
        
        {/* Mock Progress Bars */}
        <div className="space-y-3">
          {/* Primary Goal Mock */}
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {configuration.primaryGoal.emoji} {configuration.primaryGoal.displayName}
              </span>
              <span className="text-sm text-gray-600">75%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>

          {/* Secondary Goals Mock */}
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {configuration.secondaryGoal1.emoji} {configuration.secondaryGoal1.displayName}
              </span>
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-600">85%</span>
                <span className="text-xs">🚀</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {configuration.secondaryGoal2.emoji} {configuration.secondaryGoal2.displayName}
              </span>
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-600">60%</span>
                <span className="text-xs opacity-50">🚀</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center mt-3">
          Esta é uma visualização aproximada de como o dashboard aparecerá
        </div>
      </div>
    </div>
  );
};