# CSV Field Mapping Fix

## Problem
When configuring a dashboard metric to use a specific CSV field (e.g., "atividade"), the system was:
1. Fetching the correct data from the database (visible in console logs)
2. But displaying the default hardcoded data instead of the configured data on screen

## Root Cause
The `getConfiguredCsvField` method in `dashboard.service.ts` was trying to match goal names incorrectly:
- It received display names like "Atividade" from the metrics
- But the configuration stores internal names like "atividade"
- This mismatch caused the CSV field mapping to fail

## Solution
1. **Enhanced `getConfiguredCsvField` method**: Now matches both internal names and display names
2. **Added `getInternalNameFromDisplayName` helper**: Converts display names to internal names
3. **Fixed `getConfiguredGoalUnit` method**: Uses the same matching logic
4. **Added debug logging**: To track CSV field mapping process

## Changes Made

### 1. Enhanced CSV Field Matching
```typescript
private getConfiguredCsvField(configuration: any, teamType: TeamType, goalName: string): string | null {
  const internalName = this.getInternalNameFromDisplayName(goalName);
  
  // Check both internal name and display name
  if (teamConfig?.primaryGoal?.name === internalName || teamConfig?.primaryGoal?.displayName === goalName) {
    return teamConfig.primaryGoal.csvField || null;
  }
  // ... similar for secondary goals
}
```

### 2. Added Name Conversion Helper
```typescript
private getInternalNameFromDisplayName(displayName: string): string {
  const nameMap: Record<string, string> = {
    'Faturamento': 'faturamento',
    'Reais por Ativo': 'reaisPorAtivo',
    'Multimarcas por Ativo': 'multimarcasPorAtivo',
    'Atividade': 'atividade',
    'Conversões': 'conversoes',
    'UPA': 'upa'
  };
  
  return nameMap[displayName] || displayName.toLowerCase();
}
```

### 3. Enhanced Debug Logging
- Added logging to track CSV field resolution
- Shows which fields are available vs. which are requested
- Helps identify configuration mismatches

## Expected Result
Now when you configure a metric to use "atividade" as the CSV field:
1. The system correctly maps the display name "Atividade" to internal name "atividade"
2. Finds the configured CSV field "atividade" in the configuration
3. Uses the correct data from csvData["atividade"] instead of falling back to hardcoded mappings
4. Displays the configured data on screen instead of default data

## Testing
To verify the fix:
1. Configure a dashboard metric to use a specific CSV field
2. Check console logs for CSV field mapping debug messages
3. Verify the UI displays the configured data instead of default data
4. Confirm titles and values match the configured settings