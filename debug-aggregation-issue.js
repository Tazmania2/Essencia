// Debug script to understand the aggregation issue
console.log('🔍 Debugging aggregation pipeline issue...');

console.log('\n📋 Expected Flow:');
console.log('1. Report submission starts');
console.log('2. checkIfNewCycle() called with LIMITED pipeline:');
console.log('   [{"$match":{"cycleNumber":14,"status":"REGISTERED"}},{"$limit":1},{"$project":{"_id":1}}]');
console.log('   → Returns: boolean (true/false)');
console.log('');
console.log('3. If isNewCycle = false, compareReportData() calls getStoredData()');
console.log('4. getStoredData() should call with FULL pipeline:');

const fullPipeline = [
  {
    "$match": {
      "cycleNumber": 14,
      "status": "REGISTERED",
      "time": { "$exists": true }
    }
  },
  {
    "$sort": { "time": -1 }
  },
  {
    "$group": {
      "_id": "$playerId",
      "latestRecord": { "$first": "$$ROOT" }
    }
  },
  {
    "$replaceRoot": { "newRoot": "$latestRecord" }
  }
];

console.log(JSON.stringify(fullPipeline, null, 2));
console.log('   → Returns: Complete records for each player');

console.log('\n🚨 Problem Analysis:');
console.log('You are seeing the LIMITED pipeline in network tab:');
console.log('[{"$match":{"cycleNumber":14,"status":"REGISTERED"}},{"$limit":1},{"$project":{"_id":1}}]');
console.log('');
console.log('This suggests either:');
console.log('1. ❌ Only checkIfNewCycle is being called (comparison not happening)');
console.log('2. ❌ getStoredData is not being called');
console.log('3. ❌ There\'s a caching issue');
console.log('4. ❌ The wrong aggregation result is being used');

console.log('\n🔧 Debug Steps:');
console.log('1. Check console logs for "[CHECK_CYCLE]" vs "[COMPARISON]" messages');
console.log('2. Verify that isNewCycle = false (so comparison should happen)');
console.log('3. Look for the FULL pipeline in network tab (should be a separate request)');
console.log('4. Check if getStoredData method is actually being called');

console.log('\n📊 Expected Network Requests:');
console.log('Request 1 (checkIfNewCycle):');
console.log('  POST /aggregate');
console.log('  Body: [{"$match":{"cycleNumber":14,"status":"REGISTERED"}},{"$limit":1},{"$project":{"_id":1}}]');
console.log('  Response: [{"_id":"some_id"}] or []');
console.log('');
console.log('Request 2 (getStoredData - if cycle exists):');
console.log('  POST /aggregate');
console.log('  Body: [{"$match":{"cycleNumber":14,"status":"REGISTERED","time":{"$exists":true}}},{"$sort":{"time":-1}},{"$group":{"_id":"$playerId","latestRecord":{"$first":"$$ROOT"}}},{"$replaceRoot":{"newRoot":"$latestRecord"}}]');
console.log('  Response: Complete player records');

console.log('\n💡 If you only see Request 1:');
console.log('- Either isNewCycle = true (so no comparison needed)');
console.log('- Or getStoredData is not being called for some reason');
console.log('- Check the console logs to see which path is being taken');

console.log('\n✅ Test completed - check your console logs and network tab!');