// Simple test script to verify enhanced database integration
const axios = require('axios');

async function testEnhancedDatabase() {
  try {
    console.log('🧪 Testing enhanced database integration...');
    
    // Test the enhanced database service directly
    const { FunifierDatabaseService } = require('./services/funifier-database.service.ts');
    
    const dbService = FunifierDatabaseService.getInstance();
    
    // Test with a sample player ID
    const testPlayerId = '123456'; // Use the player ID from the CSV sample
    
    console.log('🔍 Testing enhanced player report...');
    const enhancedReport = await dbService.getEnhancedPlayerReport(testPlayerId);
    console.log('Enhanced report result:', enhancedReport);
    
    if (enhancedReport && enhancedReport.uploadUrl) {
      console.log('📄 Testing CSV processing...');
      const csvData = await dbService.getCSVGoalData(enhancedReport);
      console.log('CSV data result:', csvData);
    }
    
    console.log('✅ Test completed');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEnhancedDatabase();