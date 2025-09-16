'use client';

import React from 'react';
import { TeamType } from '../../types';
import { Carteira0Dashboard } from './Carteira0Dashboard';
import { CarteiraIDashboard } from './CarteiraIDashboard';
import { CarteiraIIDashboard } from './CarteiraIIDashboard';
import { CarteiraIIIDashboard } from './CarteiraIIIDashboard';
import { CarteiraIVDashboard } from './CarteiraIVDashboard';
import { ERDashboard } from './ERDashboard';

interface TeamDashboardFactoryProps {
  playerId: string;
  token: string;
  teamType: TeamType;
}

/**
 * Factory component que renderiza o dashboard específico baseado no tipo de equipe
 */
export const TeamDashboardFactory: React.FC<TeamDashboardFactoryProps> = ({
  playerId,
  token,
  teamType
}) => {
  switch (teamType) {
    case TeamType.CARTEIRA_0:
      return <Carteira0Dashboard playerId={playerId} token={token} />;
      
    case TeamType.CARTEIRA_I:
      return <CarteiraIDashboard playerId={playerId} token={token} />;
      
    case TeamType.CARTEIRA_II:
      return <CarteiraIIDashboard playerId={playerId} token={token} />;
      
    case TeamType.CARTEIRA_III:
      return <CarteiraIIIDashboard playerId={playerId} token={token} />;
      
    case TeamType.CARTEIRA_IV:
      return <CarteiraIVDashboard playerId={playerId} token={token} />;
      
    case TeamType.ER:
      return <ERDashboard playerId={playerId} token={token} />;
      
    default:
      return (
        <div className="bg-gradient-to-br from-boticario-light to-white min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Equipe não reconhecida</h2>
            <p className="text-gray-600 mb-4">
              O tipo de equipe &quot;{teamType}&quot; não é suportado pelo sistema. Entre em contato com o suporte técnico.
            </p>
            <div className="bg-gray-100 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600 mb-2">Equipes suportadas:</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Carteira 0</li>
                <li>• Carteira I</li>
                <li>• Carteira II</li>
                <li>• Carteira III</li>
                <li>• Carteira IV</li>
                <li>• ER</li>
              </ul>
            </div>
            <p className="text-sm text-gray-500">
              Tipo recebido: {teamType}
            </p>
          </div>
        </div>
      );
  }
};