import { Application, Container } from 'pixi.js';
import { GameUI } from './ui/GameUI';
import { EnemyManager } from './core/EnemyManager';
import { DamageManager } from './core/DamageManager';
import { SaveManager } from './core/SaveManager';
import { HeroManager } from './core/HeroManager';
import { GameState } from './core/GameState';
import { SkillManager } from './core/SkillManager';
import { OfflineManager } from './core/OfflineManager';
import { BalanceConfig } from './config/BalanceConfig';
import { QuestManager } from './core/QuestManager';
import { AchievementManager } from './core/AchievementManager';
import { CrazyGamesSDK } from './integrations/CrazyGamesSDK';

export const GAME_W = 1280;
export const GAME_H = 720;

async function main(): Promise<void> {
  const app = new Application();

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
  });

  // Mount canvas
  const container = document.getElementById('game-container');
  if (!container) throw new Error('No game-container element found');
  container.appendChild(app.canvas);

  // Remove loading text
  const loadingEl = document.getElementById('loading');
  if (loadingEl) loadingEl.remove();

  // Signal loading complete → gameplay begins
  CrazyGamesSDK.gameLoadingStop();
  CrazyGamesSDK.gameplayStart();

  // Scale root: all game content lives here at logical 1280x720
  // PixiJS scales it to fill the actual window → sharp + correct clicks
  const scaleRoot = new Container();
  app.stage.addChild(scaleRoot);

  function updateScale(): void {
    const scaleX = app.screen.width / GAME_W;
    const scaleY = app.screen.height / GAME_H;
    scaleRoot.scale.set(scaleX, scaleY);
  }
  updateScale();
  app.renderer.on('resize', updateScale);

  // Load saved game or start fresh
  const hasSave = SaveManager.load();

  // Initialize skills if not loaded from save
  if (GameState.skills.length === 0) {
    SkillManager.initSkills();
  }

  // Initialize quests and check achievements after load
  QuestManager.initOrRefresh();
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
