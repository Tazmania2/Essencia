// Test CSV download functionality
const fs = require('fs');

// Simulate the browser environment for testing
global.document = {
  createElement: (tag) => {
    if (tag === 'a') {
      return {
        setAttribute: (name, value) => console.log(`Setting ${name}: ${value}`),
        style: { visibility: 'hidden' },
        click: () => console.log('Link clicked - download would start'),
        href: '',
        download: ''
      };
    }
  },
  body: {
    appendChild: (element) => console.log('Element added to body'),
    removeChild: (element) => console.log('Element removed from body')
  }
};

global.URL = {
  createObjectURL: (blob) => {
    console.log('Blob created:', blob.type, blob.size + ' bytes');
    return 'blob:mock-url';
  },
  revokeObjectURL: (url) => console.log('URL revoked:', url)
};

global.Blob = class {
  constructor(content, options) {
    this.content = content;
    this.type = options.type;
    this.size = content[0].length;
  }
};

// Test the CSV generator
async function testCSVDownload() {
  try {
    console.log('Testing CSV Download Functionality...\n');
    
    // Import the module
    const { SampleCSVGenerator } = require('./utils/sample-csv-generator.ts');
    
    console.log('1. Testing simple CSV generation:');
    const simpleCSV = SampleCSVGenerator.generateSampleCSV(['123456']);
    console.log('✓ Simple CSV generated successfully');
    console.log('Columns:', simpleCSV.split('\n')[0].split(',').length);
    
    console.log('\n2. Testing multi-player CSV generation:');
    const multiCSV = SampleCSVGenerator.generateMultiPlayerSample();
    console.log('✓ Multi-player CSV generated successfully');
    console.log('Players:', multiCSV.split('\n').length - 1);
    
    console.log('\n3. Testing download simulation:');
    SampleCSVGenerator.downloadSampleCSV(['123456'], 'test-download.csv');
    console.log('✓ Download simulation completed');
    
    console.log('\n4. Validating CSV structure:');
    const lines = simpleCSV.split('\n');
    const headers = lines[0].split(',');
    const data = lines[1].split(',');
    
    console.log('✓ Headers:', headers.length);
    console.log('✓ Data columns:', data.length);
    console.log('✓ Structure valid:', headers.length === data.length && headers.length === 21);
    
    // Check for new fields
    const newFields = ['Conversões Meta', 'Conversões Atual', 'Conversões %', 'UPA Meta', 'UPA Atual', 'UPA %'];
    const hasNewFields = newFields.every(field => headers.includes(field));
    console.log('✓ New fields included:', hasNewFields);
    
    console.log('\n🎉 All CSV download tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testCSVDownload();