import { Decimal, toBigNum } from '../systems/BigNumber';

export const BalanceConfig = {
  // Zone settings
  MAX_ZONES: 410,
  ENEMIES_PER_ZONE: 10,
  BOSS_ZONE_INTERVAL: 5,  // Boss every 5 zones
  BOSS_HP_MULTIPLIER: 10,
  BOSS_TIMER_SECONDS: 30,

  // Gold
  BASE_GOLD: 2,
  GOLD_ZONE_EXPONENT: 1.3,

  // Hero
  HERO_COST_GROWTH: 1.15,
  HERO_MILESTONE_INTERVAL: 25,  // Every 25 levels
  HERO_MILESTONE_MULTIPLIER: 4, // x4 DPS

  // Enemy HP
  BASE_ENEMY_HP: 10,
  ENEMY_HP_GROWTH: 1.55,

  // Click damage
  CLICK_DPS_RATIO: 0.01,    // Click deals 1% of total DPS (Sigma Strike)
  MIN_CLICK_DAMAGE: 1,

  // Auto-save interval in ms
  AUTO_SAVE_INTERVAL: 30000,

  enemyHP(zone: number): Decimal {
    return toBigNum(BalanceConfig.BASE_ENEMY_HP).mul(
      toBigNum(BalanceConfig.ENEMY_HP_GROWTH).pow(zone)
    );
  },

  bossHP(zone: number): Decimal {
    return BalanceConfig.enemyHP(zone).mul(BalanceConfig.BOSS_HP_MULTIPLIER);
  },

  goldPerKill(zone: number, goldMultiplier: Decimal): Decimal {
    // New Exponential Base: 1 multiplied by 1.5 for every zone reached
    // Zone 1 = 1, Zone 2 = 1.5, Zone 3 = 2.25, etc.
    const baseGold = toBigNum(BalanceConfig.GOLD_ZONE_EXPONENT).pow(zone - 1);
    return baseGold.mul(goldMultiplier).floor();
  },

  heroCost(baseCost: number, level: number): Decimal {
    return toBigNum(baseCost).mul(
      toBigNum(BalanceConfig.HERO_COST_GROWTH).pow(level)
    ).floor();
  },

  heroDPS(baseDPS: number, level: number, milestoneBonus: number): Decimal {
    if (level <= 0) return toBigNum(0);
    return toBigNum(baseDPS)
      .mul(level)
      .mul(toBigNum(1 + milestoneBonus));
  },

  getMilestoneBonus(level: number): number {
    const milestones = Math.floor(level / BalanceConfig.HERO_MILESTONE_INTERVAL);
    // Each milestone doubles the multiplier: 1, 2, 4, 8, ...
    return Math.pow(BalanceConfig.HERO_MILESTONE_MULTIPLIER, milestones) - 1;
  },
};
