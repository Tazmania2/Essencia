'use client';

import React, { useState } from 'react';
import { AlertTriangle, Info, X, ChevronDown, ChevronUp, Database, Zap } from 'lucide-react';
import { backwardCompatibilityService } from '../../utils/backward-compatibility';
import { EssenciaReportRecord } from '../../types';

interface CompatibilityWarningProps {
  records: EssenciaReportRecord[];
  context: 'history' | 'dashboard' | 'admin';
  onMigrationRequest?: () => void;
  className?: string;
}

export function CompatibilityWarning({
  records,
  context,
  onMigrationRequest,
  className = ''
}: CompatibilityWarningProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || records.length === 0) {
    return null;
  }

  const migrationRecommendation = backwardCompatibilityService.shouldRecommendMigration(records);
  
  if (!migrationRecommendation.recommend) {
    return null;
  }

  const legacyCount = records.filter(r => !backwardCompatibilityService.hasCycleInfo(r)).length;
  const totalCount = records.length;
  const legacyPercentage = Math.round((legacyCount / totalCount) * 100);

  const getUrgencyConfig = () => {
    switch (migrationRecommendation.urgency) {
      case 'high':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Migration Highly Recommended'
        };
      case 'medium':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: 'Migration Recommended'
        };
      case 'low':
        return {
          icon: Info,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          title: 'Migration Available'
        };
    }
  };

  const config = getUrgencyConfig();
  const Icon = config.icon;

  const getContextSpecificMessage = () => {
    switch (context) {
      case 'history':
        return `${legacyPercentage}% of your historical data lacks cycle information, limiting history navigation and timeline features.`;
      case 'dashboard':
        return `Your current data includes ${legacyCount} legacy records, which may limit some dashboard features.`;
      case 'admin':
        return `${legacyCount} records in the system require migration to enable full cycle functionality for all users.`;
      default:
        return migrationRecommendation.reason;
    }
  };

  return (
    <div className={`rounded-lg border ${config.bgColor} ${config.borderColor} ${className}`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Icon className={`w-5 h-5 ${config.color} mt-0.5 flex-shrink-0`} />
            
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-medium ${config.color}`}>
                {config.title}
              </h3>
              
              <p className="text-sm text-gray-600 mt-1">
                {getContextSpecificMessage()}
              </p>
              
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Database className="w-3 h-3" />
                  <span>{legacyCount} legacy records</span>
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Zap className="w-3 h-3" />
                  <span>{migrationRecommendation.urgency} priority</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {migrationRecommendation.affectedFeatures.length > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
            
            <button
              onClick={() => setIsDismissed(true)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {isExpanded && migrationRecommendation.affectedFeatures.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-xs font-medium text-gray-700 mb-2">
              Affected Features:
            </h4>
            <ul className="space-y-1">
              {migrationRecommendation.affectedFeatures.map((feature, index) => (
                <li key={index} className="text-xs text-gray-600 flex items-center space-x-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {onMigrationRequest && context === 'admin' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={onMigrationRequest}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                migrationRecommendation.urgency === 'high'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : migrationRecommendation.urgency === 'medium'
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Database className="w-4 h-4 mr-2" />
              Start Migration
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface LegacyDataNoticeProps {
  message: string;
  showMigrationHint?: boolean;
  className?: string;
}

export function LegacyDataNotice({
  message,
  showMigrationHint = false,
  className = ''
}: LegacyDataNoticeProps) {
  return (
    <div className={`flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md ${className}`}>
      <Info className="w-4 h-4 text-yellow-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-yellow-800">{message}</p>
        {showMigrationHint && (
          <p className="text-xs text-yellow-600 mt-1">
            Contact your administrator to enable full cycle functionality.
          </p>
        )}
      </div>
    </div>
  );
}

interface MixedDataIndicatorProps {
  cycleAwareCount: number;
  legacyCount: number;
  className?: string;
}

export function MixedDataIndicator({
  cycleAwareCount,
  legacyCount,
  className = ''
}: MixedDataIndicatorProps) {
  const totalCount = cycleAwareCount + legacyCount;
  const cycleAwarePercentage = Math.round((cycleAwareCount / totalCount) * 100);
  
  return (
    <div className={`flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-md ${className}`}>
      <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
      
      <div className="flex-1 min-w-0">
        <p className="text-sm text-blue-800">
          Mixed Data Quality
        </p>
        <p className="text-xs text-blue-600 mt-1">
          {cycleAwarePercentage}% of data includes cycle information ({cycleAwareCount} of {totalCount} records)
        </p>
      </div>
      
      <div className="flex-shrink-0">
        <div className="w-16 h-2 bg-blue-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${cycleAwarePercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}