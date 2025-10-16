/**
 * Test script to verify the authentication fix for enhanced player reports
 */

const { FunifierDatabaseService } = require('./services/funifier-database.service.ts');

async function testAuthFix() {
  console.log('🧪 Testing authentication fix...');
  
  try {
    const dbService = FunifierDatabaseService.getInstance();
    const testPlayerId = 'dionivd123@gmail.com';
    
    console.log('🔍 Testing enhanced player report with fixed auth...');
    const enhancedReport = await dbService.getEnhancedPlayerReport(testPlayerId);
    
    if (enhancedReport) {
      console.log('✅ Enhanced report retrieved successfully!');
      console.log('📊 Report data:', {
        playerId: enhancedReport.playerId,
        hasUploadUrl: !!enhancedReport.uploadUrl,
        reportDate: enhancedReport.reportDate,
        status: enhancedReport.status
      });
    } else {
      console.log('ℹ️ No enhanced report found for player (this is normal if no data exists)');
    }
    
    console.log('🔍 Testing regular report data...');
    const regularReport = await dbService.getLatestPlayerReport(testPlayerId);
    
    if (regularReport) {
      console.log('✅ Regular report retrieved successfully!');
    } else {
      console.log('ℹ️ No regular report found for player');
    }
    
    console.log('🎉 Authentication test completed successfully!');
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Only run if called directly
if (require.main === module) {
  testAuthFix();
}

module.exports = { testAuthFix };