import { GameState } from './GameState';
import { EventBus, Events } from '../systems/EventBus';
import { BalanceConfig } from '../config/BalanceConfig';
import { EnemyManager } from './EnemyManager';
import { AchievementManager } from './AchievementManager';

export const ZoneManager = {
  advanceZone(): void {
    if (GameState.zone > BalanceConfig.MAX_ZONES) {
      // Already at max completion zone, just stay here
      GameState.enemyKillCount = 0;
      return;
    }

    GameState.zone += 1;
    GameState.enemyKillCount = 0;

    if (GameState.zone > BalanceConfig.MAX_ZONES) {
      // Reached completion zone!
      EventBus.emit(Events.ZONE_CHANGED, GameState.zone);
      return;
    }

    if (GameState.zone > GameState.stats.maxZoneReached) {
      GameState.stats.maxZoneReached = GameState.zone;
    }
    if (GameState.zone > GameState.stats.maxZoneEver) {
      GameState.stats.maxZoneEver = GameState.zone;
    }
    AchievementManager.checkAll();

    EventBus.emit(Events.ZONE_CHANGED, GameState.zone);
    EnemyManager.spawnNextNormal();
  },

  retreatZone(): void {
    // Boss timer expired, reset progress in current zone (don't retreat)
    GameState.enemyKillCount = 0;
    GameState.bossTimerActive = false;
    GameState.bossTimeRemaining = 0;

    EventBus.emit(Events.ZONE_CHANGED, GameState.zone);
    EnemyManager.spawnNextNormal();
  },

  getCurrentZone(): number {
    return GameState.zone;
  },

  isBossZone(zone?: number): boolean {
    const z = zone ?? GameState.zone;
    return z % BalanceConfig.BOSS_ZONE_INTERVAL === 0;
  },

  getZoneProgress(): number {
    // 0 to 1, progress through current zone enemies
    return Math.min(GameState.enemyKillCount / BalanceConfig.ENEMIES_PER_ZONE, 1);
  },
};
