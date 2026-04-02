import { Decimal, toBigNum, bigNumZero } from '../systems/BigNumber';
import { HERO_DATA } from '../config/HeroData';

export interface HeroState {
  id: string;
  level: number;
}

export interface EnemyState {
  name: string;
  currentHP: Decimal;
  maxHP: Decimal;
  isBoss: boolean;
  killCount: number;
}

export interface SkillSaveState {
  id: string;
  cooldownRemaining: number;
  durationRemaining: number;
  isActive: boolean;
}

export interface AscensionUpgradeState {
  id: string;
  level: number;
}

export interface RelicInstance {
  id: string;
  name: string;
  rarity: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  statType: string;
  statValue: number;
  emoji: string;
}

export interface QuestInstance {
  id: string;
  name: string;
  description: string;
  type: string;
  target: number;
  current: number;
  completed: boolean;
  reward: number;
}

export interface PlayerStats {
  totalKills: number;
  bossKills: number;
  totalCrits: number;
  skillsUsed: number;
  skillsUsedById: number[];
  questsCompleted: number;
  totalAscensions: number;
  totalSigmaSouls: number;
  maxZoneReached: number;
  herosBought: number;
}

export interface GameStateData {
  gold: Decimal;
  goldMultiplier: Decimal;
  zone: number;
  enemyKillCount: number;
  heroes: HeroState[];
  totalClicks: number;
  totalGoldEarned: Decimal;
  lastSaveTime: number;
  critChance?: number;
  critMultiplier?: number;
  skills?: SkillSaveState[];
  dpsMultiplier?: string;
  ascensionUpgrades?: AscensionUpgradeState[];
  sigmaSOuls?: number;
  relics?: RelicInstance[];
  achievements?: string[];
  quests?: QuestInstance[];
  questLastReset?: number;
  stats?: PlayerStats;
  doubleGoldExpiry?: number;
}

class GameStateClass {
  // Economy
  gold: Decimal = bigNumZero();
  goldMultiplier: Decimal = toBigNum(1);
  totalGoldEarned: Decimal = bigNumZero();

  // Zone
  zone: number = 1;
  enemyKillCount: number = 0;

  // Enemy
  currentEnemy: EnemyState = {
    name: 'Slime',
    currentHP: toBigNum(10),
    maxHP: toBigNum(10),
    isBoss: false,
    killCount: 0,
  };

  // Heroes
  heroes: HeroState[] = HERO_DATA.map(h => ({ id: h.id, level: 0 }));

  // Stats
  totalClicks: number = 0;
  totalDPS: Decimal = bigNumZero();

  // Boss timer
  bossTimerActive: boolean = false;
  bossTimeRemaining: number = 0;

  // Crit system
  critChance: number = 0.05;
  critMultiplier: number = 3;

  // Skills
  skills: SkillSaveState[] = [];
  dpsMultiplier: Decimal = toBigNum(1);

  // Save tracking
  lastSaveTime: number = 0;

  // Phase 3: Ascension
  ascensionUpgrades: AscensionUpgradeState[] = [];
  sigmaSOuls: number = 0;

  // Phase 3: Relics
  relics: RelicInstance[] = [];

  // Phase 3: Achievements
  achievements: string[] = [];

  // Phase 3: Quests
  quests: QuestInstance[] = [];
  questLastReset: number = 0;

  // Phase 4: Ad reward tracking
  doubleGoldExpiry: number = 0;

  // Phase 3: Player stats
  stats: PlayerStats = {
    totalKills: 0,
    bossKills: 0,
    totalCrits: 0,
    skillsUsed: 0,
    skillsUsedById: [0, 0, 0, 0, 0, 0, 0],
    questsCompleted: 0,
    totalAscensions: 0,
    totalSigmaSouls: 0,
    maxZoneReached: 0,
    herosBought: 0,
  };

  serialize(): GameStateData {
    return {
      gold: this.gold,
      goldMultiplier: this.goldMultiplier,
      zone: this.zone,
      enemyKillCount: this.enemyKillCount,
      heroes: this.heroes.map(h => ({ ...h })),
      totalClicks: this.totalClicks,
      totalGoldEarned: this.totalGoldEarned,
      lastSaveTime: this.lastSaveTime,
      critChance: this.critChance,
      critMultiplier: this.critMultiplier,
      skills: this.skills.map(s => ({ ...s })),
      dpsMultiplier: this.dpsMultiplier.toString(),
      ascensionUpgrades: this.ascensionUpgrades.map(u => ({ ...u })),
      sigmaSOuls: this.sigmaSOuls,
      relics: this.relics.map(r => ({ ...r })),
      achievements: [...this.achievements],
      quests: this.quests.map(q => ({ ...q })),
      questLastReset: this.questLastReset,
      stats: { ...this.stats, skillsUsedById: [...this.stats.skillsUsedById] },
      doubleGoldExpiry: this.doubleGoldExpiry,
    };
  }

  deserialize(data: GameStateData): void {
    this.gold = toBigNum(data.gold.toString());
    this.goldMultiplier = toBigNum(data.goldMultiplier?.toString() ?? '1');
    this.zone = data.zone;
    this.enemyKillCount = data.enemyKillCount;
    this.heroes = data.heroes.map(h => ({ ...h }));
    this.totalClicks = data.totalClicks;
    this.totalGoldEarned = toBigNum(data.totalGoldEarned?.toString() ?? '0');
    this.lastSaveTime = data.lastSaveTime ?? 0;
    this.critChance = data.critChance ?? 0.05;
    this.critMultiplier = data.critMultiplier ?? 3;
    this.skills = data.skills ?? [];
    this.dpsMultiplier = data.dpsMultiplier ? toBigNum(data.dpsMultiplier) : toBigNum(1);
    this.ascensionUpgrades = data.ascensionUpgrades ?? [];
    this.sigmaSOuls = data.sigmaSOuls ?? 0;
    this.relics = data.relics ?? [];
    this.achievements = data.achievements ?? [];
    this.quests = data.quests ?? [];
    this.questLastReset = data.questLastReset ?? 0;
    this.doubleGoldExpiry = data.doubleGoldExpiry ?? 0;
    this.stats = data.stats ?? {
      totalKills: 0,
      bossKills: 0,
      totalCrits: 0,
      skillsUsed: 0,
      skillsUsedById: [0, 0, 0, 0, 0, 0, 0],
      questsCompleted: 0,
      totalAscensions: 0,
      totalSigmaSouls: 0,
      maxZoneReached: 0,
      herosBought: 0,
    };
    // Ensure skillsUsedById has correct length
    while (this.stats.skillsUsedById.length < 7) {
      this.stats.skillsUsedById.push(0);
    }
  }
}

export const GameState = new GameStateClass();
