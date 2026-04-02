import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { StatsDisplay } from './StatsDisplay';
import { EnemyDisplay } from './EnemyDisplay';
import { HeroPanel } from './HeroPanel';
import { FloatingTextManager } from './FloatingText';
import { SkillBar } from './SkillBar';
import { TabBar, TabName } from './TabBar';
import { AscensionScreen } from './screens/AscensionScreen';
import { RelicScreen } from './screens/RelicScreen';
import { QuestScreen } from './screens/QuestScreen';
import { AchievementScreen } from './screens/AchievementScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ParticleSystem } from './ParticleSystem';
import { TutorialOverlay } from './TutorialOverlay';
import { AdRewardsPanel } from './AdRewardsPanel';
import { EventBus, Events } from '../systems/EventBus';
import { ClickManager } from '../core/ClickManager';
import { GameState } from '../core/GameState';
import { BalanceConfig } from '../config/BalanceConfig';
import { QuestManager } from '../core/QuestManager';
import { ACHIEVEMENT_DATA } from '../config/AchievementData';
import { RelicInstance } from '../core/GameState';
import { Decimal } from '../systems/BigNumber';
import { formatGold, formatDPS } from '../systems/NumberFormatter';
import { OfflineManager } from '../core/OfflineManager';
import { AdManager } from '../integrations/AdManager';

const GAME_W = 1280;
const GAME_H = 720;
const TOP_BAR_H = 56;
const LEFT_W = 460;
const LEFT_H = GAME_H - TOP_BAR_H;         // 664
const RIGHT_X = LEFT_W;
const RIGHT_W = GAME_W - LEFT_W;            // 820
const LEFT_TAB_H = 48;
const LEFT_MINI_STATS_H = 48;
const LEFT_CONTENT_Y = TOP_BAR_H + LEFT_TAB_H + LEFT_MINI_STATS_H; // 152
const LEFT_CONTENT_H = LEFT_H - LEFT_TAB_H - LEFT_MINI_STATS_H;    // 568
const RIGHT_ENEMY_H = LEFT_H - 70;          // 594
const RIGHT_SKILL_Y = TOP_BAR_H + RIGHT_ENEMY_H;                    // 650

// Center of enemy display area (for particles)
const ENEMY_CENTER_X = RIGHT_X + RIGHT_W / 2;
const ENEMY_CENTER_Y = TOP_BAR_H + RIGHT_ENEMY_H / 2;

export class GameUI {
  private app: Application;
  private root: Container;

  private statsDisplay: StatsDisplay;
  private enemyDisplay: EnemyDisplay;
  private heroPanel: HeroPanel;
  private floatingTextManager: FloatingTextManager;
  private skillBar: SkillBar;
  private tabBar: TabBar;

  private ascensionScreen: AscensionScreen;
  private relicScreen: RelicScreen;
  private questScreen: QuestScreen;
  private achievementScreen: AchievementScreen;
  private settingsScreen: SettingsScreen;

  private particleSystem: ParticleSystem;
  private adRewardsPanel: AdRewardsPanel;

  private activeTab: TabName = 'heroes';

  private zoneNotifText: Text | null = null;
  private zoneNotifTimer: number = 0;
  private bossWarnText: Text | null = null;

  private offlinePopup: Text | null = null;
  private offlinePopupTimer: number = 0;

  private toastText: Text | null = null;
  private toastTimer: number = 0;

