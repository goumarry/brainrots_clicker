import { GameState, QuestInstance } from './GameState';
import { EventBus, Events } from '../systems/EventBus';

const QUEST_TEMPLATES = [
  { id: 'kill_enemies', name: 'Enemy Slayer', descFn: (t: number) => `Kill ${t} enemies`, type: 'total_kills', targets: [50, 100, 250, 500, 1000] },
  { id: 'earn_gold', name: 'Gold Rush', descFn: (t: number) => `Earn ${t} gold`, type: 'gold_earned_today', targets: [1e4, 1e6, 1e9, 1e12, 1e15] },
  { id: 'reach_zone', name: 'Zone Explorer', descFn: (t: number) => `Reach zone ${t}`, type: 'zone_reached', targets: [5, 10, 25, 50, 75, 100] },
  { id: 'click_times', name: 'Click Master', descFn: (t: number) => `Click ${t} times`, type: 'clicks_today', targets: [50, 100, 250, 500] },
  { id: 'use_skills', name: 'Skill Spam', descFn: (t: number) => `Use skills ${t} times`, type: 'skills_today', targets: [3, 5, 10] },
];

const DAY_MS = 24 * 60 * 60 * 1000;

export const QuestManager = {
  initOrRefresh(): void {
    const now = Date.now();
    const lastReset = GameState.questLastReset;

    if (GameState.quests.length === 0 || (now - lastReset) >= DAY_MS) {
      QuestManager.generateNewQuests();
      GameState.questLastReset = now;
    }
  },

  generateNewQuests(): void {
    const shuffled = [...QUEST_TEMPLATES].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);

    GameState.quests = selected.map(template => {
      const targetIdx = Math.floor(Math.random() * template.targets.length);
      const target = template.targets[targetIdx];
      return {
        id: `${template.id}_${Date.now()}_${Math.random()}`,
        name: template.name,
        description: template.descFn(target),
        type: template.type,
        target,
        current: 0,
        completed: false,
        reward: 50,
      };
    });
  },

  updateProgress(type: string, delta: number): void {
    for (const quest of GameState.quests) {
      if (quest.completed) continue;
      if (quest.type !== type) continue;
      quest.current = Math.min(quest.current + delta, quest.target);
      EventBus.emit(Events.QUEST_PROGRESS, quest);
      if (quest.current >= quest.target) {
        QuestManager.completeQuest(quest);
      }
    }
  },

  completeQuest(quest: QuestInstance): void {
    quest.completed = true;
    GameState.stats.questsCompleted += 1;
    EventBus.emit(Events.QUEST_COMPLETED, quest);
  },

  getTimeUntilReset(): number {
    const now = Date.now();
    const nextReset = GameState.questLastReset + DAY_MS;
    return Math.max(0, nextReset - now);
  },
};
