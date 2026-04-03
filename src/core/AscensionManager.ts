import { GameState } from './GameState';
import { ASCENSION_UPGRADES } from '../config/AscensionData';
import { EventBus, Events } from '../systems/EventBus';
import { HeroManager } from './HeroManager';
import { EnemyManager } from './EnemyManager';
import { toBigNum } from '../systems/BigNumber';
import { CrazyGamesSDK } from '../integrations/CrazyGamesSDK';

export const AscensionManager = {
  canAscend(): boolean {
    const nextMilestone = (Math.floor(GameState.highestZoneAscended / 10) + 1) * 10;
    // To ensure boss of nextMilestone is beaten, we must be AT zone (nextMilestone + 1)
    const finalTarget = nextMilestone + 1;
    return GameState.zone >= finalTarget;
  },

  getSigmaSoulsReward(): number {
    const currentZone = GameState.zone;
    const highest = GameState.highestZoneAscended;
    
    let total = 0;
    // Current milestone counts depend on BEATEN zones (zone - 1)
    const currentMilestoneCount = Math.floor((currentZone - 1) / 10);
    const highestMilestoneCount = Math.floor(highest / 10);

    for (let i = highestMilestoneCount + 1; i <= currentMilestoneCount; i++) {
        // Milestone 1 (Zone 10) = 5 * 2^0 = 5
        // Milestone 2 (Zone 20) = 5 * 2^1 = 10
        total += 5 * Math.pow(2, i - 1);
    }
    return total;
  },

  ascend(): boolean {
    if (!AscensionManager.canAscend()) return false;

    const soulsEarned = AscensionManager.getSigmaSoulsReward();
    
    // Update sigma soul milestone persistence (multiples of 10 fully BEATEN)
    const currentMilestoneZone = Math.floor((GameState.zone - 1) / 10) * 10;
    if (currentMilestoneZone > GameState.highestZoneAscended) {
        GameState.highestZoneAscended = currentMilestoneZone;
    }
    
    // NOTE: relicLockZone is removed, we use stats.maxZoneEver now.

    GameState.sigmaSouls += soulsEarned;
    GameState.stats.totalSigmaSouls += soulsEarned;
    GameState.stats.totalAscensions += 1;

    // Reset progress
    GameState.gold = toBigNum(0);
    GameState.totalGoldEarned = toBigNum(0);
    GameState.totalClicks = 0;
    GameState.zone = 1;
    GameState.enemyKillCount = 0;
    GameState.dpsMultiplier = toBigNum(1);
    GameState.goldMultiplier = toBigNum(1);
    GameState.critChance = 0.05;
    GameState.critMultiplier = 3;
    GameState.bossTimerActive = false;
    GameState.bossTimeRemaining = 0;

    // Reset run-specific stats (Milestone update moved to top)
    GameState.stats.maxZoneReached = 1;

    // Reset heroes (First one unlocked, others locked)
    GameState.heroes.forEach((hero, index) => {
      hero.level = index === 0 ? 1 : 0;
      hero.isUnlocked = index === 0;
    });

    // Reset skills
    for (const skill of GameState.skills) {
      skill.cooldownRemaining = 0;
      skill.durationRemaining = 0;
      skill.isActive = false;
    }

    // Apply ascension bonuses immediately
    AscensionManager.applyAllBonuses();

    HeroManager.recalculateDPS();
    EnemyManager.initialSpawn();
    CrazyGamesSDK.happyTime();
    EventBus.emit(Events.ASCENSION_COMPLETE, soulsEarned);
    return true;
  },

  getUpgradeLevel(upgradeId: string): number {
    const found = GameState.ascensionUpgrades.find(u => u.id === upgradeId);
    return found?.level ?? 0;
  },

  canAffordUpgrade(upgradeId: string): boolean {
    const upgDef = ASCENSION_UPGRADES.find(u => u.id === upgradeId);
    if (!upgDef) return false;
    const currentLevel = AscensionManager.getUpgradeLevel(upgradeId);
    if (currentLevel >= upgDef.maxLevel) return false;
    const cost = upgDef.cost * (currentLevel + 1);
    return GameState.sigmaSouls >= cost;
  },

  buyUpgrade(upgradeId: string): boolean {
    if (!AscensionManager.canAffordUpgrade(upgradeId)) return false;
    const upgDef = ASCENSION_UPGRADES.find(u => u.id === upgradeId);
    if (!upgDef) return false;
    const currentLevel = AscensionManager.getUpgradeLevel(upgradeId);
    const cost = upgDef.cost * (currentLevel + 1);
    GameState.sigmaSouls -= cost;

    let entry = GameState.ascensionUpgrades.find(u => u.id === upgradeId);
    if (!entry) {
      entry = { id: upgradeId, level: 0 };
      GameState.ascensionUpgrades.push(entry);
    }
    entry.level += 1;

    AscensionManager.applyAllBonuses();
    HeroManager.recalculateDPS();
    return true;
  },

  getTotalBonus(effectType: string): number {
    let total = 0;
    for (const upg of ASCENSION_UPGRADES) {
      if (upg.effectType === effectType) {
        const level = AscensionManager.getUpgradeLevel(upg.id);
        total += upg.effectValue * level;
      }
    }
    return total;
  },

  applyAllBonuses(): void {
    // Bonuses are read dynamically — no-op here
  },

  getDPSAscensionMult(): number {
    return 1 + AscensionManager.getTotalBonus('dps_mult');
  },

  getGoldAscensionMult(): number {
    return 1 + AscensionManager.getTotalBonus('gold_mult');
  },

  getClickAscensionMult(): number {
    return 1 + AscensionManager.getTotalBonus('click_mult');
  },

  getCritChanceBonus(): number {
    return AscensionManager.getTotalBonus('crit_chance');
  },

  getCritMultBonus(): number {
    return AscensionManager.getTotalBonus('crit_mult');
  },

  getCooldownReduction(): number {
    return Math.min(0.75, AscensionManager.getTotalBonus('cooldown_reduction'));
  },

  getOfflineMult(): number {
    return 1 + AscensionManager.getTotalBonus('offline_mult');
  },
};
