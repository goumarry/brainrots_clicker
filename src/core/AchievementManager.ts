import { ACHIEVEMENT_DATA } from '../config/AchievementData';
import { GameState } from './GameState';
import { EventBus, Events } from '../systems/EventBus';

export const AchievementManager = {
  checkAll(): void {
    for (const ach of ACHIEVEMENT_DATA) {
      if (GameState.achievements.includes(ach.id)) continue;
      if (AchievementManager.isUnlocked(ach.id)) {
        AchievementManager.unlock(ach.id);
      }
    }
  },

  isUnlocked(id: string): boolean {
    const ach = ACHIEVEMENT_DATA.find(a => a.id === id);
    if (!ach) return false;
    const s = GameState.stats;
    const { type, value } = ach.condition;
    switch (type) {
      case 'total_kills': return s.totalKills >= value;
      case 'boss_kills': return s.bossKills >= value;
      case 'total_gold': return GameState.totalGoldEarned.gte(value);
      case 'max_zone': return s.maxZoneReached >= value;
      case 'hero_bought': return s.herosBought >= value;
      case 'hero_max_level': return GameState.heroes.some(h => h.level >= value);
      case 'heroes_unlocked': return GameState.heroes.filter(h => h.level > 0).length >= value;
      case 'total_clicks': return GameState.totalClicks >= value;
      case 'total_crits': return s.totalCrits >= value;
      case 'skills_used': return s.skillsUsed >= value;
      case 'skill_used_id': return (s.skillsUsedById[value] ?? 0) > 0;
      case 'total_ascensions': return s.totalAscensions >= value;
      case 'total_sigma_souls': return s.totalSigmaSouls >= value;
      case 'relics_owned': return GameState.relics.length >= value;
      case 'quests_completed': return s.questsCompleted >= value;
      default: return false;
    }
  },

  unlock(id: string): void {
    if (GameState.achievements.includes(id)) return;
    GameState.achievements.push(id);
    EventBus.emit(Events.ACHIEVEMENT_UNLOCKED, id);
  },

  getTotalRewardMult(rewardType: string): number {
    let total = 0;
    for (const ach of ACHIEVEMENT_DATA) {
      if (GameState.achievements.includes(ach.id) && ach.reward.type === rewardType) {
        total += ach.reward.value;
      }
    }
    return total;
  },
};
