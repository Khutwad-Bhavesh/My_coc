const fs = require('fs');
const path = require('path');
const { CoCParser } = require('../js/parser');

try {
  // Test 1: Standard sample export parsing
  const samplePath = path.join(__dirname, '../data/sample_export.json');
  const rawData = fs.readFileSync(samplePath, 'utf8');
  const parsed = CoCParser.parse(rawData);

  console.log('✅ Test 1: Standard CoCParser Passed!');

  // Test 2: XSS Sanitization check
  const maliciousInput = JSON.stringify({
    name: "<script>alert('XSS')</script>",
    tag: "<iframe src='evil.com'></iframe>",
    buildings: [{ name: "<img src=x onerror=alert(1)>", level: 5 }]
  });
  const sanitized = CoCParser.parse(maliciousInput);

  if (sanitized.playerName.includes('<script>') || sanitized.buildings[0].name.includes('<img')) {
    throw new Error('XSS Sanitization Failed!');
  }
  console.log('✅ Test 2: XSS Sanitization Security Passed!');

  // Test 3: Boundary edge cases (empty array)
  const emptyParsed = CoCParser.parse({});
  if (emptyParsed.buildings.length !== 0 || emptyParsed.freeBuilders !== 6) {
    throw new Error('Empty Payload Boundary Check Failed!');
  }
  console.log('✅ Test 3: Empty Payload Boundary Passed!');

} catch (err) {
  console.error('❌ CoCParser Test Suite Failed:', err);
  process.exit(1);
}
// Oct 4 Audit V8
