import { Decimal } from '../systems/BigNumber';
import { DamageManager } from './DamageManager';
import { EnemyManager } from './EnemyManager';
import { GameState } from './GameState';
import { EventBus, Events } from '../systems/EventBus';
import { formatNumber } from '../systems/NumberFormatter';
import { AscensionManager } from './AscensionManager';
import { AchievementManager } from './AchievementManager';
import { RelicManager } from './RelicManager';
import { StatCalculator } from './StatCalculator';
import { AudioManager } from '../systems/AudioManager';

export const ClickManager = {
  handleClick(x: number, y: number): Decimal {
    const baseDamage = DamageManager.getClickDamage();
    const effectiveCritChance = StatCalculator.getEffectiveCritChance();
    const effectiveCritMult = StatCalculator.getTotalCritMultiplier();
    const isCrit = Math.random() < effectiveCritChance;
    const damage = isCrit ? baseDamage.mul(effectiveCritMult) : baseDamage;
    GameState.totalClicks += 1;
    AudioManager.playHitSound();
    if (isCrit) {
      GameState.stats.totalCrits += 1;
    }
    EnemyManager.dealDamage(damage);
    
    if (isCrit) {
      EventBus.emit(Events.CLICK_CRITICAL, damage, x, y);
    } else {
      EventBus.emit(Events.CLICK_DAMAGE, damage, x, y);
    }
    return damage;
  },
};
