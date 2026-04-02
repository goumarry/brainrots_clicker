import { Decimal } from '../systems/BigNumber';
import { GameState } from './GameState';
import { HeroManager } from './HeroManager';
import { GoldManager } from './GoldManager';
import { EventBus, Events } from '../systems/EventBus';
import { AscensionManager } from './AscensionManager';

const MAX_OFFLINE_SECONDS = 8 * 60 * 60; // 8 hours

export interface OfflineResult {
  secondsAway: number;
  goldEarned: Decimal;
}

export const OfflineManager = {
  calculate(): OfflineResult | null {
    const now = Date.now();
    const lastSave = GameState.lastSaveTime;
    if (!lastSave || lastSave <= 0) return null;

    const secondsAway = Math.min((now - lastSave) / 1000, MAX_OFFLINE_SECONDS);
    if (secondsAway < 10) return null; // Don't show for < 10s

    const dps = HeroManager.getTotalDPS();
    if (dps.lte(0)) return null;

    // Offline earns 50% efficiency, with ascension multiplier
    const offlineMult = AscensionManager.getOfflineMult();
    const goldEarned = dps.mul(secondsAway).mul(0.5).mul(offlineMult);
    GoldManager.addGold(goldEarned);

    const result: OfflineResult = { secondsAway, goldEarned };
    EventBus.emit(Events.OFFLINE_CALCULATED, result);
    return result;
  },

  formatTime(seconds: number): string {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  },
};
