/**
 * Clash of Clans JSON Export Parser Module (Hardened V2)
 * Extracts raw village JSON payload into structured VillageState DTO with XSS sanitization
 */

class CoCParser {
  /**
   * Escape HTML entities to prevent XSS script injection vulnerabilities
   */
  static escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

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
      data = rawInput || {};
    }

    const goldPassBoost = Math.max(0, Math.min(20, Number(data.goldPassBoost) || 0)); // Clamp 0-20%
    const boostMultiplier = 1 - (goldPassBoost / 100);

    const rawBuildings = Array.isArray(data.buildings) ? data.buildings : [];
    const parsedBuildings = rawBuildings.map(b => {
      const name = this.escapeHTML(b.name || 'Structure');
      const id = b.id ? this.escapeHTML(b.id) : name.toLowerCase().replace(/\s+/g, '_');
      const upgradeTimeSec = Math.max(0, Number(b.upgradeTimeSeconds) || 0);
      const remainingSec = Math.max(0, Number(b.remainingTimeSeconds) || 0);

      return {
        id,
        name,
        level: Math.max(1, Number(b.level) || 1),
        maxLevel: Math.max(1, Number(b.maxLevel) || 1),
        isUpgrading: Boolean(b.isUpgrading),
        upgradeCost: Math.max(0, Number(b.upgradeCost) || 0),
        resourceType: this.escapeHTML(b.resourceType || 'gold'),
        upgradeTimeSeconds: Math.round(upgradeTimeSec * boostMultiplier),
        remainingTimeSeconds: remainingSec
      };
    });

    const activeUpgrades = parsedBuildings.filter(b => b.isUpgrading);
    const totalBuilders = Math.max(1, Math.min(6, Number(data.builderCount) || 5));

    return {
      playerTag: this.escapeHTML(data.tag || '#UNKNOWN'),
      playerName: this.escapeHTML(data.name || 'Chief'),
      townHallLevel: Math.max(1, Math.min(16, Number(data.townHallLevel) || 1)),
      totalBuilders,
      activeBuilders: activeUpgrades.length,
      freeBuilders: Math.max(0, totalBuilders - activeUpgrades.length),
      goldPassBoost,
      resources: data.resources || {},
      buildings: parsedBuildings,
      activeUpgrades,
      laboratory: data.laboratory ? {
        isUpgrading: Boolean(data.laboratory.isUpgrading),
        unitName: this.escapeHTML(data.laboratory.unitName || 'Troop'),
        targetLevel: Number(data.laboratory.targetLevel) || 1,
        remainingTimeSeconds: Math.max(0, Number(data.laboratory.remainingTimeSeconds) || 0)
      } : null,
      builderBase: data.builderBase || null,
      timestamp: Date.now()
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CoCParser };
}
// Oct 4 Audit V1
// Oct 4 Audit V2
