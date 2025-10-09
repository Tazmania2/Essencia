import { funifierApiService, SchedulerExecutionResult } from './funifier-api.service';
import { ApiError, ErrorType } from '../types';

export interface CycleChangeStep {
  id: string;
  name: string;
  description: string;
  schedulerId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  result?: SchedulerExecutionResult;
  validationResult?: {
    success: boolean;
    message: string;
    details?: any;
  };
}

export interface CycleChangeProgress {
  currentStep: number;
  totalSteps: number;
  steps: CycleChangeStep[];
  isRunning: boolean;
  startTime?: Date;
  endTime?: Date;
  overallStatus: 'not_started' | 'running' | 'completed' | 'failed' | 'cancelled';
}

export class CycleChangeService {
  private static instance: CycleChangeService;
  private currentProgress: CycleChangeProgress | null = null;
  private progressCallbacks: ((progress: CycleChangeProgress) => void)[] = [];

  // Scheduler IDs in execution order
  private readonly CYCLE_SCHEDULERS = [
    {
      id: '68e7f93a06f77c5c2aad34f1',
      name: 'Ciclo de transição de pontos Desbloqueados para Carteira de pontos da Temporada',
      description: 'Transfere pontos desbloqueados para a carteira da temporada',
      validation: 'checkPointsCleared'
    },
    {
      id: '68e7f8be06f77c5c2aad34d5',
      name: 'Ciclo de perda de pontos bloqueados ao fim do ciclo',
      description: 'Remove pontos bloqueados dos jogadores',
      validation: 'checkLockedPointsCleared'
    },
    {
      id: '68de22de06f77c5c2aa9d2b6',
      name: 'Resetar action_log em Troca de Ciclo',
      description: 'Reseta o log de ações e progresso de desafios',
      validation: 'checkChallengeProgressCleared'
    },
    {
      id: '68e803cf06f77c5c2aad37bc',
      name: 'Limpar itens - fim de ciclo',
      description: 'Remove itens virtuais, mantendo apenas o item Bloqueado (E6F0MJ3)',
      validation: 'checkVirtualGoodsCleared'
    }
  ];

  private constructor() {}

  public static getInstance(): CycleChangeService {
    if (!CycleChangeService.instance) {
      CycleChangeService.instance = new CycleChangeService();
    }
    return CycleChangeService.instance;
  }