  constructor(app: Application, parent: Container) {
    this.app = app;
    this.root = new Container();
    parent.addChild(this.root);

    // 1. Full background
    const bg = new Graphics();
    bg.rect(0, 0, GAME_W, GAME_H);
    bg.fill(0x060d16);
    this.root.addChild(bg);

    // 2. Vertical divider between left and right panels
    const divider = new Graphics();
    divider.rect(LEFT_W, TOP_BAR_H, 1, LEFT_H);
    divider.fill(0x1e3a5f);
    this.root.addChild(divider);

    // 3. Top bar (stats display)
    this.statsDisplay = new StatsDisplay(GAME_W, TOP_BAR_H);
    this.statsDisplay.container.y = 0;
    this.root.addChild(this.statsDisplay.container);

    // 4. Left panel background
    const leftBg = new Graphics();
    leftBg.rect(0, TOP_BAR_H, LEFT_W, LEFT_H);
    leftBg.fill(0x080f18);
    this.root.addChild(leftBg);

    // 5. Tab bar
    this.tabBar = new TabBar(LEFT_W, LEFT_TAB_H, (tab) => this.onTabChange(tab));
    this.tabBar.container.x = 0;
    this.tabBar.container.y = TOP_BAR_H;
    this.root.addChild(this.tabBar.container);

    // 6. Mini stats panel
    this.buildLeftMiniStats(0, TOP_BAR_H + LEFT_TAB_H, LEFT_W, LEFT_MINI_STATS_H);

    // 7. Hero panel
    this.heroPanel = new HeroPanel(LEFT_W, LEFT_CONTENT_H);
    this.heroPanel.container.x = 0;
    this.heroPanel.container.y = LEFT_CONTENT_Y;
    this.root.addChild(this.heroPanel.container);

    // 8. Ascension screen
    this.ascensionScreen = new AscensionScreen(LEFT_W, LEFT_CONTENT_H);
    this.ascensionScreen.container.x = 0;
    this.ascensionScreen.container.y = LEFT_CONTENT_Y;
    this.ascensionScreen.container.visible = false;
    this.root.addChild(this.ascensionScreen.container);

    // Relic screen
    this.relicScreen = new RelicScreen(LEFT_W, LEFT_CONTENT_H);
    this.relicScreen.container.x = 0;
    this.relicScreen.container.y = LEFT_CONTENT_Y;
    this.relicScreen.container.visible = false;
    this.root.addChild(this.relicScreen.container);

    // Quest screen
    this.questScreen = new QuestScreen(LEFT_W, LEFT_CONTENT_H);
    this.questScreen.container.x = 0;
    this.questScreen.container.y = LEFT_CONTENT_Y;
    this.questScreen.container.visible = false;
    this.root.addChild(this.questScreen.container);

    // Achievement screen
    this.achievementScreen = new AchievementScreen(LEFT_W, LEFT_CONTENT_H);
    this.achievementScreen.container.x = 0;
    this.achievementScreen.container.y = LEFT_CONTENT_Y;
    this.achievementScreen.container.visible = false;
    this.root.addChild(this.achievementScreen.container);

    // Settings screen
    this.settingsScreen = new SettingsScreen(LEFT_W, LEFT_CONTENT_H);
    this.settingsScreen.container.x = 0;
    this.settingsScreen.container.y = LEFT_CONTENT_Y;
    this.settingsScreen.container.visible = false;
    this.root.addChild(this.settingsScreen.container);

    // 9. Right area background
    const rightBg = new Graphics();
    rightBg.rect(RIGHT_X, TOP_BAR_H, RIGHT_W, LEFT_H);
    rightBg.fill(0x060d14);
    this.root.addChild(rightBg);

    // 10. Enemy display
    const enemyDisplayW = RIGHT_W - 40;
    const enemyDisplayH = RIGHT_ENEMY_H - 20;
    this.enemyDisplay = new EnemyDisplay(enemyDisplayW, enemyDisplayH);
    this.enemyDisplay.setBasePosition(RIGHT_X + 20, TOP_BAR_H + 10);
    this.root.addChild(this.enemyDisplay.container);

    // 11. Click zone — covers only the enemy area (not the ad panel strip at bottom)
    const AD_PANEL_H = 56;
    const clickZone = new Graphics();
    clickZone.rect(RIGHT_X, TOP_BAR_H, RIGHT_W, RIGHT_ENEMY_H - AD_PANEL_H);
    clickZone.fill({ color: 0xffffff, alpha: 0 });
    clickZone.eventMode = 'static';
    clickZone.cursor = 'pointer';
    clickZone.on('pointerdown', (e) => {
      ClickManager.handleClick(e.global.x, e.global.y);
    });
    this.root.addChild(clickZone);

    // 12. Ad Rewards Panel — added AFTER clickZone so it's on top in hit-testing
    this.adRewardsPanel = new AdRewardsPanel(RIGHT_W);
    this.adRewardsPanel.container.x = RIGHT_X;
    this.adRewardsPanel.container.y = TOP_BAR_H + RIGHT_ENEMY_H - AD_PANEL_H;
    this.root.addChild(this.adRewardsPanel.container);

    // 13. Skill bar
    const skillBarBg = new Graphics();
    skillBarBg.rect(RIGHT_X, RIGHT_SKILL_Y, RIGHT_W, 70);
    skillBarBg.fill(0x0d1825);
    this.root.addChild(skillBarBg);

    this.skillBar = new SkillBar(RIGHT_W);
    this.skillBar.container.x = RIGHT_X;
    this.skillBar.container.y = RIGHT_SKILL_Y;
    this.root.addChild(this.skillBar.container);

    // 14. Floating text container (renders on top of most things)
    const floatingContainer = new Container();
    this.root.addChild(floatingContainer);
    this.floatingTextManager = new FloatingTextManager(floatingContainer);

    // 15. Particle system container (top of stack for particles)
    const particleContainer = new Container();
    particleContainer.eventMode = 'none';
    this.root.addChild(particleContainer);
    this.particleSystem = new ParticleSystem(particleContainer);

    // 16. Tutorial overlay (last — sits on top of everything)
    if (TutorialOverlay.shouldShow()) {
      const tutorial = new TutorialOverlay(GAME_W, GAME_H, () => {});
      this.root.addChild(tutorial.container);
    }

    // Initialize quests
    QuestManager.initOrRefresh();

    this.setupEventListeners();
    this.statsDisplay.refresh();
  }

