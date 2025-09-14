/**
 * Challenge Configuration Verification
 * Direct verification of challenge IDs for all carteiras
 */

// Challenge mapping from the configuration
const CHALLENGE_MAPPING = {
  'carteira-i': {
    atividade: [
      'E6FO12f', // Carteira I - Subir Atividade (Pré Meta)
      'E6FQIjs', // Carteira I - Bater Meta Atividade %
      'E6KQAoh'  // Carteira I - Subir Atividade (Pós-Meta)
    ],
    reaisPorAtivo: [
      'E6Gm8RI', // Carteira I, III & IV - Subir Reais por Ativo
      'E6Gke5g'  // Carteira I, III & IV - Descer Reais Ativo
    ],
    faturamento: [
      'E6GglPq', // Carteira I - Bater Faturamento (Meta)
      'E6LIVVX'  // Carteira I - Perder Faturamento (Meta)
    ]
  },
  'carteira-ii': {
    reaisPorAtivo: [
      'E6MTIIK'  // Carteira II - Subir Reais por Ativo
    ],
    atividade: [
      'E6Gv58l', // Carteira II - Subir Atividade
      'E6MZw2L'  // Carteira II - Perder Atividade
    ],
    multimarcasPorAtivo: [
      'E6MWJKs', // Carteira II - Subir Multimarcas por Ativo
      'E6MWYj3'  // Carteira II - Perder Multimarcas por Ativo
    ]
  },
  'carteira-iii': {
    faturamento: [
      'E6F8HMK', // Carteira III & IV - Bater Meta Faturamento
      'E6Gahd4', // Carteira III & IV - Subir Faturamento (Pre-Meta)
      'E6MLv3L'  // Carteira III & IV - Subir Faturamento (Pós-Meta)
    ],
    reaisPorAtivo: [
      'E6Gm8RI', // Carteira I, III & IV - Subir Reais por Ativo
      'E6Gke5g'  // Carteira I, III & IV - Descer Reais Ativo
    ],
    multimarcasPorAtivo: [
      'E6MMH5v', // Carteira III & IV - Subir Multimarcas por Ativo
      'E6MM3eK'  // Carteira III & IV - Perder Multimarcas por Ativo
    ]
  },
  'carteira-iv': {
    faturamento: [
      'E6F8HMK', // Carteira III & IV - Bater Meta Faturamento
      'E6Gahd4', // Carteira III & IV - Subir Faturamento (Pre-Meta)
      'E6MLv3L'  // Carteira III & IV - Subir Faturamento (Pós-Meta)
    ],
    reaisPorAtivo: [
      'E6Gm8RI', // Carteira I, III & IV - Subir Reais por Ativo
      'E6Gke5g'  // Carteira I, III & IV - Descer Reais Ativo
    ],
    multimarcasPorAtivo: [
      'E6MMH5v', // Carteira III & IV - Subir Multimarcas por Ativo
      'E6MM3eK'  // Carteira III & IV - Perder Multimarcas por Ativo
    ]
  }
};

// Expected goal structure for each carteira
const CARTEIRA_GOALS = {
  'carteira-i': {
    primary: 'atividade',
    secondary1: 'reaisPorAtivo',
    secondary2: 'faturamento'
  },
  'carteira-ii': {
    primary: 'reaisPorAtivo',
    secondary1: 'atividade', 
    secondary2: 'multimarcasPorAtivo'
  },
  'carteira-iii': {
    primary: 'faturamento',
    secondary1: 'reaisPorAtivo',
    secondary2: 'multimarcasPorAtivo'
  },
  'carteira-iv': {
    primary: 'faturamento',
    secondary1: 'reaisPorAtivo',
    secondary2: 'multimarcasPorAtivo'
  }
};

console.log('🔍 CHALLENGE ID VERIFICATION FOR ALL CARTEIRAS');
console.log('='.repeat(60));

let allValid = true;
const issues = [];

function validateChallengeId(id) {
  return id && typeof id === 'string' && id.match(/^E6[A-Za-z0-9]{5}$/);
}

