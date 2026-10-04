/**
 * Builder Priority, Meta Army Evaluator & Stagger Optimization Scheduler (V2 Hardened)
 * Staggers upgrade start & finish times to avoid builder bottlenecks and resource overflow
 */

class MetaArmyEvaluator {
  static META_ARMIES = [
    {
      id: "root_rider_valk",
      name: "TH15/16 Root Rider + Overgrowth Valkyrie",
      requiredHeroes: { barbarianKing: 85, archerQueen: 85, grandWarden: 60, royalChampion: 35 },
      keyBuildings: ["Spell Tower", "Monolith", "Pet House"],
      difficulty: "Medium",
      metaScore: 98
    },
    {
      id: "sarch_blimp_hydra",
      name: "Super Archer Blimp + Hydra (Dragons/Loons)",
      requiredHeroes: { barbarianKing: 80, archerQueen: 85, grandWarden: 60, royalChampion: 35 },
      keyBuildings: ["Clan Castle", "Laboratory", "Pet House"],
      difficulty: "High",
      metaScore: 95
    },
    {
      id: "qc_lalo",
      name: "Queen Charge LavaLoon",
      requiredHeroes: { barbarianKing: 75, archerQueen: 90, grandWarden: 65, royalChampion: 35 },
      keyBuildings: ["Laboratory", "Spell Tower"],
      difficulty: "Expert",
      metaScore: 94
    },
    {
      id: "super_dragon_smash",
      name: "TH16 Super Dragon + Fireball Smash",
      requiredHeroes: { barbarianKing: 85, archerQueen: 85, grandWarden: 65, royalChampion: 40 },
      keyBuildings: ["Monolith", "Spell Tower", "Eagle Artillery"],
      difficulty: "Hard",
      metaScore: 97
    }
  ];

  static evaluateArmyReadiness(villageState) {
    const rawBuildings = Array.isArray(villageState.buildings) ? villageState.buildings : [];
    return this.META_ARMIES.map(army => {
      let score = army.metaScore;
      const missingReqs = [];

      army.keyBuildings.forEach(bName => {
        const found = rawBuildings.find(b => b.name && b.name.toLowerCase().includes(bName.toLowerCase()));
        if (!found || found.isUpgrading) {
          missingReqs.push(`Upgrade ${bName}`);
        }
      });

      return {
        armyName: army.name,
        metaScore: score,
        difficulty: army.difficulty,
        readinessPercent: missingReqs.length === 0 ? 100 : Math.max(50, 100 - (missingReqs.length * 15)),
        recommendations: missingReqs
      };
    });
  }
}

class BaseLayoutEvaluator {
  static getAnti3StarPriorities(villageState) {
    const rawBuildings = Array.isArray(villageState.buildings) ? villageState.buildings : [];
    const keyDefenses = ['Monolith', 'Eagle Artillery', 'Scattershot', 'Spell Tower', 'Air Defense'];
    const candidates = rawBuildings.filter(b => b.name && keyDefenses.some(kd => b.name.includes(kd)));

    return candidates.sort((a, b) => {
      if (a.isUpgrading && !b.isUpgrading) return 1;
      if (!a.isUpgrading && b.isUpgrading) return -1;
      return (b.maxLevel - b.level) - (a.maxLevel - a.level);
    });
  }
}

class BuilderScheduler {
  /**
   * Calculate dynamic staggered schedule considering Gold Pass, Builder Potions & Clock Tower
   */
  static generateSchedule(villageState, options = {}) {
    const activeUpgrades = Array.isArray(villageState.activeUpgrades) ? villageState.activeUpgrades : [];
    const freeBuilders = Number(villageState.freeBuilders) || 0;
    const totalBuilders = Number(villageState.totalBuilders) || 5;

    let speedMultiplier = 1;
    if (options.builderPotionActive) speedMultiplier *= 10;
    if (options.clockTowerActive) speedMultiplier *= 10;

    const now = Date.now();
    const activeTimeline = activeUpgrades.map((upgrade, index) => {
      const remainingSec = Math.max(0, Math.round((upgrade.remainingTimeSeconds || 0) / speedMultiplier));
      // Add slight millisecond jitter (index ms) to prevent simultaneous completion collisions
      const finishTimestamp = now + (remainingSec * 1000) + index;
      return {
        ...upgrade,
        remainingTimeSecondsAdjusted: remainingSec,
        finishDate: new Date(finishTimestamp),
        finishTimestamp
      };
    }).sort((a, b) => a.finishTimestamp - b.finishTimestamp);

    const staggerGaps = [];
    for (let i = 0; i < activeTimeline.length - 1; i++) {
      const gapSeconds = Math.max(0, Math.round((activeTimeline[i + 1].finishTimestamp - activeTimeline[i].finishTimestamp) / 1000));
      staggerGaps.push({
        builderPair: `Builder ${i + 1} & Builder ${i + 2}`,
        gapSeconds,
        gapFormatted: this.formatDuration(gapSeconds)
      });
    }

    const armyAnalysis = MetaArmyEvaluator.evaluateArmyReadiness(villageState);
    const layoutPriorities = BaseLayoutEvaluator.getAnti3StarPriorities(villageState);

    return {
      activeTimeline,
      staggerGaps,
      availableBuildersCount: freeBuilders,
      totalBuilders,
      armyAnalysis,
      layoutPriorities
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
  module.exports = { BuilderScheduler, MetaArmyEvaluator, BaseLayoutEvaluator };
}
// Oct 4 Audit V9
// Oct 4 Audit V10
// Oct 4 Audit V11
// Oct 4 Audit V12
