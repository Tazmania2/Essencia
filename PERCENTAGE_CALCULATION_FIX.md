# Percentage Calculation Fix

## Problem
After fixing the CSV field mapping, the titles and values were correct, but the percentages displayed in both the goal cards and accordion details were still wrong. They were showing the original hardcoded percentages instead of the calculated percentages from the configured CSV data.

## Root Cause
The percentage values were still coming from the original `metrics` object (which uses hardcoded mappings) instead of being calculated from the configured CSV data that was now being correctly fetched.

## Solution
Enhanced the dashboard service to calculate percentages from the configured CSV data and use those calculated percentages throughout the UI.

## Changes Made

### 1. Enhanced Goal Data Processing
```typescript
// Calculate percentage from CSV data
const percentage = goalData.target > 0 ? (goalData.current / goalData.target) * 100 : 0;

return {
  target: goalData.target,
  current: goalData.current,
  percentage: Math.min(percentage, 999), // Cap at 999% to prevent UI issues
  unit: this.getConfiguredGoalUnit(configuration, teamType, goalName),
  daysRemaining: daysRemaining
};
```

### 2. Updated Dashboard Data Creation
```typescript
// Cache enhanced goal data to avoid multiple calculations
const primaryEnhancedData = getEnhancedGoalData(metrics.primaryGoal.name);
const secondary1EnhancedData = getEnhancedGoalData(metrics.secondaryGoal1.name);
const secondary2EnhancedData = getEnhancedGoalData(metrics.secondaryGoal2.name);

// Use calculated percentages
primaryGoal: {
  percentage: primaryEnhancedData.percentage ?? metrics.primaryGoal.percentage,
  // ... other properties
}
```

### 3. Fixed Goal Details Generation
```typescript
const getEnhancedGoalDataWithPercentage = (goalName: string) => {
  const goalData = this.getGoalDataFromSources(goalName, enhancedRecord, csvData, configuration, teamType);
  if (goalData && goalData.target && goalData.current) {
    const percentage = goalData.target > 0 ? (goalData.current / goalData.target) * 100 : 0;
    return { ...goalData, percentage: Math.min(percentage, 999) };
  }
  return goalData;
};
```

### 4. Updated Description Generation
Updated goal descriptions to use the calculated percentages instead of the original metrics percentages.

## Key Features

1. **Accurate Percentage Calculation**: Percentages are now calculated as `(current / target) * 100` from the configured CSV data
2. **Fallback Support**: If CSV data is not available, falls back to original metrics percentages
3. **Performance Optimization**: Caches enhanced goal data to avoid multiple calculations
4. **UI Safety**: Caps percentages at 999% to prevent UI layout issues
5. **Comprehensive Coverage**: Updates percentages in both goal cards and accordion details

## Expected Result
Now when you configure a metric to use a specific CSV field:
1. **Titles**: Show the configured display names ✅
2. **Values**: Show the configured target/current values ✅  
3. **Percentages**: Show the calculated percentages from configured data ✅
4. **Units**: Show the configured units ✅
5. **Accordion Details**: Show all the above with correct calculations ✅

The dashboard will now display completely accurate data based on your configuration instead of mixing configured data with hardcoded percentages.