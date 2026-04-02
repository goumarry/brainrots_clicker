import { Decimal, toBigNum, bigNumMax } from '../systems/BigNumber';
import { GameState } from './GameState';
import { HeroManager } from './HeroManager';
import { EnemyManager } from './EnemyManager';
import { AscensionManager } from './AscensionManager';
import { AchievementManager } from './AchievementManager';
import { RelicManager } from './RelicManager';

export const DamageManager = {
  getClickDamage(): Decimal {
    const totalDPS = HeroManager.getTotalDPS().mul(GameState.dpsMultiplier);
    const baseClick = totalDPS.mul(0.05);
    const clickDmg = bigNumMax(baseClick, toBigNum(1));
    const ascMult = AscensionManager.getClickAscensionMult();
    const achMult = 1 + AchievementManager.getTotalRewardMult('click_mult');
    const relicMult = 1 + RelicManager.getTotalBonus('click_mult');
    return clickDmg.mul(ascMult).mul(achMult).mul(relicMult);
  },

  applyDPSTick(deltaSeconds: number): void {
    if (GameState.currentEnemy.currentHP.lte(0)) return;

    const dps = HeroManager.getTotalDPS().mul(GameState.dpsMultiplier);
    if (dps.lte(0)) return;

    const damageThisTick = dps.mul(deltaSeconds);
    EnemyManager.dealDamage(damageThisTick);
  },

  applyClickDamage(): Decimal {
    const damage = DamageManager.getClickDamage();
    GameState.totalClicks += 1;
    EnemyManager.dealDamage(damage);
    return damage;
  },
};
