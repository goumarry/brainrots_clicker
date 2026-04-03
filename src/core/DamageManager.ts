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
    const hero0Level = GameState.heroes[0]?.level || 0;
    // Base is exactly Hero 0 Level (Nous), matching StatCalculator
    const baseClick = toBigNum(Math.max(1, hero0Level));
    let clickDmg = baseClick;

    // AURA DE SIGMA (Skill 0)
    if (GameState.skills[0]?.isActive) {
      const power = GameState.getSkillPower(0);
      clickDmg = clickDmg.mul(10 * power);
    }

    const ascMult = AscensionManager.getClickAscensionMult();
    const achMult = 1 + AchievementManager.getTotalRewardMult('click_mult');
    const relicMult = 1 + RelicManager.getTotalBonus('click_mult');
    const heroLevelMult = HeroManager.getHeroLevelClickMult();
    return clickDmg.mul(ascMult).mul(achMult).mul(relicMult).mul(heroLevelMult);
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
