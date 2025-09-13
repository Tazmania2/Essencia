'use client';

import React from 'react';

interface CycleCardProps {
  currentDay: number;
  totalDays: number;
  isDataFromCollection?: boolean;
}

export const CycleCard: React.FC<CycleCardProps> = ({ 
  currentDay, 
  totalDays, 
  isDataFromCollection = false 
}) => {
  // Handle edge cases and fallbacks
  const safeTotalDays = totalDays > 0 ? totalDays : 21; // Fallback to 21 days
  const safeCurrentDay = Math.max(0, Math.min(currentDay, safeTotalDays)); // Clamp between 0 and totalDays
  
  const daysRemaining = Math.max(0, safeTotalDays - safeCurrentDay);
  const progressPercentage = safeTotalDays > 0 ? (safeCurrentDay / safeTotalDays) * 100 : 0;
  
  // Handle cycle transitions (when current day exceeds total days)
  const isOverdue = currentDay > totalDays && totalDays > 0;
  const displayCurrentDay = isOverdue ? totalDays : safeCurrentDay;
  const displayDaysRemaining = isOverdue ? 0 : daysRemaining;
  const displayProgressPercentage = isOverdue ? 100 : Math.min(progressPercentage, 100);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Ciclo Atual</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className={`text-3xl font-bold ${isOverdue ? 'text-red-500' : 'text-boticario-purple'}`}>
            {displayCurrentDay}
          </div>
          <p className="text-gray-600 text-sm">Dia Atual</p>
        </div>
        <div className="text-center">
          <div className={`text-3xl font-bold ${isOverdue ? 'text-red-500' : 'text-boticario-purple'}`}>
            {displayDaysRemaining}
          </div>
          <p className="text-gray-600 text-sm">Dias Restantes</p>
        </div>
      </div>
      <div className="mt-4 bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-700 ease-in-out ${
            isOverdue ? 'bg-red-500' : 'bg-boticario-purple'
          }`}
          style={{ width: `${displayProgressPercentage}%` }}
        ></div>
      </div>
      <div className="text-center mt-2">
        <p className="text-sm text-gray-600">
          {Math.round(displayProgressPercentage)}% do ciclo concluído
        </p>
        {isOverdue && (
          <p className="text-xs text-red-500 mt-1">
            ⚠️ Ciclo vencido
          </p>
        )}
        {!isDataFromCollection && (
          <p className="text-xs text-gray-400 mt-1">
            * Usando padrão de {safeTotalDays} dias
          </p>
        )}
      </div>
    </div>
  );
};