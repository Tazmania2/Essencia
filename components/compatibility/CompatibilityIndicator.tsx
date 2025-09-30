'use client';

import React from 'react';
import { AlertTriangle, Info, Clock, CheckCircle, Database } from 'lucide-react';
import { CompatibilityIndicator } from '../../utils/backward-compatibility';

interface CompatibilityIndicatorProps {
  compatibility: CompatibilityIndicator;
  context: 'history' | 'dashboard' | 'admin';
  showDetails?: boolean;
  className?: string;
}

export function CompatibilityIndicatorComponent({
  compatibility,
  context,
  showDetails = false,
  className = ''
}: CompatibilityIndicatorProps) {
  const getIndicatorConfig = () => {
    if (compatibility.hasCycleInfo && compatibility.dataQuality === 'complete') {
      return {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        title: 'Complete Data',
        message: 'All data includes cycle information'
      };
    }

    if (compatibility.hasCycleInfo && compatibility.dataQuality === 'partial') {
      return {
        icon: Info,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        title: 'Partial Data',
        message: 'Most data includes cycle information'
      };
    }

    if (compatibility.isLegacyData && compatibility.migrationStatus === 'pending') {
      return {
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        title: 'Legacy Data',
        message: 'Data from before cycle tracking'
      };
    }

    return {
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      title: 'Limited Data',
      message: 'Minimal data available'
    };
  };

  const config = getIndicatorConfig();
  const Icon = config.icon;

  const getContextMessage = () => {
    switch (context) {
      case 'history':
        if (compatibility.isLegacyData) {
          return 'Some historical features may be limited';
        }
        return 'Full history functionality available';

      case 'dashboard':
        if (compatibility.isLegacyData) {
          return 'Current dashboard shows available data';
        }
        return 'Dashboard shows complete cycle data';

      case 'admin':
        if (compatibility.migrationStatus === 'pending') {
          return 'Data migration recommended';
        }
        return 'All data is cycle-aware';

      default:
        return '';
    }
  };

  if (!showDetails && compatibility.hasCycleInfo && compatibility.dataQuality === 'complete') {
    // Don't show indicator for perfect data unless details are requested
    return null;
  }

  return (
    <div className={`flex items-start space-x-3 p-3 rounded-lg border ${config.bgColor} ${config.borderColor} ${className}`}>
      <Icon className={`w-5 h-5 ${config.color} mt-0.5 flex-shrink-0`} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h4 className={`text-sm font-medium ${config.color}`}>
            {config.title}
          </h4>
          
          {compatibility.cycleNumber && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
              Cycle {compatibility.cycleNumber}
            </span>
          )}
          
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            compatibility.dataQuality === 'complete' ? 'bg-green-100 text-green-800' :
            compatibility.dataQuality === 'partial' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {compatibility.dataQuality}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mt-1">
          {config.message}
        </p>
        
        {getContextMessage() && (
          <p className="text-xs text-gray-500 mt-1">
            {getContextMessage()}
          </p>
        )}
        
        {showDetails && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Migration: {compatibility.migrationStatus}</span>
              <span>Legacy: {compatibility.isLegacyData ? 'Yes' : 'No'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface DataQualityBadgeProps {
  quality: 'complete' | 'partial' | 'minimal';
  size?: 'sm' | 'md';
}

export function DataQualityBadge({ quality, size = 'sm' }: DataQualityBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  
  const qualityConfig = {
    complete: 'bg-green-100 text-green-800',
    partial: 'bg-yellow-100 text-yellow-800',
    minimal: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${qualityConfig[quality]}`}>
      <Database className="w-3 h-3 mr-1" />
      {quality}
    </span>
  );
}

interface MigrationStatusBadgeProps {
  status: 'migrated' | 'pending' | 'not_applicable';
  size?: 'sm' | 'md';
}

export function MigrationStatusBadge({ status, size = 'sm' }: MigrationStatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  
  const statusConfig = {
    migrated: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    not_applicable: { color: 'bg-gray-100 text-gray-800', icon: Info }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${config.color}`}>
      <Icon className="w-3 h-3 mr-1" />
      {status.replace('_', ' ')}
    </span>
  );
}