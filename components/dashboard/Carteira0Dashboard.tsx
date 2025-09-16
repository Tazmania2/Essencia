'use client';

import React from 'react';
import { ConnectedPlayerDashboard } from './ConnectedPlayerDashboard';

interface Carteira0DashboardProps {
  playerId: string;
  token: string;
}

/**
 * Dashboard específico para Carteira 0
 * Metas:
 * - Principal: Conversões (🔄)
 * - Secundária 1: Reais por Ativo (💰) com boost
 * - Secundária 2: Faturamento (📈) com boost
 * 
 * Pontos vêm diretamente da Funifier
 */
export const Carteira0Dashboard: React.FC<Carteira0DashboardProps> = ({
  playerId,
  token
}) => {
  return <ConnectedPlayerDashboard playerId={playerId} token={token} />;
};