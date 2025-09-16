'use client';

import React from 'react';
import { ConnectedPlayerDashboard } from './ConnectedPlayerDashboard';

interface ERDashboardProps {
  playerId: string;
  token: string;
}

/**
 * Dashboard específico para ER
 * Metas:
 * - Principal: Faturamento (📈)
 * - Secundária 1: Reais por Ativo (💰) com boost
 * - Secundária 2: UPA (🎯) com boost
 * 
 * Inclui botão Medalhas adicional nas ações rápidas
 * Pontos vêm diretamente da Funifier
 */
export const ERDashboard: React.FC<ERDashboardProps> = ({
  playerId,
  token
}) => {
  return <ConnectedPlayerDashboard playerId={playerId} token={token} />;
};