type EventCallback = (...args: unknown[]) => void;

class EventBusClass {
  private listeners: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event: string, ...args: unknown[]): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    for (const cb of callbacks) {
      cb(...args);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const EventBus = new EventBusClass();

export const Events = {
  ENEMY_DAMAGED: 'enemy:damaged',
  ENEMY_DIED: 'enemy:died',
  ENEMY_SPAWNED: 'enemy:spawned',
  BOSS_SPAWNED: 'boss:spawned',
  BOSS_TIMER_EXPIRED: 'boss:timer_expired',
  GOLD_CHANGED: 'gold:changed',
  HERO_BOUGHT: 'hero:bought',
  HERO_UPGRADED: 'hero:upgraded',
  ZONE_CHANGED: 'zone:changed',
  DPS_CHANGED: 'dps:changed',
  CLICK_DAMAGE: 'click:damage',
  CLICK_CRITICAL: 'click:critical',
  SKILL_ACTIVATED: 'skill:activated',
  SKILL_READY: 'skill:ready',
  OFFLINE_CALCULATED: 'offline:calculated',
  SAVE_LOADED: 'save:loaded',
  FLOATING_TEXT: 'ui:floating_text',
  ASCENSION_AVAILABLE: 'ascension:available',
  ASCENSION_COMPLETE: 'ascension:complete',
  ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',
  RELIC_DROPPED: 'relic:dropped',
  RELIC_FUSED: 'relic:fused',
  STATS_UPDATED: 'stats:updated',
  AUTO_CLICK: 'click:auto',
  SKILL_ANIMATION_TRIGGERED: 'skill:animation_triggered',
} as const;
