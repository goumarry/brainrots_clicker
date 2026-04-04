import { Decimal } from '../systems/BigNumber';
import { GameState } from './GameState';
import { GoldManager } from './GoldManager';
import { EventBus, Events } from '../systems/EventBus';
import { BalanceConfig } from '../config/BalanceConfig';
import { HERO_DATA } from '../config/HeroData';
import { AscensionManager } from './AscensionManager';
import { AchievementManager } from './AchievementManager';
import { RelicManager } from './RelicManager';

export const HeroManager = {
  getHeroCost(heroIndex: number): Decimal {
    const hero = HERO_DATA[heroIndex];
    const state = GameState.heroes[heroIndex];
    return BalanceConfig.heroCost(hero.baseCost, state.level);
  },

  getHeroDPS(heroIndex: number): Decimal {
    const hero = HERO_DATA[heroIndex];
    const state = GameState.heroes[heroIndex];
    const milestoneBonus = BalanceConfig.getMilestoneBonus(state.level);
    return BalanceConfig.heroDPS(hero.baseDPS, state.level, milestoneBonus);
  },

  getTotalDPS(): Decimal {
    let total = new Decimal(0);
    for (let i = 0; i < HERO_DATA.length; i++) {
        const h = GameState.heroes[i];
        if (h.level > 0) {
            total = total.add(HeroManager.getHeroDPS(i));
        }
    }
    const ascMult = AscensionManager.getDPSAscensionMult();
    const achMult = 1 + AchievementManager.getTotalRewardMult('dps_mult');
    const relicMult = 1 + RelicManager.getTotalBonus('dps_mult');
    return total.mul(ascMult).mul(achMult).mul(relicMult);
  },

  canBuyHero(heroIndex: number): boolean {
    if (heroIndex === 0) return true; // Gigachad is always buyable
    const prevHeroState = GameState.heroes[heroIndex - 1];
    return prevHeroState.level > 0;
  },

  buyHero(heroIndex: number): boolean {
    if (!HeroManager.canBuyHero(heroIndex)) return false;

    const cost = HeroManager.getHeroCost(heroIndex);
    if (!GoldManager.canAfford(cost)) return false;

    GoldManager.spendGold(cost);
    const state = GameState.heroes[heroIndex];
    if (!state.isUnlocked) return false;

    state.level += 1;
    if (state.level === 1) {
      GameState.stats.herosBought += 1;
    }

    // UPDATED: Recalculate DPS but REMOVED AchievementManager.checkAll() from hot path
    // Achievements are checked periodically in GameUI.ts every 0.1s
    this.recalculateDPS();

    EventBus.emit(Events.HERO_BOUGHT, heroIndex, state.level);
    return true;
  },

  recalculateDPS(): void {
    const rawDPS = HeroManager.getTotalDPS();
    const effectiveDPS = rawDPS.mul(GameState.dpsMultiplier);
    GameState.totalDPS = effectiveDPS;
    EventBus.emit(Events.DPS_CHANGED, effectiveDPS);
  },

  unlockHero(heroIndex: number): void {
    if (heroIndex < 0 || heroIndex >= GameState.heroes.length) return;
    if (GameState.heroes[heroIndex].isUnlocked) return;

    GameState.heroes[heroIndex].isUnlocked = true;
    EventBus.emit(Events.HERO_BOUGHT, heroIndex, 0); 
  },

  getMilestoneLevel(heroIndex: number): number {
    const level = GameState.heroes[heroIndex].level;
    return Math.floor(level / BalanceConfig.HERO_MILESTONE_INTERVAL) * BalanceConfig.HERO_MILESTONE_INTERVAL;
  },

  getNextMilestone(heroIndex: number): number {
    const level = GameState.heroes[heroIndex].level;
    const current = Math.floor(level / BalanceConfig.HERO_MILESTONE_INTERVAL);
    return (current + 1) * BalanceConfig.HERO_MILESTONE_INTERVAL;
  },
  
  getHeroLevelClickMult(): number {
    let totalLevels = 0;
    for (const h of GameState.heroes) {
      totalLevels += h.level;
    }
    return Math.pow(1.1, Math.floor(totalLevels / 5));
  },
};

// Periodic checks handled in UI loop
EventBus.on(Events.RELIC_DROPPED, () => { HeroManager.recalculateDPS(); });
EventBus.on(Events.ACHIEVEMENT_UNLOCKED, () => { HeroManager.recalculateDPS(); });
