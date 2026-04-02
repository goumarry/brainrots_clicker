import { Decimal, toBigNum } from '../systems/BigNumber';
import { GameState } from './GameState';
import { EventBus, Events } from '../systems/EventBus';
import { BalanceConfig } from '../config/BalanceConfig';
import { AscensionManager } from './AscensionManager';
import { AchievementManager } from './AchievementManager';
import { RelicManager } from './RelicManager';
import { QuestManager } from './QuestManager';

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
    const base = BalanceConfig.goldPerKill(zone, GameState.goldMultiplier);
    const ascMult = AscensionManager.getGoldAscensionMult();
    const achMult = 1 + AchievementManager.getTotalRewardMult('gold_mult');
    const relicMult = 1 + RelicManager.getTotalBonus('gold_mult');
    let reward = base.mul(ascMult).mul(achMult).mul(relicMult);
    if (isBoss) reward = reward.mul(5);
    GoldManager.addGold(reward);
    QuestManager.updateProgress('gold_earned_today', reward.toNumber());
    return reward;
  },

  setMultiplier(multiplier: number): void {
    GameState.goldMultiplier = toBigNum(multiplier);
  },
};
