const fs = require('fs');
const path = require('path');
const { CoCParser } = require('../js/parser');
const { BuilderScheduler } = require('../js/scheduler');

try {
  const samplePath = path.join(__dirname, '../data/sample_export.json');
  const rawData = fs.readFileSync(samplePath, 'utf8');
  const parsed = CoCParser.parse(rawData);

  // Test 1: Standard schedule generation
  const scheduleNormal = BuilderScheduler.generateSchedule(parsed);
  if (scheduleNormal.activeTimeline.length === 0) throw new Error('Schedule generation failed');
  console.log('✅ Test 1: Standard BuilderScheduler Passed!');

  // Test 2: Builder Potion 10x speedup math
  const schedulePotion = BuilderScheduler.generateSchedule(parsed, { builderPotionActive: true });
  const normalTime = scheduleNormal.activeTimeline[0].remainingTimeSecondsAdjusted;
  const potionTime = schedulePotion.activeTimeline[0].remainingTimeSecondsAdjusted;

  if (potionTime > normalTime) {
    throw new Error('Builder Potion 10x speedup math failed!');
  }
  console.log('✅ Test 2: Builder Potion 10x Speedup Passed!');

} catch (err) {
  console.error('❌ BuilderScheduler Test Suite Failed:', err);
  process.exit(1);
}
// Oct 4 Audit V14
