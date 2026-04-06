import { GameState } from './GameState';
import { HeroManager } from './HeroManager';
import { AchievementManager } from './AchievementManager';
import { RelicManager } from './RelicManager';
import { AscensionManager } from './AscensionManager';
import { AdManager } from '../integrations/AdManager';
import { HERO_DATA } from '../config/HeroData';
import { Decimal, toBigNum } from '../systems/BigNumber';
import { BalanceConfig } from '../config/BalanceConfig';
import { GoldManager } from './GoldManager';

export interface StatBreakdown {
  label: string;
  base: string | number | Decimal;
  multipliers: { label: string; value: string | number | Decimal; type: 'mult' | 'add' }[];
  total: string | number | Decimal;
}

export const StatCalculator = {
  getDPSBreakdown(): StatBreakdown {
    let baseHeroDPS = toBigNum(0);
    for (let i = 0; i < HERO_DATA.length; i++) {
        baseHeroDPS = baseHeroDPS.add(HeroManager.getHeroDPS(i));
    }

    const breakdown: StatBreakdown = {
      label: 'Dégâts Par Seconde (DPS)',
      base: baseHeroDPS,
      multipliers: [],
      total: GameState.totalDPS,
    };

    const achMult = 1 + AchievementManager.getTotalRewardMult('dps_mult');
    if (achMult > 1) breakdown.multipliers.push({ label: 'Achievements', value: achMult, type: 'mult' });

    const relicMult = 1 + RelicManager.getTotalBonus('dps_mult');
    if (relicMult > 1) breakdown.multipliers.push({ label: 'Reliques', value: relicMult, type: 'mult' });

    const ascMult = AscensionManager.getDPSAscensionMult();
    if (ascMult > 1) breakdown.multipliers.push({ label: 'Ascension', value: ascMult, type: 'mult' });

    const currentDpsMult = GameState.dpsMultiplier.toNumber();
    if (currentDpsMult > 1) breakdown.multipliers.push({ label: 'Bonus Temporaire', value: currentDpsMult, type: 'mult' });
    
    // Ad DPS Boost
    if (GameState.dpsBoostTimeLeft > 0) {
        breakdown.multipliers.push({ label: 'Pub Double DPS', value: 2.0, type: 'mult' });
    }

    return breakdown;
  },

  getClickBreakdown(): StatBreakdown {
    const rawDPS = HeroManager.getTotalDPS().mul(GameState.dpsMultiplier);
    const hero0Level = GameState.heroes[0]?.level || 0;
    // Base click is only hero 0 level (with a minimum of 1 for early game)
    const baseClick = toBigNum(Math.max(1, hero0Level));

    const breakdown: StatBreakdown = {
      label: 'Dégâts Par Clic (CPS)',
      base: baseClick,
      multipliers: [],
      total: toBigNum(0),
    };

    const heroLevelMult = HeroManager.getHeroLevelClickMult();
    if (heroLevelMult > 1) breakdown.multipliers.push({ label: 'Bonus Nvx Héros', value: heroLevelMult, type: 'mult' });

    // AURA DE SIGMA (Skill 0)
    if (GameState.skills[0]?.isActive) {
      const power = GameState.getSkillPower(0);
      breakdown.multipliers.push({ label: 'Aura de Sigma', value: 10 * power, type: 'mult' });
    }

    const achMult = 1 + AchievementManager.getTotalRewardMult('click_mult');
    if (achMult > 1) breakdown.multipliers.push({ label: 'Achievements', value: achMult, type: 'mult' });

    const relicMult = 1 + RelicManager.getTotalBonus('click_mult');
    if (relicMult > 1) breakdown.multipliers.push({ label: 'Reliques', value: relicMult, type: 'mult' });

    const ascMult = AscensionManager.getClickAscensionMult();
    if (ascMult > 1) breakdown.multipliers.push({ label: 'Ascension', value: ascMult, type: 'mult' });

    let final = baseClick.mul(heroLevelMult).mul(achMult).mul(relicMult).mul(ascMult);
    if (GameState.skills[0]?.isActive) {
      final = final.mul(10 * GameState.getSkillPower(0));
    }
    breakdown.total = final;
    return breakdown;
  },

  getGoldBreakdown(): StatBreakdown {
    const zone = GameState.zone;
    const baseVal = toBigNum(BalanceConfig.GOLD_ZONE_EXPONENT).pow(zone - 1);
    
    const breakdown: StatBreakdown = {
        label: `Or de la Zone ${zone}`,
        base: baseVal,
        multipliers: [],
        total: '',
    };

    const achMult = 1 + AchievementManager.getTotalRewardMult('gold_mult');
    if (achMult > 1) breakdown.multipliers.push({ label: 'Achievements', value: achMult, type: 'mult' });

    const relicMult = 1 + RelicManager.getTotalBonus('gold_mult');
    if (relicMult > 1) breakdown.multipliers.push({ label: 'Reliques', value: relicMult, type: 'mult' });

    const ascMult = AscensionManager.getGoldAscensionMult();
    if (ascMult > 1) breakdown.multipliers.push({ label: 'Ascension', value: ascMult, type: 'mult' });

    const adMult = AdManager.getGoldMultiplier();
    if (adMult > 1) breakdown.multipliers.push({ label: 'Pub Double Or', value: adMult, type: 'mult' });
    
    if (GameState.goldMultiplier.gt(1)) {
        breakdown.multipliers.push({ label: 'Aura de Rizz', value: GameState.goldMultiplier, type: 'mult' });
    }

    // Use shared logic for final total to ensure consistency (including floor)
    const totalMult = GoldManager.getTotalMultiplier();
    const totalReward = BalanceConfig.goldPerKill(zone, totalMult);
    
    breakdown.total = totalReward;
    return breakdown;
  },

  getRawTotalCritChance(): number {
    const achAdd = AchievementManager.getTotalRewardMult('crit_chance');
    const relicAdd = RelicManager.getTotalBonus('crit_chance');
    const ascAdd = AscensionManager.getCritChanceBonus();
    return GameState.critChance + achAdd + relicAdd + ascAdd;
  },

  getEffectiveCritChance(): number {
    return Math.min(1.0, this.getRawTotalCritChance());
  },

  getTotalCritMultiplier(): number {
    const baseMult = GameState.critMultiplier + AscensionManager.getCritMultBonus();
    const rawChance = this.getRawTotalCritChance();
    const overflow = Math.max(0, rawChance - 1.0);
    // 1% surplus crit = 1% extra crit damage (e.g. +0.01 to the multiplier)
    return baseMult + overflow;
  },

  getCritBreakdown(): StatBreakdown {
    const rawTotal = this.getRawTotalCritChance();
    const effective = this.getEffectiveCritChance();
    const totalMult = this.getTotalCritMultiplier();
    const overflow = Math.max(0, rawTotal - 1.0);

    const breakdown: StatBreakdown = {
      label: 'Système Critique',
      base: `${(GameState.critChance * 100).toFixed(1)}% Chance`,
      multipliers: [],
      total: `${(effective * 100).toFixed(1)}% Chance`,
    };

    const achAdd = AchievementManager.getTotalRewardMult('crit_chance');
    if (achAdd > 0) breakdown.multipliers.push({ label: 'Bonus Achievements', value: `+${(achAdd * 100).toFixed(1)}%`, type: 'add' });

    const relicAdd = RelicManager.getTotalBonus('crit_chance');
    if (relicAdd > 0) breakdown.multipliers.push({ label: 'Bonus Reliques', value: `+${(relicAdd * 100).toFixed(1)}%`, type: 'add' });

    const ascAdd = AscensionManager.getCritChanceBonus();
    if (ascAdd > 0) breakdown.multipliers.push({ label: 'Bonus Ascension', value: `+${(ascAdd * 100).toFixed(1)}%`, type: 'add' });

    breakdown.multipliers.push({ label: '──────────────', value: '', type: 'add' });
    breakdown.multipliers.push({ label: 'Dégâts Crit Base', value: `${(GameState.critMultiplier * 100).toFixed(0)}%`, type: 'add' });
    
    const ascMult = AscensionManager.getCritMultBonus();
    if (ascMult > 0) breakdown.multipliers.push({ label: 'Bonus Ascension', value: `+${(ascMult * 100).toFixed(0)}%`, type: 'add' });

    if (overflow > 0) {
      breakdown.multipliers.push({ label: 'Surplus Critique', value: `+${(overflow * 100).toFixed(1)}%`, type: 'add' });
    }

    breakdown.total = `${(effective * 100).toFixed(1)}% Chance / ${(totalMult * 100).toFixed(0)}% Dégâts`;
    return breakdown;
  }
};
