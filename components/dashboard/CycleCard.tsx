'use client';

import React from 'react';

interface CycleCardProps {
  currentDay: number;
  totalDays: number;
}

export const CycleCard: React.FC<CycleCardProps> = ({ currentDay, totalDays }) => {
  const daysRemaining = totalDays - currentDay;
  const progressPercentage = (currentDay / totalDays) * 100;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Ciclo Atual</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-boticario-purple">{currentDay}</div>
          <p className="text-gray-600 text-sm">Dia Atual</p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-boticario-purple">{daysRemaining}</div>
          <p className="text-gray-600 text-sm">Dias Restantes</p>
        </div>
      </div>
      <div className="mt-4 bg-gray-200 rounded-full h-2">
        <div 
          className="bg-boticario-purple h-2 rounded-full transition-all duration-700 ease-in-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <p className="text-center text-sm text-gray-600 mt-2">
        {Math.round(progressPercentage)}% do ciclo concluído
      </p>
    </div>
  );
};