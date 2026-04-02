import { GameState } from './GameState';
import { EventBus, Events } from '../systems/EventBus';
import { BalanceConfig } from '../config/BalanceConfig';
import { EnemyManager } from './EnemyManager';
import { QuestManager } from './QuestManager';
import { AchievementManager } from './AchievementManager';

export const ZoneManager = {
  advanceZone(): void {
    if (GameState.zone >= BalanceConfig.MAX_ZONES) {
      // Already at max zone, just respawn
      GameState.enemyKillCount = 0;
      EnemyManager.spawnNextNormal();
      return;
    }

    GameState.zone += 1;
    GameState.enemyKillCount = 0;

    if (GameState.zone > GameState.stats.maxZoneReached) {
      GameState.stats.maxZoneReached = GameState.zone;
    }
    QuestManager.updateProgress('zone_reached', GameState.zone);
    AchievementManager.checkAll();

    EventBus.emit(Events.ZONE_CHANGED, GameState.zone);
    EnemyManager.spawnNextNormal();
  },

  retreatZone(): void {
    // Boss timer expired, retreat to previous zone
    if (GameState.zone > 1) {
      GameState.zone -= 1;
    }
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
