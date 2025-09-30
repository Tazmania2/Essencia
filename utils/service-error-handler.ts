/**
 * Comprehensive error handling utilities for new services
 * Provides consistent error handling patterns across history and configuration services
 */

import { ApiError } from '../types';

export interface ServiceErrorContext {
  service: string;
  method: string;
  playerId?: string;
  configId?: string;
  cycleNumber?: number;
  additionalData?: Record<string, any>;
}

export interface ServiceErrorResult {
  error: ApiError;
  shouldRetry: boolean;
  userMessage: string;
  logData: Record<string, any>;
}

export class ServiceErrorHandler {
  // Implementation will be added later
} 