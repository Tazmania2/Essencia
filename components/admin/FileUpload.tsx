'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Download, Eye } from 'lucide-react';
import { ReportProcessingService, ParseResult, ReportData } from '../../services/report-processing.service';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      for (const file of validFiles) {
        // Update status to parsing
        setUploadedFiles(prev => 
          prev.map(f => 
            f.file.name === file.name
              ? { ...f, status: 'parsing' as const, progress: 25 }
              : f
          )
        );

        // Parse the file
        const parseResult = await ReportProcessingService.parseFile(file);
        parseResults.push(parseResult);

        // Generate summary
        const summary = ReportProcessingService.generateSummary(parseResult);

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

        // Call onFileProcessed callback if provided
        if (onFileProcessed) {
          onFileProcessed(file, parseResult);
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

      // Call the upload handler with parsed results
      await onFileUpload(validFiles, parseResults);

      clearInterval(progressInterval);

      // Mark as success
      setUploadedFiles(prev => 
        prev.map(f => 
          validFiles.some(vf => vf.name === f.file.name)
            ? { ...f, status: 'success' as const, progress: 100 }
            : f
        )
      );
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
      message += 'Primeiros erros:\n';
      errors.slice(0, 5).forEach(error => {
        message += `• Linha ${error.row}, campo '${error.field}': ${error.message}\n`;
      });
      
      if (errors.length > 5) {
        message += `... e mais ${errors.length - 5} erros\n`;
      }
    }

    if (uploadedFile.summary) {
      message += `\n${uploadedFile.summary}`;
    }

    alert(message);
  }, []);

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

  return (
    <div className={`space-y-4 ${className}`}>
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
        </div>
      )}
    </div>
  );
};

export default FileUpload;