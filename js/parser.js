/**
 * Clash of Clans JSON Export Parser Module
 * Extracts raw village JSON payload into structured VillageState DTO
 */

class CoCParser {
  /**
   * Parse raw JSON string exported from CoC (Settings -> More Settings -> Export Village Data)
   * @param {string|object} rawInput 
   * @returns {object} VillageState DTO
   */
  static parse(rawInput) {
    let data;
    if (typeof rawInput === 'string') {
      try {
        data = JSON.parse(rawInput);
      } catch (err) {
        throw new Error('Invalid JSON format: Unable to parse village export data.');
      }
    } else {
      data = rawInput;
    }

    const goldPassBoost = data.goldPassBoost || 0; // 0, 10, 15, or 20 percent
    const boostMultiplier = 1 - (goldPassBoost / 100);

    const parsedBuildings = (data.buildings || []).map(b => ({
      id: b.id || b.name.toLowerCase().replace(/\s+/g, '_'),
      name: b.name,
      level: b.level,
      maxLevel: b.maxLevel,
      isUpgrading: Boolean(b.isUpgrading),
      upgradeCost: b.upgradeCost || 0,
      resourceType: b.resourceType || 'gold',
      upgradeTimeSeconds: Math.round((b.upgradeTimeSeconds || 0) * boostMultiplier),
      remainingTimeSeconds: b.remainingTimeSeconds || 0
    }));

    const activeUpgrades = parsedBuildings.filter(b => b.isUpgrading);

    return {
      playerTag: data.tag || 'UNKNOWN',
      playerName: data.name || 'Chief',
      townHallLevel: data.townHallLevel || 1,
      totalBuilders: data.builderCount || 5,
      activeBuilders: activeUpgrades.length,
      freeBuilders: Math.max(0, (data.builderCount || 5) - activeUpgrades.length),
      goldPassBoost,
      resources: data.resources || {},
      buildings: parsedBuildings,
      activeUpgrades,
      laboratory: data.laboratory || null,
      builderBase: data.builderBase || null,
      timestamp: Date.now()
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CoCParser };
}
// Parser validation logic enhanced
