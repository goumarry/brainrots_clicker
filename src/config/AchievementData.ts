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
  { id: 'boss_kills_1', name: 'Boss Basher', description: 'Defeat your first boss', category: 'kills', condition: { type: 'boss_kills', value: 1 }, reward: { type: 'gold_mult', value: 0.05 }, emoji: '👹' },
  { id: 'boss_kills_10', name: 'Boss Slayer', description: 'Defeat 10 bosses', category: 'kills', condition: { type: 'boss_kills', value: 10 }, reward: { type: 'dps_mult', value: 0.05 }, emoji: '🏆' },
  { id: 'boss_kills_50', name: 'Boss Hunter Pro', description: 'Defeat 50 bosses', category: 'kills', condition: { type: 'boss_kills', value: 50 }, reward: { type: 'dps_mult', value: 0.1 }, emoji: '👑' },

  // GOLD
  { id: 'gold_1k', name: 'Pocket Change', description: 'Earn 1,000 total gold', category: 'gold', condition: { type: 'total_gold', value: 1000 }, reward: { type: 'gold_mult', value: 0.02 }, emoji: '🪙' },
  { id: 'gold_1m', name: 'Millionaire', description: 'Earn 1 Million total gold', category: 'gold', condition: { type: 'total_gold', value: 1e6 }, reward: { type: 'gold_mult', value: 0.03 }, emoji: '💰' },
  { id: 'gold_1b', name: 'Billionaire', description: 'Earn 1 Billion total gold', category: 'gold', condition: { type: 'total_gold', value: 1e9 }, reward: { type: 'gold_mult', value: 0.05 }, emoji: '💎' },
  { id: 'gold_1t', name: 'Trillionaire', description: 'Earn 1 Trillion total gold', category: 'gold', condition: { type: 'total_gold', value: 1e12 }, reward: { type: 'gold_mult', value: 0.1 }, emoji: '🏦' },
  { id: 'gold_1qa', name: 'Sigma Economy', description: 'Earn 1 Quadrillion total gold', category: 'gold', condition: { type: 'total_gold', value: 1e15 }, reward: { type: 'gold_mult', value: 0.15 }, emoji: '🤑' },

  // ZONE
  { id: 'zone_5', name: 'Just Getting Started', description: 'Reach zone 5', category: 'zone', condition: { type: 'max_zone', value: 5 }, reward: { type: 'dps_mult', value: 0.02 }, emoji: '🗺️' },
  { id: 'zone_10', name: 'Explorer', description: 'Reach zone 10', category: 'zone', condition: { type: 'max_zone', value: 10 }, reward: { type: 'dps_mult', value: 0.03 }, emoji: '🧭' },
  { id: 'zone_25', name: 'Veteran', description: 'Reach zone 25', category: 'zone', condition: { type: 'max_zone', value: 25 }, reward: { type: 'dps_mult', value: 0.05 }, emoji: '⭐' },
  { id: 'zone_50', name: 'Skibidi Army General', description: 'Reach zone 50', category: 'zone', condition: { type: 'max_zone', value: 50 }, reward: { type: 'dps_mult', value: 0.08 }, emoji: '🌟' },
  { id: 'zone_100', name: 'Ohio Overlord', description: 'Reach zone 100', category: 'zone', condition: { type: 'max_zone', value: 100 }, reward: { type: 'dps_mult', value: 0.15 }, emoji: '🏴' },
  { id: 'zone_150', name: 'Sigma Tier', description: 'Reach zone 150', category: 'zone', condition: { type: 'max_zone', value: 150 }, reward: { type: 'dps_mult', value: 0.2 }, emoji: '🔥' },
  { id: 'zone_200', name: 'Brainrot God', description: 'Reach zone 200', category: 'zone', condition: { type: 'max_zone', value: 200 }, reward: { type: 'dps_mult', value: 0.3 }, emoji: '🧠' },

  // HEROES
  { id: 'first_hero', name: 'First Recruit', description: 'Buy your first hero', category: 'heroes', condition: { type: 'hero_bought', value: 1 }, reward: { type: 'dps_mult', value: 0.02 }, emoji: '👶' },
  { id: 'hero_level_25', name: 'Getting Strong', description: 'Get any hero to level 25', category: 'heroes', condition: { type: 'hero_max_level', value: 25 }, reward: { type: 'dps_mult', value: 0.03 }, emoji: '💪' },
  { id: 'hero_level_100', name: 'Hero Legend', description: 'Get any hero to level 100', category: 'heroes', condition: { type: 'hero_max_level', value: 100 }, reward: { type: 'dps_mult', value: 0.08 }, emoji: '🦸' },
  { id: 'hero_level_500', name: 'Mythic Grind', description: 'Get any hero to level 500', category: 'heroes', condition: { type: 'hero_max_level', value: 500 }, reward: { type: 'dps_mult', value: 0.15 }, emoji: '⚡' },
  { id: 'all_common_heroes', name: 'Common Gang', description: 'Unlock all Common heroes', category: 'heroes', condition: { type: 'heroes_unlocked', value: 3 }, reward: { type: 'gold_mult', value: 0.05 }, emoji: '👥' },
  { id: 'all_rare_heroes', name: 'Rare Collection', description: 'Unlock all Rare heroes', category: 'heroes', condition: { type: 'heroes_unlocked', value: 5 }, reward: { type: 'dps_mult', value: 0.05 }, emoji: '💠' },
  { id: 'all_epic_heroes', name: 'Epic Roster', description: 'Unlock all Epic heroes', category: 'heroes', condition: { type: 'heroes_unlocked', value: 9 }, reward: { type: 'dps_mult', value: 0.1 }, emoji: '🌀' },
  { id: 'all_legendary', name: 'Legendary Status', description: 'Unlock all Legendary heroes', category: 'heroes', condition: { type: 'heroes_unlocked', value: 12 }, reward: { type: 'dps_mult', value: 0.15 }, emoji: '👑' },
  { id: 'all_heroes', name: 'Full Brainrot Roster', description: 'Unlock all 15 heroes', category: 'heroes', condition: { type: 'heroes_unlocked', value: 15 }, reward: { type: 'dps_mult', value: 0.25 }, emoji: '🧠' },

  // CLICKS
  { id: 'clicks_10', name: 'First Clicker', description: 'Click 10 times', category: 'clicks', condition: { type: 'total_clicks', value: 10 }, reward: { type: 'click_mult', value: 0.02 }, emoji: '👆' },
  { id: 'clicks_100', name: 'Click Machine', description: 'Click 100 times', category: 'clicks', condition: { type: 'total_clicks', value: 100 }, reward: { type: 'click_mult', value: 0.03 }, emoji: '🖱️' },
  { id: 'clicks_1000', name: 'Tap Titan', description: 'Click 1,000 times', category: 'clicks', condition: { type: 'total_clicks', value: 1000 }, reward: { type: 'click_mult', value: 0.05 }, emoji: '⚡' },
  { id: 'clicks_10000', name: 'Carpal Tunnel Risk', description: 'Click 10,000 times', category: 'clicks', condition: { type: 'total_clicks', value: 10000 }, reward: { type: 'click_mult', value: 0.1 }, emoji: '🤯' },
  { id: 'first_crit', name: 'Critical Hit!', description: 'Land your first critical click', category: 'clicks', condition: { type: 'total_crits', value: 1 }, reward: { type: 'crit_chance', value: 0.005 }, emoji: '💥' },
  { id: 'crits_100', name: 'Crit Enjoyer', description: 'Land 100 critical clicks', category: 'clicks', condition: { type: 'total_crits', value: 100 }, reward: { type: 'crit_chance', value: 0.01 }, emoji: '🎯' },
  { id: 'crits_1000', name: 'Crit God', description: 'Land 1,000 critical clicks', category: 'clicks', condition: { type: 'total_crits', value: 1000 }, reward: { type: 'crit_chance', value: 0.02 }, emoji: '🌟' },

  // SKILLS
  { id: 'first_skill', name: 'Activated!', description: 'Use a skill for the first time', category: 'skills', condition: { type: 'skills_used', value: 1 }, reward: { type: 'dps_mult', value: 0.02 }, emoji: '⚡' },
  { id: 'skills_10', name: 'Skill Enjoyer', description: 'Use skills 10 times', category: 'skills', condition: { type: 'skills_used', value: 10 }, reward: { type: 'dps_mult', value: 0.03 }, emoji: '🔮' },
  { id: 'skills_100', name: 'Skill Master', description: 'Use skills 100 times', category: 'skills', condition: { type: 'skills_used', value: 100 }, reward: { type: 'dps_mult', value: 0.05 }, emoji: '🧙' },
  { id: 'first_bomb', name: 'GYATT Bomb Dropped', description: 'Use the GYATT Bomb skill', category: 'skills', condition: { type: 'skill_used_id', value: 5 }, reward: { type: 'dps_mult', value: 0.05 }, emoji: '💣' },

  // ASCENSION
  { id: 'first_ascension', name: 'Sigma Ascension', description: 'Ascend for the first time', category: 'ascension', condition: { type: 'total_ascensions', value: 1 }, reward: { type: 'dps_mult', value: 0.1 }, emoji: '🌀' },
  { id: 'ascension_5', name: 'Serial Ascender', description: 'Ascend 5 times', category: 'ascension', condition: { type: 'total_ascensions', value: 5 }, reward: { type: 'dps_mult', value: 0.15 }, emoji: '♾️' },
  { id: 'ascension_10', name: 'Prestige King', description: 'Ascend 10 times', category: 'ascension', condition: { type: 'total_ascensions', value: 10 }, reward: { type: 'dps_mult', value: 0.25 }, emoji: '🔱' },
  { id: 'sigma_souls_100', name: 'Soul Collector', description: 'Earn 100 Sigma Souls total', category: 'ascension', condition: { type: 'total_sigma_souls', value: 100 }, reward: { type: 'dps_mult', value: 0.1 }, emoji: '💫' },
  { id: 'sigma_souls_1000', name: 'Soul Hoarder', description: 'Earn 1,000 Sigma Souls total', category: 'ascension', condition: { type: 'total_sigma_souls', value: 1000 }, reward: { type: 'dps_mult', value: 0.2 }, emoji: '🌌' },

  // MISC
  { id: 'first_relic', name: 'Relic Hunter', description: 'Obtain your first relic', category: 'misc', condition: { type: 'relics_owned', value: 1 }, reward: { type: 'dps_mult', value: 0.03 }, emoji: '🏺' },
  { id: 'relics_5', name: 'Relic Collector', description: 'Own 5 relics at once', category: 'misc', condition: { type: 'relics_owned', value: 5 }, reward: { type: 'dps_mult', value: 0.05 }, emoji: '🪄' },
  { id: 'first_quest', name: 'Quest Accepted', description: 'Complete your first daily quest', category: 'misc', condition: { type: 'quests_completed', value: 1 }, reward: { type: 'gold_mult', value: 0.05 }, emoji: '📋' },
  { id: 'quests_10', name: 'Quest Grinder', description: 'Complete 10 daily quests', category: 'misc', condition: { type: 'quests_completed', value: 10 }, reward: { type: 'gold_mult', value: 0.1 }, emoji: '📜' },
];
