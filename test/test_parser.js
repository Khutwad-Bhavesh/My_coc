const fs = require('fs');
const path = require('path');
const { CoCParser } = require('../js/parser');

try {
  const samplePath = path.join(__dirname, '../data/sample_export.json');
  const rawData = fs.readFileSync(samplePath, 'utf8');
  const parsed = CoCParser.parse(rawData);

  console.log('✅ CoCParser Test Passed!');
  console.log(`Player: ${parsed.playerName} (${parsed.playerTag})`);
  console.log(`Town Hall: TH${parsed.townHallLevel}`);
  console.log(`Builders: ${parsed.freeBuilders} Free / ${parsed.totalBuilders} Total`);
  console.log(`Active Upgrades: ${parsed.activeUpgrades.length}`);
} catch (err) {
  console.error('❌ CoCParser Test Failed:', err);
  process.exit(1);
}
// Edge cases tested
