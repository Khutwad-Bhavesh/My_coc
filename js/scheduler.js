/**
 * Builder Priority & Stagger Optimization Scheduler
 * Staggers upgrade start & finish times to avoid builder bottlenecks and resource overflow
 */

class BuilderScheduler {
  /**
   * Calculate staggered completion schedule for pending upgrades
   * @param {object} villageState Parsed DTO from CoCParser
   * @returns {array} Scheduled timeline of upgrade completion windows
   */
  static generateSchedule(villageState) {
    const { activeUpgrades, freeBuilders, totalBuilders } = villageState;

    // Sort active upgrades by remaining time ascending
    const activeTimeline = activeUpgrades.map(upgrade => {
      const finishTimestamp = Date.now() + (upgrade.remainingTimeSeconds * 1000);
      return {
        ...upgrade,
        finishDate: new Date(finishTimestamp),
        finishTimestamp
      };
    }).sort((a, b) => a.finishTimestamp - b.finishTimestamp);

    // Calculate builder stagger gaps (time between successive builder completions)
    const staggerGaps = [];
    for (let i = 0; i < activeTimeline.length - 1; i++) {
      const gapSeconds = Math.round((activeTimeline[i + 1].finishTimestamp - activeTimeline[i].finishTimestamp) / 1000);
      staggerGaps.push({
        builderPair: `Builder ${i + 1} & Builder ${i + 2}`,
        gapSeconds,
        gapFormatted: this.formatDuration(gapSeconds)
      });
    }

    return {
      activeTimeline,
      staggerGaps,
      availableBuildersCount: freeBuilders,
      totalBuilders
    };
  }

  static formatDuration(totalSeconds) {
    if (totalSeconds <= 0) return '0s';
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    return parts.join(' ');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BuilderScheduler };
}
