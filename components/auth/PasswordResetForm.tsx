'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface PasswordResetFormProps {
  onRequestReset: (userId: string) => Promise<void>;
  onConfirmReset: (userId: string, code: string, newPassword: string) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

interface RequestFormData {
  userId: string;
}

interface ConfirmFormData {
  code: string;
  newPassword: string;
  confirmPassword: string;
}

export function PasswordResetForm({ 
  onRequestReset, 
  onConfirmReset, 
  onBack, 
  isLoading 
}: PasswordResetFormProps) {
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [userId, setUserId] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const requestForm = useForm<RequestFormData>({
    mode: 'onChange'
  });

  const confirmForm = useForm<ConfirmFormData>({
    mode: 'onChange'
  });

  const handleRequestSubmit = async (data: RequestFormData) => {
    try {
      await onRequestReset(data.userId);
      setUserId(data.userId);
      setStep('confirm');
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleConfirmSubmit = async (data: ConfirmFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      confirmForm.setError('confirmPassword', {
        type: 'manual',
        message: 'As senhas não coincidem'
      });
      return;
    }

    try {
      await onConfirmReset(userId, data.code, data.newPassword);
      // Success - parent component will handle navigation
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  if (step === 'request') {
    return (
      <form onSubmit={requestForm.handleSubmit(handleRequestSubmit)} className="space-y-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#880E4F] mb-2">
            Recuperar Senha
          </h2>
          <p className="text-[#9C27B0]">
            Digite seu usuário para receber o código de recuperação por email
          </p>
        </div>

        {/* User ID Field */}
        <div>
          <label htmlFor="userId" className="block text-sm font-semibold text-[#880E4F] mb-3">
            Usuário
          </label>
          <div className="relative">
            <input
              {...requestForm.register('userId', {
                required: 'Usuário é obrigatório',
                minLength: {
                  value: 3,
                  message: 'Usuário deve ter pelo menos 3 caracteres'
                }
              })}
              type="text"
              id="userId"
              className={`w-full px-4 py-3 pl-12 border-2 rounded-xl focus:ring-2 focus:ring-[#E91E63] focus:border-[#E91E63] transition-all duration-200 font-medium ${
                requestForm.formState.errors.userId 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 hover:border-[#9C27B0] focus:bg-white'
              }`}
              placeholder="Digite seu usuário"
              disabled={isLoading}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <svg className={`w-5 h-5 ${requestForm.formState.errors.userId ? 'text-red-400' : 'text-[#9C27B0]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          {requestForm.formState.errors.userId && (
            <p className="mt-2 text-sm text-red-600 font-medium flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {requestForm.formState.errors.userId.message}
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            type="submit"
            disabled={isLoading || !requestForm.formState.isValid}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform ${
              isLoading || !requestForm.formState.isValid
                ? 'bg-gray-300 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-[#E91E63] to-[#9C27B0] hover:from-[#C2185B] hover:to-[#7B1FA2] focus:ring-4 focus:ring-pink-200 hover:scale-105 shadow-lg hover:shadow-xl'
            }`}
            style={!isLoading && requestForm.formState.isValid ? { boxShadow: '0 4px 15px rgba(233, 30, 99, 0.3)' } : {}}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Enviar Código
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="w-full py-3 px-4 border-2 border-[#9C27B0] text-[#9C27B0] rounded-xl font-semibold hover:bg-[#9C27B0] hover:text-white transition-all duration-200 disabled:opacity-50"
          >
            Voltar ao Login
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={confirmForm.handleSubmit(handleConfirmSubmit)} className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#880E4F] mb-2">
          Nova Senha
        </h2>
        <p className="text-[#9C27B0]">
          Digite o código recebido por email e sua nova senha
        </p>
      </div>

      {/* Code Field */}
      <div>
        <label htmlFor="code" className="block text-sm font-semibold text-[#880E4F] mb-3">
          Código de Verificação
        </label>
        <div className="relative">
          <input
            {...confirmForm.register('code', {
              required: 'Código é obrigatório',
              minLength: {
                value: 4,
                message: 'Código deve ter pelo menos 4 caracteres'
              }
            })}
            type="text"
            id="code"
            className={`w-full px-4 py-3 pl-12 border-2 rounded-xl focus:ring-2 focus:ring-[#E91E63] focus:border-[#E91E63] transition-all duration-200 font-medium ${
              confirmForm.formState.errors.code 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-200 hover:border-[#9C27B0] focus:bg-white'
            }`}
            placeholder="Digite o código recebido"
            disabled={isLoading}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <svg className={`w-5 h-5 ${confirmForm.formState.errors.code ? 'text-red-400' : 'text-[#9C27B0]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        {confirmForm.formState.errors.code && (
          <p className="mt-2 text-sm text-red-600 font-medium flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {confirmForm.formState.errors.code.message}
          </p>
        )}
      </div>

      {/* New Password Field */}
      <div>
        <label htmlFor="newPassword" className="block text-sm font-semibold text-[#880E4F] mb-3">
          Nova Senha
        </label>
        <div className="relative">
          <input
            {...confirmForm.register('newPassword', {
              required: 'Nova senha é obrigatória',
              minLength: {
                value: 6,
                message: 'Senha deve ter pelo menos 6 caracteres'
              }
            })}
            type={showPassword ? 'text' : 'password'}
            id="newPassword"
            className={`w-full px-4 py-3 pl-12 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-[#E91E63] focus:border-[#E91E63] transition-all duration-200 font-medium ${
              confirmForm.formState.errors.newPassword 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-200 hover:border-[#9C27B0] focus:bg-white'
            }`}
            placeholder="Digite sua nova senha"
            disabled={isLoading}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <svg className={`w-5 h-5 ${confirmForm.formState.errors.newPassword ? 'text-red-400' : 'text-[#9C27B0]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? (
              <svg className={`w-5 h-5 transition-colors ${confirmForm.formState.errors.newPassword ? 'text-red-400' : 'text-[#9C27B0] hover:text-[#E91E63]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className={`w-5 h-5 transition-colors ${confirmForm.formState.errors.newPassword ? 'text-red-400' : 'text-[#9C27B0] hover:text-[#E91E63]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {confirmForm.formState.errors.newPassword && (
          <p className="mt-2 text-sm text-red-600 font-medium flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {confirmForm.formState.errors.newPassword.message}
          </p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#880E4F] mb-3">
          Confirmar Nova Senha
        </label>
        <div className="relative">
          <input
            {...confirmForm.register('confirmPassword', {
              required: 'Confirmação de senha é obrigatória'
            })}
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            className={`w-full px-4 py-3 pl-12 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-[#E91E63] focus:border-[#E91E63] transition-all duration-200 font-medium ${
              confirmForm.formState.errors.confirmPassword 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-200 hover:border-[#9C27B0] focus:bg-white'
            }`}
            placeholder="Confirme sua nova senha"
            disabled={isLoading}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <svg className={`w-5 h-5 ${confirmForm.formState.errors.confirmPassword ? 'text-red-400' : 'text-[#9C27B0]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isLoading}
          >
            {showConfirmPassword ? (
              <svg className={`w-5 h-5 transition-colors ${confirmForm.formState.errors.confirmPassword ? 'text-red-400' : 'text-[#9C27B0] hover:text-[#E91E63]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className={`w-5 h-5 transition-colors ${confirmForm.formState.errors.confirmPassword ? 'text-red-400' : 'text-[#9C27B0] hover:text-[#E91E63]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {confirmForm.formState.errors.confirmPassword && (
          <p className="mt-2 text-sm text-red-600 font-medium flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {confirmForm.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Buttons */}
      <div className="space-y-3">
        <button
          type="submit"
          disabled={isLoading || !confirmForm.formState.isValid}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform ${
            isLoading || !confirmForm.formState.isValid
              ? 'bg-gray-300 cursor-not-allowed opacity-60'
              : 'bg-gradient-to-r from-[#E91E63] to-[#9C27B0] hover:from-[#C2185B] hover:to-[#7B1FA2] focus:ring-4 focus:ring-pink-200 hover:scale-105 shadow-lg hover:shadow-xl'
          }`}
          style={!isLoading && confirmForm.formState.isValid ? { boxShadow: '0 4px 15px rgba(233, 30, 99, 0.3)' } : {}}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Alterando...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Alterar Senha
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => setStep('request')}
          disabled={isLoading}
          className="w-full py-3 px-4 border-2 border-[#9C27B0] text-[#9C27B0] rounded-xl font-semibold hover:bg-[#9C27B0] hover:text-white transition-all duration-200 disabled:opacity-50"
        >
          Voltar
        </button>
      </div>
    </form>
  );
}