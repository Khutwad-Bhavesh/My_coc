/**
 * Builder Priority, Meta Army Evaluator & Stagger Optimization Scheduler
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
    }
  ];

  static evaluateArmyReadiness(villageState) {
    return this.META_ARMIES.map(army => {
      let score = army.metaScore;
      const missingReqs = [];

      // Check key defense / offense building levels
      army.keyBuildings.forEach(bName => {
        const found = villageState.buildings.find(b => b.name.toLowerCase().includes(bName.toLowerCase()));
        if (!found || found.isUpgrading) {
          missingReqs.push(`Upgrade ${bName}`);
        }
      });

      return {
        armyName: army.name,
        metaScore: score,
        difficulty: army.difficulty,
        readinessPercent: missingReqs.length === 0 ? 100 : Math.max(60, 100 - (missingReqs.length * 15)),
        recommendations: missingReqs
      };
    });
  }
}

class BaseLayoutEvaluator {
  static getAnti3StarPriorities(villageState) {
    const keyDefenses = ['Monolith', 'Eagle Artillery', 'Scattershot', 'Spell Tower', 'Air Defense'];
    const candidates = villageState.buildings.filter(b => keyDefenses.some(kd => b.name.includes(kd)));

    return candidates.sort((a, b) => {
      // Prioritize non-maxed & not currently upgrading defenses
      if (a.isUpgrading && !b.isUpgrading) return 1;
      if (!a.isUpgrading && b.isUpgrading) return -1;
      return (b.maxLevel - b.level) - (a.maxLevel - a.level);
    });
  }
}

class BuilderScheduler {
  /**
   * Calculate dynamic staggered schedule considering Gold Pass & Builder Potions
   */
  static generateSchedule(villageState, options = {}) {
    const { activeUpgrades, freeBuilders, totalBuilders } = villageState;
    const potionMultiplier = options.builderPotionActive ? 10 : 1; // 10x speed boost

    const activeTimeline = activeUpgrades.map(upgrade => {
      const remainingSec = Math.round(upgrade.remainingTimeSeconds / potionMultiplier);
      const finishTimestamp = Date.now() + (remainingSec * 1000);
      return {
        ...upgrade,
        remainingTimeSecondsAdjusted: remainingSec,
        finishDate: new Date(finishTimestamp),
        finishTimestamp
      };
    }).sort((a, b) => a.finishTimestamp - b.finishTimestamp);

    const staggerGaps = [];
    for (let i = 0; i < activeTimeline.length - 1; i++) {
      const gapSeconds = Math.round((activeTimeline[i + 1].finishTimestamp - activeTimeline[i].finishTimestamp) / 1000);
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
