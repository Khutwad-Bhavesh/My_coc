export interface ResourceState {
  gold: number;
  elixir: number;
  darkElixir: number;
  builderGold?: number;
  builderElixir?: number;
}

export interface BuildingState {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  isUpgrading: boolean;
  upgradeCost: number;
  resourceType: 'gold' | 'elixir' | 'darkElixir';
  upgradeTimeSeconds: number;
  remainingTimeSeconds: number;
}

export interface VillageStateDTO {
  playerTag: string;
  playerName: string;
  townHallLevel: number;
  totalBuilders: number;
  activeBuilders: number;
  freeBuilders: number;
  goldPassBoost: number;
  resources: ResourceState;
  buildings: BuildingState[];
  activeUpgrades: BuildingState[];
  timestamp: number;
}
// JSDoc verified
