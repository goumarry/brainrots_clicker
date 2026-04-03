export interface HeroDefinition {
  id: string;
  name: string;
  emoji: string;
  image?: string;
  baseCost: number;
  baseDPS: number;
  description: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  unlockZone: number;
}

export const HERO_DATA: HeroDefinition[] = [
  { id: 'nous', name: 'Nous', emoji: '👤', baseCost: 10, baseDPS: 0, description: "C'est nous ! Chaque niveau augmente les dégâts de base de clic de +1.", rarity: 'Common', unlockZone: 0 },
  { id: 'tung_sahur', name: 'Tung Tung Sahur', emoji: '🥁', image: 'assets/brainrots/Tung-Tung-Tung-Sahur-PNG.png', baseCost: 10, baseDPS: 1000000000000000000000000, description: 'The beat maker. Let the rhythm guide your clicks.', rarity: 'Common', unlockZone: 1 },
  { id: 'ballerino_lololo', name: 'Ballerino Lololo', emoji: '🩰', image: 'assets/brainrots/Ballerino-Lololo-PNG.png', baseCost: 1000, baseDPS: 140, description: 'Dancing warrior.', rarity: 'Common', unlockZone: 10 },
  { id: 'bananita_dolfinita', name: 'Bananita Dolfinita', emoji: '🐬', image: 'assets/brainrots/Bananita-Dolfinita-PNG.png', baseCost: 10000, baseDPS: 1800, description: 'Fruit aquatic master.', rarity: 'Rare', unlockZone: 20 },
  { id: 'bombombini_gusini', name: 'Bombombini Gusini', emoji: '💣', image: 'assets/brainrots/Bombombini-Gusini-PNG.png', baseCost: 1e5, baseDPS: 23000, description: 'Explosive personality.', rarity: 'Rare', unlockZone: 30 },
  { id: 'bulbito_bandito', name: 'Bulbito Bandito', emoji: '🚜', image: 'assets/brainrots/Bulbito-Bandito-Traktorito-PNG.png', baseCost: 1e6, baseDPS: 3e5, description: 'Tractor bandit.', rarity: 'Rare', unlockZone: 40 },
  { id: 'cappuccino_assassino', name: 'Cappuccino Assassino', emoji: '☕', image: 'assets/brainrots/Cappuccino-Assassino-PNG.png', baseCost: 1e7, baseDPS: 4e6, description: 'Caffeinated lethality.', rarity: 'Epic', unlockZone: 50 },
  { id: 'cocofanto_elefanto', name: 'Cocofanto Elefanto', emoji: '🐘', image: 'assets/brainrots/Cocofanto-Elefanto-PNG.png', baseCost: 1e8, baseDPS: 5.2e7, description: 'Coconut hybrid.', rarity: 'Epic', unlockZone: 60 },
  { id: 'frulli_frulla', name: 'Frulli Frulla', emoji: '🍓', image: 'assets/brainrots/Frulli-Frulla-PNG.png', baseCost: 1e9, baseDPS: 6.8e8, description: 'Juicy damage.', rarity: 'Epic', unlockZone: 70 },
  { id: 'girafa_celestre', name: 'Girafa Celvestre', emoji: '🦒', image: 'assets/brainrots/Girafa-Celestre-PNG.png', baseCost: 1e10, baseDPS: 8.8e9, description: 'Cosmic neck reach.', rarity: 'Legendary', unlockZone: 80 },
  { id: 'glorbo_fruttodrillo', name: 'Glorbo Fruttodrillo', emoji: '🐊', image: 'assets/brainrots/Glorbo-Fruttodrillo-PNG.png', baseCost: 1e11, baseDPS: 1.1e11, description: 'Fruit crocodile.', rarity: 'Legendary', unlockZone: 90 },
  { id: 'orangutini_ananasini', name: 'Orangutini Ananasini', emoji: '🦧', image: 'assets/brainrots/Orangutini-Ananasini-PNG.png', baseCost: 1e12, baseDPS: 1.4e12, description: 'Pineapple primate.', rarity: 'Legendary', unlockZone: 100 },
  { id: 'rhino_toasterino', name: 'Rhino Toasterino', emoji: '🦏', image: 'assets/brainrots/Rhino-Toasterino-PNG.png', baseCost: 1e13, baseDPS: 1.8e13, description: 'Heating up combat.', rarity: 'Mythic', unlockZone: 110 },
  { id: 'spaghetti_tualetti', name: 'Spaghetti Tualetti', emoji: '🍝', image: 'assets/brainrots/Spaghetti-Tualetti-PNG.png', baseCost: 1e14, baseDPS: 2.3e14, description: 'Pasta toilet phantom.', rarity: 'Mythic', unlockZone: 120 },
  { id: 'tigroligre_frutonni', name: 'Tigroligre Frutonni', emoji: '🐅', image: 'assets/brainrots/Tigroligre-Frutonni-PNG.png', baseCost: 1e15, baseDPS: 3e15, description: 'Fruity feline fury.', rarity: 'Mythic', unlockZone: 130 },
  { id: 'tric_trac_baraboom', name: 'Tric Trac Baraboom', emoji: '🎆', image: 'assets/brainrots/Tric-Trac-baraboom-PNG.png', baseCost: 1e16, baseDPS: 3.9e16, description: 'Ultimate fireworks.', rarity: 'Mythic', unlockZone: 140 },
  { id: 'zibra_zubra', name: 'Zibra Zubra', emoji: '🦓', image: 'assets/brainrots/Zibra-Zubra-Zibralini-PNG.png', baseCost: 1e17, baseDPS: 5e17, description: 'Striped madness.', rarity: 'Common', unlockZone: 150 },
  { id: 'ballerina_cappuccina', name: 'Ballerina Cappuccina', emoji: '👗', image: 'assets/brainrots/Ballerina-Cappuccina-PNG.png', baseCost: 1e18, baseDPS: 6.5e18, description: 'Elegant destruction.', rarity: 'Common', unlockZone: 160 },
  { id: 'boneca_ambalabu', name: 'Boneca Ambalabu', emoji: '🎎', image: 'assets/brainrots/Boneca-Ambalabu-PNG.png', baseCost: 1e19, baseDPS: 8.5e19, description: 'Ancient doll spirit.', rarity: 'Common', unlockZone: 170 },
  { id: 'brr_brr_patapim', name: 'Brr Brr Patapim', emoji: '❄️', image: 'assets/brainrots/Brr-Brr-Patapim-PNG.png', baseCost: 1e20, baseDPS: 1.1e21, description: 'Frosty beat maker.', rarity: 'Rare', unlockZone: 180 },
  { id: 'brri_bicus', name: 'Brri Bicus', emoji: '🦷', image: 'assets/brainrots/Brri-Brri-Bicus-Dicus-Bombicus-PNG.png', baseCost: 1e21, baseDPS: 1.4e22, description: 'Toothy chaos.', rarity: 'Rare', unlockZone: 190 },
  { id: 'burbaloni', name: 'Burbaloni Lulilolli', emoji: '🍭', image: 'assets/brainrots/Burbaloni-Lulilolli-PNG.png', baseCost: 1e22, baseDPS: 1.8e23, description: 'Sweet but lethal.', rarity: 'Rare', unlockZone: 200 },
  { id: 'chimpanzini', name: 'Chimpanzini Bananini', emoji: '🍌', image: 'assets/brainrots/Chimpanzini-Bananini-PNG.png', baseCost: 1e23, baseDPS: 2.4e24, description: 'Ape aggression.', rarity: 'Epic', unlockZone: 210 },
  { id: 'cocossini_mama', name: 'Cocossini Mama', emoji: '🥥', image: 'assets/brainrots/Cocossini-Mama-PNG.png', baseCost: 1e24, baseDPS: 3.1e25, description: 'The matron of zones.', rarity: 'Epic', unlockZone: 220 },
  { id: 'croko_dancer', name: 'Croko Dancer', emoji: '🕺', image: 'assets/brainrots/Croko-Dildo-Penisi-PNG.png', baseCost: 1e25, baseDPS: 4e26, description: 'Dancer of the deep.', rarity: 'Epic', unlockZone: 230 },
  { id: 'ganganzelli', name: 'Ganganzelli Trulala', emoji: '🎊', image: 'assets/brainrots/Ganganzelli-Trulala-PNG.png', baseCost: 1e26, baseDPS: 5.2e27, description: 'Party time damage.', rarity: 'Legendary', unlockZone: 240 },
  { id: 'gorillo_water', name: 'Gorillo Watermellondrillo', emoji: '🍉', image: 'assets/brainrots/Gorillo-Watermellondrillo-PNG.png', baseCost: 1e27, baseDPS: 6.8e28, description: 'Juicy strength.', rarity: 'Legendary', unlockZone: 250 },
  { id: 'lirili_elephant', name: 'Lirili Larila Elephant', emoji: '🐘', image: 'assets/brainrots/Lirili-Larila-Elephant-PNG.png', baseCost: 1e28, baseDPS: 8.9e29, description: 'Massive vibes.', rarity: 'Legendary', unlockZone: 260 },
  { id: 'matteooooooooooooo', name: 'Matteooooooooooooo', emoji: '🔊', image: 'assets/brainrots/Matteooooooooooooo-PNG.png', baseCost: 1e29, baseDPS: 1.1e31, description: 'Ear-blasting power.', rarity: 'Mythic', unlockZone: 270 },
  { id: 'odindin_dean', name: 'Odindin Dean', emoji: '🧙', image: 'assets/brainrots/Odindin-Dean-Dean-Dunmadin-Dean-Dundun-PNG.png', baseCost: 1e30, baseDPS: 1.5e32, description: 'The chant master.', rarity: 'Mythic', unlockZone: 280 },
  { id: 'perochello', name: 'Perochello Lemonchello', emoji: '🍋', image: 'assets/brainrots/Perochello-Lemonchello-PNG.png', baseCost: 1e31, baseDPS: 2e33, description: 'Zesty combatant.', rarity: 'Mythic', unlockZone: 290 },
  { id: 'pot_hotspot', name: 'Pot Hotspot', emoji: '🔥', image: 'assets/brainrots/Pot-hotspot-PNG.png', baseCost: 1e32, baseDPS: 2.6e34, description: 'Cooking up crits.', rarity: 'Common', unlockZone: 300 },
  { id: 'snooffi', name: 'Snooffi Zeffirulli', emoji: '🌬️', image: 'assets/brainrots/Snooffi-Zeffirulli-PNG.png', baseCost: 1e33, baseDPS: 3.4e35, description: 'Windy warrior.', rarity: 'Common', unlockZone: 310 },
  { id: 'spie_uni', name: 'Spie Uni with Golubi', emoji: '🕊️', image: 'assets/brainrots/Spie-Uni-with-Golubi-PNG.png', baseCost: 1e34, baseDPS: 4.4e36, description: 'Avian alliance.', rarity: 'Common', unlockZone: 320 },
  { id: 'svinino', name: 'Svinino Bombondino', emoji: '🐷', image: 'assets/brainrots/Svinino-Bombondino-PNG.png', baseCost: 1e35, baseDPS: 5.7e37, description: 'Pink power.', rarity: 'Rare', unlockZone: 330 },
  { id: 'ta_sahur', name: 'Ta Ta Sahur', emoji: '🕌', image: 'assets/brainrots/Ta-Ta-Ta-Ta-Ta-Sahur-PNG.png', baseCost: 1e36, baseDPS: 7.4e38, description: 'Twilight guardian.', rarity: 'Rare', unlockZone: 340 },
  { id: 'tracotucotulu', name: 'Tracotucotulu', emoji: '🌀', image: 'assets/brainrots/Tracotucotulu-Delapeladustuz-PNG.png', baseCost: 1e37, baseDPS: 9.6e39, description: 'Chaos incarnate.', rarity: 'Rare', unlockZone: 350 },
  { id: 'tralaleo', name: 'Tralalero Tralala', emoji: '🎶', image: 'assets/brainrots/Tralalero-Tralala-PNG.png', baseCost: 1e38, baseDPS: 1.2e41, description: 'Musical madness.', rarity: 'Epic', unlockZone: 360 },
  { id: 'trippa_troppa', name: 'Trippa Troppa', emoji: '🎭', image: 'assets/brainrots/Trippa-Troppa-Tralala-Lirili-Rila-Tung-Tung-Sahur-PNG.png', baseCost: 1e39, baseDPS: 1.6e42, description: 'Ultimate fusion.', rarity: 'Epic', unlockZone: 370 },
  { id: 'trippi_troppi', name: 'Trippi Troppi', emoji: '👣', image: 'assets/brainrots/Trippi-Troppi-PNG.png', baseCost: 1e40, baseDPS: 2.1e43, description: 'The stomper.', rarity: 'Epic', unlockZone: 380 },
  { id: 'tripy_trophy', name: 'Tripy Trophy', emoji: '🏆', image: 'assets/brainrots/Tripy-Trophy-PNG.png', baseCost: 1e41, baseDPS: 2.7e44, description: 'Winning vibes.', rarity: 'Legendary', unlockZone: 390 },
  { id: 'trulimeo', name: 'Trulimeo Trulrich', emoji: '💎', image: 'assets/brainrots/Trulimeo-Trulrich-PNG.png', baseCost: 1e42, baseDPS: 3.5e45, description: 'Wealthy warrior.', rarity: 'Legendary', unlockZone: 400 },
  { id: 'tung_assassino', name: 'Tung Assassino', emoji: '🎭', image: 'assets/brainrots/Tung-Tung-Assassino-Boneca-PNG.png', baseCost: 1e43, baseDPS: 4.6e46, description: 'Silent doll. The ultimate phantom.', rarity: 'Legendary', unlockZone: 410 },
];
