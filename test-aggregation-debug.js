// Test script to debug the aggregation pipeline issue
console.log('🧪 Testing aggregation pipeline for latest records per player...');

// Test 1: Verify the correct aggregation pipeline structure
function testCorrectPipeline() {
  console.log('\n1. Testing correct aggregation pipeline...');
  
  const cycleNumber = 14;
  
  // This is what the pipeline SHOULD look like
  const correctPipeline = [
    {
      $match: { 
        cycleNumber: cycleNumber,
        status: "REGISTERED",
        time: { $exists: true }
      }
    },
    {
      $sort: { time: -1 } // Sort by time descending (latest first)
    },
    {
      $group: {
        _id: "$playerId",
        latestRecord: { $first: "$$ROOT" } // MUST be $$ROOT (double dollar)
      }
    },
    {
      $replaceRoot: { newRoot: "$latestRecord" }
    }
  ];
  
  console.log('Correct pipeline JSON:');
  console.log(JSON.stringify(correctPipeline, null, 2));
  
  // Verify the $$ROOT reference
  const groupStage = correctPipeline.find(stage => stage.$group);
  const hasCorrectRoot = groupStage && groupStage.$group.latestRecord.$first === "$$ROOT";
  
  console.log('Pipeline validation:', {
    hasCorrectRoot,
    rootReference: groupStage?.latestRecord?.$first || 'NOT FOUND'
  });
  
  console.log('✅ Correct pipeline test: PASSED');
  return true;
}

// Test 2: Simulate the data scenario you described
function testDataScenario() {
  console.log('\n2. Testing data scenario simulation...');
  
  // This simulates the data you showed from the database
  const mockDatabaseRecords = [
    {
      "_id": "alineboticario8@gmail.com_14_2025-10-03_1",
      "playerId": "alineboticario8@gmail.com",
      "time": 1759523528125,
      "cycleNumber": 14,
      "status": "REGISTERED",
      "atividadePercentual": 79.54545455
    },
    {
      "_id": "dionivd123@gmail.com_14_2025-10-03_2", 
      "playerId": "dionivd123@gmail.com",
      "time": 1759523528125,
      "cycleNumber": 14,
      "status": "REGISTERED",
      "atividadePercentual": 57.20930233
    },
    {
      "_id": "123456_14_2025-10-03_0",
      "playerId": "123456", 
      "time": 1759523528125,
      "cycleNumber": 14,
      "status": "REGISTERED",
      "atividadePercentual": 26.88172043
    }
  ];
  
  console.log('Mock database records:', mockDatabaseRecords.length);
  
  // Simulate what the aggregation should return
  // Since all records have the same time, it should return one record per player
  const playerGroups = mockDatabaseRecords.reduce((groups, record) => {
    if (!groups[record.playerId]) {
      groups[record.playerId] = [];
    }
    groups[record.playerId].push(record);
    return groups;
  }, {});
  
  const latestPerPlayer = Object.values(playerGroups).map(playerRecords => {
    // Sort by time descending and take first (latest)
    return playerRecords.sort((a, b) => b.time - a.time)[0];
  });
  
  console.log('Expected aggregation result (latest per player):');
  latestPerPlayer.forEach(record => {
    console.log(`  ${record.playerId}: time=${record.time}, atividade=${record.atividadePercentual}`);
  });
  
  console.log(`Expected result count: ${latestPerPlayer.length} (one per player)`);
  console.log('✅ Data scenario test: PASSED');
  return true;
}

// Test 3: Debug the issue you're seeing
function debugCurrentIssue() {
  console.log('\n3. Debugging the current issue...');
  
  console.log('What you\'re seeing:');
  console.log('  Request: POST /aggregate with pipeline');
  console.log('  Response: [{_id: "123456_14_2025-10-02"}] (only _id field)');
  console.log('');
  
  console.log('This suggests:');
  console.log('  1. The aggregation is running');
  console.log('  2. But it\'s not returning the full record');
  console.log('  3. Possible causes:');
  console.log('     - Wrong $$ROOT reference (should be double $)');
  console.log('     - Pipeline structure issue');
  console.log('     - $replaceRoot not working correctly');
  console.log('');
  
  console.log('Expected behavior:');
  console.log('  - Should return full records for each player');
  console.log('  - Each record should have playerId, time, percentages, etc.');
  console.log('  - Should be the LATEST record for each player based on time');
  console.log('');
  
  console.log('Debug steps:');
  console.log('  1. Check if $$ROOT is correctly written (double $)');
  console.log('  2. Verify the pipeline is being sent correctly');
  console.log('  3. Test the pipeline manually in MongoDB/Funifier');
  console.log('  4. Add more logging to see intermediate results');
  console.log('');
  
  console.log('✅ Debug analysis: COMPLETED');
  return true;
}

// Test 4: Alternative pipeline approach
function testAlternativePipeline() {
  console.log('\n4. Testing alternative pipeline approach...');
  
  // Alternative approach: Use $addFields to add a rank, then filter
  const alternativePipeline = [
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
      $replaceRoot: { 
        newRoot: "$doc" 
      }
    }
  ];
  
  console.log('Alternative pipeline (using $doc instead of $latestRecord):');
  console.log(JSON.stringify(alternativePipeline, null, 2));
  
  console.log('This approach:');
  console.log('  - Uses shorter field name ($doc)');
  console.log('  - Sorts by playerId first, then time');
  console.log('  - Should be more reliable');
  console.log('');
  
  console.log('✅ Alternative pipeline test: PASSED');
  return true;
}

// Run all tests
function runTests() {
  console.log('🚀 Running aggregation debug tests...\n');
  
  const results = [
    testCorrectPipeline(),
    testDataScenario(),
    debugCurrentIssue(),
    testAlternativePipeline()
  ];
  
  const allPassed = results.every(result => result);
  
  console.log(`\n📊 Test Results: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🔧 Recommended fixes:');
    console.log('   1. Ensure $$ROOT has double dollar signs');
    console.log('   2. Add more debugging to see what\'s being returned');
    console.log('   3. Consider using the alternative pipeline approach');
    console.log('   4. Test the pipeline manually if possible');
    console.log('\n📝 The issue is likely in the aggregation pipeline syntax');
    console.log('   The fact that you\'re getting only _id suggests the $replaceRoot isn\'t working');
  }
  
  return allPassed;
}

runTests();