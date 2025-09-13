'use client';

import React from 'react';
import { ConnectedPlayerDashboard } from './ConnectedPlayerDashboard';

interface CarteiraIIIDashboardProps {
  playerId: string;
  token: string;
}

/**
 * Dashboard específico para Carteira III
 * Metas:
 * - Principal: Faturamento (📈)
 * - Secundária 1: Reais por Ativo (💰) com boost
 * - Secundária 2: Multimarcas por Ativo (🏪) com boost
 * 
 * Pontos vêm diretamente da Funifier
 */
export const CarteiraIIIDashboard: React.FC<CarteiraIIIDashboardProps> = ({
  playerId,
  token
}) => {
  return <ConnectedPlayerDashboard playerId={playerId} token={token} />;
};