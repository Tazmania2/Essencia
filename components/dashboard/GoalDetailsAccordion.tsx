'use client';

import React, { useState } from 'react';

interface GoalDetail {
  title: string;
  items: string[];
  bgColor: string;
  textColor: string;
}

interface GoalDetailsAccordionProps {
  goals: GoalDetail[];
}

export const GoalDetailsAccordion: React.FC<GoalDetailsAccordionProps> = ({ goals }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

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
        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      } overflow-hidden`}>
        <div className="p-6 pt-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {goals.map((goal, index) => (
              <div key={index} className={`${goal.bgColor} rounded-lg p-4`}>
                <h4 className={`font-semibold ${goal.textColor} mb-2`}>{goal.title}</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {goal.items.map((item, itemIndex) => (
                    <li key={itemIndex}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};