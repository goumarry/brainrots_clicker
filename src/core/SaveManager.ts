import { GameState, GameStateData } from './GameState';
import { HeroManager } from './HeroManager';
import { EnemyManager } from './EnemyManager';
import { EventBus, Events } from '../systems/EventBus';
import { toBigNum } from '../systems/BigNumber';
import { SkillManager } from './SkillManager';

const SAVE_KEY = 'brainrots_clicker_save';

let pendingDelete = false;

export const SaveManager = {
  save(): void {
    if (pendingDelete) return; // don't re-save if a delete+reload is in progress
    try {
      GameState.lastSaveTime = Date.now();
      const data = GameState.serialize();
      const json = JSON.stringify(data);
      localStorage.setItem(SAVE_KEY, json);
    } catch (e) {
      console.warn('Failed to save game:', e);
    }
  },

  load(): boolean {
    try {
      const json = localStorage.getItem(SAVE_KEY);
      if (!json) return false;

      const raw = JSON.parse(json) as GameStateData;

      // Reconstruct Decimal values from strings
      const defaultStats = {
        totalKills: 0, bossKills: 0, totalCrits: 0, skillsUsed: 0,
        skillsUsedById: [0, 0, 0, 0, 0, 0, 0], questsCompleted: 0,
        totalAscensions: 0, totalSigmaSouls: 0, maxZoneReached: 0, herosBought: 0,
      };
      const data: GameStateData = {
        gold: toBigNum(raw.gold?.toString() ?? '0'),
        goldMultiplier: toBigNum(raw.goldMultiplier?.toString() ?? '1'),
        zone: raw.zone ?? 1,
        enemyKillCount: raw.enemyKillCount ?? 0,
        heroes: raw.heroes ?? [],
        totalClicks: raw.totalClicks ?? 0,
        totalGoldEarned: toBigNum(raw.totalGoldEarned?.toString() ?? '0'),
        lastSaveTime: raw.lastSaveTime ?? 0,
        critChance: raw.critChance ?? 0.05,
        critMultiplier: raw.critMultiplier ?? 3,
        skills: raw.skills ?? [],
        dpsMultiplier: raw.dpsMultiplier ?? '1',
        ascensionUpgrades: raw.ascensionUpgrades ?? [],
        sigmaSOuls: raw.sigmaSOuls ?? 0,
        relics: raw.relics ?? [],
        achievements: raw.achievements ?? [],
        quests: raw.quests ?? [],
        questLastReset: raw.questLastReset ?? 0,
        stats: raw.stats ?? defaultStats,
      };

      GameState.deserialize(data);

      // If no skills were saved, initialize them
      if (GameState.skills.length === 0) {
        SkillManager.initSkills();
      }

      HeroManager.recalculateDPS();

      EventBus.emit(Events.SAVE_LOADED);
      return true;
    } catch (e) {
      console.warn('Failed to load save:', e);
      return false;
    }
  },

  deleteSave(): void {
    pendingDelete = true; // block the beforeunload save that fires on reload
    localStorage.removeItem(SAVE_KEY);
  },

  setupAutoSave(intervalMs: number = 30000): () => void {
    const intervalId = setInterval(() => {
      SaveManager.save();
    }, intervalMs);

    const onUnload = () => SaveManager.save();
    window.addEventListener('beforeunload', onUnload);

    // Return cleanup function
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', onUnload);
    };
  },
};
