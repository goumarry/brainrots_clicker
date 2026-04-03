import { CrazyGamesSDK } from './CrazyGamesSDK';
import { GameState } from '../core/GameState';
import { RelicManager } from '../core/RelicManager';
import { EventBus, Events } from '../systems/EventBus';

export type AdRewardType = 'double_gold' | 'reset_cooldowns' | 'double_offline' | 'free_relic' | 'boss_retry';

export const AdManager = {
  // x2 gold for 30 minutes
  watchAdDoubleGold(): void {
    CrazyGamesSDK.requestRewardedAd(() => {
      GameState.goldMultiplier = GameState.goldMultiplier.mul(2);
      GameState.doubleGoldExpiry = Date.now() + 30 * 60 * 1000;
      EventBus.emit(Events.GOLD_CHANGED, GameState.gold);
      EventBus.emit(Events.FLOATING_TEXT, '🔥 Gold x2 for 30min!', 640, 360, 0xffd700);
    });
  },

  // Reset all skill cooldowns
  watchAdResetCooldowns(): void {
    CrazyGamesSDK.requestRewardedAd(() => {
      for (const skill of GameState.skills) {
        skill.cooldownRemaining = 0;
      }
      EventBus.emit(Events.SKILL_READY, -1);
      EventBus.emit(Events.FLOATING_TEXT, '⚡ All cooldowns reset!', 640, 360, 0x44aaff);
    });
  },

  // Get a free random relic
  watchAdFreeRelic(): void {
    CrazyGamesSDK.requestRewardedAd(() => {
      if (GameState.relics.length < 10) {
        const relic = RelicManager.generateRelic();
        GameState.relics.push(relic);
        EventBus.emit(Events.RELIC_DROPPED, relic);
        EventBus.emit(Events.FLOATING_TEXT, `🏺 Free relic: ${relic.name}!`, 640, 360, 0xffd700);
      }
    });
  },

  // Boss retry: reset boss timer
  watchAdBossRetry(): void {
    CrazyGamesSDK.requestRewardedAd(() => {
      if (GameState.currentEnemy?.isBoss) {
        GameState.currentEnemy.currentHP = GameState.currentEnemy.maxHP;
        GameState.bossTimerActive = true;
        GameState.bossTimeRemaining = 30;
        EventBus.emit(Events.FLOATING_TEXT, '👑 Boss retry! Timer reset!', 640, 360, 0xff4444);
      }
    });
  },

  // Tick: check if double gold has expired
  tick(): void {
    if (GameState.doubleGoldExpiry > 0 && Date.now() > GameState.doubleGoldExpiry) {
      GameState.goldMultiplier = GameState.goldMultiplier.div(2);
      GameState.doubleGoldExpiry = 0;
      EventBus.emit(Events.GOLD_CHANGED, GameState.gold);
    }
  },

  getGoldMultiplier(): number {
    return (GameState.doubleGoldExpiry > 0 && Date.now() < GameState.doubleGoldExpiry) ? 2 : 1;
  },
};