  private buildLeftMiniStats(x: number, y: number, width: number, height: number): void {
    const bg = new Graphics();
    bg.rect(x, y, width, height);
    bg.fill(0x0a141f);
    // bottom border
    bg.rect(x, y + height - 1, width, 1);
    bg.fill(0x1e3a5f);
    this.root.addChild(bg);

    // DPS text (left half)
    const dpsText = new Text({ text: 'DPS: 0/s', style: { fontSize: 13, fill: 0x88ccff } });
    dpsText.x = x + 10;
    dpsText.y = y + height / 2 - 7;
    this.root.addChild(dpsText);

    // Crit text (right half)
    const critText = new Text({ text: 'Crit: 5%', style: { fontSize: 13, fill: 0xff9944 } });
    critText.x = x + width / 2 + 10;
    critText.y = y + height / 2 - 7;
    this.root.addChild(critText);

    // Update on DPS change
    EventBus.on(Events.DPS_CHANGED, (dps: unknown) => {
      dpsText.text = `⚔️ DPS: ${formatDPS(dps as Decimal)}/s`;
      critText.text = `🎯 Crit: ${Math.round(GameState.critChance * 100)}%`;
    });
  }

  private onTabChange(tab: TabName): void {
    this.activeTab = tab;
    this.heroPanel.container.visible = tab === 'heroes';
    this.ascensionScreen.container.visible = tab === 'ascension';
    this.relicScreen.container.visible = tab === 'relics';
    this.questScreen.container.visible = tab === 'quests';
    this.achievementScreen.container.visible = tab === 'achievements';
    this.settingsScreen.container.visible = tab === 'settings';
  }

