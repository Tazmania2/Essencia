/**
 * Script to check current dashboard configuration for UPA and Conversões
 * This will help you see what needs to be updated in the admin panel
 */

console.log('🔍 Dashboard Configuration Checker');
console.log('==================================\n');

console.log('📋 CURRENT ISSUE:');
console.log('The Conversões metric (Carteira 0) is likely configured with the wrong challenge ID.');
console.log('This causes the dashboard to not fetch proper data from Funifier challenges.\n');

console.log('🎯 WHAT TO CHECK IN ADMIN PANEL:');
console.log('1. Go to /admin/configuration');
console.log('2. Look for Carteira 0 configuration');
console.log('3. Check the primaryGoal (Conversões) challengeId\n');

console.log('❌ LIKELY CURRENT CONFIG (INCORRECT):');
console.log('Carteira 0 -> Primary Goal (Conversões):');
console.log('  challengeId: "E6GglPq"  // This is wrong - E6GglPq is for Faturamento');
console.log('  actionId: "conversoes"  // This should be correct\n');

console.log('✅ CORRECT CONFIG SHOULD BE:');
console.log('Carteira 0 -> Primary Goal (Conversões):');
console.log('  challengeId: "E82R5cQ"  // Correct Conversões challenge ID');
console.log('  actionId: "conversoes"  // Keep this the same\n');

console.log('🔍 ALSO VERIFY:');
console.log('ER -> Secondary Goal 2 (UPA):');
console.log('  challengeId: "E62x2PW"  // Should be correct');
console.log('  actionId: "upa"         // Should be correct\n');

console.log('📊 CHALLENGE ID REFERENCE:');
console.log('┌─────────────────┬──────────────┬─────────────────┐');
console.log('│ Metric          │ Challenge ID │ Action ID       │');
console.log('├─────────────────┼──────────────┼─────────────────┤');
console.log('│ Conversões      │ E82R5cQ      │ conversoes      │');
console.log('│ UPA             │ E62x2PW      │ upa             │');
console.log('│ Faturamento     │ E6GglPq      │ faturamento     │');
console.log('│ Reais por Ativo │ E6Gm8RI      │ reais_por_ativo │');
console.log('└─────────────────┴──────────────┴─────────────────┘\n');

console.log('🚀 STEPS TO FIX:');
console.log('1. Open admin panel: /admin/configuration');
console.log('2. Find Carteira 0 configuration');
console.log('3. Update Conversões challengeId from E6GglPq to E82R5cQ');
console.log('4. Save configuration');
console.log('5. Test dashboard with a Carteira 0 player\n');

console.log('✅ AFTER THE FIX:');
console.log('- Carteira 0 dashboard will show correct Conversões data from Funifier');
console.log('- ER dashboard will show correct UPA data from Funifier');
console.log('- Action logs will be sent with correct actionIds');
console.log('- No more conflicts between Conversões and Faturamento data\n');

console.log('💡 TIP: After making the change, you can test by:');
console.log('1. Exporting a player\'s data to see their challenge_progress');
console.log('2. Checking if E82R5cQ appears with Conversões percentage');
console.log('3. Verifying dashboard shows the correct percentages');

console.log('\n🎉 This should fix the UPA and Conversões data fetching issue!');