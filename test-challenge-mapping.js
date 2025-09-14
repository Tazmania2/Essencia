/**
 * Comprehensive Challenge Mapping Verification Test
 * 
 * This script verifies that all carteiras (I-IV) have proper challenge IDs
 * configured for their meta principal and both secundarias.
 */

const { CHALLENGE_MAPPING } = require('./services/team-processor.service');
const { TeamType, FUNIFIER_CONFIG } = require('./types');

console.log('🔍 CHALLENGE MAPPING VERIFICATION TEST');
console.log('=====================================\n');

// Expected structure for each carteira
const expectedStructure = {
  [TeamType.CARTEIRA_I]: {
    primary: 'atividade',
    secondary1: 'reaisPorAtivo', 
    secondary2: 'faturamento'
  },
  [TeamType.CARTEIRA_II]: {
    primary: 'reaisPorAtivo',
    secondary1: 'atividade',
    secondary2: 'multimarcasPorAtivo'
  },
  [TeamType.CARTEIRA_III]: {
    primary: 'faturamento',
    secondary1: 'reaisPorAtivo',
    secondary2: 'multimarcasPorAtivo'
  },
  [TeamType.CARTEIRA_IV]: {
    primary: 'faturamento',
    secondary1: 'reaisPorAtivo', 
    secondary2: 'multimarcasPorAtivo'
  }
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  issues: []
};

function validateChallengeIds(teamType, goalType, challengeIds) {
  const issues = [];
  
  if (!challengeIds || !Array.isArray(challengeIds)) {
    issues.push(`❌ ${goalType}: No challenge IDs defined`);
    return issues;
  }
  
  if (challengeIds.length === 0) {
    issues.push(`❌ ${goalType}: Empty challenge IDs array`);
    return issues;
  }
  
  // Validate each challenge ID format
  challengeIds.forEach((id, index) => {
    if (!id || typeof id !== 'string') {
      issues.push(`❌ ${goalType}[${index}]: Invalid challenge ID format`);
    } else if (!id.match(/^E6[A-Za-z0-9]{5}$/)) {
      issues.push(`⚠️  ${goalType}[${index}]: Challenge ID '${id}' doesn't match expected format`);
    } else {
      console.log(`   ✅ ${goalType}[${index}]: ${id}`);
    }
  });
  
  return issues;
}

function testCarteira(teamType) {
  console.log(`\n📊 Testing ${teamType.toUpperCase()}`);
  console.log('─'.repeat(50));
  
  const mapping = CHALLENGE_MAPPING[teamType];
  const expected = expectedStructure[teamType];
  
  if (!mapping) {
    results.issues.push(`❌ ${teamType}: No challenge mapping found`);
    results.failed++;
    return;
  }
  
  let carteiraIssues = [];
  
  // Test primary goal
  console.log(`\n🎯 Primary Goal: ${expected.primary}`);
  const primaryIds = mapping[expected.primary];
  carteiraIssues.push(...validateChallengeIds(teamType, expected.primary, primaryIds));
  
  // Test secondary goal 1
  console.log(`\n🥈 Secondary Goal 1: ${expected.secondary1}`);
  const secondary1Ids = mapping[expected.secondary1];
  carteiraIssues.push(...validateChallengeIds(teamType, expected.secondary1, secondary1Ids));
  
  // Test secondary goal 2
  console.log(`\n🥉 Secondary Goal 2: ${expected.secondary2}`);
  const secondary2Ids = mapping[expected.secondary2];
  carteiraIssues.push(...validateChallengeIds(teamType, expected.secondary2, secondary2Ids));
  
  // Summary for this carteira
  if (carteiraIssues.length === 0) {
    console.log(`\n✅ ${teamType.toUpperCase()}: All challenge IDs configured correctly`);
    results.passed++;
  } else {
    console.log(`\n❌ ${teamType.toUpperCase()}: Found ${carteiraIssues.length} issues:`);
    carteiraIssues.forEach(issue => console.log(`   ${issue}`));
    results.failed++;
    results.issues.push(...carteiraIssues.map(issue => `${teamType}: ${issue}`));
  }
}

// Test all carteiras
Object.values(TeamType).forEach(teamType => {
  if (teamType !== TeamType.ADMIN) {
    testCarteira(teamType);
  }
});

// Final summary
console.log('\n' + '='.repeat(60));
console.log('📋 FINAL SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${results.passed}/4 carteiras`);
console.log(`❌ Failed: ${results.failed}/4 carteiras`);

if (results.issues.length > 0) {
  console.log('\n🚨 Issues Found:');
  results.issues.forEach(issue => console.log(`   ${issue}`));
} else {
  console.log('\n🎉 All carteiras have complete challenge ID configuration!');
}

// Test catalog items configuration
console.log('\n📦 CATALOG ITEMS VERIFICATION');
console.log('─'.repeat(30));
const catalogItems = FUNIFIER_CONFIG.CATALOG_ITEMS;
Object.entries(catalogItems).forEach(([key, value]) => {
  if (value && value.match(/^E6[A-Za-z0-9]{5}$/)) {
    console.log(`✅ ${key}: ${value}`);
  } else {
    console.log(`❌ ${key}: Invalid format - ${value}`);
    results.issues.push(`Catalog item ${key}: Invalid format`);
  }
});

// Test team IDs configuration
console.log('\n👥 TEAM IDS VERIFICATION');
console.log('─'.repeat(25));
const teamIds = FUNIFIER_CONFIG.TEAM_IDS;
Object.entries(teamIds).forEach(([key, value]) => {
  if (value && value.match(/^E6[A-Za-z0-9]{5}$/)) {
    console.log(`✅ ${key}: ${value}`);
  } else {
    console.log(`❌ ${key}: Invalid format - ${value}`);
    results.issues.push(`Team ID ${key}: Invalid format`);
  }
});

console.log('\n' + '='.repeat(60));
if (results.issues.length === 0) {
  console.log('🎉 ALL CONFIGURATIONS ARE COMPLETE AND VALID!');
  process.exit(0);
} else {
  console.log('🚨 CONFIGURATION ISSUES DETECTED - REVIEW NEEDED');
  process.exit(1);
}