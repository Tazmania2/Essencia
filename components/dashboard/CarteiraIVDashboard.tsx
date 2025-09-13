'use client';

import React from 'react';
import { ConnectedPlayerDashboard } from './ConnectedPlayerDashboard';

interface CarteiraIVDashboardProps {
  playerId: string;
  token: string;
}

/**
 * Dashboard específico para Carteira IV
 * Metas:
 * - Principal: Faturamento (📈)
 * - Secundária 1: Reais por Ativo (💰) com boost
 * - Secundária 2: Multimarcas por Ativo (🏪) com boost
 * 
 * Pontos vêm diretamente da Funifier
 * (Mesmo comportamento que Carteira III)
 */
export const CarteiraIVDashboard: React.FC<CarteiraIVDashboardProps> = ({
  playerId,
  token
}) => {
  return <ConnectedPlayerDashboard playerId={playerId} token={token} />;
};