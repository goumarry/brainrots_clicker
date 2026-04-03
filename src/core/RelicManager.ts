import { GameState, RelicInstance } from './GameState';
import { EventBus, Events } from '../systems/EventBus';
import { AscensionManager } from './AscensionManager';

// RELIC LIMIT REMOVED
// const MAX_RELICS = 10;

export const RARITY_ORDER: ('Bronze' | 'Silver' | 'Gold' | 'Diamond')[] = ['Bronze', 'Silver', 'Gold', 'Diamond'];

export const RELIC_POOL = [
  { name: 'Skibidi Plunger', emoji: '🪠', statType: 'dps_mult', baseValue: 0.10 },
  { name: 'Sigma Stone', emoji: '🪨', statType: 'dps_mult', baseValue: 0.15 },
  { name: 'Ohio Orb', emoji: '🔮', statType: 'gold_mult', baseValue: 0.10 },
  { name: 'Rizz Ring', emoji: '💍', statType: 'gold_mult', baseValue: 0.15 },
  { name: 'Brainrot Badge', emoji: '🏅', statType: 'click_mult', baseValue: 0.20 },
  { name: 'Gyatt Gem', emoji: '💎', statType: 'crit_chance', baseValue: 0.02 },
  { name: 'Fanum Fetish', emoji: '🪬', statType: 'gold_mult', baseValue: 0.20 },
  { name: 'Mewing Medal', emoji: '🥇', statType: 'dps_mult', baseValue: 0.20 },
  { name: 'IShowSpeed Crown', emoji: '👑', statType: 'click_mult', baseValue: 0.30 },
  { name: 'Quandale Crystal', emoji: '🔷', statType: 'dps_mult', baseValue: 0.25 },
  { name: 'NPC Skull', emoji: '💀', statType: 'dps_mult', baseValue: 0.05 },
  { name: 'Toilet Water', emoji: '🚽', statType: 'gold_mult', baseValue: 0.08 },
  { name: 'Drip Talisman', emoji: '✨', statType: 'click_mult', baseValue: 0.15 },
  { name: 'Aura Amulet', emoji: '🌟', statType: 'dps_mult', baseValue: 0.12 },
  { name: 'W Stone', emoji: '🪩', statType: 'crit_chance', baseValue: 0.03 },
];

export const RARITY_MULTIPLIERS: Record<string, number> = {
  Bronze: 1.0,
  Silver: 1.5,
  Gold: 2.5,
  Diamond: 5.0,
};

const RARITY_CHANCES = [
  { rarity: 'Bronze' as const, weight: 40 },
  { rarity: 'Silver' as const, weight: 35 },
  { rarity: 'Gold' as const, weight: 20 },
  { rarity: 'Diamond' as const, weight: 5 },
];

export const RelicManager = {
  tryDropRelic(isBoss: boolean): void {
    if (GameState.zone < GameState.stats.maxZoneEver) {
      // RELIC LOCK ACTIVE: No drops until player reaches their Record
      return;
    }
    
    const baseChance = isBoss ? 0.5 : 0.05;
    const chaosBonus = AscensionManager.getTotalBonus('chaos_proc') * 0.5;
    const dropChance = baseChance + chaosBonus;

    if (Math.random() > dropChance) return;

    let targetRelic = RelicManager.generateRelic();
    EventBus.emit(Events.RELIC_DROPPED, targetRelic);
    let wasFusedAtLeastOnce = false;
    
    // PERSISTENT FUSION LOOP: Keep fusing as long as we have a duplicate of the SAME name and rarity
    while (true) {
      const existingIdx = GameState.relics.findIndex(r => r.name === targetRelic.name && r.rarity === targetRelic.rarity);
      
      if (existingIdx === -1) {
        // No more duplicates, stop fusing
        break;
      }

      const currentRarityIdx = RARITY_ORDER.indexOf(targetRelic.rarity);
      if (currentRarityIdx >= RARITY_ORDER.length - 1) {
        // MAX RARITY (Diamond) reached, now STACK instead of further fusing
        const existingDiamond = GameState.relics.find(r => r.name === targetRelic.name && r.rarity === 'Diamond');
        if (existingDiamond) {
          existingDiamond.count += 1;
          wasFusedAtLeastOnce = true;
          EventBus.emit(Events.RELIC_FUSED, existingDiamond);
          return; // Done
        }
        break;
      }

      // Perform fusion
      const nextRarity = RARITY_ORDER[currentRarityIdx + 1];
      
      // 1. Remove the existing duplicate
      GameState.relics.splice(existingIdx, 1);
      
      // 2. Upgrade our target relic
      targetRelic.rarity = nextRarity;
      const base = RELIC_POOL.find(p => p.name === targetRelic.name);
      if (base) {
        const mult = RARITY_MULTIPLIERS[nextRarity];
        targetRelic.statValue = parseFloat((base.baseValue * mult).toFixed(3));
      }

      wasFusedAtLeastOnce = true;
      EventBus.emit(Events.RELIC_FUSED, targetRelic);
      
      // Continue the loop to check for the next tier
    }

    // After all possible fusions, add the final relic (No more limit)
    GameState.relics.push(targetRelic);
  },

  generateRelic(): RelicInstance {
    const base = RELIC_POOL[Math.floor(Math.random() * RELIC_POOL.length)];
    const rarity = RelicManager.rollRarity();
    const mult = RARITY_MULTIPLIERS[rarity];

    return {
      id: `${base.name}_${Date.now()}`,
      name: base.name,
      rarity,
      statType: base.statType,
      statValue: parseFloat((base.baseValue * mult).toFixed(3)),
      emoji: base.emoji,
      count: 1,
    };
  },

  rollRarity(): 'Bronze' | 'Silver' | 'Gold' | 'Diamond' {
    const roll = Math.random() * 100;
    let cumulative = 0;
    for (const { rarity, weight } of RARITY_CHANCES) {
      cumulative += weight;
      if (roll < cumulative) return rarity;
    }
    return 'Bronze';
  },

  removeRelic(relicId: string): void {
    GameState.relics = GameState.relics.filter(r => r.id !== relicId);
  },

  getTotalBonus(statType: string): number {
    return GameState.relics
      .filter(r => r.statType === statType)
      .reduce((sum, r) => sum + (r.statValue * r.count), 0);
  },
};
