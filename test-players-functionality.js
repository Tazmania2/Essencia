/**
 * Test script to verify the players functionality
 * This script tests the Funifier API integration for players management
 */

const { funifierApiService } = require('./services/funifier-api.service');

async function testPlayersFunctionality() {
  console.log('🧪 Testing Players Functionality...\n');

  try {
    // Test 1: Get all players
    console.log('1️⃣ Testing getAllPlayers...');
    const players = await funifierApiService.getAllPlayers({ max_results: 10 });
    console.log(`✅ Found ${players.length} players`);
    
    if (players.length > 0) {
      const firstPlayer = players[0];
      console.log(`   First player: ${firstPlayer.name} (${firstPlayer._id})`);
      
      // Test 2: Get player status
      console.log('\n2️⃣ Testing getPlayerStatus...');
      const playerStatus = await funifierApiService.getPlayerStatus(firstPlayer._id);
      console.log(`✅ Player status retrieved for ${playerStatus.name}`);
      console.log(`   Total points: ${playerStatus.total_points}`);
      console.log(`   Total challenges: ${playerStatus.total_challenges}`);
      
      // Test 3: Get team info
      console.log('\n3️⃣ Testing getPlayerTeamInfo...');
      const teamInfo = funifierApiService.getPlayerTeamInfo(playerStatus);
      console.log(`✅ Team info: ${teamInfo.teamNames.join(', ')}`);
      console.log(`   Is admin: ${teamInfo.isAdmin}`);
    }

    // Test 4: Get all teams
    console.log('\n4️⃣ Testing getAllTeams...');
    const teams = await funifierApiService.getAllTeams({ max_results: 10 });
    console.log(`✅ Found ${teams.length} teams`);

    // Test 5: Get all schedulers
    console.log('\n5️⃣ Testing getAllSchedulers...');
    const schedulers = await funifierApiService.getAllSchedulers({ max_results: 10 });
    console.log(`✅ Found ${schedulers.length} schedulers`);

    console.log('\n🎉 All tests passed! Players functionality is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('FUNIFIER_BASIC_TOKEN')) {
      console.log('\n💡 Make sure to set the FUNIFIER_BASIC_TOKEN environment variable');
      console.log('   You can find this in your .env file or environment configuration');
    }
  }
}

async function testCycleChangeFunctionality() {
  console.log('\n🔄 Testing Cycle Change Functionality...\n');

  try {
    const { cycleChangeService } = require('./services/cycle-change.service');

    // Test 1: Initialize cycle change
    console.log('1️⃣ Testing initializeCycleChange...');
    const progress = cycleChangeService.initializeCycleChange();
    console.log(`✅ Cycle change initialized with ${progress.totalSteps} steps`);

    // Test 2: Check validation methods
    console.log('\n2️⃣ Testing validation methods...');
    
    const pointsCheck = await funifierApiService.checkAllPlayersPointsCleared();
    console.log(`✅ Points check: ${pointsCheck.allCleared ? 'All cleared' : `${pointsCheck.playersWithPoints.length} players with points`}`);
    
    const lockedPointsCheck = await funifierApiService.checkAllPlayersLockedPointsCleared();
    console.log(`✅ Locked points check: ${lockedPointsCheck.allCleared ? 'All cleared' : `${lockedPointsCheck.playersWithLockedPoints.length} players with locked points`}`);

    console.log('\n🎉 Cycle change functionality is working correctly.');

  } catch (error) {
    console.error('❌ Cycle change test failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  await testPlayersFunctionality();
  await testCycleChangeFunctionality();
}

if (require.main === module) {
  runAllTests();
}

module.exports = {
  testPlayersFunctionality,
  testCycleChangeFunctionality
};