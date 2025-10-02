'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Download, Eye, Send } from 'lucide-react';
import { ReportProcessingService, ParseResult, ReportData } from '../../services/report-processing.service';
import { reportSubmissionService, SubmissionResult } from '../../services/report-submission.service';
import { DataUploadProgress } from '../ui/DashboardSkeleton';
import { useNotificationHelpers } from '../ui/NotificationSystem';

export interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'parsing' | 'success' | 'error';
  progress: number;
  error?: string;
  parseResult?: ParseResult;
  summary?: string;
}

export interface FileUploadProps {
  onFileUpload: (files: File[], parseResults: ParseResult[]) => Promise<void>;
  onFileProcessed?: (file: File, parseResult: ParseResult) => void;
  onSubmissionComplete?: (result: any) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  autoProcess?: boolean; // Whether to automatically process files after upload
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  onFileProcessed,
  onSubmissionComplete,
  acceptedTypes = ['.csv', '.xlsx', '.xls'],
  maxFileSize = 10,
  multiple = false,
  disabled = false,
  className = '',
  autoProcess = true
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState({ progress: 0, message: '', fileName: '' });
  const [cycleNumber, setCycleNumber] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { notifySuccess, notifyError, notifyInfo } = useNotificationHelpers();

  const validateFile = useCallback((file: File): string | null => {
    return ReportProcessingService.validateFileFormat(file);
  }, []);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const newUploadedFiles: UploadedFile[] = [];

    // Validate files
    fileArray.forEach((file) => {
      const error = validateFile(file);
      const uploadedFile: UploadedFile = {
        file,
        id: `${file.name}-${Date.now()}`,
        status: error ? 'error' : 'pending',
        progress: 0,
        error: error || undefined
      };

      newUploadedFiles.push(uploadedFile);
      if (!error) {
        validFiles.push(file);
      }
    });

    setUploadedFiles(prev => [...prev, ...newUploadedFiles]);

    if (validFiles.length === 0) {
      return;
    }

    setIsUploading(true);

