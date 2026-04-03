import { CrazyGamesSDK } from './CrazyGamesSDK';
import { GameState, RelicInstance } from '../core/GameState';
import { RelicManager, RARITY_MULTIPLIERS, RELIC_POOL } from '../core/RelicManager';
import { EventBus, Events } from '../systems/EventBus';
import { HeroManager } from '../core/HeroManager';

export const AdManager = {
  // x2 gold for 30 minutes
  watchAdDoubleGold(): void {
    CrazyGamesSDK.requestRewardedAd(() => {
      GameState.goldBoostTimeLeft += 30 * 60; // 1800s
      EventBus.emit(Events.FLOATING_TEXT, '🔥 Gold x2 Boost Applied!', 640, 360, 0xffd700);
    });
  },

  // x2 DPS for 30 minutes
  watchAdDoubleDPS(): void {
    CrazyGamesSDK.requestRewardedAd(() => {
      GameState.dpsBoostTimeLeft += 30 * 60; // 1800s
      HeroManager.recalculateDPS();
      EventBus.emit(Events.FLOATING_TEXT, '⚔️ DPS x2 Boost Applied!', 640, 360, 0xff4444);
    });
  },

  // Get a free Diamond relic
  watchAdDiamondRelic(): void {
    CrazyGamesSDK.requestRewardedAd(() => {
      const base = RELIC_POOL[Math.floor(Math.random() * RELIC_POOL.length)];
      const rarity: 'Diamond' = 'Diamond';
      const mult = RARITY_MULTIPLIERS[rarity];
      
      const relic: RelicInstance = {
        id: `${base.name}_${Date.now()}`,
        name: base.name,
        rarity,
        statType: base.statType,
        statValue: parseFloat((base.baseValue * mult).toFixed(3)),
        emoji: base.emoji,
        count: 1,
      };

      // Check for stacking
      const existingDiamond = GameState.relics.find(r => r.name === relic.name && r.rarity === 'Diamond');
      if (existingDiamond) {
        existingDiamond.count += 1;
        EventBus.emit(Events.RELIC_FUSED, existingDiamond);
      } else {
        GameState.relics.push(relic);
        EventBus.emit(Events.RELIC_DROPPED, relic);
      }
      
      EventBus.emit(Events.FLOATING_TEXT, `💎 Diamond Relic: ${relic.name}!`, 640, 360, 0x00e5ff);
      HeroManager.recalculateDPS();
    });
  },

  // +5 levels to the latest unlocked hero
  watchAdHeroLevelUp(): void {
    CrazyGamesSDK.requestRewardedAd(() => {
      // Find the highest index unlocked hero
      let latestIdx = 0;
      for (let i = GameState.heroes.length - 1; i >= 0; i--) {
        if (GameState.heroes[i].isUnlocked) {
          latestIdx = i;
          break;
        }
      }
      
      const state = GameState.heroes[latestIdx];
      state.level += 5;
      HeroManager.recalculateDPS();
      EventBus.emit(Events.HERO_BOUGHT, latestIdx, state.level);
      EventBus.emit(Events.FLOATING_TEXT, `🚀 +5 Levels for ${latestIdx === 0 ? 'Nous' : 'Hero ' + latestIdx}!`, 640, 360, 0x76ff03);
    });
  },

  // Boss retry: reset boss timer (Keeping this as a hidden/conditional internal helper if needed)
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

  // Tick: update timers
  tick(delta: number): void {
    let changed = false;
    if (GameState.goldBoostTimeLeft > 0) {
        GameState.goldBoostTimeLeft = Math.max(0, GameState.goldBoostTimeLeft - delta);
        if (GameState.goldBoostTimeLeft <= 0) changed = true;
    }
    if (GameState.dpsBoostTimeLeft > 0) {
        GameState.dpsBoostTimeLeft = Math.max(0, GameState.dpsBoostTimeLeft - delta);
        if (GameState.dpsBoostTimeLeft <= 0) {
            changed = true;
            HeroManager.recalculateDPS();
        }
    }
  },

  getGoldMultiplier(): number {
    return GameState.goldBoostTimeLeft > 0 ? 2 : 1;
  },

  getDPSMultiplier(): number {
    return GameState.dpsBoostTimeLeft > 0 ? 2 : 1;
  }
};
