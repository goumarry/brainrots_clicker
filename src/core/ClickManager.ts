import { Decimal } from '../systems/BigNumber';
import { DamageManager } from './DamageManager';
import { EnemyManager } from './EnemyManager';
import { GameState } from './GameState';
import { EventBus, Events } from '../systems/EventBus';
import { formatNumber } from '../systems/NumberFormatter';
import { AscensionManager } from './AscensionManager';
import { AchievementManager } from './AchievementManager';
import { RelicManager } from './RelicManager';
import { QuestManager } from './QuestManager';

export const ClickManager = {
  handleClick(x: number, y: number): Decimal {
    const baseDamage = DamageManager.getClickDamage();
    const effectiveCritChance = Math.min(
      0.95,
      GameState.critChance
      + AscensionManager.getCritChanceBonus()
      + AchievementManager.getTotalRewardMult('crit_chance')
      + RelicManager.getTotalBonus('crit_chance')
    );
    const effectiveCritMult = GameState.critMultiplier + AscensionManager.getCritMultBonus();
    const isCrit = Math.random() < effectiveCritChance;
    const damage = isCrit ? baseDamage.mul(effectiveCritMult) : baseDamage;
    GameState.totalClicks += 1;
    if (isCrit) {
      GameState.stats.totalCrits += 1;
    }
    EnemyManager.dealDamage(damage);
    // Quest progress
    QuestManager.updateProgress('clicks_today', 1);
    AchievementManager.checkAll();
    if (isCrit) {
      EventBus.emit(Events.CLICK_CRITICAL, damage, x, y);
      EventBus.emit(Events.FLOATING_TEXT, `CRIT! ${formatNumber(damage)}`, x, y - 10, 0xff4444);
    } else {
      EventBus.emit(Events.CLICK_DAMAGE, damage, x, y);
      EventBus.emit(Events.FLOATING_TEXT, formatNumber(damage), x, y, 0xffff44);
    }
    return damage;
  },
};
