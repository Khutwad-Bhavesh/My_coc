const fs = require('fs');
const path = require('path');
const { CoCParser } = require('../js/parser');
const { BuilderScheduler } = require('../js/scheduler');

try {
  const samplePath = path.join(__dirname, '../data/sample_export.json');
  const rawData = fs.readFileSync(samplePath, 'utf8');
  const parsed = CoCParser.parse(rawData);
  const schedule = BuilderScheduler.generateSchedule(parsed);

  console.log('✅ BuilderScheduler Test Passed!');
  console.log(`Timeline items: ${schedule.activeTimeline.length}`);
  console.log(`Stagger gaps computed: ${schedule.staggerGaps.length}`);
} catch (err) {
  console.error('❌ BuilderScheduler Test Failed:', err);
  process.exit(1);
}
// Duration math optimized
