/**
 * Debug script to investigate UPA and Conversões data fetching issues
 * 
 * This script will:
 * 1. Check challenge ID mappings for conflicts
 * 2. Test Funifier API data retrieval for UPA and Conversões
 * 3. Verify action log generation
 * 4. Check if challenge data exists in player status
 */

// Since we're dealing with TypeScript modules, let's analyze the mappings directly
const fs = require('fs');
const path = require('path');

async function debugUpaConversoes() {
  console.log('🔍 Starting UPA and Conversões debug analysis...\n');

  // 1. Analyze Challenge ID Mappings from source files
  console.log('📋 ANALYZING CHALLENGE ID MAPPINGS FROM SOURCE:');
  console.log('===============================================');
  
  try {
    const teamProcessorContent = fs.readFileSync('./services/team-processor.service.ts', 'utf8');
    
    // Extract challenge mappings using regex
    const challengeMatches = teamProcessorContent.match(/CHALLENGE_MAPPING[\s\S]*?};/);
    
    if (challengeMatches) {
      console.log('✅ Found CHALLENGE_MAPPING in team-processor.service.ts');
      
      // Look for specific conflicts
      const e6GglPqMatches = teamProcessorContent.match(/'E6GglPq'/g) || [];
      const e62x2PWMatches = teamProcessorContent.match(/'E62x2PW'/g) || [];
      
      console.log(`\n🔍 Challenge ID Usage Analysis:`);
      console.log(`   E6GglPq appears ${e6GglPqMatches.length} times`);
      console.log(`   E62x2PW appears ${e62x2PWMatches.length} times`);
      
      // Check for the specific conflict
      const carteiraZeroSection = teamProcessorContent.match(/\[TeamType\.CARTEIRA_0\]:\s*{[\s\S]*?}/);
      const carteiraISection = teamProcessorContent.match(/\[TeamType\.CARTEIRA_I\]:\s*{[\s\S]*?}/);
      
      if (carteiraZeroSection && carteiraISection) {
        const carteira0HasE6GglPq = carteiraZeroSection[0].includes('E6GglPq');
        const carteiraIHasE6GglPq = carteiraISection[0].includes('E6GglPq');
        
        if (carteira0HasE6GglPq && carteiraIHasE6GglPq) {
          console.log('\n⚠️  CRITICAL CONFLICT DETECTED:');
          console.log('   E6GglPq is used in both CARTEIRA_0 and CARTEIRA_I');
          console.log('   This will cause data processing conflicts!');
        }
      }
    }
  } catch (error) {
    console.log(`❌ Error reading team-processor.service.ts: ${error.message}`);
  }

  // 3. Test Funifier API Access
  console.log('🌐 TESTING FUNIFIER API ACCESS:');
  console.log('===============================');
  
  try {
    // Get a sample of players to test
    const players = await funifierApiService.getAllPlayersStatus({ max_results: 5 });
    console.log(`✅ Successfully fetched ${players.length} player statuses`);
    
    if (players.length > 0) {
      const samplePlayer = players[0];
      console.log(`\n📊 Sample Player Analysis (${samplePlayer.name}):`);
      console.log(`   Player ID: ${samplePlayer._id}`);
      console.log(`   Total Challenges: ${samplePlayer.total_challenges || 0}`);
      console.log(`   Challenge Progress Count: ${samplePlayer.challenge_progress?.length || 0}`);
      
      // Check if UPA or Conversões challenge IDs exist in challenge_progress
      const challengeProgress = samplePlayer.challenge_progress || [];
      const challengeIds = challengeProgress.map(cp => 
        cp.challenge || cp.challengeId || cp.id
      );
      
      console.log(`   Available Challenge IDs: ${challengeIds.join(', ')}`);
      
      // Check for UPA and Conversões specific IDs
      const hasUpaChallenge = challengeIds.includes('E62x2PW');
      const hasConversoesChallenge = challengeIds.includes('E82R5cQ');
      
      console.log(`   Has UPA Challenge (E62x2PW): ${hasUpaChallenge ? '✅' : '❌'}`);
      console.log(`   Has Conversões Challenge (E82R5cQ): ${hasConversoesChallenge ? '✅' : '❌'}`);
      
      // Show detailed challenge progress
      if (challengeProgress.length > 0) {
        console.log('\n   📈 Challenge Progress Details:');
        challengeProgress.forEach(cp => {
          const id = cp.challenge || cp.challengeId || cp.id;
          const percentage = cp.percent_completed || cp.percentage || cp.progress || 0;
          console.log(`      ${id}: ${percentage}%`);
        });
      }
    }
    
  } catch (error) {
    console.log(`❌ Error accessing Funifier API: ${error.message}`);
  }

  // 4. Check Action Log Configuration
  console.log('\n🔄 ACTION LOG CONFIGURATION:');
  console.log('============================');
  
  const { ActionLogService } = require('./services/action-log.service');
  
  // Test action log generation for UPA and Conversões
  const testDifferences = [
    {
      playerId: 'test-player',
      playerName: 'Test Player',
      metric: 'conversoes',
      funifierValue: 80,
      reportValue: 85,
      difference: 5,
      percentageChange: 6.25,
      requiresUpdate: true
    },
    {
      playerId: 'test-player',
      playerName: 'Test Player', 
      metric: 'upa',
      funifierValue: 70,
      reportValue: 75,
      difference: 5,
      percentageChange: 7.14,
      requiresUpdate: true
    }
  ];

  const testComparisonResults = [{
    playerId: 'test-player',
    playerName: 'Test Player',
    hasChanges: true,
    differences: testDifferences
  }];

  try {
    const actionLogs = ActionLogService.generateActionLogs(testComparisonResults);
    console.log(`✅ Generated ${actionLogs.length} action logs`);
    
    actionLogs.forEach(log => {
      console.log(`   ${log.attribute}: ${log.challengeType} -> ${log.value}`);
    });
    
  } catch (error) {
    console.log(`❌ Error generating action logs: ${error.message}`);
  }

  // 5. Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('===================');
  
  if (conflicts.length > 0) {
    console.log('1. ⚠️  CRITICAL: Fix challenge ID conflicts');
    console.log('   - E6GglPq is used for both Conversões and Faturamento');
    console.log('   - This will cause data to be incorrectly processed');
    console.log('   - Assign unique challenge IDs for each metric');
  }
  
  console.log('2. 🔍 Check Funifier Challenge Configuration');
  console.log('   - Verify that challenges E62x2PW (UPA) and E6GglPq (Conversões) exist in Funifier');
  console.log('   - Ensure they are properly configured to track the correct metrics');
  
  console.log('3. 📊 Test with Real Player Data');
  console.log('   - Export a player\'s data and check if challenge_progress contains UPA/Conversões data');
  console.log('   - Verify that the percentage values are being calculated correctly');
  
  console.log('4. 🔄 Verify Action Log Submission');
  console.log('   - Test that action logs are being sent to Funifier with correct actionIds');
  console.log('   - Check Funifier logs to see if UPA and Conversões actions are being received');

  console.log('\n✅ Debug analysis complete!');
}

// Run the debug analysis
debugUpaConversoes().catch(console.error);