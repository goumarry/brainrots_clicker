import { Decimal, toBigNum, bigNumZero } from '../systems/BigNumber';
import { HERO_DATA } from '../config/HeroData';
import { SKILL_DATA } from '../config/SkillData';

export interface HeroState {
  id: string;
  level: number;
  isUnlocked: boolean;
}

export interface EnemyState {
  name: string;
  currentHP: Decimal;
  maxHP: Decimal;
  isBoss: boolean;
  killCount: number;
  color: number;
}

export interface SkillSaveState {
  id: string;
  cooldownRemaining: number;
  durationRemaining: number;
  isActive: boolean;
  activeMultiplier?: number;
  activeStat?: string;
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
  count: number; // For Diamond stacking
}

export interface PlayerStats {
  totalKills: number;
  bossKills: number;
  totalCrits: number;
  skillsUsed: number;
  skillsUsedById: number[];
  totalAscensions: number;
  totalSigmaSouls: number;
  maxZoneReached: number;
  maxZoneEver: number;
  ascensionRank: number;
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
  sigmaSouls?: number;
  relics?: RelicInstance[];
  achievements?: string[];
  stats?: PlayerStats;
  doubleGoldExpiry?: number;
  goldBoostTimeLeft?: number;
  dpsBoostTimeLeft?: number;
  relicBoostCooldown?: number;
  heroBoostCooldown?: number;
  highestZoneAscended?: number;
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
    color: 0x4a9eff,
  };

  // Heroes
  heroes: HeroState[] = HERO_DATA.map((h, i) => ({
    id: h.id,
    level: i === 0 ? 1 : 0, // 'Nous' starts at level 1
    isUnlocked: i === 0,    // Only 'Nous' is unlocked at start
  }));

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
  sigmaSouls: number = 0;

  // Phase 3: Relics
  relics: RelicInstance[] = [];

  // Phase 3: Achievements
  achievements: string[] = [];

  // Phase 4: Ad reward tracking
  doubleGoldExpiry: number = 0; // Legacy
  goldBoostTimeLeft: number = 0;
  dpsBoostTimeLeft: number = 0;
  relicBoostCooldown: number = 0;
  heroBoostCooldown: number = 0;

  // Phase 3: Player stats
  stats: PlayerStats = {
    totalKills: 0,
    bossKills: 0,
    totalCrits: 0,
    skillsUsed: 0,
    skillsUsedById: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    totalAscensions: 0,
    totalSigmaSouls: 0,
    maxZoneReached: 0,
    maxZoneEver: 1, // Start at 1
    ascensionRank: 0,
    herosBought: 0,
  };

  // Phase 3: Persistent milestone tracking
  highestZoneAscended: number = 0;

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
      sigmaSouls: this.sigmaSouls,
      relics: this.relics.map(r => ({ ...r })),
      achievements: [...this.achievements],
      stats: { ...this.stats, skillsUsedById: [...this.stats.skillsUsedById] },
      doubleGoldExpiry: this.doubleGoldExpiry,
      goldBoostTimeLeft: this.goldBoostTimeLeft,
      dpsBoostTimeLeft: this.dpsBoostTimeLeft,
      relicBoostCooldown: this.relicBoostCooldown,
      heroBoostCooldown: this.heroBoostCooldown,
      highestZoneAscended: this.highestZoneAscended,
    };
  }

  deserialize(data: GameStateData): void {
    this.gold = toBigNum(data.gold.toString());
    this.goldMultiplier = toBigNum(data.goldMultiplier?.toString() ?? '1');
    this.zone = data.zone;
    this.enemyKillCount = data.enemyKillCount;
    this.heroes = data.heroes.map((h, i) => ({
      ...h,
      isUnlocked: h.isUnlocked ?? (i === 0),
    }));
    this.totalClicks = data.totalClicks;
    this.totalGoldEarned = toBigNum(data.totalGoldEarned?.toString() ?? '0');
    this.lastSaveTime = data.lastSaveTime ?? 0;
    this.critChance = data.critChance ?? 0.05;
    this.critMultiplier = data.critMultiplier ?? 3;
    
    // Skill Migration: Always ensure 12 slots mapped by ID
    const savedSkills = data.skills ?? [];
    this.skills = SKILL_DATA.map(def => {
      const saved = savedSkills.find(s => s.id === def.id);
      return {
        id: def.id,
        cooldownRemaining: saved?.cooldownRemaining ?? 0,
        durationRemaining: saved?.durationRemaining ?? 0,
        isActive: saved?.isActive ?? false,
        activeMultiplier: saved?.activeMultiplier,
        activeStat: saved?.activeStat,
      };
    });
    
    this.dpsMultiplier = data.dpsMultiplier ? toBigNum(data.dpsMultiplier) : toBigNum(1);
    this.ascensionUpgrades = data.ascensionUpgrades ?? [];
    this.sigmaSouls = data.sigmaSouls ?? 0;
    this.relics = (data.relics || []).map(r => ({ ...r, count: r.count || 1 }));
    this.doubleGoldExpiry = data.doubleGoldExpiry ?? 0;
    this.goldBoostTimeLeft = data.goldBoostTimeLeft ?? 0;
    this.dpsBoostTimeLeft = data.dpsBoostTimeLeft ?? 0;
    this.relicBoostCooldown = data.relicBoostCooldown ?? 0;
    this.heroBoostCooldown = data.heroBoostCooldown ?? 0;
    this.highestZoneAscended = (data as any).highestZoneAscended ?? 0;
    this.stats = {
      totalKills: 0,
      bossKills: 0,
      totalCrits: 0,
      skillsUsed: 0,
      skillsUsedById: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      totalAscensions: 0,
      totalSigmaSouls: 0,
      maxZoneReached: 0,
      maxZoneEver: 1,
      ascensionRank: 0,
      herosBought: 0,
      ...(data.stats || {}),
    };
    // Ensure skillsUsedById has correct length
    while (this.stats.skillsUsedById.length < 12) {
      this.stats.skillsUsedById.push(0);
    }
  }

  getSkillPower(index: number): number {
    const unlockedCount = this.heroes.filter(h => h.level > 0).length;
    return Math.max(1, 1 + Math.floor((unlockedCount - 1 - index) / 12));
  }
}

export const GameState = new GameStateClass();
