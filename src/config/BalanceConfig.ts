import { Decimal, toBigNum } from '../systems/BigNumber';

export const BalanceConfig = {
  // Zone settings
  MAX_ZONES: 200,
  ENEMIES_PER_ZONE: 10,
  BOSS_ZONE_INTERVAL: 5,  // Boss every 5 zones
  BOSS_HP_MULTIPLIER: 10,
  BOSS_TIMER_SECONDS: 30,

  // Gold
  BASE_GOLD: 2,
  GOLD_ZONE_EXPONENT: 1.3,

  // Hero
  HERO_COST_GROWTH: 1.07,
  HERO_MILESTONE_INTERVAL: 25,  // Every 25 levels
  HERO_MILESTONE_MULTIPLIER: 2, // x2 DPS

  // Enemy HP
  BASE_ENEMY_HP: 10,
  ENEMY_HP_GROWTH: 1.55,

  // Click damage
  CLICK_DPS_RATIO: 0.05,    // Click deals 5% of total DPS
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
    const baseGold = toBigNum(BalanceConfig.BASE_GOLD);
    // Polynomial part: early game feel
    const polyPart = Math.pow(zone + 1, BalanceConfig.GOLD_ZONE_EXPONENT);
    // Exponential part: keeps up with HP growth (1.55^zone) at ~70% of its rate
    const expPart = Math.pow(1.35, zone / 5);
    return baseGold.mul(polyPart * expPart).mul(goldMultiplier).floor();
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
