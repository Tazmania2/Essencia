'use client';

import React, { useState } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { PointsCard } from './PointsCard';
import { CycleCard } from './CycleCard';
import { GoalCard } from './GoalCard';
import { GoalDetailsAccordion } from './GoalDetailsAccordion';
import { QuickActions } from './QuickActions';

interface PlayerDashboardProps {
  playerName: string;
  totalPoints: number;
  pointsLocked: boolean;
  currentCycleDay: number;
  totalCycleDays: number;
  isDataFromCollection: boolean;
  primaryGoal: {
    name: string;
    percentage: number;
    description: string;
    emoji: string;
  };
  secondaryGoal1: {
    name: string;
    percentage: number;
    description: string;
    emoji: string;
    hasBoost: boolean;
    isBoostActive: boolean;
  };
  secondaryGoal2: {
    name: string;
    percentage: number;
    description: string;
    emoji: string;
    hasBoost: boolean;
    isBoostActive: boolean;
  };
  goalDetails?: Array<{
    title: string;
    items: string[];
    bgColor: string;
    textColor: string;
  }>;
}

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({
  playerName,
  totalPoints,
  pointsLocked,
  currentCycleDay,
  totalCycleDays,
  isDataFromCollection,
  primaryGoal,
  secondaryGoal1,
  secondaryGoal2,
  goalDetails = []
}) => {
  const [boost1Active, setBoost1Active] = useState(secondaryGoal1.isBoostActive);
  const [boost2Active, setBoost2Active] = useState(secondaryGoal2.isBoostActive);

  const handleBoost1Toggle = () => {
    setBoost1Active(!boost1Active);
  };

  const handleBoost2Toggle = () => {
    setBoost2Active(!boost2Active);
  };

  const defaultGoalDetails = [
    {
      title: 'Meta Principal',
      items: [
        `Valor atual: ${primaryGoal.percentage}%`,
        `Meta: 100%`,
        `Restante: ${Math.max(0, 100 - primaryGoal.percentage)}%`,
        `Prazo: ${totalCycleDays - currentCycleDay} dias`
      ],
      bgColor: 'bg-boticario-light',
      textColor: 'text-boticario-dark'
    },
    {
      title: secondaryGoal1.name,
      items: [
        `Progresso: ${secondaryGoal1.percentage}%`,
        `Boost: ${boost1Active ? 'Ativo (2x pontos)' : 'Inativo'}`,
        `Próxima ação: +400 pts`,
        'Categoria favorita'
      ],
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800'
    },
    {
      title: secondaryGoal2.name,
      items: [
        `Progresso: ${secondaryGoal2.percentage}%`,
        `Boost: ${boost2Active ? 'Ativo (2x pontos)' : 'Inativo'}`,
        `Próxima ação: +200 pts`,
        'Desconto disponível: 15%'
      ],
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-800'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-boticario-light to-white min-h-screen">
      <DashboardHeader playerName={playerName} />
      
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Pontos e Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PointsCard points={totalPoints} isUnlocked={!pointsLocked} />
          <CycleCard 
            currentDay={currentCycleDay} 
            totalDays={totalCycleDays}
            isDataFromCollection={isDataFromCollection}
          />
        </div>

        {/* Metas */}
        <div className="space-y-6">
          {/* Meta Principal */}
          <GoalCard
            title={primaryGoal.name}
            percentage={primaryGoal.percentage}
            description={primaryGoal.description}
            emoji={primaryGoal.emoji}
            isPrimary={true}
          />

          {/* Metas Secundárias */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GoalCard
              title={secondaryGoal1.name}
              percentage={secondaryGoal1.percentage}
              description={secondaryGoal1.description}
              emoji={secondaryGoal1.emoji}
              hasBoost={secondaryGoal1.hasBoost}
              isBoostActive={boost1Active}
              onBoostToggle={handleBoost1Toggle}
            />
            <GoalCard
              title={secondaryGoal2.name}
              percentage={secondaryGoal2.percentage}
              description={secondaryGoal2.description}
              emoji={secondaryGoal2.emoji}
              hasBoost={secondaryGoal2.hasBoost}
              isBoostActive={boost2Active}
              onBoostToggle={handleBoost2Toggle}
            />
          </div>
        </div>

        {/* Detalhes das Metas */}
        <GoalDetailsAccordion goals={goalDetails.length > 0 ? goalDetails : defaultGoalDetails} />

        {/* Ações Rápidas */}
        <QuickActions />
      </main>
    </div>
  );
};