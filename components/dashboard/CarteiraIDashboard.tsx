'use client';

import React from 'react';
import { ConnectedPlayerDashboard } from './ConnectedPlayerDashboard';

interface CarteiraIDashboardProps {
  playerId: string;
  token: string;
}

/**
 * Dashboard específico para Carteira I
 * Metas:
 * - Principal: Atividade (🎯)
 * - Secundária 1: Reais por Ativo (💰) com boost
 * - Secundária 2: Faturamento (📈) com boost
 * 
 * Pontos vêm diretamente da Funifier
 */
export const CarteiraIDashboard: React.FC<CarteiraIDashboardProps> = ({
  playerId,
  token
}) => {
  return <ConnectedPlayerDashboard playerId={playerId} token={token} />;
};