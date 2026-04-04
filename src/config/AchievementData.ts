export type AchievementCategory = 'kills' | 'gold' | 'zone' | 'heroes' | 'clicks' | 'skills' | 'ascension' | 'misc';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  condition: { type: string; value: number };
  reward: { type: 'gold_mult' | 'dps_mult' | 'click_mult' | 'crit_chance'; value: number };
  emoji: string;
}

export const ACHIEVEMENT_DATA: AchievementDefinition[] = [
  // KILLS
  { id: 'first_blood', name: 'First Blood', description: 'Kill your first enemy', category: 'kills', condition: { type: 'total_kills', value: 1 }, reward: { type: 'gold_mult', value: 0.01 }, emoji: '⚔️' },
  { id: 'kills_10', name: 'Getting Warmed Up', description: 'Kill 10 enemies', category: 'kills', condition: { type: 'total_kills', value: 10 }, reward: { type: 'gold_mult', value: 0.01 }, emoji: '💀' },
  { id: 'kills_100', name: 'Skibidi Slayer', description: 'Kill 100 enemies', category: 'kills', condition: { type: 'total_kills', value: 100 }, reward: { type: 'dps_mult', value: 0.02 }, emoji: '🗡️' },
  { id: 'kills_1000', name: 'Brainrot Hunter', description: 'Kill 1,000 enemies', category: 'kills', condition: { type: 'total_kills', value: 1000 }, reward: { type: 'dps_mult', value: 0.03 }, emoji: '💥' },
  { id: 'kills_10000', name: 'Normie Terminator', description: 'Kill 10,000 enemies', category: 'kills', condition: { type: 'total_kills', value: 10000 }, reward: { type: 'dps_mult', value: 0.05 }, emoji: '☠️' },
  { id: 'kills_100000', name: 'Sigma Reaper', description: 'Kill 100,000 enemies', category: 'kills', condition: { type: 'total_kills', value: 100000 }, reward: { type: 'dps_mult', value: 0.1 }, emoji: '💀' },
  { id: 'boss_kills_10', name: 'Boss Slayer', description: 'Defeat 10 bosses', category: 'kills', condition: { type: 'boss_kills', value: 10 }, reward: { type: 'dps_mult', value: 0.05 }, emoji: '🏆' },
  { id: 'boss_kills_50', name: 'Boss Hunter Pro', description: 'Defeat 50 bosses', category: 'kills', condition: { type: 'boss_kills', value: 50 }, reward: { type: 'dps_mult', value: 0.1 }, emoji: '👑' },

  // GOLD
  { id: 'gold_1k', name: 'Pocket Change', description: 'Earn 1k total gold', category: 'gold', condition: { type: 'total_gold', value: 1000 }, reward: { type: 'gold_mult', value: 0.02 }, emoji: '🪙' },
  { id: 'gold_1m', name: 'Millionaire', description: 'Earn 1 Million total gold', category: 'gold', condition: { type: 'total_gold', value: 1e6 }, reward: { type: 'gold_mult', value: 0.03 }, emoji: '💰' },
  { id: 'gold_1b', name: 'Billionaire', description: 'Earn 1 Billion total gold', category: 'gold', condition: { type: 'total_gold', value: 1e9 }, reward: { type: 'gold_mult', value: 0.05 }, emoji: '💎' },
  { id: 'gold_1t', name: 'Trillionaire', description: 'Earn 1 Trillion total gold', category: 'gold', condition: { type: 'total_gold', value: 1e12 }, reward: { type: 'gold_mult', value: 0.1 }, emoji: '🏦' },
  { id: 'gold_1qa', name: 'Sigma Economy', description: 'Earn 1 Quadrillion total gold', category: 'gold', condition: { type: 'total_gold', value: 1e15 }, reward: { type: 'gold_mult', value: 0.15 }, emoji: '🤑' },

  // ZONE
  { id: 'zone_50', name: 'Skibidi Army General', description: 'Reach zone 50', category: 'zone', condition: { type: 'max_zone', value: 50 }, reward: { type: 'dps_mult', value: 0.08 }, emoji: '🌟' },
  { id: 'zone_100', name: 'Ohio Overlord', description: 'Reach zone 100', category: 'zone', condition: { type: 'max_zone', value: 100 }, reward: { type: 'dps_mult', value: 0.15 }, emoji: '🏴' },
  { id: 'zone_200', name: 'Brainrot God', description: 'Reach zone 200', category: 'zone', condition: { type: 'max_zone', value: 200 }, reward: { type: 'dps_mult', value: 0.3 }, emoji: '🧠' },
  { id: 'zone_410', name: 'The Final Boss Slayer', description: 'Reach the final zone 410', category: 'zone', condition: { type: 'max_zone', value: 410 }, reward: { type: 'dps_mult', value: 1.0 }, emoji: '💀' },

  // HEROES
  { id: 'hero_level_100', name: 'Hero Legend', description: 'Get any hero to level 100', category: 'heroes', condition: { type: 'hero_max_level', value: 100 }, reward: { type: 'dps_mult', value: 0.08 }, emoji: '🦸' },
  { id: 'hero_level_500', name: 'Mythic Grind', description: 'Get any hero to level 500', category: 'heroes', condition: { type: 'hero_max_level', value: 500 }, reward: { type: 'dps_mult', value: 0.15 }, emoji: '⚡' },
  { id: 'all_heroes', name: 'Full Brainrot Roster', description: 'Unlock all 43 heroes', category: 'heroes', condition: { type: 'heroes_unlocked', value: 43 }, reward: { type: 'dps_mult', value: 0.25 }, emoji: '🧠' },

  // CLICKS
  { id: 'clicks_1000', name: 'Tap Titan', description: 'Click 1,000 times', category: 'clicks', condition: { type: 'total_clicks', value: 1000 }, reward: { type: 'click_mult', value: 0.05 }, emoji: '⚡' },
  { id: 'clicks_10000', name: 'Carpal Tunnel Risk', description: 'Click 10,000 times', category: 'clicks', condition: { type: 'total_clicks', value: 10000 }, reward: { type: 'click_mult', value: 0.1 }, emoji: '🤯' },
  { id: 'crits_1000', name: 'Crit God', description: 'Land 1,000 critical clicks', category: 'clicks', condition: { type: 'total_crits', value: 1000 }, reward: { type: 'crit_chance', value: 0.02 }, emoji: '🌟' },

  // ASCENSION
  { id: 'ascension_10', name: 'Prestige King', description: 'Ascend 10 times', category: 'ascension', condition: { type: 'total_ascensions', value: 10 }, reward: { type: 'dps_mult', value: 0.25 }, emoji: '🔱' },
  { id: 'sigma_souls_1000', name: 'Soul Hoarder', description: 'Earn 1,000 Sigma Souls total', category: 'ascension', condition: { type: 'total_sigma_souls', value: 1000 }, reward: { type: 'dps_mult', value: 0.2 }, emoji: '🌌' },
];
