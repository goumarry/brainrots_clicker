import { Decimal, toBigNum } from '../systems/BigNumber';
import { GameState } from './GameState';
import { EventBus, Events } from '../systems/EventBus';
import { BalanceConfig } from '../config/BalanceConfig';
import { AscensionManager } from './AscensionManager';
import { AchievementManager } from './AchievementManager';
import { HeroManager } from './HeroManager';
import { RelicManager } from './RelicManager';
import { AdManager } from '../integrations/AdManager';

export const GoldManager = {
  addGold(amount: Decimal): void {
    GameState.gold = GameState.gold.add(amount);
    GameState.totalGoldEarned = GameState.totalGoldEarned.add(amount);
    EventBus.emit(Events.GOLD_CHANGED, GameState.gold);
  },

  spendGold(amount: Decimal): boolean {
    if (GameState.gold.lt(amount)) return false;
    GameState.gold = GameState.gold.sub(amount);
    EventBus.emit(Events.GOLD_CHANGED, GameState.gold);
    return true;
  },

  canAfford(amount: Decimal): boolean {
    return GameState.gold.gte(amount);
  },

  awardKillGold(zone: number, isBoss: boolean): Decimal {
    // getGoldMultiplier includes all bonuses (Relics, Ads, etc.)
    const totalMult = GoldManager.getTotalMultiplier();
    const base = BalanceConfig.goldPerKill(zone, totalMult);
    
    let reward = base;
    if (isBoss) reward = reward.mul(5);
    
    GoldManager.addGold(reward);
    return reward;
  },

  getTotalMultiplier(): Decimal {
    const ascMult = AscensionManager.getGoldAscensionMult();
    const achMult = 1 + AchievementManager.getTotalRewardMult('gold_mult');
    const relicMult = 1 + RelicManager.getTotalBonus('gold_mult');
    const adMult = AdManager.getGoldMultiplier();
    
    // INCLUDE GameState.goldMultiplier (Rizz Aura, etc.)
    return toBigNum(ascMult * achMult * relicMult * adMult).mul(GameState.goldMultiplier);
  },

  setMultiplier(multiplier: number): void {
    GameState.goldMultiplier = toBigNum(multiplier);
  },
};
