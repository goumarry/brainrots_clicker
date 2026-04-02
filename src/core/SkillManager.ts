import { SKILL_DATA } from '../config/SkillData';
import { GameState } from './GameState';
import { EnemyManager } from './EnemyManager';
import { HeroManager } from './HeroManager';
import { EventBus, Events } from '../systems/EventBus';
import { toBigNum } from '../systems/BigNumber';
import { AscensionManager } from './AscensionManager';
import { QuestManager } from './QuestManager';
import { AchievementManager } from './AchievementManager';

export interface SkillState {
  id: string;
  cooldownRemaining: number;  // seconds
  durationRemaining: number;  // seconds (0 when not active)
  isActive: boolean;
}

export const SkillManager = {
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
          SkillManager.deactivateSkill(i);
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
    if (GameState.skills[0]?.isActive) {
      const autoClicksPerSec = 30;
      const totalDamage = HeroManager.getTotalDPS()
        .mul(0.05)
        .mul(autoClicksPerSec)
        .mul(deltaSeconds);
      EnemyManager.dealDamage(totalDamage);
    }
  },

  activateSkill(index: number): boolean {
    const skill = GameState.skills[index];
    const def = SKILL_DATA[index];

    if (!skill || skill.cooldownRemaining > 0) return false;

    // Start cooldown (apply ascension reduction)
    const reduction = AscensionManager.getCooldownReduction();
    skill.cooldownRemaining = def.cooldownSeconds * (1 - reduction);

    // Apply effect
    switch (def.id) {
      case 'skibidi_rush':
        skill.isActive = true;
        skill.durationRemaining = def.durationSeconds;
        break;

      case 'sigma_grindset':
        skill.isActive = true;
        skill.durationRemaining = def.durationSeconds;
        GameState.dpsMultiplier = GameState.dpsMultiplier.mul(5);
        HeroManager.recalculateDPS();
        break;

      case 'ohio_mode': {
        skill.isActive = true;
        skill.durationRemaining = def.durationSeconds;
        const multiplier = 2 + Math.random() * 98; // x2 to x100
        GameState.dpsMultiplier = GameState.dpsMultiplier.mul(multiplier);
        HeroManager.recalculateDPS();
        break;
      }

      case 'fanum_tax': {
        // Steal 10% of current enemy HP
        const enemyHP = GameState.currentEnemy.currentHP;
        const stolen = enemyHP.mul(0.1);
        EnemyManager.dealDamage(stolen);
        break;
      }

      case 'rizz_aura':
        skill.isActive = true;
        skill.durationRemaining = def.durationSeconds;
        GameState.goldMultiplier = GameState.goldMultiplier.mul(10);
        break;

      case 'gyatt_bomb': {
        // Deal 10 minutes of DPS
        const nukeDamage = HeroManager.getTotalDPS().mul(600);
        EnemyManager.dealDamage(nukeDamage);
        break;
      }

      case 'mewing_focus':
        skill.isActive = true;
        skill.durationRemaining = def.durationSeconds;
        GameState.critChance = 1.0; // 100% crit
        break;
    }

    // Track stats
    GameState.stats.skillsUsed += 1;
    if (GameState.stats.skillsUsedById.length > index) {
      GameState.stats.skillsUsedById[index] += 1;
    }
    QuestManager.updateProgress('skills_today', 1);
    AchievementManager.checkAll();

    EventBus.emit(Events.SKILL_ACTIVATED, index, def.id);
    return true;
  },

  deactivateSkill(index: number): void {
    const def = SKILL_DATA[index];

    switch (def.id) {
      case 'sigma_grindset':
        GameState.dpsMultiplier = GameState.dpsMultiplier.div(5);
        HeroManager.recalculateDPS();
        break;
      case 'ohio_mode':
        // Reset to base (can't easily undo random mult, so reset to 1)
        GameState.dpsMultiplier = toBigNum(1);
        HeroManager.recalculateDPS();
        break;
      case 'rizz_aura':
        GameState.goldMultiplier = GameState.goldMultiplier.div(10);
        break;
      case 'mewing_focus':
        GameState.critChance = 0.05; // Reset to 5%
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
