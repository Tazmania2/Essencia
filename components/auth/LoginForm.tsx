'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { LoginCredentials } from '../../types';

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  isLoading: boolean;
}

interface FormData {
  username: string;
  password: string;
}

export function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<FormData>({
    mode: 'onChange'
  });

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit({
      username: data.username.trim(),
      password: data.password
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Username Field */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
          Usuário
        </label>
        <div className="relative">
          <input
            {...register('username', {
              required: 'Usuário é obrigatório',
              minLength: {
                value: 3,
                message: 'Usuário deve ter pelo menos 3 caracteres'
              }
            })}
            type="text"
            id="username"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors ${
              errors.username ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Digite seu usuário"
            disabled={isLoading}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Senha
        </label>
        <div className="relative">
          <input
            {...register('password', {
              required: 'Senha é obrigatória',
              minLength: {
                value: 6,
                message: 'Senha deve ter pelo menos 6 caracteres'
              }
            })}
            type={showPassword ? 'text' : 'password'}
            id="password"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors pr-12 ${
              errors.password ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Digite sua senha"
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? (
              <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !isValid}
        className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 ${
          isLoading || !isValid
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 focus:ring-4 focus:ring-pink-200'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Entrando...
          </div>
        ) : (
          'Entrar'
        )}
      </button>
    </form>
  );
}