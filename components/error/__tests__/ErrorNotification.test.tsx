import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorNotification } from '../ErrorNotification';
import { ApiError, ErrorType } from '../../../types';

// Mock the error handler service
jest.mock('../../../services/error-handler.service', () => ({
  errorHandlerService: {
    logError: jest.fn(),
    getUserFriendlyMessage: jest.fn((error) => {
      if (error instanceof ApiError) {
        switch (error.type) {
          case ErrorType.AUTHENTICATION_ERROR:
            return 'Erro de autenticação. Por favor, faça login novamente.';
          case ErrorType.NETWORK_ERROR:
            return 'Problema de conexão. Verifique sua internet e tente novamente.';
          default:
            return 'Ocorreu um erro inesperado. Tente novamente.';
        }
      }
      return 'Ocorreu um erro inesperado. Tente novamente.';
    }),
    isRecoverableError: jest.fn((error) => {
      if (error instanceof ApiError) {
        return error.type === ErrorType.NETWORK_ERROR || error.type === ErrorType.FUNIFIER_API_ERROR;
      }
      return true;
    }),
  },
}));

describe('ErrorNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not render when error is null', () => {
    render(<ErrorNotification error={null} />);
    
    expect(screen.queryByText(/Erro/)).not.toBeInTheDocument();
  });

  it('renders authentication error correctly', () => {
    const authError = new ApiError({
      type: ErrorType.AUTHENTICATION_ERROR,
      message: 'Invalid credentials',
      timestamp: new Date()
    });

    render(<ErrorNotification error={authError} />);

    expect(screen.getByText('Erro de Autenticação')).toBeInTheDocument();
    expect(screen.getByText('Erro de autenticação. Por favor, faça login novamente.')).toBeInTheDocument();
  });

  it('renders network error correctly', () => {
    const networkError = new ApiError({
      type: ErrorType.NETWORK_ERROR,
      message: 'Connection failed',
      timestamp: new Date()
    });

    render(<ErrorNotification error={networkError} />);

    expect(screen.getByText('Erro de Conexão')).toBeInTheDocument();
    expect(screen.getByText('Problema de conexão. Verifique sua internet e tente novamente.')).toBeInTheDocument();
    expect(screen.getByText('Você pode tentar novamente.')).toBeInTheDocument();
  });

  it('renders generic error correctly', () => {
    const genericError = new Error('Generic error');

    render(<ErrorNotification error={genericError} />);

    expect(screen.getByText('Erro de Processamento')).toBeInTheDocument();
    expect(screen.getByText('Ocorreu um erro inesperado. Tente novamente.')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = jest.fn();
    const error = new Error('Test error');

    render(<ErrorNotification error={error} onDismiss={onDismiss} />);

    const dismissButton = screen.getByRole('button');
    fireEvent.click(dismissButton);

    // Wait for animation
    jest.advanceTimersByTime(300);

    expect(onDismiss).toHaveBeenCalled();
  });

  it('auto-hides after specified delay', async () => {
    const onDismiss = jest.fn();
    const error = new Error('Test error');

    render(<ErrorNotification error={error} onDismiss={onDismiss} autoHideDelay={1000} />);

    expect(screen.getByText('Erro de Processamento')).toBeInTheDocument();

    // Fast-forward time
    jest.advanceTimersByTime(1000);

    // Wait for animation
    jest.advanceTimersByTime(300);

    expect(onDismiss).toHaveBeenCalled();
  });

  it('does not auto-hide when autoHide is false', () => {
    const onDismiss = jest.fn();
    const error = new Error('Test error');

    render(<ErrorNotification error={error} onDismiss={onDismiss} autoHide={false} />);

    expect(screen.getByText('Erro de Processamento')).toBeInTheDocument();

    // Fast-forward time
    jest.advanceTimersByTime(10000);

    expect(onDismiss).not.toHaveBeenCalled();
    expect(screen.getByText('Erro de Processamento')).toBeInTheDocument();
  });

  it('shows debug info in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const apiError = new ApiError({
      type: ErrorType.VALIDATION_ERROR,
      message: 'Validation failed',
      details: { field: 'username' },
      timestamp: new Date()
    });

    render(<ErrorNotification error={apiError} />);

    expect(screen.getByText('Debug Info')).toBeInTheDocument();
    
    // Click to expand debug info
    fireEvent.click(screen.getByText('Debug Info'));
    
    expect(screen.getByText('Type:')).toBeInTheDocument();
    expect(screen.getByText('VALIDATION_ERROR')).toBeInTheDocument();
    expect(screen.getByText('Message:')).toBeInTheDocument();
    expect(screen.getByText('Validation failed')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('hides debug info in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const apiError = new ApiError({
      type: ErrorType.VALIDATION_ERROR,
      message: 'Validation failed',
      timestamp: new Date()
    });

    render(<ErrorNotification error={apiError} />);

    expect(screen.queryByText('Debug Info')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('shows different colors for different error types', () => {
    const { rerender } = render(
      <ErrorNotification error={new ApiError({
        type: ErrorType.AUTHENTICATION_ERROR,
        message: 'Auth error',
        timestamp: new Date()
      })} />
    );

    let container = screen.getByText('Erro de Autenticação').closest('.bg-yellow-50');
    expect(container).toHaveClass('bg-yellow-50', 'border-yellow-200');

    rerender(
      <ErrorNotification error={new ApiError({
        type: ErrorType.NETWORK_ERROR,
        message: 'Network error',
        timestamp: new Date()
      })} />
    );

    container = screen.getByText('Erro de Conexão').closest('.bg-orange-50');
    expect(container).toHaveClass('bg-orange-50', 'border-orange-200');

    rerender(
      <ErrorNotification error={new ApiError({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Validation error',
        timestamp: new Date()
      })} />
    );

    container = screen.getByText('Dados Inválidos').closest('.bg-blue-50');
    expect(container).toHaveClass('bg-blue-50', 'border-blue-200');
  });

  it('logs error when displayed', () => {
    const { errorHandlerService } = require('../../../services/error-handler.service');
    const error = new Error('Test error');

    render(<ErrorNotification error={error} />);

    expect(errorHandlerService.logError).toHaveBeenCalledWith(error, 'notification');
  });
});