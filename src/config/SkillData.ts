export interface SkillDefinition {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cooldownSeconds: number;
  durationSeconds: number; // 0 = instant
  color: number;
}

export const SKILL_DATA: SkillDefinition[] = [
  {
    id: 'skibidi_rush',
    name: 'Skibidi Rush',
    emoji: '🚽',
    description: 'Auto-click x30 for 30s',
    cooldownSeconds: 180,
    durationSeconds: 30,
    color: 0x7ed321,
  },
  {
    id: 'sigma_grindset',
    name: 'Sigma Grindset',
    emoji: '🐺',
    description: 'DPS x5 for 60s',
    cooldownSeconds: 300,
    durationSeconds: 60,
    color: 0x9b59b6,
  },
  {
    id: 'ohio_mode',
    name: 'Ohio Mode',
    emoji: '🏴',
    description: 'Random buff x2-x100 for 15s',
    cooldownSeconds: 600,
    durationSeconds: 15,
    color: 0xe74c3c,
  },
  {
    id: 'fanum_tax',
    name: 'Fanum Tax',
    emoji: '💸',
    description: 'Steal 10% HP from enemy instantly',
    cooldownSeconds: 120,
    durationSeconds: 0,
    color: 0x27ae60,
  },
  {
    id: 'rizz_aura',
    name: 'Rizz Aura',
    emoji: '😎',
    description: 'Gold x10 for 45s',
    cooldownSeconds: 480,
    durationSeconds: 45,
    color: 0xf5a623,
  },
  {
    id: 'gyatt_bomb',
    name: 'GYATT Bomb',
    emoji: '💣',
    description: 'Nuke for 10 minutes of DPS instantly',
    cooldownSeconds: 900,
    durationSeconds: 0,
    color: 0xff5722,
  },
  {
    id: 'mewing_focus',
    name: 'Mewing Focus',
    emoji: '🧘',
    description: 'Guaranteed crits for 20s',
    cooldownSeconds: 300,
    durationSeconds: 20,
    color: 0x2980b9,
  },
];
