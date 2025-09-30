'use client';

import React, { useState, useEffect } from 'react';
import { Database, Play, CheckCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { cycleMigrationService } from '../../services';
import { MigrationReport, MigrationProgress } from '../../services/cycle-migration.service';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface DataMigrationPanelProps {
  className?: string;
}

export function DataMigrationPanel({ className = '' }: DataMigrationPanelProps) {
  const [migrationStatus, setMigrationStatus] = useState<{
    needsMigration: boolean;
    recordsWithoutCycles: number;
    recordsWithCycles: number;
    totalRecords: number;
  } | null>(null);
  
  const [migrationReport, setMigrationReport] = useState<MigrationReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMigrationStatus();
  }, []);

  const loadMigrationStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const status = await cycleMigrationService.getMigrationStatus();
      setMigrationStatus(status);
    } catch (error) {
      console.error('Failed to load migration status:', error);
      setError('Failed to load migration status');
    } finally {
      setIsLoading(false);
    }
  };

  const startMigration = async () => {
    try {
      setIsRunning(true);
      setError(null);
      setMigrationReport(null);
      
      const report = await cycleMigrationService.migrateAllData();
      setMigrationReport(report);
      
      // Refresh status after migration
      await loadMigrationStatus();
    } catch (error) {
      console.error('Migration failed:', error);
      setError(error instanceof Error ? error.message : 'Migration failed');
    } finally {
      setIsRunning(false);
    }
  };

  const validateMigration = async () => {
    try {
      setIsLoading(true);
      const validation = await cycleMigrationService.validateMigration();
      
      if (validation.isValid) {
        alert('Migration validation passed! All data is properly migrated.');
      } else {
        alert(`Migration validation found issues:\n${validation.issues.join('\n')}`);
      }
    } catch (error) {
      console.error('Validation failed:', error);
      setError('Validation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusIcon = () => {
    if (isLoading) return <RefreshCw className="w-5 h-5 animate-spin" />;
    if (!migrationStatus) return <Database className="w-5 h-5" />;
    if (!migrationStatus.needsMigration) return <CheckCircle className="w-5 h-5 text-green-600" />;
    return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
  };

  const getStatusColor = () => {
    if (isLoading) return 'border-gray-200 bg-gray-50';
    if (!migrationStatus) return 'border-gray-200 bg-gray-50';
    if (!migrationStatus.needsMigration) return 'border-green-200 bg-green-50';
    return 'border-yellow-200 bg-yellow-50';
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Database className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Data Migration</h2>
        </div>

        {/* Migration Status */}
        <div className={`rounded-lg border p-4 mb-4 ${getStatusColor()}`}>
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">
                {isLoading ? 'Loading status...' :
                 !migrationStatus ? 'Status unavailable' :
                 !migrationStatus.needsMigration ? 'Migration Complete' :
                 'Migration Required'}
              </h3>
              
              {migrationStatus && (
                <div className="text-sm text-gray-600 mt-1 space-y-1">
                  <p>Total records: {migrationStatus.totalRecords}</p>
                  <p>Records with cycle info: {migrationStatus.recordsWithCycles}</p>
                  <p>Records needing migration: {migrationStatus.recordsWithoutCycles}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Migration Progress */}
        {isRunning && migrationReport && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Migration in Progress</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-blue-800">
                <span>Batch {migrationReport.progress.currentBatch} of {migrationReport.progress.totalBatches}</span>
                <span>{Math.round((migrationReport.progress.completedBatches / migrationReport.progress.totalBatches) * 100)}%</span>
              </div>
              
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(migrationReport.progress.completedBatches / migrationReport.progress.totalBatches) * 100}%` 
                  }}
                />
              </div>
              
              {migrationReport.progress.estimatedTimeRemaining > 0 && (
                <p className="text-xs text-blue-700">
                  Estimated time remaining: {formatDuration(migrationReport.progress.estimatedTimeRemaining)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Migration Results */}
        {migrationReport && !isRunning && (
          <div className={`rounded-lg border p-4 mb-4 ${
            migrationReport.status.isComplete ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {migrationReport.status.isComplete ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm font-medium">
                Migration {migrationReport.status.isComplete ? 'Completed' : 'Completed with Errors'}
              </span>
            </div>
            
            <div className="text-sm space-y-1">
              <p>Migrated: {migrationReport.status.migratedRecords} records</p>
              <p>Failed: {migrationReport.status.failedRecords} records</p>
              <p>Duration: {formatDuration(migrationReport.performanceMetrics.totalDuration)}</p>
              <p>Speed: {Math.round(migrationReport.performanceMetrics.recordsPerSecond)} records/sec</p>
            </div>
            
            {migrationReport.status.errors.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-red-700 cursor-pointer">
                  View Errors ({migrationReport.status.errors.length})
                </summary>
                <div className="mt-2 text-xs text-red-600 max-h-32 overflow-y-auto">
                  {migrationReport.status.errors.map((error, index) => (
                    <p key={index} className="mb-1">{error}</p>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-900">Error</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={startMigration}
            disabled={isRunning || isLoading || (migrationStatus && !migrationStatus.needsMigration)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{isRunning ? 'Running...' : 'Start Migration'}</span>
          </button>

          <button
            onClick={validateMigration}
            disabled={isLoading || isRunning}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Validate</span>
          </button>

          <button
            onClick={loadMigrationStatus}
            disabled={isLoading || isRunning}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}