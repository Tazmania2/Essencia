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

export class AdminErrorBoundary extends Component<Props, State> {
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
    console.error('Admin panel error:', error, errorInfo);
    
    // Log admin-specific error details
    const adminErrorData = {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorType: error instanceof ApiError ? error.type : 'UNKNOWN',
      timestamp: new Date().toISOString(),
      context: 'admin',
      userAgent: navigator.userAgent,
    };

    console.error('Admin error data:', adminErrorData);
  }

  private getErrorMessage = (): string => {
    const { error, errorType } = this.state;

    if (!error) return 'Erro desconhecido';

    switch (errorType) {
      case ErrorType.AUTHENTICATION_ERROR:
        return 'Sua sessão administrativa expirou. Faça login novamente para continuar.';
      case ErrorType.FUNIFIER_API_ERROR:
        return 'Erro na comunicação com a API Funifier. Verifique a conectividade e tente novamente.';
      case ErrorType.NETWORK_ERROR:
        return 'Problema de rede detectado. Verifique sua conexão com a internet.';
      case ErrorType.DATA_PROCESSING_ERROR:
        return 'Erro ao processar dados administrativos. Verifique os dados enviados.';
      case ErrorType.VALIDATION_ERROR:
        return 'Dados inválidos detectados. Verifique os campos obrigatórios.';
      default:
        return 'Erro inesperado no painel administrativo. Tente recarregar a página.';
    }
  };

  private getErrorActions = (): ReactNode => {
    const { errorType } = this.state;
    const isAuthError = errorType === ErrorType.AUTHENTICATION_ERROR;

    if (isAuthError) {
      return (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.location.href = '/login'}
            className="flex-1 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors font-medium"
          >
            Fazer Login
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => this.setState({ hasError: false, error: undefined, errorType: undefined })}
          className="flex-1 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors font-medium"
        >
          Tentar Novamente
        </button>
        <button
          onClick={() => window.location.reload()}
          className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
        >
          Recarregar Página
        </button>
        <button
          onClick={() => window.location.href = '/admin'}
          className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          Voltar ao Início
        </button>
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      const { errorType } = this.state;
      const isAuthError = errorType === ErrorType.AUTHENTICATION_ERROR;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
          <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {isAuthError ? 'Acesso Negado' : 'Erro no Painel Administrativo'}
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                {this.getErrorMessage()}
              </p>
            </div>

            {this.getErrorActions()}

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Informações de Debug:</h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-gray-600">Tipo do Erro:</span>
                    <span className="ml-2 text-sm font-mono bg-gray-200 px-2 py-1 rounded">
                      {this.state.errorType || 'UNKNOWN'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Mensagem:</span>
                    <p className="mt-1 text-sm text-gray-700 break-words font-mono bg-gray-200 p-2 rounded">
                      {this.state.error.message}
                    </p>
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <span className="font-medium text-gray-600">Stack Trace:</span>
                      <pre className="mt-1 text-xs text-gray-700 bg-gray-200 p-2 rounded overflow-x-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}