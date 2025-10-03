// Fixed version of the getStoredData method
const fixedGetStoredData = `
  /**
   * Get stored data from Funifier custom collection for specific cycle
   * Uses aggregation to get the LATEST report for each player in the cycle
   */
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
          doc: { $first: "$$ROOT" } // Use $$ROOT (double dollar) and shorter field name
        }
      });
      
      // Replace root with the latest record
      pipeline.push({
        $replaceRoot: { newRoot: "$doc" }
      });
      
      console.log('🔍 Using FIXED aggregation pipeline for stored data:', JSON.stringify(pipeline, null, 2));
      
      const results = await databaseService.aggregateReportData(pipeline);
      
      console.log(\`📊 Found \${results.length} latest records for cycle \${cycleNumber || 'all'}\`);
      
      // Debug: Log the first few results to see what we're getting
      if (results.length > 0) {
        console.log('📋 Sample results from FIXED aggregation:');
        results.slice(0, 2).forEach((result, index) => {
          console.log(\`  Result \${index + 1}:\`, {
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
`;

console.log('Fixed getStoredData method:');
console.log(fixedGetStoredData);

console.log('\nKey changes made:');
console.log('1. ✅ Fixed $$ROOT (double dollar sign)');
console.log('2. ✅ Changed field name from "latestRecord" to "doc"');
console.log('3. ✅ Updated $replaceRoot to use "$doc"');
console.log('4. ✅ Added better sorting (playerId first, then time)');
console.log('5. ✅ Enhanced debugging with field count');

console.log('\nExpected pipeline JSON:');
const expectedPipeline = [
  {
    $match: { 
      cycleNumber: 14,
      status: "REGISTERED",
      time: { $exists: true }
    }
  },
  {
    $sort: { 
      playerId: 1,
      time: -1 
    }
  },
  {
    $group: {
      _id: "$playerId",
      doc: { $first: "$$ROOT" }
    }
  },
  {
    $replaceRoot: { newRoot: "$doc" }
  }
];

console.log(JSON.stringify(expectedPipeline, null, 2));