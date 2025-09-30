'use client';

import React, { useState } from 'react';
import { 
  createGoalDetailMetric, 
  FALLBACK_VALUES,
  type GoalDetailMetric 
} from '../../utils/metric-formatters';

interface GoalDetail {
  title: string;
  items: string[];
  bgColor: string;
  textColor: string;
}

interface EnhancedGoalDetail {
  name: string;
  displayName: string;
  emoji: string;
  target?: number;
  current?: number;
  percentage: number;
  unit?: string;
  bgColor: string;
  textColor: string;
  boostActive?: boolean;
  daysRemaining?: number;
  hasReportData?: boolean;
}

interface GoalDetailsAccordionProps {
  goals?: GoalDetail[]; // Legacy support
  enhancedGoals?: EnhancedGoalDetail[]; // New enhanced format
}

export const GoalDetailsAccordion: React.FC<GoalDetailsAccordionProps> = ({ 
  goals, 
  enhancedGoals 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  // Helper function to render enhanced goal details
  const renderEnhancedGoal = (goal: EnhancedGoalDetail, index: number) => {
    let metricData: GoalDetailMetric;
    
    // Check if we have actual report data
    if (goal.hasReportData && goal.target !== undefined && goal.current !== undefined) {
      metricData = createGoalDetailMetric(
        goal.name,
        goal.displayName,
        goal.target,
        goal.current,
        goal.emoji
      );
    } else {
      // Fallback when report data is unavailable
      metricData = {
        name: goal.name,
        displayName: goal.displayName,
        target: FALLBACK_VALUES.unavailable,
        current: FALLBACK_VALUES.unavailable,
        percentage: {
          displayValue: goal.percentage.toFixed(1) + '%',
          rawValue: goal.percentage,
          unit: '%',
          type: 'percentage'
        },
        emoji: goal.emoji
      };
    }

    return (
      <div key={index} className={`${goal.bgColor} rounded-lg p-4`}>
        <h4 className={`font-semibold ${goal.textColor} mb-3 flex items-center gap-2`}>
          <span>{goal.emoji}</span>
          <span>{goal.displayName}</span>
        </h4>
        
        <div className="space-y-2 text-sm">
          {/* Target and Current Values */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/50 rounded p-2">
              <div className="text-xs text-gray-600 font-medium">Meta</div>
              <div className="font-semibold text-gray-800">
                {metricData.target.displayValue}
              </div>
            </div>
            <div className="bg-white/50 rounded p-2">
              <div className="text-xs text-gray-600 font-medium">Atual</div>
              <div className="font-semibold text-gray-800">
                {metricData.current.displayValue}
              </div>
            </div>
          </div>

          {/* Progress Percentage */}
          <div className="bg-white/50 rounded p-2">
            <div className="text-xs text-gray-600 font-medium">Progresso</div>
            <div className="font-semibold text-gray-800">
              {metricData.percentage.displayValue}
            </div>
          </div>

          {/* Additional Information */}
          {goal.daysRemaining !== undefined && (
            <div className="bg-white/50 rounded p-2">
              <div className="text-xs text-gray-600 font-medium">Prazo</div>
              <div className="font-semibold text-gray-800">
                {goal.daysRemaining} dias restantes
              </div>
            </div>
          )}

          {/* Boost Status */}
          {goal.boostActive !== undefined && (
            <div className="bg-white/50 rounded p-2">
              <div className="text-xs text-gray-600 font-medium">Boost</div>
              <div className={`font-semibold ${goal.boostActive ? 'text-green-600' : 'text-gray-600'}`}>
                {goal.boostActive ? '✅ Ativo (2x pontos)' : '❌ Inativo'}
              </div>
            </div>
          )}

          {/* Data Availability Indicator */}
          {!goal.hasReportData && (
            <div className="text-xs text-amber-600 bg-amber-50 rounded p-2 mt-2">
              ⚠️ Dados do relatório indisponíveis - mostrando apenas progresso percentual
            </div>
          )}
        </div>
      </div>
    );
  };

  // Helper function to render legacy goal details
  const renderLegacyGoal = (goal: GoalDetail, index: number) => (
    <div key={index} className={`${goal.bgColor} rounded-lg p-4`}>
      <h4 className={`font-semibold ${goal.textColor} mb-2`}>{goal.title}</h4>
      <ul className="text-sm text-gray-700 space-y-1">
        {goal.items.map((item, itemIndex) => (
          <li key={itemIndex}>• {item}</li>
        ))}
      </ul>
    </div>
  );

  // Determine which goals to render
  const goalsToRender = enhancedGoals || goals || [];
  const isEnhanced = !!enhancedGoals;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <button 
        onClick={toggleAccordion}
        className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <h2 className="text-xl font-semibold text-gray-800">📊 Detalhes das Metas</h2>
        <span 
          className={`text-2xl text-boticario-pink transform transition-transform duration-300 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        >
          ▼
        </span>
      </button>
      
      <div className={`transition-all duration-300 ease-in-out ${
        isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
      } overflow-hidden`}>
        <div className="p-6 pt-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {goalsToRender.map((goal, index) => 
              isEnhanced 
                ? renderEnhancedGoal(goal as EnhancedGoalDetail, index)
                : renderLegacyGoal(goal as GoalDetail, index)
            )}
          </div>
          
          {goalsToRender.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <div>Nenhum detalhe de meta disponível</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};