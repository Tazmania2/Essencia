'use client';

import React from 'react';

// Mock notification system - replace with actual implementation
export const useNotifications = () => {
  return {
    showSuccess: (title: string, message: string) => {
      console.log(`SUCCESS: ${title} - ${message}`);
    },
    showError: (title: string, message: string) => {
      console.log(`ERROR: ${title} - ${message}`);
    },
    showWarning: (title: string, message: string) => {
      console.log(`WARNING: ${title} - ${message}`);
    },
    showInfo: (title: string, message: string) => {
      console.log(`INFO: ${title} - ${message}`);
    }
  };
};

export const useNotificationHelpers = () => {
  return {
    notifySuccess: (title: string, message?: string) => {
      console.log(`SUCCESS: ${title}${message ? ` - ${message}` : ''}`);
    },
    notifyError: (title: string, message?: string) => {
      console.log(`ERROR: ${title}${message ? ` - ${message}` : ''}`);
    },
    notifyWarning: (message: string) => {
      console.log(`WARNING: ${message}`);
    },
    notifyInfo: (title: string, message?: string) => {
      console.log(`INFO: ${title}${message ? ` - ${message}` : ''}`);
    },
    notifyConfigurationSaved: () => {
      console.log('SUCCESS: Configuração salva com sucesso!');
    },
    notifyConfigurationError: (error: string) => {
      console.log(`ERROR: Erro ao salvar configuração - ${error}`);
    },
    notifyHistoryLoaded: (count: number) => {
      console.log(`SUCCESS: ${count} ciclos históricos carregados`);
    },
    notifyNoHistoryData: () => {
      console.log('INFO: Nenhum dado histórico encontrado');
    }
  };
};