  /**
   * Subscribe to progress updates
   */
  public onProgressUpdate(callback: (progress: CycleChangeProgress) => void): () => void {
    this.progressCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.progressCallbacks.indexOf(callback);
      if (index > -1) {
        this.progressCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all subscribers of progress updates
   */
  private notifyProgressUpdate(): void {
    if (this.currentProgress) {
      this.progressCallbacks.forEach(callback => {
        try {
          callback(this.currentProgress!);
        } catch (error) {
          console.error('Error in progress callback:', error);
        }
      });
    }
  }

  /**
   * Get current cycle change progress
   */
  public getCurrentProgress(): CycleChangeProgress | null {
    return this.currentProgress;
  }

  /**
   * Initialize cycle change process
   */
  public initializeCycleChange(): CycleChangeProgress {
    const steps: CycleChangeStep[] = this.CYCLE_SCHEDULERS.map((scheduler, index) => ({
      id: `step_${index + 1}`,
      name: scheduler.name,
      description: scheduler.description,
      schedulerId: scheduler.id,
      status: 'pending'
    }));

    this.currentProgress = {
      currentStep: 0,
      totalSteps: steps.length,
      steps,
      isRunning: false,
      overallStatus: 'not_started'
    };

    this.notifyProgressUpdate();
    return this.currentProgress;
  }

  /**
   * Start the cycle change process
   */
  public async startCycleChange(): Promise<void> {
    if (!this.currentProgress) {
      throw new ApiError({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Cycle change not initialized. Call initializeCycleChange() first.',
        timestamp: new Date()
      });
    }

    if (this.currentProgress.isRunning) {
      throw new ApiError({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Cycle change is already running',
        timestamp: new Date()
      });
    }

    this.currentProgress.isRunning = true;
    this.currentProgress.overallStatus = 'running';
    this.currentProgress.startTime = new Date();
    this.notifyProgressUpdate();

    try {
      for (let i = 0; i < this.currentProgress.steps.length; i++) {
        this.currentProgress.currentStep = i;
        await this.executeStep(i);
        
        // If step failed, stop the process
        if (this.currentProgress.steps[i].status === 'failed') {
          this.currentProgress.overallStatus = 'failed';
          break;
        }
      }

      // If all steps completed successfully
      if (this.currentProgress.overallStatus === 'running') {
        this.currentProgress.overallStatus = 'completed';
      }

    } catch (error) {
      console.error('Cycle change process failed:', error);
      this.currentProgress.overallStatus = 'failed';
      
      // Mark current step as failed if not already marked
      const currentStep = this.currentProgress.steps[this.currentProgress.currentStep];
      if (currentStep && currentStep.status === 'running') {
        currentStep.status = 'failed';
        currentStep.endTime = new Date();
      }
    } finally {
      this.currentProgress.isRunning = false;
      this.currentProgress.endTime = new Date();
      this.notifyProgressUpdate();
    }
  }

  /**
   * Execute a single step in the cycle change process
   */
  private async executeStep(stepIndex: number): Promise<void> {
    const step = this.currentProgress!.steps[stepIndex];
    const schedulerConfig = this.CYCLE_SCHEDULERS[stepIndex];

    step.status = 'running';
    step.startTime = new Date();
    this.notifyProgressUpdate();

    try {
      // Execute the scheduler
      console.log(`Executing scheduler: ${step.name} (${step.schedulerId})`);
      const result = await funifierApiService.executeScheduler(step.schedulerId);
      
      step.result = result;
      
      if (!result.success) {
        step.status = 'failed';
        step.endTime = new Date();
        this.notifyProgressUpdate();
        return;
      }

      // Wait a moment for the scheduler to complete its work
      await this.delay(5000); // 5 seconds

      // Validate the step completion
      const validationResult = await this.validateStepCompletion(schedulerConfig.validation);
      step.validationResult = validationResult;

      if (validationResult.success) {
        step.status = 'completed';
      } else {
        step.status = 'failed';
      }

    } catch (error) {
      console.error(`Step ${stepIndex + 1} failed:`, error);
      step.status = 'failed';
      step.result = {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now()
      };
    } finally {
      step.endTime = new Date();
      this.notifyProgressUpdate();
    }
  }

  /**
   * Validate step completion based on validation type
   */
  private async validateStepCompletion(validationType: string): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      switch (validationType) {
        case 'checkPointsCleared':
          const pointsResult = await funifierApiService.checkAllPlayersPointsCleared();
          return {
            success: pointsResult.allCleared,
            message: pointsResult.allCleared 
              ? `Todos os pontos foram limpos (${pointsResult.totalPlayersChecked} jogadores verificados)`
              : `${pointsResult.playersWithPoints.length} jogadores ainda têm pontos`,
            details: pointsResult
          };

        case 'checkLockedPointsCleared':
          const lockedPointsResult = await funifierApiService.checkAllPlayersLockedPointsCleared();
          return {
            success: lockedPointsResult.allCleared,
            message: lockedPointsResult.allCleared 
              ? `Todos os pontos bloqueados foram limpos (${lockedPointsResult.totalPlayersChecked} jogadores verificados)`
              : `${lockedPointsResult.playersWithLockedPoints.length} jogadores ainda têm pontos bloqueados`,
            details: lockedPointsResult
          };

        case 'checkChallengeProgressCleared':
          const challengeResult = await funifierApiService.checkAllPlayersChallengeProgressCleared();
          return {
            success: challengeResult.allCleared,
            message: challengeResult.allCleared 
              ? `Todo o progresso de desafios foi limpo (${challengeResult.totalPlayersChecked} jogadores verificados)`
              : `${challengeResult.playersWithProgress.length} jogadores ainda têm progresso de desafios`,
            details: challengeResult
          };

        case 'checkVirtualGoodsCleared':
          const virtualGoodsResult = await funifierApiService.checkAllPlayersVirtualGoodsCleared();
          return {
            success: virtualGoodsResult.allCleared,
            message: virtualGoodsResult.allCleared 
              ? `Todos os itens virtuais foram limpos corretamente (${virtualGoodsResult.totalPlayersChecked} jogadores verificados)`
              : `${virtualGoodsResult.playersWithExtraItems.length} jogadores têm itens incorretos`,
            details: virtualGoodsResult
          };

        default:
          return {
            success: false,
            message: `Tipo de validação desconhecido: ${validationType}`
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Erro na validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        details: { error }
      };
    }
  }

  /**
   * Cancel the cycle change process
   */
  public cancelCycleChange(): void {
    if (this.currentProgress && this.currentProgress.isRunning) {
      this.currentProgress.isRunning = false;
      this.currentProgress.overallStatus = 'cancelled';
      this.currentProgress.endTime = new Date();
      
      // Mark current running step as cancelled
      const currentStep = this.currentProgress.steps[this.currentProgress.currentStep];
      if (currentStep && currentStep.status === 'running') {
        currentStep.status = 'failed';
        currentStep.endTime = new Date();
        if (!currentStep.result) {
          currentStep.result = {
            success: false,
            message: 'Processo cancelado pelo usuário',
            executionTime: Date.now()
          };
        }
      }
      
      this.notifyProgressUpdate();
    }
  }

  /**
   * Reset the cycle change process
   */
  public resetCycleChange(): void {
    this.currentProgress = null;
    this.notifyProgressUpdate();
  }

  /**
   * Get scheduler logs for a specific step
   */
  public async getStepLogs(stepIndex: number): Promise<any[]> {
    if (!this.currentProgress || stepIndex >= this.currentProgress.steps.length) {
      return [];
    }

    const step = this.currentProgress.steps[stepIndex];
    try {
      return await funifierApiService.getSchedulerLogs(step.schedulerId, {
        max_results: 50,
        orderby: 'time',
        reverse: true
      });
    } catch (error) {
      console.error(`Error getting logs for step ${stepIndex}:`, error);
      return [];
    }
  }

  /**
   * Utility method to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get cycle change summary
   */
  public getCycleChangeSummary(): {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    duration?: number;
    status: string;
  } | null {
    if (!this.currentProgress) {
      return null;
    }

    const completedSteps = this.currentProgress.steps.filter(step => step.status === 'completed').length;
    const failedSteps = this.currentProgress.steps.filter(step => step.status === 'failed').length;
    
    let duration: number | undefined;
    if (this.currentProgress.startTime) {
      const endTime = this.currentProgress.endTime || new Date();
      duration = endTime.getTime() - this.currentProgress.startTime.getTime();
    }

    return {
      totalSteps: this.currentProgress.totalSteps,
      completedSteps,
      failedSteps,
      duration,
      status: this.currentProgress.overallStatus
    };
  }
}

// Export singleton instance
export const cycleChangeService = CycleChangeService.getInstance();