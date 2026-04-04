import { Decimal, toBigNum } from '../systems/BigNumber';
import { GameState } from './GameState';
import { GoldManager } from './GoldManager';
import { EventBus, Events } from '../systems/EventBus';
import { BalanceConfig } from '../config/BalanceConfig';
import { HERO_DATA } from '../config/HeroData';
import { SKILL_DATA } from '../config/SkillData';
import { AscensionManager } from './AscensionManager';
import { AchievementManager } from './AchievementManager';
import { RelicManager } from './RelicManager';
import { AdManager } from '../integrations/AdManager';

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
    const adMult = AdManager.getDPSMultiplier();
    return total.mul(ascMult).mul(achMult).mul(relicMult).mul(adMult);
  },

  canBuyHero(heroIndex: number): boolean {
    if (heroIndex === 0) return true; // Nous is always buyable
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

    this.recalculateDPS();

    EventBus.emit(Events.HERO_BOUGHT, heroIndex, state.level);
    return true;
  },

  recalculateDPS(): void {
    const skillMult = HeroManager.getSkillDPSMultiplier();
    GameState.dpsMultiplier = skillMult;
    
    const rawDPS = HeroManager.getTotalDPS();
    const effectiveDPS = rawDPS.mul(skillMult);
    GameState.totalDPS = effectiveDPS;
    EventBus.emit(Events.DPS_CHANGED, effectiveDPS);
  },

  getSkillDPSMultiplier(): Decimal {
    let mult = toBigNum(1);
    
    // Check all active skills and combine their multipliers correctly
    GameState.skills.forEach(s => {
      if (!s.isActive) return;
      
      if (s.id === 'sigma_grindset') {
        const idx = SKILL_DATA.findIndex(def => def.id === 'sigma_grindset');
        const power = GameState.getSkillPower(idx);
        mult = mult.mul(5 * power);
      } else if (s.id === 'ohio_mode' && s.activeMultiplier) {
        mult = mult.mul(s.activeMultiplier);
      }
    });

    return mult;
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

// Periodic checks
EventBus.on(Events.RELIC_DROPPED, () => { HeroManager.recalculateDPS(); });
EventBus.on(Events.ACHIEVEMENT_UNLOCKED, () => { HeroManager.recalculateDPS(); });
