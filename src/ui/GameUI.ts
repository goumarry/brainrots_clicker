import { Application, Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js';
import { createTextStyle } from './styles/Typography';
import { StatsDisplay } from './StatsDisplay';
import { EnemyDisplay } from './EnemyDisplay';
import { HeroPanel } from './HeroPanel';
import { FloatingTextManager } from './FloatingText';
import { TabBar, TabName } from './TabBar';
import { AscensionScreen } from './screens/AscensionScreen';
import { RelicScreen } from './screens/RelicScreen';
import { AchievementScreen } from './screens/AchievementScreen';
import { AchievementManager } from '../core/AchievementManager';
import { SettingsScreen } from './screens/SettingsScreen';
import { ParticleSystem } from './ParticleSystem';
import { TutorialOverlay } from './TutorialOverlay';
import { AdRewardsPanel } from './AdRewardsPanel';
import { EventBus, Events } from '../systems/EventBus';
import { ClickManager } from '../core/ClickManager';
import { GameState } from '../core/GameState';
import { AudioManager } from '../systems/AudioManager';
import { BalanceConfig } from '../config/BalanceConfig';
import { ACHIEVEMENT_DATA } from '../config/AchievementData';
import { RelicInstance } from '../core/GameState';
import { formatGold, formatDPS, formatNumber } from '../systems/NumberFormatter';
import { AdManager } from '../integrations/AdManager';
import { Decimal } from '../systems/BigNumber';
import { HeroCombatDisplay } from './HeroCombatDisplay';
import { ActiveSkillsDisplay } from './ActiveSkillsDisplay';
import { HERO_DATA } from '../config/HeroData';
import { EnemyManager } from '../core/EnemyManager';

export class GameUI {
  private app: Application;
  private root: Container;

  private statsDisplay!: StatsDisplay;
  private enemyDisplay!: EnemyDisplay;
  private heroPanel!: HeroPanel;
  private floatingTextManager!: FloatingTextManager;
  private tabBar!: TabBar;
  private uiOverlay!: Container;
  private tooltipLayer: Container = new Container();
  private combatRoot: Container = new Container();

  private ascensionScreen!: AscensionScreen;
  private relicScreen!: RelicScreen;
  private achievementScreen!: AchievementScreen;
  private settingsScreen!: SettingsScreen;

  private particleSystem!: ParticleSystem;
  private adRewardsPanel!: AdRewardsPanel;
  private heroCombatDisplay!: HeroCombatDisplay;
  private activeSkillsHUD!: ActiveSkillsDisplay;
  private activeTab: TabName = 'heroes';
  private relicStatusText!: Text;
  private activeToasts: { text: Text, timer: number, pos: 'center' | 'top-left' | 'top-right' }[] = [];
  private achTimer: number = 0.5;

  // Layout Properties (Liquid)
  private screenW: number;
  private screenH: number;
  private enemyCenterX: number = 0;
  private enemyCenterY: number = 0;
  private leftW: number = 530; // Increased from 480
  private rightW: number;
  private topBarH: number = 90;
  private adPanelW: number = 100;
  private skillBarH: number = 120;

  constructor(app: Application, parent: Container) {
    this.app = app;
    this.screenW = app.screen.width;
    this.screenH = app.screen.height;
    this.rightW = this.screenW - this.leftW;

    this.root = new Container();
    parent.addChild(this.root);

    this.build();
    this.setupEventListeners();

    // Resize listener for true liquid layout
    window.addEventListener('resize', () => this.onResize());
  }

  private onResize(): void {
    this.screenW = this.app.screen.width;
    this.screenH = this.app.screen.height;
    this.rightW = this.screenW - this.leftW;
    this.build();
  }

  private build(): void {
    this.root.removeChildren(); // Clean up on resize/rebuild
    
    const sw = this.screenW;
    const sh = this.screenH;
    const lw = this.leftW;
    const rw = this.rightW;
    const th = this.topBarH;
    const aw = this.adPanelW;
    const shh = this.skillBarH;
    
    // 0. Global Tooltip Layer (Above everything)
    // Initialize before components so they can add themselves to it
    this.tooltipLayer = new Container();
    // We will addChild(this.tooltipLayer) at the very end to ensure top-most layering

    // 1. Full background
    const bg = new Graphics();
    bg.rect(0, 0, sw, sh);
    bg.fill(0x060d16);
    this.root.addChild(bg);

    // 2. Left panel background
    const leftBg = new Graphics();
    leftBg.rect(0, 0, lw, sh);
    leftBg.fill(0x0d1b2a); // Unified deeper background
    this.root.addChild(leftBg);

    // 3. Tab bar (top left)
    this.tabBar = new TabBar(lw, 90, (tab) => this.onTabChange(tab));
    this.root.addChild(this.tabBar.container);

    // 4. Management screens area
    const contentH = sh - 90;
    const contentY = 90;

    this.heroPanel = new HeroPanel(lw, contentH);
    this.heroPanel.container.y = contentY;
    this.root.addChild(this.heroPanel.container);

    this.ascensionScreen = new AscensionScreen(lw, contentH);
    this.ascensionScreen.container.y = contentY;
    this.ascensionScreen.container.visible = false;
    this.root.addChild(this.ascensionScreen.container);

    this.relicScreen = new RelicScreen(lw, contentH);
    this.relicScreen.container.y = contentY;
    this.relicScreen.container.visible = false;
    this.root.addChild(this.relicScreen.container);

    this.achievementScreen = new AchievementScreen(lw, contentH);
    this.achievementScreen.container.y = contentY;
    this.achievementScreen.container.visible = false;
    this.root.addChild(this.achievementScreen.container);

    this.settingsScreen = new SettingsScreen(lw, contentH);
    this.settingsScreen.container.y = contentY;
    this.settingsScreen.container.visible = false;
    this.root.addChild(this.settingsScreen.container);

    // 5. COMBAT ZONE ISOLATION (Strict masking and local container)
    const rightX = lw;
    const padding = 20;

    this.combatRoot = new Container();
    this.combatRoot.x = rightX;
    this.root.addChild(this.combatRoot);

    // Apply strict mask to ensure NO bleed-over into the Hero Panel
    const combatMask = new Graphics();
    combatMask.rect(0, 0, rw, sh).fill(0xffffff);
    this.combatRoot.addChild(combatMask);
    this.combatRoot.mask = combatMask;

    // Enemy Display (Now local to combatRoot)
    if (this.enemyDisplay) this.enemyDisplay.destroy();
    this.enemyDisplay = new EnemyDisplay(rw, sh);
    this.enemyDisplay.setBasePosition(0, 0); 
    this.combatRoot.addChild(this.enemyDisplay.container);

    // Click zone (Local to combatRoot)
    const clickZone = new Graphics();
    clickZone.rect(0, 0, rw, sh);
    clickZone.fill({ color: 0xffffff, alpha: 0 });
    clickZone.eventMode = 'static';
    clickZone.cursor = 'pointer';
    this.enemyCenterX = rw / 2;
    this.enemyCenterY = sh / 2;

    clickZone.on('pointerdown', (e) => {
      const local = e.getLocalPosition(this.combatRoot);
      ClickManager.handleClick(local.x, local.y);
    });
    this.combatRoot.addChild(clickZone);

    // 6. HUD OVERLAYS (Local to combatRoot)
    this.uiOverlay = new Container();
    this.uiOverlay.sortableChildren = true;
    this.combatRoot.addChild(this.uiOverlay);

    // Stats bar (Top Overlay)
    this.statsDisplay = new StatsDisplay(rw, this.tooltipLayer, th);
    this.statsDisplay.container.x = 0;
    this.uiOverlay.addChild(this.statsDisplay.container);

    // Ad Rewards Panel (Right Overlay)
    const adPanelX = rw - aw - padding;
    const adPanelY = th + padding + 60; // Lowered from 20 to 60 for better centering with top bar
    const adPanelH = sh - th - 120; // Expanded available height
    this.adRewardsPanel = new AdRewardsPanel(aw, adPanelH);
    this.adRewardsPanel.container.x = adPanelX;
    this.adRewardsPanel.container.y = adPanelY;
    this.uiOverlay.addChild(this.adRewardsPanel.container);

    // Hero Combat Display (Replaces bottom Skill Bar)
    this.heroCombatDisplay = new HeroCombatDisplay(rw, sh, this.tooltipLayer);
    this.uiOverlay.addChild(this.heroCombatDisplay.container);

    // Active Skills HUD (Lowered from sh - shh - 85)
    this.activeSkillsHUD = new ActiveSkillsDisplay();
    this.activeSkillsHUD.container.x = 25;
    this.activeSkillsHUD.container.y = sh - 110; 
    this.uiOverlay.addChild(this.activeSkillsHUD.container);

    // Relic status text (Persistent label)
    this.relicStatusText = new Text({
      text: '',
      style: createTextStyle({ fontSize: 16, fill: 0xaaaaaa, fontWeight: '900', stroke: { color: 0x000000, width: 3.5 }, dropShadow: { color: 0x000000, alpha: 0.4, blur: 4, distance: 2 }, padding: 8 }),
      resolution: window.devicePixelRatio || 2,
    });
    this.relicStatusText.x = 25; // 25px margin for alignment with toasts
    this.relicStatusText.y = th + 20; // 110px total Y
    this.uiOverlay.addChild(this.relicStatusText);

    // 7. FX layers (Local to combatRoot)
    const floatingContainer = new Container();
    this.combatRoot.addChild(floatingContainer);
    this.floatingTextManager = new FloatingTextManager(floatingContainer);

    const particleContainer = new Container();
    particleContainer.eventMode = 'none';
    this.combatRoot.addChild(particleContainer);
    this.particleSystem = new ParticleSystem(particleContainer);
 
    // GLOBAL DIVIDERS (Top-most layer)
    const globalDividers = new Graphics();
    
    // Horizontal Divider (Bottom of Tabs) - Dark for subtle transition
    globalDividers.rect(0, th - 2, lw, 2);
    globalDividers.fill(0x0a1422);
    
    // Vertical Divider (Right Border) - Blue, Top-most for un-interrupted line
    globalDividers.rect(lw - 2, 0, 2, sh);
    globalDividers.fill(0x1e3a5f);
    
    this.root.addChild(globalDividers);

    // Tutorial
    if (TutorialOverlay.shouldShow()) {
      const tutorial = new TutorialOverlay(sw, sh, () => {});
      this.root.addChild(tutorial.container);
    }
    
    // FINALLY: Add global tooltip layer as the last child to be on top of everything
    this.root.addChild(this.tooltipLayer);

    // Space key listener
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
          e.preventDefault();
          ClickManager.handleClick(this.enemyCenterX, this.enemyCenterY);
        }
    });
 
    // Auto-click visuals listener
    EventBus.on(Events.AUTO_CLICK, (damage) => {
      // Simulate click at center with some jitter
      const jitter = 80; // INCREASED jitter for 30Hz density
      const jx = this.enemyCenterX + (Math.random() - 0.5) * jitter;
      const jy = this.enemyCenterY + (Math.random() - 0.5) * jitter;
      this.showClickEffect(jx, jy, false, damage as Decimal);
    });
 
    this.statsDisplay.refresh();
  }
 
  private showClickEffect(x: number, y: number, isCrit: boolean, damage: Decimal): void {
    AudioManager.playHitSound();
    this.floatingTextManager.spawn(
      isCrit ? `CRIT! ${formatNumber(damage)}` : formatNumber(damage),
      x,
      y,
      isCrit ? 0xff4444 : 0x9b59b6
    );
    this.particleSystem.spawnClickSparks(x, y, isCrit);
    this.enemyDisplay.triggerHitShake();
  }

  private onTabChange(tab: TabName): void {
    this.activeTab = tab;
    this.heroPanel.container.visible = tab === 'heroes';
    this.ascensionScreen.container.visible = tab === 'ascension';
    this.relicScreen.container.visible = tab === 'relics';
    this.achievementScreen.container.visible = tab === 'achievements';
    this.settingsScreen.container.visible = tab === 'settings';
  }

  private setupEventListeners(): void {
    EventBus.on(Events.CLICK_DAMAGE, (damage, x, y) => {
      this.showClickEffect(x as number, y as number, false, damage as Decimal);
    });
 
    EventBus.on(Events.CLICK_CRITICAL, (damage, x, y) => {
      this.showClickEffect(x as number, y as number, true, damage as Decimal);
    });
 
    EventBus.on(Events.FLOATING_TEXT, (msg, x, y, color) => {
      // Generic floating text (still needed for gold etc.)
      this.floatingTextManager.spawn(msg as string, x as number, y as number, color as number);
    });

    EventBus.on(Events.ZONE_CHANGED, (zone) => {
      this.showToast(`✨ Zone ${zone} ✨`, true, 2.8, 'top-right', 0x00e5ff);
      this.particleSystem.spawnZoneCelebration(this.rightW / 2, this.screenH / 2);
    });

    EventBus.on(Events.ENEMY_DIED, (_g, isBoss, enemyColor) => {
        const color = (enemyColor !== undefined) ? (enemyColor as number) : ((isBoss as boolean) ? 0xff4444 : 0x44ff88);
        const count = (isBoss as boolean) ? 30 : 16;
        const scale = (isBoss as boolean) ? 10.5 : 7.5;
        this.particleSystem.spawnKillBurst(this.rightW / 2, this.screenH / 2, color, count, scale, 3.0);
    });

    EventBus.on(Events.ACHIEVEMENT_UNLOCKED, (id) => {
      const ach = ACHIEVEMENT_DATA.find(a => a.id === id);
      if (ach) this.showToast(`🏆 Achievement: ${ach.name}!`, true, 3.5, 'center', 0xffaa00);
    });

    EventBus.on(Events.RELIC_DROPPED, (relic) => {
      const r = relic as RelicInstance;
      const col = r.rarity === 'Diamond' ? 0x00e5ff : (r.rarity === 'Gold' ? 0xffd700 : (r.rarity === 'Silver' ? 0xbdc3c7 : 0xcd7f32));
      this.showToast(`🏺 Relic dropped: ${r.emoji} ${r.name}!`, true, 4.5, 'top-left', col);
    });

    EventBus.on(Events.RELIC_FUSED, (relic) => {
      const r = relic as RelicInstance;
      const col = r.rarity === 'Diamond' ? 0x00e5ff : (r.rarity === 'Gold' ? 0xffd700 : (r.rarity === 'Silver' ? 0xbdc3c7 : 0xcd7f32));
      this.showToast(`✨ FUSION! ${r.name} upgraded to ${r.rarity}! ✨`, true, 4.5, 'top-left', col);
    });
 
    EventBus.on(Events.SKILL_ANIMATION_TRIGGERED, (data: any) => {
        this.animateHeroSkill(data.heroIds, data.skillId, data.damage);
    });
  }

  private showToast(message: string, isBig: boolean = false, duration: number = 2.5, pos: 'center' | 'top-left' | 'top-right' = 'center', color: number = 0xffffff): void {
    // Calculate combat area dimensions for centering (local to combatRoot)
    const padding = 20;
    const enemyAreaX = 0; 
    const adPanelX = this.rightW - this.adPanelW - padding;
    const enemyAreaW = adPanelX - enemyAreaX - padding;
 
    const toast = new Text({
      text: message,
      style: createTextStyle({
        fontSize: isBig ? 20 : 16,
        fill: color,
        fontWeight: '900',
        stroke: { color: 0x000000, width: 4.5 },
        dropShadow: { color: 0x000000, alpha: 0.4, blur: 4, distance: 2 },
        align: pos === 'center' ? 'center' : (pos === 'top-left' ? 'left' : 'right'),
        padding: 6,
      }),
      resolution: window.devicePixelRatio || 2,
    });
    
    // Vertical offset (40px below their matching persistent labels + stacking)
    const labelY = this.topBarH + padding;
    let baseOffset = (pos === 'center') ? 15 : 20;
    baseOffset += 40; // Base margin from labels
    
    // Check existing toasts in the same position to calculate stack offset
    const existingInPos = this.activeToasts.filter(t => t.pos === pos);
    const stackOffset = existingInPos.length * 25; // 25px per additional message
    
    if (pos === 'center') {
      toast.anchor.set(0.5, 0);
      toast.x = this.rightW / 2; // Exactly aligned with enemyNameText.x
      toast.y = labelY + baseOffset + stackOffset;
    } else if (pos === 'top-left') {
      toast.anchor.set(0, 0);
      toast.x = 25; // Balanced with relicStatusText.x
      toast.y = labelY + baseOffset + stackOffset;
    } else {
      toast.anchor.set(1, 0);
      toast.x = this.rightW - 25; // Balanced with mobProgressText.x
      toast.y = labelY + baseOffset + stackOffset;
    }
    
    this.uiOverlay.addChild(toast); // Use uiOverlay instead of root
    this.activeToasts.push({ text: toast, timer: duration, pos });
  }

  update(deltaSeconds: number): void {
    this.statsDisplay.update(deltaSeconds);
    this.floatingTextManager.update(deltaSeconds);
    this.enemyDisplay.update(deltaSeconds);

    if (GameState.bossTimerActive) {
      this.enemyDisplay.updateBossTimer(GameState.bossTimeRemaining, BalanceConfig.BOSS_TIMER_SECONDS);
    }

    if (this.heroCombatDisplay) this.heroCombatDisplay.update(deltaSeconds);
    this.heroPanel.update(deltaSeconds);
    this.particleSystem.update(deltaSeconds);
    this.adRewardsPanel.update(deltaSeconds);
 
    // Update relic status
    const isActive = GameState.zone >= GameState.stats.maxZoneEver;
    if (isActive) {
      this.relicStatusText.text = `Relic Drops: ACTIVE ✅`;
      this.relicStatusText.style.fill = 0x44ff88;
    } else {
      this.relicStatusText.text = `Relic Drops: LOCKED 🔒 (Record: Zone ${GameState.stats.maxZoneEver})`;
      this.relicStatusText.style.fill = 0xff6666;
    }

    // Update active screen
    if (this.activeTab === 'ascension') this.ascensionScreen.update(deltaSeconds);
    else if (this.activeTab === 'relics') this.relicScreen.update(deltaSeconds);
    else if (this.activeTab === 'achievements') this.achievementScreen.update(deltaSeconds);
    else if (this.activeTab === 'settings') this.settingsScreen.update(deltaSeconds);

    // Update active toasts
    const toastsByPos: Record<string, typeof this.activeToasts> = { 'center': [], 'top-left': [], 'top-right': [] };
    
    // 1. Decrement timers and remove expired
    for (let i = this.activeToasts.length - 1; i >= 0; i--) {
      const toast = this.activeToasts[i];
      toast.timer -= deltaSeconds;
      if (toast.timer <= 0) {
        this.root.removeChild(toast.text);
        toast.text.destroy();
        this.activeToasts.splice(i, 1);
      } else {
        if (toast.timer < 0.5) toast.text.alpha = toast.timer / 0.5;
        // Group remaining for repositioning
        toastsByPos[toast.pos].push(toast);
      }
    }
    
    // 2. Smoothly reposition remaining toasts (Slide Up effect)
    const padding = 20;
    const labelY = this.topBarH + padding;
    
    for (const pos in toastsByPos) {
      const list = toastsByPos[pos];
      // Note: list was built in reverse order (newest first). 
      // We want oldest (created first) at the top. 
      // Reverse again to get oldest-first order for indexing.
      list.reverse(); 
      
      const baseOffset = (pos === 'center') ? 15 + 40 : 20 + 40;
      
      for (let j = 0; j < list.length; j++) {
        const t = list[j];
        const targetY = labelY + baseOffset + (j * 25);
        // Lerp Y for smooth sliding
        t.text.y += (targetY - t.text.y) * 0.15;
      }
    }

    this.achTimer -= deltaSeconds;
    if (this.achTimer <= 0) {
      this.achTimer = 0.5;
      AchievementManager.checkAll();
    }
    this.activeSkillsHUD.update(deltaSeconds);
  }
  private animateHeroSkill(heroIds: string[], _skillId: string, damage: any): void {
    let hitTriggered = false;
    const sunPos = EnemyDisplay.getSunPos(GameState.zone, this.rightW);

    heroIds.forEach((heroId, index) => {
      const hero = HERO_DATA.find(h => h.id === heroId);
      if (!hero || !hero.image) return;
  
      const shadow = Sprite.from(hero.image);
      shadow.anchor.set(0.5);
      shadow.scale.set(1.1);
      shadow.tint = 0x000000;
      shadow.alpha = 0.25;
      shadow.zIndex = 4999;
      this.uiOverlay.addChild(shadow);

      const sprite = Sprite.from(hero.image);
      sprite.anchor.set(0.5);
      sprite.scale.set(1.1);
      sprite.x = -200; 
      // Small vertical offset for subsequent heroes
      sprite.y = this.enemyCenterY + (index * 40) - ((heroIds.length-1) * 20); 
      sprite.zIndex = 5000;
      
      this.uiOverlay.addChild(sprite);
  
      let progress = 0;
      const duration = 1.0; 
      const startX = -150;
      const endX = this.rightW + 150; // Bound to rightW
      const delay = index * 0.15; // 150ms delay between heroes
      let elapsed = 0;
  
      const ticker = (tickerObj: any) => {
          const delta = tickerObj.deltaTime / 60;
          elapsed += delta;
 
          if (elapsed < delay) return;
 
          progress += (delta) / duration;
          sprite.x = startX + (endX - startX) * progress;
          sprite.rotation = 0.1 * Math.sin(progress * 10);
  
          // Sync shadow with sun
          const relSunX = sunPos.x - sprite.x;
          const relSunY = sunPos.y - sprite.y;
          const shadowX = -relSunX * 0.1;
          const shadowY = -relSunY * 0.1;
          shadow.x = sprite.x + shadowX;
          shadow.y = sprite.y + shadowY;
          shadow.rotation = sprite.rotation;
          shadow.scale.set(sprite.scale.x * 0.95);

          // Trigger impact when the FIRST hero reaches the center
          if (index === 0 && !hitTriggered && sprite.x >= this.enemyCenterX) {
              hitTriggered = true;
              if (damage) {
                this.handleSkillImpact(damage);
              } else {
                this.particleSystem.spawnClickSparks(this.enemyCenterX, this.enemyCenterY, false);
              }
          }
  
          if (progress >= 1) {
              this.app.ticker.remove(ticker);
              this.uiOverlay.removeChild(sprite);
              this.uiOverlay.removeChild(shadow);
              sprite.destroy();
              shadow.destroy();
          }
      };
      this.app.ticker.add(ticker);
    });
  }
 
  private handleSkillImpact(damage: any): void {
    // ACTUAL DAMAGE
    EnemyManager.dealDamage(damage);
 
    // VISUALS
    AudioManager.playExplosionSound();
    
    // Large burst of particles
    for (let i = 0; i < 4; i++) {
        const jx = this.enemyCenterX + (Math.random() - 0.5) * 60;
        const jy = this.enemyCenterY + (Math.random() - 0.5) * 60;
        this.particleSystem.spawnClickSparks(jx, jy, true);
    }
 
    // Floating damage
    this.floatingTextManager.spawn(formatNumber(damage), this.enemyCenterX, this.enemyCenterY - 80, 0xffaa00);
 
    // Heavy shake
    this.enemyDisplay.triggerHitShake();
    this.enemyDisplay.triggerHitShake(); // Extra punch for explosion
  }
}
