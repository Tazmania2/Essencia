# Aggregation Pipeline Fix Instructions

## Issue Found
The aggregation pipeline in `services/report-comparison.service.ts` has a syntax error that's causing it to return only `_id` fields instead of complete records.

## Problem
In the `getStoredData` method, line 153 has:
```typescript
latestRecord: { $first: "$ROOT" } // WRONG - single dollar sign
```

It should be:
```typescript
doc: { $first: "$$ROOT" } // CORRECT - double dollar sign
```

## Complete Fix

Replace the entire `getStoredData` method in `services/report-comparison.service.ts` (lines ~119-189) with:

```typescript
private static async getStoredData(cycleNumber?: number): Promise<any[]> {
  try {
    const databaseService = FunifierDatabaseService.getInstance();
    
    // Use aggregation to get the latest report for each player
    // This is much more efficient and accurate than filtering
    const pipeline = [];
    
    // Match records for the specific cycle (if provided)
    if (cycleNumber) {
      pipeline.push({
        $match: { 
          cycleNumber: cycleNumber,
          status: "REGISTERED",
          time: { $exists: true }
        }
      });
    } else {
      pipeline.push({
        $match: { 
          status: "REGISTERED",
          time: { $exists: true }
        }
      });
    }
    
    // Sort by playerId first, then by time descending to get latest per player
    pipeline.push({
      $sort: { 
        playerId: 1,
        time: -1 
      }
    });
    
    // Group by playerId and get the latest record for each player
    pipeline.push({
      $group: {
        _id: "$playerId",
        doc: { $first: "$$ROOT" } // FIXED: Use $$ROOT (double dollar) and shorter field name
      }
    });
    
    // Replace root with the latest record
    pipeline.push({
      $replaceRoot: { newRoot: "$doc" }
    });
    
    console.log('🔍 Using FIXED aggregation pipeline for stored data:', JSON.stringify(pipeline, null, 2));
    
    const results = await databaseService.aggregateReportData(pipeline);
    
    console.log(`📊 Found ${results.length} latest records for cycle ${cycleNumber || 'all'}`);
    
    // Debug: Log the first few results to see what we're getting
    if (results.length > 0) {
      console.log('📋 Sample results from FIXED aggregation:');
      results.slice(0, 2).forEach((result, index) => {
        console.log(`  Result ${index + 1}:`, {
          playerId: result.playerId,
          time: result.time,
          createdAt: result.createdAt,
          hasPercentages: !!(result.atividadePercentual !== undefined && result.reaisPorAtivoPercentual !== undefined),
          fullRecord: Object.keys(result).length > 5 ? 'Complete' : 'Incomplete',
          fieldCount: Object.keys(result).length
        });
      });
    } else {
      console.log('❌ No results returned from FIXED aggregation');
    }
    
    return results;
  } catch (error) {
    // If collection doesn't exist or is empty, return empty array
    console.warn('No stored data found in Funifier collection:', error);
    return [];
  }
}
```

## Key Changes Made

1. **Fixed `$$ROOT` reference**: Changed from `"$ROOT"` to `"$$ROOT"` (double dollar sign)
2. **Changed field name**: From `latestRecord` to `doc` (shorter, more reliable)
3. **Updated `$replaceRoot`**: Changed from `"$latestRecord"` to `"$doc"`
4. **Improved sorting**: Sort by `playerId` first, then `time` descending
5. **Enhanced debugging**: Added field count and better logging

## Expected Result

After this fix, the aggregation should return complete records like:
```json
[
  {
    "_id": "alineboticario8@gmail.com_14_2025-10-03_1",
    "playerId": "alineboticario8@gmail.com",
    "reaisPorAtivoPercentual": 55.89005967,
    "faturamentoPercentual": 36.88330893,
    "atividadePercentual": 79.54545455,
    "time": 1759523528125,
    "cycleNumber": 14,
    // ... all other fields
  }
]
```

Instead of just:
```json
[
  {
    "_id": "123456_14_2025-10-02"
  }
]
```

## Testing

After applying this fix:
1. Upload a CSV file
2. Check the console logs for "FIXED aggregation pipeline"
3. Verify that complete records are returned (not just `_id`)
4. Upload the same CSV again - should not create duplicate action logs

This should resolve the comparison issue where duplicate uploads were creating action logs incorrectly.