import { GameState } from './GameState';
import { ASCENSION_UPGRADES } from '../config/AscensionData';
import { EventBus, Events } from '../systems/EventBus';
import { HeroManager } from './HeroManager';
import { toBigNum } from '../systems/BigNumber';
import { CrazyGamesSDK } from '../integrations/CrazyGamesSDK';

export const AscensionManager = {
  canAscend(): boolean {
    return GameState.stats.maxZoneReached >= 100;
  },

  getSigmaSoulsReward(): number {
    const maxZone = GameState.stats.maxZoneReached;
    if (maxZone < 75) return 0;
    const presBonus = GameState.stats.totalAscensions * 0.1;
    return Math.floor((maxZone - 75) * 0.5 * (1 + presBonus));
  },

  ascend(): boolean {
    if (!AscensionManager.canAscend()) return false;

    const soulsEarned = AscensionManager.getSigmaSoulsReward();
    GameState.sigmaSOuls += soulsEarned;
    GameState.stats.totalSigmaSouls += soulsEarned;
    GameState.stats.totalAscensions += 1;

    // Reset progress
    GameState.gold = toBigNum(0);
    GameState.totalGoldEarned = toBigNum(0);
    GameState.zone = 1;
    GameState.enemyKillCount = 0;
    GameState.dpsMultiplier = toBigNum(1);
    GameState.goldMultiplier = toBigNum(1);
    GameState.critChance = 0.05;
    GameState.critMultiplier = 3;
    GameState.bossTimerActive = false;
    GameState.bossTimeRemaining = 0;

    // Reset heroes
    for (const hero of GameState.heroes) {
      hero.level = 0;
    }

    // Reset skills
    for (const skill of GameState.skills) {
      skill.cooldownRemaining = 0;
      skill.durationRemaining = 0;
      skill.isActive = false;
    }

    // Apply ascension bonuses immediately
    AscensionManager.applyAllBonuses();

    HeroManager.recalculateDPS();
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
    return GameState.sigmaSOuls >= cost;
  },

  buyUpgrade(upgradeId: string): boolean {
    if (!AscensionManager.canAffordUpgrade(upgradeId)) return false;
    const upgDef = ASCENSION_UPGRADES.find(u => u.id === upgradeId);
    if (!upgDef) return false;
    const currentLevel = AscensionManager.getUpgradeLevel(upgradeId);
    const cost = upgDef.cost * (currentLevel + 1);
    GameState.sigmaSOuls -= cost;

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
