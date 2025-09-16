'use client';

import { useState } from 'react';
import { TeamType } from '../../types';

export interface TeamOption {
  teamType: TeamType | 'ADMIN';
  displayName: string;
  teamId: string;
}

interface TeamSelectionModalProps {
  availableTeams: TeamOption[];
  onTeamSelect: (selection: TeamType | 'ADMIN') => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function TeamSelectionModal({
  availableTeams,
  onTeamSelect,
  onClose,
  isLoading = false
}: TeamSelectionModalProps) {
  const [selectedTeam, setSelectedTeam] = useState<TeamType | 'ADMIN' | null>(null);

  const handleTeamSelection = (teamType: TeamType | 'ADMIN') => {
    setSelectedTeam(teamType);
  };

  const handleConfirm = () => {
    if (selectedTeam) {
      onTeamSelect(selectedTeam);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="team-selection-title"
        aria-describedby="team-selection-description"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="team-selection-title" className="text-xl font-bold text-[#880E4F] mb-1">
                Selecionar Equipe
              </h2>
              <p id="team-selection-description" className="text-sm text-gray-600">
                Você tem acesso a múltiplas equipes. Escolha uma para continuar.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              disabled={isLoading}
              aria-label="Fechar modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Team Options */}
        <div className="p-6 space-y-3">
          {availableTeams.map((team) => (
            <button
              key={team.teamType}
              onClick={() => handleTeamSelection(team.teamType)}
              disabled={isLoading}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                selectedTeam === team.teamType
                  ? 'border-[#E91E63] bg-pink-50 shadow-md'
                  : 'border-gray-200 hover:border-[#9C27B0] hover:bg-purple-50'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedTeam === team.teamType
                      ? 'border-[#E91E63] bg-[#E91E63]'
                      : 'border-gray-300'
                  }`}>
                    {selectedTeam === team.teamType && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {team.displayName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {team.teamType === 'ADMIN' ? 'Acesso administrativo' : `Equipe ${team.displayName}`}
                    </p>
                  </div>
                </div>
                <div className="text-[#9C27B0]">
                  {team.teamType === 'ADMIN' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !selectedTeam}
            className={`px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
              isLoading || !selectedTeam
                ? 'bg-gray-300 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-[#E91E63] to-[#9C27B0] hover:from-[#C2185B] hover:to-[#7B1FA2] focus:ring-4 focus:ring-pink-200 shadow-lg hover:shadow-xl'
            }`}
            style={!isLoading && selectedTeam ? { boxShadow: '0 4px 15px rgba(233, 30, 99, 0.3)' } : {}}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Carregando...
              </div>
            ) : (
              'Continuar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}