  private setupEventListeners(): void {
    EventBus.on(Events.FLOATING_TEXT, (msg: unknown, x: unknown, y: unknown, color: unknown) => {
      this.floatingTextManager.spawn(
        msg as string,
        x as number,
        y as number,
        color as number
      );
    });

    EventBus.on(Events.ZONE_CHANGED, (zone: unknown) => {
      this.showZoneNotification(zone as number);
      // Zone celebration particles
      this.particleSystem.spawnZoneCelebration(ENEMY_CENTER_X, ENEMY_CENTER_Y);
    });

    EventBus.on(Events.BOSS_SPAWNED, () => {
      this.showBossWarning();
    });

    EventBus.on(Events.BOSS_TIMER_EXPIRED, () => {
      this.hideBossWarning();
      this.showZoneRetreatedNotification();
    });

    EventBus.on(Events.ENEMY_DIED, (_goldEarned: unknown, isBoss: unknown) => {
      if (isBoss) {
        this.hideBossWarning();
      }
      // Kill burst particles
      const color = (isBoss as boolean) ? 0xff4444 : 0x44ff88;
      const count = (isBoss as boolean) ? 20 : 12;
      this.particleSystem.spawnKillBurst(ENEMY_CENTER_X, ENEMY_CENTER_Y, color, count);
    });

    EventBus.on(Events.CLICK_DAMAGE, (_dmg: unknown, x: unknown, y: unknown) => {
      this.particleSystem.spawnClickSparks(x as number, y as number, false);
    });

    EventBus.on(Events.CLICK_CRITICAL, (_dmg: unknown, x: unknown, y: unknown) => {
      this.particleSystem.spawnClickSparks(x as number, y as number, true);
    });

    EventBus.on(Events.OFFLINE_CALCULATED, (result: unknown) => {
      const r = result as { secondsAway: number; goldEarned: Decimal };
      this.showOfflinePopup(r);
    });

    EventBus.on(Events.ACHIEVEMENT_UNLOCKED, (id: unknown) => {
      const achId = id as string;
      const ach = ACHIEVEMENT_DATA.find(a => a.id === achId);
      if (ach) {
        this.showToast(`🏆 Achievement: ${ach.name}!`);
      }
    });

    EventBus.on(Events.RELIC_DROPPED, (relic: unknown) => {
      const r = relic as RelicInstance;
      this.showToast(`🏺 Relic dropped: ${r.emoji} ${r.name} [${r.rarity}]!`);
    });
  }

  private showToast(message: string): void {
    if (this.toastText) {
      this.root.removeChild(this.toastText);
      this.toastText.destroy();
      this.toastText = null;
    }

    const text = new Text({
      text: message,
      style: new TextStyle({
        fontSize: 13,
        fontWeight: 'bold',
        fill: 0xffd700,
        stroke: { color: 0x000000, width: 3 },
        align: 'center',
        wordWrap: true,
        wordWrapWidth: RIGHT_W - 40,
      }),
    });
    text.anchor.set(0.5, 0);
    text.x = RIGHT_X + RIGHT_W / 2;
    text.y = TOP_BAR_H + 8;
    text.alpha = 1;

    this.root.addChild(text);
    this.toastText = text;
    this.toastTimer = 3.0;
  }

  private showOfflinePopup(result: { secondsAway: number; goldEarned: Decimal }): void {
    if (this.offlinePopup) {
      this.root.removeChild(this.offlinePopup);
      this.offlinePopup.destroy();
    }

    const timeStr = OfflineManager.formatTime(result.secondsAway);
    const goldStr = formatGold(result.goldEarned);
    const msg = `Welcome back! Away for ${timeStr}\n+${goldStr} gold earned!`;

    const text = new Text({
      text: msg,
      style: new TextStyle({
        fontSize: 16,
        fontWeight: 'bold',
        fill: 0xffd700,
        stroke: { color: 0x000000, width: 4 },
        align: 'center',
      }),
    });
    text.anchor.set(0.5, 0.5);
    text.x = RIGHT_X + RIGHT_W / 2;
    text.y = TOP_BAR_H + RIGHT_ENEMY_H / 2;
    text.alpha = 1;

    this.root.addChild(text);
    this.offlinePopup = text;
    this.offlinePopupTimer = 4.0;
  }

  private showZoneNotification(zone: number): void {
    if (this.zoneNotifText) {
      this.root.removeChild(this.zoneNotifText);
      this.zoneNotifText.destroy();
    }

    const isBoss = zone % 5 === 0;
    const msg = isBoss
      ? `⚔️ ZONE ${zone} - BOSS FIGHT! ⚔️`
      : `✨ Zone ${zone} ✨`;

    const text = new Text({
      text: msg,
      style: new TextStyle({
        fontSize: isBoss ? 22 : 18,
        fontWeight: 'bold',
        fill: isBoss ? 0xff4444 : 0x44ff88,
        stroke: { color: 0x000000, width: 4 },
        align: 'center',
      }),
    });
    text.anchor.set(0.5, 0.5);
    text.x = RIGHT_X + RIGHT_W / 2;
    text.y = TOP_BAR_H + RIGHT_ENEMY_H / 2;
    text.alpha = 1;

    this.root.addChild(text);
    this.zoneNotifText = text;
    this.zoneNotifTimer = 2.5;
  }

