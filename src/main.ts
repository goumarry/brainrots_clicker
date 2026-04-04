import { Application, Container, Assets } from 'pixi.js';
import { HERO_DATA } from './config/HeroData';
import { GameUI } from './ui/GameUI';
import { registerFonts } from './ui/styles/Typography';
import { EnemyManager } from './core/EnemyManager';
import { DamageManager } from './core/DamageManager';
import { SaveManager } from './core/SaveManager';
import { HeroManager } from './core/HeroManager';
import { GameState } from './core/GameState';
import { SkillManager } from './core/SkillManager';
import { OfflineManager } from './core/OfflineManager';
import { BalanceConfig } from './config/BalanceConfig';
import { AchievementManager } from './core/AchievementManager';
import { AdManager } from './integrations/AdManager';
import { CrazyGamesSDK } from './integrations/CrazyGamesSDK';

export const GAME_W = 1280;
export const GAME_H = 720;

async function main(): Promise<void> {
  const app = new Application();
  
  // Wait for web fonts to be ready before starting PixiJS
  await document.fonts.ready;
  await document.fonts.load('800 1em Outfit');

  // Register custom fonts with PixiJS
  registerFonts();
  
  // Init CrazyGames SDK first — must be done before loading/gameplay signals
  await CrazyGamesSDK.init();

  // Signal loading start (after SDK is ready)
  CrazyGamesSDK.gameLoadingStart();

  // resizeTo: window → canvas renders at actual screen resolution (sharp text)
  await app.init({
    resizeTo: window,
    backgroundColor: 0x060d16,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    roundPixels: true,
    hello: true, // Diagnostics
  });

  // Mount canvas
  const container = document.getElementById('game-container');
  if (!container) throw new Error('No game-container element found');
  container.appendChild(app.canvas);

  // Pre-load all Brainrot Assets
  const assetPaths = HERO_DATA
    .filter(h => h.image)
    .map(h => h.image!);
  
  // Also pre-load any other specific assets if needed
  await Assets.load([...assetPaths, 'Outfit']);

  // Remove loading text
  const loadingEl = document.getElementById('loading');
  if (loadingEl) loadingEl.remove();

  // Signal loading complete → gameplay begins
  CrazyGamesSDK.gameLoadingStop();
  CrazyGamesSDK.gameplayStart();

  // Liquid Layout: scaleRoot now fills the actual screen
  const scaleRoot = new Container();
  app.stage.addChild(scaleRoot);

  // Layout is handled in GameUI

  // Load saved game or start fresh
  const hasSave = SaveManager.load();

  // Initialize skills if not loaded from save
  if (GameState.skills.length === 0) {
    SkillManager.initSkills();
  }

  // Check achievements after load
  AchievementManager.checkAll();

  // Calculate offline progress after loading save
  OfflineManager.calculate();

  // Recalculate DPS in case heroes were loaded
  HeroManager.recalculateDPS();
  GameState.totalDPS = HeroManager.getTotalDPS();

  // Initialize UI — pass scaleRoot as parent
  const gameUI = new GameUI(app, scaleRoot);

  // Initial enemy spawn
  EnemyManager.initialSpawn();

  // Setup auto-save
  SaveManager.setupAutoSave(BalanceConfig.AUTO_SAVE_INTERVAL);

  // Game loop
  app.ticker.add((ticker) => {
    const deltaSeconds = ticker.deltaMS / 1000;

    SkillManager.tick(deltaSeconds);
    AdManager.tick(deltaSeconds);
    DamageManager.applyDPSTick(deltaSeconds);

    if (GameState.bossTimerActive) {
      EnemyManager.bossTimerTick(deltaSeconds);
    }

    gameUI.update(deltaSeconds);
  });

  if (hasSave) {
    console.log('Save loaded successfully');
  } else {
    console.log('Starting new game');
  }
}

main().catch(console.error);