    try {
      const parseResults: ParseResult[] = [];

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        
        // Show upload progress modal for multiple files or large files
        if (validFiles.length > 1 || file.size > 1024 * 1024) { // > 1MB
          setUploadProgress({
            progress: 10,
            message: 'Iniciando processamento...',
            fileName: file.name
          });
        }

        // Update status to parsing
        setUploadedFiles(prev => 
          prev.map(f => 
            f.file.name === file.name
              ? { ...f, status: 'parsing' as const, progress: 25 }
              : f
          )
        );

        if (validFiles.length > 1 || file.size > 1024 * 1024) {
          setUploadProgress(prev => ({
            ...prev,
            progress: 25,
            message: 'Analisando estrutura do arquivo...'
          }));
        }

        // Parse the file
        const parseResult = await ReportProcessingService.parseFile(file);
        parseResults.push(parseResult);

        // Generate summary
        const summary = ReportProcessingService.generateSummary(parseResult);

        if (validFiles.length > 1 || file.size > 1024 * 1024) {
          setUploadProgress(prev => ({
            ...prev,
            progress: 50,
            message: 'Validando dados...'
          }));
        }

        // Update with parse results
        setUploadedFiles(prev => 
          prev.map(f => 
            f.file.name === file.name
              ? { 
                  ...f, 
                  status: 'uploading' as const, 
                  progress: 50,
                  parseResult,
                  summary
                }
              : f
          )
        );

        // Show notifications for parse results
        if (parseResult.isValid) {
          notifySuccess(`${file.name} processado com sucesso`, 
            `${parseResult.data.length} registros válidos encontrados`);
        } else {
          notifyError(`Problemas encontrados em ${file.name}`, 
            `${parseResult.errors.length} erros de validação`);
        }

        // Call onFileProcessed callback if provided
        if (onFileProcessed) {
          onFileProcessed(file, parseResult);
        }

        if (validFiles.length > 1 || file.size > 1024 * 1024) {
          setUploadProgress(prev => ({
            ...prev,
            progress: 70 + (i / validFiles.length) * 20,
            message: `Processando arquivo ${i + 1} de ${validFiles.length}...`
          }));
        }
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.status === 'uploading' && f.progress < 90
              ? { ...f, progress: f.progress + 10 }
              : f
          )
        );
      }, 200);

      if (validFiles.length > 1 || validFiles.some(f => f.size > 1024 * 1024)) {
        setUploadProgress(prev => ({
          ...prev,
          progress: 90,
          message: 'Finalizando processamento...'
        }));
      }

      // Call the upload handler with parsed results
      await onFileUpload(validFiles, parseResults);

      clearInterval(progressInterval);

      if (validFiles.length > 1 || validFiles.some(f => f.size > 1024 * 1024)) {
        setUploadProgress(prev => ({
          ...prev,
          progress: 100,
          message: 'Upload concluído com sucesso!'
        }));
        
        // Hide progress modal after a short delay
        setTimeout(() => {
          setUploadProgress({ progress: 0, message: '', fileName: '' });
        }, 1500);
      }

      // Mark as success
      setUploadedFiles(prev => 
        prev.map(f => 
          validFiles.some(vf => vf.name === f.file.name)
            ? { ...f, status: 'success' as const, progress: 100 }
            : f
        )
      );

      // Show overall success notification
      if (validFiles.length > 1) {
        notifySuccess('Todos os arquivos processados', 
          `${validFiles.length} arquivos foram processados com sucesso`);
      }
    } catch (error) {
      // Mark as error
      setUploadedFiles(prev => 
        prev.map(f => 
          validFiles.some(vf => vf.name === f.file.name)
            ? { 
                ...f, 
                status: 'error' as const, 
                error: error instanceof Error ? error.message : 'Erro no processamento'
              }
            : f
        )
      );

      // Show error notification
      notifyError('Erro no processamento', 
        error instanceof Error ? error.message : 'Erro desconhecido durante o processamento');

      // Hide progress modal on error
      setUploadProgress({ progress: 0, message: '', fileName: '' });
    } finally {
      setIsUploading(false);
    }
  }, [validateFile, onFileUpload, onFileProcessed]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [disabled, processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const clearAllFiles = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  const viewParseResults = useCallback((uploadedFile: UploadedFile) => {
    if (!uploadedFile.parseResult) return;

    const { data, errors } = uploadedFile.parseResult;
    let message = `Resultados do processamento de ${uploadedFile.file.name}:\n\n`;
    
    message += `✅ ${data.length} registros válidos processados\n`;
    
    if (errors.length > 0) {
      message += `❌ ${errors.length} erros encontrados\n\n`;
      
      // Group errors by type for better readability
      const fieldErrors = errors.reduce((acc, error) => {
        if (!acc[error.field]) acc[error.field] = [];
        acc[error.field].push(error);
        return acc;
      }, {} as Record<string, typeof errors>);

      message += 'Erros por campo:\n';
      Object.keys(fieldErrors).forEach(field => {
        const fieldErrorList = fieldErrors[field];
        const fieldDisplayName = getFieldDisplayName(field);
        message += `• ${fieldDisplayName}: ${fieldErrorList.length} erro(s)\n`;
        fieldErrorList.slice(0, 2).forEach(error => {
          message += `  - Linha ${error.row}: ${error.message}\n`;
        });
        if (fieldErrorList.length > 2) {
          message += `  - ... e mais ${fieldErrorList.length - 2} erros\n`;
        }
      });
    }

    if (uploadedFile.summary) {
      message += `\n${uploadedFile.summary}`;
    }

    alert(message);
  }, []);

  const getFieldDisplayName = (field: string): string => {
    const fieldNames: Record<string, string> = {
      playerId: 'Player ID',
      diaDociclo: 'Dia do Ciclo',
      totalDiasCiclo: 'Total Dias Ciclo',
      faturamentoMeta: 'Faturamento Meta',
      faturamentoAtual: 'Faturamento Atual',
      faturamentoPercentual: 'Faturamento %',
      reaisPorAtivoMeta: 'Reais por Ativo Meta',
      reaisPorAtivoAtual: 'Reais por Ativo Atual',
      reaisPorAtivoPercentual: 'Reais por Ativo %',
      multimarcasPorAtivoMeta: 'Multimarcas por Ativo Meta',
      multimarcasPorAtivoAtual: 'Multimarcas por Ativo Atual',
      multimarcasPorAtivoPercentual: 'Multimarcas por Ativo %',
      atividadeMeta: 'Atividade Meta',
      atividadeAtual: 'Atividade Atual',
      atividadePercentual: 'Atividade %',
      conversoesMeta: 'Conversões Meta',
      conversoesAtual: 'Conversões Atual',
      conversoesPercentual: 'Conversões %',
      upaMeta: 'UPA Meta',
      upaAtual: 'UPA Atual',
      upaPercentual: 'UPA %'
    };
    return fieldNames[field] || field;
  };

  const downloadErrorReport = useCallback((uploadedFile: UploadedFile) => {
    if (!uploadedFile.parseResult?.errors.length) return;

    const errors = uploadedFile.parseResult.errors;
    const csvContent = [
      'Linha,Campo,Erro,Valor',
      ...errors.map(error => 
        `${error.row},"${error.field}","${error.message}","${error.value || ''}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `erros_${uploadedFile.file.name.replace(/\.[^/.]+$/, '')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
      case 'parsing':
        return (
          <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'parsing':
        return 'Processando...';
      case 'uploading':
        return 'Enviando...';
      case 'success':
        return 'Concluído';
      case 'error':
        return 'Erro';
      default:
        return 'Pendente';
    }
  };

  const handleSubmit = useCallback(async () => {
    const successfulFiles = uploadedFiles.filter(f => f.status === 'success' && f.parseResult?.isValid);
    
    if (successfulFiles.length === 0) {
      notifyError('Nenhum arquivo válido', 
        'Certifique-se de que os arquivos foram processados com sucesso.');
      return;
    }

    if (successfulFiles.length > 1) {
      notifyError('Múltiplos arquivos', 
        'Por favor, envie apenas um arquivo por vez.');
      return;
    }

    const fileToSubmit = successfulFiles[0];
    
    setIsSubmitting(true);
    setSubmissionResult(null);

    // Show submission progress
    setUploadProgress({
      progress: 10,
      message: 'Iniciando envio do relatório...',
      fileName: fileToSubmit.file.name
    });

    try {
      // Simulate progress updates during submission
      setTimeout(() => {
        setUploadProgress(prev => ({
          ...prev,
          progress: 30,
          message: 'Validando dados no servidor...'
        }));
      }, 500);

      setTimeout(() => {
        setUploadProgress(prev => ({
          ...prev,
          progress: 60,
          message: 'Processando registros...'
        }));
      }, 1500);

      setTimeout(() => {
        setUploadProgress(prev => ({
          ...prev,
          progress: 80,
          message: 'Criando logs de ação...'
        }));
      }, 2500);

      const result = await reportSubmissionService.submitReport(
        fileToSubmit.parseResult!,
        fileToSubmit.file,
        cycleNumber
      );

      setUploadProgress(prev => ({
        ...prev,
        progress: 100,
        message: 'Envio concluído com sucesso!'
      }));

      setSubmissionResult(result);
      
      if (onSubmissionComplete) {
        onSubmissionComplete(result);
      }

      if (result.success) {
        notifySuccess('Relatório enviado com sucesso!', 
          `${result.recordsProcessed} registros processados, ${result.actionLogsCreated} logs criados`);
        
        // Clear files after successful submission
        setUploadedFiles([]);
      } else {
        notifyError('Problemas no envio', 
          result.message || 'Erro durante o processamento');
      }

      // Hide progress modal after a short delay
      setTimeout(() => {
        setUploadProgress({ progress: 0, message: '', fileName: '' });
      }, 1500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido durante o envio';
      
      setSubmissionResult({
        success: false,
        message: `Erro durante o envio: ${errorMessage}`,
        submissionId: null,
        recordsProcessed: 0,
        cycleNumber: cycleNumber,
        submittedAt: new Date().toISOString(),
        errors: [errorMessage]
      });

      notifyError('Erro no envio', errorMessage);
      setUploadProgress({ progress: 0, message: '', fileName: '' });
    } finally {
      setIsSubmitting(false);
    }
  }, [uploadedFiles, onSubmissionComplete, notifySuccess, notifyError]);

  const canSubmit = uploadedFiles.some(f => f.status === 'success' && f.parseResult?.isValid) && !isSubmitting;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Progress Modal */}
      <DataUploadProgress
        isVisible={uploadProgress.progress > 0 && uploadProgress.progress < 100}
        progress={uploadProgress.progress}
        message={uploadProgress.message}
        fileName={uploadProgress.fileName}
        onCancel={uploadProgress.progress < 90 ? () => {
          setUploadProgress({ progress: 0, message: '', fileName: '' });
          setIsUploading(false);
        } : undefined}
      />

      {/* Cycle Number Input */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label htmlFor="cycle-number" className="block text-sm font-medium text-gray-700 mb-2">
          Número do Ciclo
        </label>
        <div className="flex items-center space-x-3">
          <input
            id="cycle-number"
            type="number"
            min="1"
            max="100"
            value={cycleNumber}
            onChange={(e) => setCycleNumber(parseInt(e.target.value) || 1)}
            className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            disabled={disabled}
          />
          <span className="text-sm text-gray-500">
            Este número será associado a todos os dados do relatório enviado
          </span>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragOver 
            ? 'border-pink-500 bg-pink-50' 
            : 'border-gray-300 hover:border-pink-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedTypes.join(',')}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
        />

        <div className="space-y-4">
          <div className={`
            mx-auto w-16 h-16 rounded-full flex items-center justify-center
            ${isDragOver ? 'bg-pink-100' : 'bg-gray-100'}
          `}>
            <Upload className={`w-8 h-8 ${isDragOver ? 'text-pink-600' : 'text-gray-400'}`} />
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isDragOver ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
            </p>
            <p className="text-sm text-gray-500">
              Formatos aceitos: {acceptedTypes.join(', ')} • Tamanho máximo: {maxFileSize}MB
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Suporte para métricas opcionais: Conversões e UPA (colunas 16-21)
            </p>
          </div>

          {isUploading && (
            <div className="text-sm text-pink-600 font-medium">
              Processando arquivos...
            </div>
          )}
        </div>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Arquivos ({uploadedFiles.length})
            </h4>
            <button
              onClick={clearAllFiles}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Limpar todos
            </button>
          </div>

          <div className="space-y-2">
            {uploadedFiles.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getStatusIcon(uploadedFile.status)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadedFile.file.name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{(uploadedFile.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                      <span>•</span>
                      <span>{getStatusText(uploadedFile.status)}</span>
                    </div>
                    {uploadedFile.error && (
                      <p className="text-xs text-red-600 mt-1">
                        {uploadedFile.error}
                      </p>
                    )}
                    {uploadedFile.summary && (
                      <p className="text-xs text-green-600 mt-1">
                        {uploadedFile.summary.split('\n')[0]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {(uploadedFile.status === 'uploading' || uploadedFile.status === 'parsing') && (
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadedFile.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8">
                        {uploadedFile.progress}%
                      </span>
                    </div>
                  )}

                  {uploadedFile.parseResult && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => viewParseResults(uploadedFile)}
                        className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                        title="Ver resultados"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {uploadedFile.parseResult.errors.length > 0 && (
                        <button
                          onClick={() => downloadErrorReport(uploadedFile)}
                          className="p-1 text-orange-500 hover:text-orange-700 transition-colors"
                          title="Baixar relatório de erros"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => removeFile(uploadedFile.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`
                flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200
                ${canSubmit
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Enviar Relatório</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Submission Results */}
      {submissionResult && (
        <div className={`
          p-6 rounded-lg border-2 
          ${submissionResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
          }
        `}>
          <div className="flex items-center space-x-3 mb-4">
            {submissionResult.success ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600" />
            )}
            <h3 className={`text-lg font-semibold ${
              submissionResult.success ? 'text-green-900' : 'text-red-900'
            }`}>
              {submissionResult.success ? 'Envio Concluído!' : 'Erro no Envio'}
            </h3>
          </div>

          <div className={`text-sm whitespace-pre-line ${
            submissionResult.success ? 'text-green-800' : 'text-red-800'
          }`}>
            {submissionResult.message}
          </div>

          {submissionResult.errors && submissionResult.errors.length > 0 && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
              <h4 className="font-medium text-red-900 mb-2">Erros:</h4>
              <ul className="text-sm text-red-800 space-y-1">
                {submissionResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {submissionResult.success && submissionResult.differences && submissionResult.differences.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-medium text-blue-900 mb-2">
                Action Logs Criados ({submissionResult.actionLogsCreated || 0}):
              </h4>
              <div className="text-sm text-blue-800 max-h-40 overflow-y-auto">
                {submissionResult.differences?.map((diff, index) => (
                  <div key={index} className="mb-1">
                    <strong>{diff.playerId}</strong> - {diff.metric}: 
                    <span className={diff.difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {diff.difference >= 0 ? '+' : ''}{diff.difference.toFixed(2)}%
                    </span>
                    {diff.isFirstEntry && <span className="text-purple-600"> (Primeira entrada)</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;