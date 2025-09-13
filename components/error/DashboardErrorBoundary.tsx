'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ApiError, ErrorType } from '../../types';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorType?: ErrorType;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorType = error instanceof ApiError ? error.type : ErrorType.DATA_PROCESSING_ERROR;
    
    return {
      hasError: true,
      error,
      errorType,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dashboard error:', error, errorInfo);
    
    // Log dashboard-specific error details
    const dashboardErrorData = {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorType: error instanceof ApiError ? error.type : 'UNKNOWN',
      timestamp: new Date().toISOString(),
      context: 'dashboard',
    };

    console.error('Dashboard error data:', dashboardErrorData);
  }

  private getErrorMessage = (): string => {
    const { error, errorType } = this.state;

    if (!error) return 'Erro desconhecido';

    switch (errorType) {
      case ErrorType.AUTHENTICATION_ERROR:
        return 'Sua sessão expirou. Por favor, faça login novamente.';
      case ErrorType.FUNIFIER_API_ERROR:
        return 'Erro ao conectar com o servidor. Tente novamente em alguns instantes.';
      case ErrorType.NETWORK_ERROR:
        return 'Problema de conexão. Verifique sua internet e tente novamente.';
      case ErrorType.DATA_PROCESSING_ERROR:
        return 'Erro ao processar seus dados. Nossa equipe foi notificada.';
      case ErrorType.VALIDATION_ERROR:
        return 'Dados inválidos detectados. Tente recarregar a página.';
      default:
        return 'Ocorreu um erro inesperado. Tente recarregar a página.';
    }
  };

  private getErrorIcon = (): ReactNode => {
    const { errorType } = this.state;

    switch (errorType) {
      case ErrorType.AUTHENTICATION_ERROR:
        return (
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case ErrorType.NETWORK_ERROR:
        return (
          <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
    }
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorType: undefined });
  };

  private handleGoToLogin = () => {
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      const { errorType } = this.state;
      const isAuthError = errorType === ErrorType.AUTHENTICATION_ERROR;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
          <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {this.getErrorIcon()}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {isAuthError ? 'Sessão Expirada' : 'Erro no Dashboard'}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {this.getErrorMessage()}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {isAuthError ? (
                <button
                  onClick={this.handleGoToLogin}
                  className="flex-1 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors font-medium"
                >
                  Fazer Login
                </button>
              ) : (
                <>
                  <button
                    onClick={this.handleRetry}
                    className="flex-1 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors font-medium"
                  >
                    Tentar Novamente
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    Recarregar
                  </button>
                </>
              )}
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
                <p className="font-semibold text-gray-700 mb-2">Debug Info:</p>
                <p className="text-sm text-gray-600 break-words font-mono">
                  {this.state.error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}