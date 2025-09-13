'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ApiError, ErrorType } from '../../types';
import { errorHandlerService } from '../../services/error-handler.service';

interface Props {
  error: Error | ApiError | null;
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export const ErrorNotification: React.FC<Props> = ({
  error,
  onDismiss,
  autoHide = true,
  autoHideDelay = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 300);
  }, [onDismiss]);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      setIsAnimating(true);

      // Log the error
      errorHandlerService.logError(error, 'notification');

      // Auto hide after delay
      if (autoHide) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoHideDelay);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
      setIsAnimating(false);
    }
  }, [error, autoHide, autoHideDelay, handleDismiss]);

  const getErrorIcon = () => {
    if (!error) return null;

    const errorType = error instanceof ApiError ? error.type : ErrorType.DATA_PROCESSING_ERROR;

    switch (errorType) {
      case ErrorType.AUTHENTICATION_ERROR:
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case ErrorType.NETWORK_ERROR:
        return (
          <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getErrorColor = () => {
    if (!error) return 'bg-red-50 border-red-200';

    const errorType = error instanceof ApiError ? error.type : ErrorType.DATA_PROCESSING_ERROR;

    switch (errorType) {
      case ErrorType.AUTHENTICATION_ERROR:
        return 'bg-yellow-50 border-yellow-200';
      case ErrorType.NETWORK_ERROR:
        return 'bg-orange-50 border-orange-200';
      case ErrorType.VALIDATION_ERROR:
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-red-50 border-red-200';
    }
  };

  const getErrorTitle = () => {
    if (!error) return 'Erro';

    const errorType = error instanceof ApiError ? error.type : ErrorType.DATA_PROCESSING_ERROR;

    switch (errorType) {
      case ErrorType.AUTHENTICATION_ERROR:
        return 'Erro de Autenticação';
      case ErrorType.NETWORK_ERROR:
        return 'Erro de Conexão';
      case ErrorType.FUNIFIER_API_ERROR:
        return 'Erro do Servidor';
      case ErrorType.VALIDATION_ERROR:
        return 'Dados Inválidos';
      case ErrorType.DATA_PROCESSING_ERROR:
        return 'Erro de Processamento';
      default:
        return 'Erro';
    }
  };

  if (!isVisible || !error) {
    return null;
  }

  const isRecoverable = errorHandlerService.isRecoverableError(error);
  const userMessage = errorHandlerService.getUserFriendlyMessage(error);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div
        className={`
          ${getErrorColor()}
          border rounded-lg shadow-lg p-4 transition-all duration-300 transform
          ${isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        `}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getErrorIcon()}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              {getErrorTitle()}
            </h3>
            <p className="mt-1 text-sm text-gray-700">
              {userMessage}
            </p>
            {isRecoverable && (
              <p className="mt-2 text-xs text-gray-600">
                Você pode tentar novamente.
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                Debug Info
              </summary>
              <div className="mt-2 p-2 bg-gray-100 rounded text-gray-700 font-mono break-all">
                <div><strong>Type:</strong> {error instanceof ApiError ? error.type : 'Unknown'}</div>
                <div><strong>Message:</strong> {error.message}</div>
                {error instanceof ApiError && error.details && (
                  <div><strong>Details:</strong> {JSON.stringify(error.details, null, 2)}</div>
                )}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};