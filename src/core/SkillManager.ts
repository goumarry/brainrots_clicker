import { SKILL_DATA } from '../config/SkillData';
import { GameState } from './GameState';
import { EnemyManager } from './EnemyManager';
import { DamageManager } from './DamageManager';
import { HeroManager } from './HeroManager';
import { EventBus, Events } from '../systems/EventBus';
import { toBigNum } from '../systems/BigNumber';
import { formatNumber } from '../systems/NumberFormatter';
import { AscensionManager } from './AscensionManager';
import { AchievementManager } from './AchievementManager';

export interface SkillState {
  id: string;
  cooldownRemaining: number;  // seconds
  durationRemaining: number;  // seconds (0 when not active)
  isActive: boolean;
}

export const SkillManager = {
  visualTimer: 0,
 
  // Called from main.ts ticker
  tick(deltaSeconds: number): void {
    for (let i = 0; i < GameState.skills.length; i++) {
      const skill = GameState.skills[i];
      const def = SKILL_DATA[i];

      // Tick active duration
      if (skill.isActive && skill.durationRemaining > 0) {
        skill.durationRemaining -= deltaSeconds;
        if (skill.durationRemaining <= 0) {
          skill.durationRemaining = 0;
          skill.isActive = false;
          this.deactivateSkill(i);
        }
      }

      // Tick cooldown
      if (skill.cooldownRemaining > 0) {
        skill.cooldownRemaining -= deltaSeconds;
        if (skill.cooldownRemaining <= 0) {
          skill.cooldownRemaining = 0;
          EventBus.emit(Events.SKILL_READY, i);
        }
      }
    }

    // Apply Skibidi Rush auto-click
    const skibidiIdx = SKILL_DATA.findIndex(s => s.id === 'skibidi_rush');
    const skibidiSkill = GameState.skills[skibidiIdx];
    if (skibidiSkill?.isActive) {
      const power = GameState.getSkillPower(skibidiIdx);
      const autoClicksPerSec = 30 * power;
      const damagePerClick = DamageManager.getClickDamage();
      const totalDamage = damagePerClick
        .mul(autoClicksPerSec)
        .mul(deltaSeconds);
      EnemyManager.dealDamage(totalDamage);
  
      // Add visual feedback
      this.visualTimer += deltaSeconds;
      if (this.visualTimer >= 1/30) { 
        this.visualTimer = 0;
        EventBus.emit(Events.AUTO_CLICK, damagePerClick);
      }
    }
  },

  activateSkill(index: number): boolean {
    const skill = GameState.skills[index];
    const def = SKILL_DATA[index];

    if (!skill || skill.cooldownRemaining > 0) return false;
 
    // Check if hero is recruited
    const heroState = GameState.heroes.find(h => h.id === def.heroId);
    if (!heroState || heroState.level <= 0) return false;

    // Start cooldown (apply ascension reduction)
    const reduction = AscensionManager.getCooldownReduction();
    skill.cooldownRemaining = def.cooldownSeconds * (1 - reduction);

    // Refresh duration
    skill.durationRemaining = def.durationSeconds;
    
    let damageToAnimate: any = null;
 
    // If not active, apply the base effect
    if (!skill.isActive) {
      skill.isActive = true;
      const power = GameState.getSkillPower(index);
      
      switch (def.id) {
        case 'aura_de_sigma':
          // Handled in DamageManager
          break;

        case 'skibidi_rush':
          break;
  
        case 'sigma_grindset':
          HeroManager.recalculateDPS();
          break;
   
        case 'ohio_mode': {
          const stats = ['dps', 'click', 'gold'];
          const chosen = stats[Math.floor(Math.random() * stats.length)];
          const multiplier = 5 * power; 
          skill.activeMultiplier = multiplier;
          skill.activeStat = chosen;
          
          if (chosen === 'dps') {
            HeroManager.recalculateDPS();
          }

          const label = chosen === 'dps' ? 'DPS' : (chosen === 'click' ? 'CLICK' : 'GOLD');
          EventBus.emit(Events.FLOATING_TEXT, `OHIO MODE: x${multiplier} ${label}!`, window.innerWidth/2, window.innerHeight/2 - 100, 0xe74c3c);
          break;
        }
  
        case 'fanum_tax': {
          const pct = Math.min(0.5 * power, 1.0);
          const enemyHP = GameState.currentEnemy.currentHP;
          damageToAnimate = enemyHP.mul(pct);
          break;
        }
  
        case 'rizz_aura':
          // GoldManager recalculates on the fly
          break;
  
        case 'gyatt_bomb': {
          const nukeDamage = HeroManager.getTotalDPS().mul(600 * power);
          damageToAnimate = nukeDamage;
          break;
        }
  
        case 'mewing_focus':
          GameState.critChance = 1.0; 
          break;

        case 'fruit_frenzy': {
          const gold = HeroManager.getTotalDPS().mul(3600 * power);
          GameState.gold = GameState.gold.add(gold);
          GameState.totalGoldEarned = GameState.totalGoldEarned.add(gold);
          EventBus.emit(Events.GOLD_CHANGED, GameState.gold);
          EventBus.emit(Events.FLOATING_TEXT, `+${formatNumber(gold)} GOLD`, window.innerWidth/2, window.innerHeight/2, 0xffd700);
          break;
        }

        case 'cosmic_reach':
          GameState.critMultiplier *= (1 + power);
          break;

        case 'delta_strike': {
          const damage = DamageManager.getClickDamage().mul(3600 * power);
          damageToAnimate = damage;
          break;
        }

        case 'pineapple_pulse': {
          const reductionRatio = Math.min(0.5 + (power - 1) * 0.1, 0.9);
          for (const s of GameState.skills) {
            if (s.cooldownRemaining > 0) {
              s.cooldownRemaining *= (1 - reductionRatio);
            }
          }
          break;
        }
      }
    } else {
        const power = GameState.getSkillPower(index);
        if (def.id === 'fanum_tax') {
            const pct = Math.min(0.5 * power, 1.0);
            damageToAnimate = GameState.currentEnemy.currentHP.mul(pct);
        } else if (def.id === 'gyatt_bomb') {
            damageToAnimate = HeroManager.getTotalDPS().mul(600 * power);
        } else if (def.id === 'delta_strike') {
            damageToAnimate = DamageManager.getClickDamage().mul(3600 * power);
        }
    }

    GameState.stats.skillsUsed += 1;
    if (GameState.stats.skillsUsedById.length > index) {
      GameState.stats.skillsUsedById[index] += 1;
    }
    AchievementManager.checkAll();

    if (def.durationSeconds === 0) {
      skill.isActive = false;
    }
 
    EventBus.emit(Events.SKILL_ACTIVATED, index, def.id);

    const power = GameState.getSkillPower(index);
    const heroIds: string[] = [];
    for (let p = 0; p < power; p++) {
        const hIdx = index + (p * 12);
        if (hIdx < GameState.heroes.length) {
            heroIds.push(GameState.heroes[hIdx].id);
        }
    }
 
    EventBus.emit(Events.SKILL_ANIMATION_TRIGGERED, {
        heroIds: heroIds,
        skillId: def.id,
        damage: damageToAnimate
    });

    return true;
  },

  deactivateSkill(index: number): void {
    const def = SKILL_DATA[index];
    const power = GameState.getSkillPower(index);

    switch (def.id) {
      case 'sigma_grindset':
      case 'ohio_mode':
        HeroManager.recalculateDPS();
        break;
      case 'rizz_aura':
        // Automatic via recalculate from GoldManager
        break;
      case 'mewing_focus':
        GameState.critChance = 0.05; 
        break;
      case 'cosmic_reach':
        GameState.critMultiplier /= (1 + power);
        break;
    }
  },

  initSkills(): void {
    GameState.skills = SKILL_DATA.map(def => ({
      id: def.id,
      cooldownRemaining: 0,
      durationRemaining: 0,
      isActive: false,
    }));
  },
};