  private showBossWarning(): void {
    if (this.bossWarnText) return;

    const text = new Text({
      text: '👑 BOSS BATTLE! 👑',
      style: new TextStyle({
        fontSize: 20,
        fontWeight: 'bold',
        fill: 0xffd700,
        stroke: { color: 0x000000, width: 4 },
      }),
    });
    text.anchor.set(0.5, 0);
    text.x = RIGHT_X + RIGHT_W / 2;
    text.y = TOP_BAR_H + 20;

    this.root.addChild(text);
    this.bossWarnText = text;
  }

  private hideBossWarning(): void {
    if (this.bossWarnText) {
      this.root.removeChild(this.bossWarnText);
      this.bossWarnText.destroy();
      this.bossWarnText = null;
    }
  }

  private showZoneRetreatedNotification(): void {
    if (this.zoneNotifText) {
      this.root.removeChild(this.zoneNotifText);
      this.zoneNotifText.destroy();
    }

    const text = new Text({
      text: '💀 Boss escaped! Retreated...',
      style: new TextStyle({
        fontSize: 16,
        fontWeight: 'bold',
        fill: 0xff6666,
        stroke: { color: 0x000000, width: 3 },
      }),
    });
    text.anchor.set(0.5, 0.5);
    text.x = RIGHT_X + RIGHT_W / 2;
    text.y = TOP_BAR_H + RIGHT_ENEMY_H / 2;

    this.root.addChild(text);
    this.zoneNotifText = text;
    this.zoneNotifTimer = 2.0;
  }

  update(deltaSeconds: number): void {
    this.floatingTextManager.update(deltaSeconds);
    this.enemyDisplay.update(deltaSeconds);

    if (GameState.bossTimerActive) {
      this.enemyDisplay.updateBossTimer(
        GameState.bossTimeRemaining,
        BalanceConfig.BOSS_TIMER_SECONDS
      );
    }

    this.skillBar.update(deltaSeconds);

    // Update active screen
    if (this.activeTab === 'ascension') this.ascensionScreen.update(deltaSeconds);
    else if (this.activeTab === 'relics') this.relicScreen.update(deltaSeconds);
    else if (this.activeTab === 'quests') this.questScreen.update(deltaSeconds);
    else if (this.activeTab === 'achievements') this.achievementScreen.update(deltaSeconds);
    else if (this.activeTab === 'settings') this.settingsScreen.update(deltaSeconds);

    // Particle system update
    this.particleSystem.update(deltaSeconds);

    // Ad manager tick (check double gold expiry)
    AdManager.tick();

    // Zone notification fade
    if (this.zoneNotifText && this.zoneNotifTimer > 0) {
      this.zoneNotifTimer -= deltaSeconds;
      if (this.zoneNotifTimer <= 0) {
        this.root.removeChild(this.zoneNotifText);
        this.zoneNotifText.destroy();
        this.zoneNotifText = null;
      } else if (this.zoneNotifTimer < 0.5) {
        this.zoneNotifText.alpha = this.zoneNotifTimer / 0.5;
      }
    }

    // Offline popup fade
    if (this.offlinePopup && this.offlinePopupTimer > 0) {
      this.offlinePopupTimer -= deltaSeconds;
      if (this.offlinePopupTimer <= 0) {
        this.root.removeChild(this.offlinePopup);
        this.offlinePopup.destroy();
        this.offlinePopup = null;
      } else if (this.offlinePopupTimer < 1.0) {
        this.offlinePopup.alpha = this.offlinePopupTimer / 1.0;
      }
    }

    // Toast fade
    if (this.toastText && this.toastTimer > 0) {
      this.toastTimer -= deltaSeconds;
      if (this.toastTimer <= 0) {
        this.root.removeChild(this.toastText);
        this.toastText.destroy();
        this.toastText = null;
      } else if (this.toastTimer < 1.0) {
        this.toastText.alpha = this.toastTimer / 1.0;
      }
    }
  }
}
