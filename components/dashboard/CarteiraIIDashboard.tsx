'use client';

import React from 'react';
import { ConnectedPlayerDashboard } from './ConnectedPlayerDashboard';

interface CarteiraIIDashboardProps {
  playerId: string;
  token: string;
}

/**
 * Dashboard específico para Carteira II
 * Metas:
 * - Principal: Reais por Ativo (💰) - controla desbloqueio de pontos
 * - Secundária 1: Atividade (🎯) com boost
 * - Secundária 2: Multimarcas por Ativo (🏪) com boost
 * 
 * CASO ESPECIAL: Pontos calculados localmente
 * - Pontos base da Funifier
 * - Desbloqueio quando Reais por Ativo >= 100%
 * - Multiplicadores de boost aplicados localmente
 */
export const CarteiraIIDashboard: React.FC<CarteiraIIDashboardProps> = ({
  playerId,
  token
}) => {
  return <ConnectedPlayerDashboard playerId={playerId} token={token} />;
};