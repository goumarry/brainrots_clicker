export type AscensionBranch = 'sigma' | 'grind' | 'speed' | 'crit' | 'chaos';

export interface AscensionUpgrade {
  id: string;
  branch: AscensionBranch;
  name: string;
  description: string;
  cost: number; // Sigma Souls cost
  maxLevel?: number; // Optional: Some might still have a limit if added later
  effectValue: number;
  effectType: 'dps_mult' | 'gold_mult' | 'crit_chance' | 'crit_mult' | 'cooldown_reduction' | 'click_mult' | 'chaos_proc' | 'offline_mult';
}

export const ASCENSION_UPGRADES: AscensionUpgrade[] = [
  // SIGMA PATH — DPS
  { id: 'sigma_power_1', branch: 'sigma', name: 'Sigma Grind I', description: '+25% total DPS per level', cost: 1, effectValue: 0.25, effectType: 'dps_mult' },
  { id: 'sigma_power_2', branch: 'sigma', name: 'Sigma Grind II', description: '+50% hero DPS per level', cost: 5, effectValue: 0.5, effectType: 'dps_mult' },
  { id: 'sigma_power_3', branch: 'sigma', name: 'Alpha Surge', description: '+100% DPS per level', cost: 20, effectValue: 1.0, effectType: 'dps_mult' },
  { id: 'sigma_power_4', branch: 'sigma', name: 'Gigachad Mode', description: '+200% DPS per level', cost: 100, effectValue: 2.0, effectType: 'dps_mult' },

  // GRIND PATH — Gold
  { id: 'grind_gold_1', branch: 'grind', name: 'Easy Money I', description: '+25% gold per kill per level', cost: 1, effectValue: 0.25, effectType: 'gold_mult' },
  { id: 'grind_gold_2', branch: 'grind', name: 'Easy Money II', description: '+50% gold per kill per level', cost: 5, effectValue: 0.5, effectType: 'gold_mult' },
  { id: 'grind_gold_3', branch: 'grind', name: 'Fanum Tax Pro', description: '+100% gold per level', cost: 20, effectValue: 1.0, effectType: 'gold_mult' },
  { id: 'grind_gold_4', branch: 'grind', name: 'Brainrot Economy', description: '+2x offline gold per level', cost: 50, effectValue: 1.0, effectType: 'offline_mult' },

  // SPEED PATH — Cooldowns & Click
  { id: 'speed_cd_1', branch: 'speed', name: 'Rush Mode I', description: '-10% skill cooldowns per level', cost: 2, effectValue: 0.1, effectType: 'cooldown_reduction' },
  { id: 'speed_cd_2', branch: 'speed', name: 'Rush Mode II', description: '-15% skill cooldowns per level', cost: 10, effectValue: 0.15, effectType: 'cooldown_reduction' },
  { id: 'speed_click_1', branch: 'speed', name: 'Turbo Click I', description: '+25% click damage per level', cost: 3, effectValue: 0.25, effectType: 'click_mult' },
  { id: 'speed_click_2', branch: 'speed', name: 'Turbo Click II', description: '+50% click damage per level', cost: 25, effectValue: 0.5, effectType: 'click_mult' },

  // CRIT PATH
  { id: 'crit_chance_1', branch: 'crit', name: 'Eagle Eye I', description: '+2% crit chance per level', cost: 2, effectValue: 0.02, effectType: 'crit_chance' },
  { id: 'crit_chance_2', branch: 'crit', name: 'Eagle Eye II', description: '+3% crit chance per level', cost: 15, effectValue: 0.03, effectType: 'crit_chance' },
  { id: 'crit_damage_1', branch: 'crit', name: 'Critical Mass I', description: '+50% dégâts crit par niveau', cost: 5, effectValue: 0.5, effectType: 'crit_mult' },
  { id: 'crit_damage_2', branch: 'crit', name: 'Critical Mass II', description: '+100% dégâts crit par niveau', cost: 30, effectValue: 1.0, effectType: 'crit_mult' },

  // CHAOS PATH
  { id: 'chaos_1', branch: 'chaos', name: 'Chaos Theory I', description: '+5% chance of double gold per level', cost: 3, effectValue: 0.05, effectType: 'chaos_proc' },
  { id: 'chaos_2', branch: 'chaos', name: 'Chaos Theory II', description: '+5% chance of x3 crit per level', cost: 15, effectValue: 0.05, effectType: 'chaos_proc' },
  { id: 'chaos_3', branch: 'chaos', name: 'Ohio Blessing', description: '+10% relic drop chance per level', cost: 30, effectValue: 0.1, effectType: 'chaos_proc' },
  { id: 'chaos_4', branch: 'chaos', name: 'Pure Brainrot', description: '+50% all damage per level', cost: 75, effectValue: 0.5, effectType: 'dps_mult' },
];