function checkCarteira(carteiraName) {
  console.log(`\n📊 ${carteiraName.toUpperCase()}`);
  console.log('─'.repeat(40));
  
  const mapping = CHALLENGE_MAPPING[carteiraName];
  const goals = CARTEIRA_GOALS[carteiraName];
  
  if (!mapping) {
    console.log(`❌ No mapping found for ${carteiraName}`);
    allValid = false;
    return;
  }
  
  // Check primary goal
  console.log(`\n🎯 Meta Principal: ${goals.primary}`);
  const primaryChallenges = mapping[goals.primary];
  if (!primaryChallenges || primaryChallenges.length === 0) {
    console.log(`   ❌ No challenge IDs for primary goal`);
    issues.push(`${carteiraName}: Missing primary goal challenges`);
    allValid = false;
  } else {
    primaryChallenges.forEach((id, index) => {
      if (validateChallengeId(id)) {
        console.log(`   ✅ Challenge ${index + 1}: ${id}`);
      } else {
        console.log(`   ❌ Invalid challenge ID: ${id}`);
        issues.push(`${carteiraName}: Invalid primary challenge ID ${id}`);
        allValid = false;
      }
    });
  }
  
  // Check secondary goal 1
  console.log(`\n🥈 Meta Secundária 1: ${goals.secondary1}`);
  const secondary1Challenges = mapping[goals.secondary1];
  if (!secondary1Challenges || secondary1Challenges.length === 0) {
    console.log(`   ❌ No challenge IDs for secondary goal 1`);
    issues.push(`${carteiraName}: Missing secondary goal 1 challenges`);
    allValid = false;
  } else {
    secondary1Challenges.forEach((id, index) => {
      if (validateChallengeId(id)) {
        console.log(`   ✅ Challenge ${index + 1}: ${id}`);
      } else {
        console.log(`   ❌ Invalid challenge ID: ${id}`);
        issues.push(`${carteiraName}: Invalid secondary1 challenge ID ${id}`);
        allValid = false;
      }
    });
  }
  
  // Check secondary goal 2
  console.log(`\n🥉 Meta Secundária 2: ${goals.secondary2}`);
  const secondary2Challenges = mapping[goals.secondary2];
  if (!secondary2Challenges || secondary2Challenges.length === 0) {
    console.log(`   ❌ No challenge IDs for secondary goal 2`);
    issues.push(`${carteiraName}: Missing secondary goal 2 challenges`);
    allValid = false;
  } else {
    secondary2Challenges.forEach((id, index) => {
      if (validateChallengeId(id)) {
        console.log(`   ✅ Challenge ${index + 1}: ${id}`);
      } else {
        console.log(`   ❌ Invalid challenge ID: ${id}`);
        issues.push(`${carteiraName}: Invalid secondary2 challenge ID ${id}`);
        allValid = false;
      }
    });
  }
}

// Check all carteiras
Object.keys(CARTEIRA_GOALS).forEach(checkCarteira);

// Summary
console.log('\n' + '='.repeat(60));
console.log('📋 VERIFICATION SUMMARY');
console.log('='.repeat(60));

if (allValid) {
  console.log('🎉 ALL CARTEIRAS HAVE COMPLETE CHALLENGE ID CONFIGURATION!');
  console.log('\n✅ Every carteira has:');
  console.log('   • Meta Principal with challenge IDs');
  console.log('   • Meta Secundária 1 with challenge IDs');
  console.log('   • Meta Secundária 2 with challenge IDs');
  console.log('   • All challenge IDs follow correct format (E6xxxxx)');
} else {
  console.log('🚨 CONFIGURATION ISSUES DETECTED');
  console.log('\n❌ Issues found:');
  issues.forEach(issue => console.log(`   • ${issue}`));
}

// Challenge count summary
console.log('\n📊 CHALLENGE COUNT SUMMARY:');
Object.entries(CHALLENGE_MAPPING).forEach(([carteira, mapping]) => {
  const totalChallenges = Object.values(mapping).reduce((sum, challenges) => sum + challenges.length, 0);
  console.log(`   ${carteira.toUpperCase()}: ${totalChallenges} total challenges`);
});

console.log('\n' + '='.repeat(60));