/**
 * Universal Clash of Clans Export JSON Parser
 * Supports both Supercell official raw game data export payloads (data integer IDs + timer keys)
 * AND human-readable key JSON objects.
 */

class CoCParser {
  static GAME_DATA_NAME_MAP = {
    1000001: "Town Hall",
    1000002: "Gold Storage",
    1000003: "Elixir Collector",
    1000004: "Elixir Storage",
    1000005: "Cannon",
    1000006: "Builder Hut",
    1000007: "Laboratory",
    1000008: "Archer Tower",
    1000009: "Mortar",
    1000010: "Wall",
    1000011: "Air Defense",
    1000012: "Wizard Tower",
    1000013: "Air Sweeper",
    1000014: "Hidden Tesla",
    1000015: "Bomb Tower",
    1000019: "X-Bow",
    1000020: "Inferno Tower",
    1000021: "Eagle Artillery",
    1000023: "Scattershot",
    1000024: "Workshop",
    1000026: "Pet House",
    1000027: "Spell Tower",
    1000028: "Monolith",
    1000072: "Builder Apprentice Task",
    28000000: "Barbarian King",
    28000001: "Archer Queen",
    28000002: "Grand Warden",
    28000003: "Battle Machine",
    28000004: "Royal Champion",
    28000005: "Battle Copter",
    28000006: "Minion Prince"
  };

  static escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

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

    const goldPassBoost = Math.max(0, Math.min(20, Number(data.goldPassBoost) || 0));
    const boostMultiplier = 1 - (goldPassBoost / 100);

    const activeUpgrades = [];
    const parsedBuildings = [];

    // Helper to resolve building/hero name
    const resolveName = (item, defaultCategory = 'Building') => {
      if (item.name) return this.escapeHTML(item.name);
      if (item.data && this.GAME_DATA_NAME_MAP[item.data]) {
        return this.GAME_DATA_NAME_MAP[item.data];
      }
      return `${defaultCategory} #${item.data || 'Unknown'}`;
    };

    // 1. Process Home Village Buildings
    const rawBuildings = Array.isArray(data.buildings) ? data.buildings : [];
    let detectedTHLevel = Number(data.townHallLevel) || 1;

    rawBuildings.forEach((b, index) => {
      // Auto-detect Town Hall level from building data 1000001
      if (b.data === 1000001) {
        detectedTHLevel = Math.max(detectedTHLevel, Number(b.lvl) || 15);
      }

      const name = resolveName(b, 'Structure');
      const level = Math.max(1, Number(b.lvl || b.level) || 1);
      const remainingSec = Math.max(0, Number(b.timer || b.remainingTimeSeconds) || 0);
      const isUpgrading = Boolean(b.isUpgrading || remainingSec > 0);

      const parsedItem = {
        id: b.id ? this.escapeHTML(b.id) : `b_${b.data || index}`,
        name,
        level,
        maxLevel: Math.max(level, Number(b.maxLevel) || level + 1),
        isUpgrading,
        upgradeCost: Math.max(0, Number(b.upgradeCost) || 0),
        resourceType: this.escapeHTML(b.resourceType || (name.includes('King') || name.includes('Queen') || name.includes('Warden') ? 'darkElixir' : 'gold')),
        upgradeTimeSeconds: Math.round((Number(b.upgradeTimeSeconds) || remainingSec) * boostMultiplier),
        remainingTimeSeconds: remainingSec
      };

      parsedBuildings.push(parsedItem);

      if (isUpgrading && remainingSec > 0) {
        activeUpgrades.push(parsedItem);
      }
    });

    // 2. Process Home Village Heroes
    const rawHeroes = Array.isArray(data.heroes) ? data.heroes : [];
    rawHeroes.forEach((h, index) => {
      const remainingSec = Math.max(0, Number(h.timer || h.remainingTimeSeconds) || 0);
      if (remainingSec > 0 || h.isUpgrading) {
        const name = resolveName(h, 'Hero');
        const level = Math.max(1, Number(h.lvl || h.level) || 1);
        const heroItem = {
          id: `hero_${h.data || index}`,
          name: `${name} (Hero Upgrade)`,
          level,
          maxLevel: 95,
          isUpgrading: true,
          upgradeCost: 0,
          resourceType: 'darkElixir',
          upgradeTimeSeconds: remainingSec,
          remainingTimeSeconds: remainingSec
        };
        activeUpgrades.push(heroItem);
      }
    });

    // 3. Process Builder Base Heroes (heroes2)
    const rawHeroes2 = Array.isArray(data.heroes2) ? data.heroes2 : [];
    rawHeroes2.forEach((h, index) => {
      const remainingSec = Math.max(0, Number(h.timer) || 0);
      if (remainingSec > 0) {
        const name = resolveName(h, 'Builder Base Hero');
        activeUpgrades.push({
          id: `bb_hero_${h.data || index}`,
          name: `${name} (Builder Base)`,
          level: Number(h.lvl) || 1,
          maxLevel: 35,
          isUpgrading: true,
          upgradeCost: 0,
          resourceType: 'elixir',
          upgradeTimeSeconds: remainingSec,
          remainingTimeSeconds: remainingSec
        });
      }
    });

    // Determine Total & Free Builders
    const totalBuilders = Math.max(5, Number(data.builderCount) || 6); // Default 6 builders (5 + 6th O.T.T.O / Master Builder)
    const activeBuildersCount = activeUpgrades.length;
    const freeBuildersCount = Math.max(0, totalBuilders - activeBuildersCount);

    return {
      playerTag: this.escapeHTML(data.tag || '#QP9PRY20U'),
      playerName: this.escapeHTML(data.name || 'Chief'),
      townHallLevel: detectedTHLevel,
      totalBuilders,
      activeBuilders: activeBuildersCount,
      freeBuilders: freeBuildersCount,
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
