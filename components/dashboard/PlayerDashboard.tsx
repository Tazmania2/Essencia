'use client';

import React from 'react';
import { DashboardHeader } from './DashboardHeader';
import { PointsCard } from './PointsCard';
import { CycleCard } from './CycleCard';
import { GoalCard } from './GoalCard';
import { GoalDetailsAccordion } from './GoalDetailsAccordion';
import { QuickActions } from './QuickActions';
import { PrecisionMath } from '../../utils/precision-math';
import { getMetricFormatter } from '../../utils/metric-formatters';

interface QuickAction {
  icon: string;
  label: string;
  onClick: () => void;
  gradient: string;
  disabled?: boolean;
  comingSoon?: boolean;
}

interface PlayerDashboardProps {
  playerName: string;
  totalPoints: number;
  pointsLocked: boolean;
  currentCycleDay: number;
  totalCycleDays: number;
  isDataFromCollection: boolean;
  playerId?: string; // Add playerId for history functionality
  hasSpecialProcessing?: boolean;
  specialProcessingNote?: string;
  primaryGoal: {
    name: string;
    percentage: number;
    description: string;
    emoji: string;
    target?: number;
    current?: number;
    unit?: string;
    daysRemaining?: number;
  };
  secondaryGoal1: {
    name: string;
    percentage: number;
    description: string;
    emoji: string;
    hasBoost: boolean;
    isBoostActive: boolean;
    target?: number;
    current?: number;
    unit?: string;
    daysRemaining?: number;
  };
  secondaryGoal2: {
    name: string;
    percentage: number;
    description: string;
    emoji: string;
    hasBoost: boolean;
    isBoostActive: boolean;
    target?: number;
    current?: number;
    unit?: string;
    daysRemaining?: number;
  };
  goalDetails?: Array<{
    title: string;
    items: string[];
    bgColor: string;
    textColor: string;
  }>;
  customActions?: QuickAction[];
}

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({
  playerName,
  totalPoints,
  pointsLocked,
  currentCycleDay,
  totalCycleDays,
  isDataFromCollection,
  playerId,
  primaryGoal,
  secondaryGoal1,
  secondaryGoal2,
  goalDetails = [],
  customActions,
  hasSpecialProcessing = false,
  specialProcessingNote = "Pontos calculados localmente"
}) => {
  // Use boost status directly from props (no toggle functionality)
  const boost1Active = secondaryGoal1.isBoostActive;
  const boost2Active = secondaryGoal2.isBoostActive;

  // Helper function to format values for display
  const formatValue = (value: number, unit?: string): string => {
    if (unit === 'R$') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
    
    if (unit === 'marcas') {
      return value.toFixed(1) + ' ' + unit;
    }
    
    return Math.round(value).toString() + (unit ? ' ' + unit : '');
  };

  // Generate enhanced goal details
  const generateGoalItems = (goal: any, isBoostGoal: boolean = false) => {
    const items = [];
    
    if (goal.target !== undefined && goal.current !== undefined) {
      items.push(`META: ${formatValue(goal.target, goal.unit)}`);
      items.push(`Valor Atual: ${formatValue(goal.current, goal.unit)}`);
      items.push(`Porcentagem alcançada: ${PrecisionMath.fixExistingPercentage(goal.percentage).displayValue}`);
      if (goal.daysRemaining !== undefined) {
        items.push(`Prazo: ${goal.daysRemaining} dias restantes`);
      }
    } else {
      // Fallback to basic information
      items.push(`Progresso: ${PrecisionMath.fixExistingPercentage(goal.percentage).displayValue}`);
      items.push(`Meta: 100%`);
      const remaining = Math.max(0, 100 - goal.percentage);
      items.push(`Restante: ${PrecisionMath.fixExistingPercentage(remaining).displayValue}`);
      items.push(`Prazo: ${totalCycleDays - currentCycleDay} dias`);
    }
    
    if (isBoostGoal) {
      const isActive = goal.name === secondaryGoal1.name ? boost1Active : boost2Active;
      items.push(`Boost: ${isActive ? 'Ativo (2x pontos)' : 'Inativo'}`);
    }
    
    return items;
  };

  // Create enhanced goal details with real metric values
  const enhancedGoalDetails = [
    {
      name: primaryGoal.name,
      displayName: primaryGoal.name,
      emoji: primaryGoal.emoji || '🎯',
      target: primaryGoal.target,
      current: primaryGoal.current,
      percentage: primaryGoal.percentage,
      unit: primaryGoal.unit,
      bgColor: 'bg-boticario-light',
      textColor: 'text-boticario-dark',
      daysRemaining: primaryGoal.daysRemaining,
      hasReportData: primaryGoal.target !== undefined && primaryGoal.current !== undefined
    },
    {
      name: secondaryGoal1.name,
      displayName: secondaryGoal1.name,
      emoji: secondaryGoal1.emoji || '💰',
      target: secondaryGoal1.target,
      current: secondaryGoal1.current,
      percentage: secondaryGoal1.percentage,
      unit: secondaryGoal1.unit,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      boostActive: boost1Active,
      daysRemaining: secondaryGoal1.daysRemaining,
      hasReportData: secondaryGoal1.target !== undefined && secondaryGoal1.current !== undefined
    },
    {
      name: secondaryGoal2.name,
      displayName: secondaryGoal2.name,
      emoji: secondaryGoal2.emoji || '📈',
      target: secondaryGoal2.target,
      current: secondaryGoal2.current,
      percentage: secondaryGoal2.percentage,
      unit: secondaryGoal2.unit,
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-800',
      boostActive: boost2Active,
      daysRemaining: secondaryGoal2.daysRemaining,
      hasReportData: secondaryGoal2.target !== undefined && secondaryGoal2.current !== undefined
    }
  ];

  // Legacy goal details for backward compatibility
  const defaultGoalDetails = [
    {
      title: primaryGoal.name,
      items: generateGoalItems(primaryGoal),
      bgColor: 'bg-boticario-light',
      textColor: 'text-boticario-dark'
    },
    {
      title: secondaryGoal1.name,
      items: generateGoalItems(secondaryGoal1, true),
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800'
    },
    {
      title: secondaryGoal2.name,
      items: generateGoalItems(secondaryGoal2, true),
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
          <PointsCard 
            points={totalPoints} 
            isUnlocked={!pointsLocked} 
            hasSpecialProcessing={hasSpecialProcessing}
            specialProcessingNote={specialProcessingNote}
          />
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
            target={primaryGoal.target}
            current={primaryGoal.current}
            unit={primaryGoal.unit}
            daysRemaining={primaryGoal.daysRemaining}
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
              target={secondaryGoal1.target}
              current={secondaryGoal1.current}
              unit={secondaryGoal1.unit}
              daysRemaining={secondaryGoal1.daysRemaining}
            />
            <GoalCard
              title={secondaryGoal2.name}
              percentage={secondaryGoal2.percentage}
              description={secondaryGoal2.description}
              emoji={secondaryGoal2.emoji}
              hasBoost={secondaryGoal2.hasBoost}
              isBoostActive={boost2Active}
              target={secondaryGoal2.target}
              current={secondaryGoal2.current}
              unit={secondaryGoal2.unit}
              daysRemaining={secondaryGoal2.daysRemaining}
            />
          </div>
        </div>

        {/* Detalhes das Metas */}
        <GoalDetailsAccordion 
          enhancedGoals={enhancedGoalDetails}
          goals={goalDetails.length > 0 ? goalDetails : defaultGoalDetails} 
        />

        {/* Ações Rápidas */}
        <QuickActions 
          playerId={playerId}
          onHistoryClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/history';
            }
          }}
          actions={customActions} 
        />
      </main>
    </div>
  );
};