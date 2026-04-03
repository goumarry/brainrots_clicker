import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { createTextStyle } from '../styles/Typography';
import { AscensionManager } from '../../core/AscensionManager';
import { GameState } from '../../core/GameState';
import { EnemyManager } from '../../core/EnemyManager';
import { ASCENSION_UPGRADES, AscensionBranch } from '../../config/AscensionData';
import { EventBus, Events } from '../../systems/EventBus';

const BRANCH_COLORS: Record<AscensionBranch, number> = {
  sigma: 0x9b59b6,
  grind: 0xf39c12,
  speed: 0x3498db,
  crit: 0xe74c3c,
  chaos: 0x1abc9c,
};

const BRANCH_LABELS: Record<AscensionBranch, string> = {
  sigma: '💪 Sigma Path',
  grind: '💰 Grind Path',
  speed: '⚡ Speed Path',
  crit: '🎯 Crit Path',
  chaos: '🌀 Chaos Path',
};

export class AscensionScreen {
  container: Container;
  private scrollContainer: Container;
  private maskGraphic: Graphics;
  private panelW: number;
  private panelH: number;
  private scrollY: number = 0;
  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private dragStartScrollY: number = 0;
  private totalContentH: number = 0;

  constructor(width: number, height: number) {
    this.panelW = width;
    this.panelH = height;
    this.container = new Container();

    const bg = new Graphics();
    bg.rect(0, 0, width, height);
    bg.fill(0x0d1b2a);
    this.container.addChild(bg);

    this.scrollContainer = new Container();
    this.container.addChild(this.scrollContainer);

    this.maskGraphic = new Graphics();
    this.maskGraphic.rect(0, 0, width, height);
    this.maskGraphic.fill(0xffffff);
    this.container.addChild(this.maskGraphic);
    this.scrollContainer.mask = this.maskGraphic;

    this.setupScroll();
    this.build();

    EventBus.on(Events.ASCENSION_COMPLETE, () => this.build());
    EventBus.on(Events.ZONE_CHANGED, () => this.refreshAscendButton());
  }

  private setupScroll(): void {
    this.container.eventMode = 'static';
    this.container.on('pointerdown', (e) => {
      this.isDragging = true;
      this.dragStartY = e.global.y;
      this.dragStartScrollY = this.scrollY;
    });
    this.container.on('pointermove', (e) => {
      if (!this.isDragging) return;
      const dy = e.global.y - this.dragStartY;
      this.setScrollY(this.dragStartScrollY + dy);
    });
    this.container.on('pointerup', () => { this.isDragging = false; });
    this.container.on('pointerupoutside', () => { this.isDragging = false; });
    this.container.on('wheel', (e) => {
      this.setScrollY(this.scrollY - (e as WheelEvent).deltaY * 0.5);
    });
  }

  private setScrollY(y: number): void {
    const maxScroll = Math.max(0, this.totalContentH - this.panelH);
    this.scrollY = Math.max(-maxScroll, Math.min(0, y));
    this.scrollContainer.y = this.scrollY;
  }

  private build(): void {
    while (this.scrollContainer.children.length > 0) {
      this.scrollContainer.removeChildAt(0);
    }

    let yOffset = 10;

    // Header: Sigma Souls & Record
    const headerStyle = createTextStyle({ fontSize: 18, fill: 0xc39ef8, fontWeight: '800' });
    const soulsText = new Text({
      text: `🌀 Sigma Souls: ${GameState.sigmaSouls}`,
      style: headerStyle,
      resolution: window.devicePixelRatio || 2,
    });
    soulsText.x = 20;
    soulsText.y = yOffset;
    this.scrollContainer.addChild(soulsText);

    const recordText = new Text({
      text: `🏆 Record: Zone ${GameState.stats.maxZoneEver}`,
      style: createTextStyle({ fontSize: 16, fill: 0xf1c40f }),
      resolution: window.devicePixelRatio || 2,
    });
    recordText.anchor.set(1, 0);
    recordText.x = this.panelW - 20;
    recordText.y = yOffset + 2;
    this.scrollContainer.addChild(recordText);
    yOffset += 40;

    // Potential Gain
    const pendingSouls = AscensionManager.getSigmaSoulsReward();
    const pendingText = new Text({
      text: pendingSouls > 0 ? `✨ New rewards: +${pendingSouls} souls` : `⏳ No new rewards reached`,
      style: createTextStyle({ fontSize: 14, fill: pendingSouls > 0 ? 0x44ff88 : 0x8899aa }),
      resolution: window.devicePixelRatio || 2,
    });
    pendingText.x = 20;
    pendingText.y = yOffset;
    this.scrollContainer.addChild(pendingText);
    yOffset += 24;

    // Requirement text
    const canAscend = AscensionManager.canAscend();
    const milestoneTarget = (Math.floor(GameState.highestZoneAscended / 10) + 1) * 10;
    
    const reqText = new Text({
      text: canAscend
        ? `✅ Milestone reached! (Beat Zone ${milestoneTarget})`
        : `🔒 Goal: Beat Zone ${milestoneTarget} Boss`,
      style: createTextStyle({ fontSize: 15, fill: canAscend ? 0x44ff88 : 0xff8844, fontWeight: 'bold' }),
      resolution: window.devicePixelRatio || 2,
    });
    reqText.x = 20;
    reqText.y = yOffset;
    this.scrollContainer.addChild(reqText);
    yOffset += 32;

    // Ascend button
    const ascendBtn = new Graphics();
    ascendBtn.roundRect(20, 0, this.panelW - 40, 66, 12);
    ascendBtn.fill(canAscend ? 0x6a35c8 : 0x2a2a3a);
    ascendBtn.roundRect(20, 0, this.panelW - 40, 66, 12);
    ascendBtn.stroke({ width: 3, color: canAscend ? 0x9b59b6 : 0x3a3a4a });
    ascendBtn.y = yOffset;
    this.scrollContainer.addChild(ascendBtn);

    const ascendText = new Text({
      text: `🌀 ASCEND (+${pendingSouls} Sigma Souls)`,
      style: createTextStyle({ fontSize: 22, fill: canAscend ? 0xffffff : 0x555566, fontWeight: '800', padding: 8 }),
      resolution: window.devicePixelRatio || 2,
    });
    ascendText.anchor.set(0.5);
    ascendText.x = this.panelW / 2;
    ascendText.y = yOffset + 33;
    this.scrollContainer.addChild(ascendText);

    if (canAscend) {
      ascendBtn.eventMode = 'static';
      ascendBtn.cursor = 'pointer';
      ascendBtn.on('pointerdown', () => {
        if (AscensionManager.ascend()) {
          EnemyManager.initialSpawn();
          this.build();
        }
      });
    }
    yOffset += 78;

    // Separator
    yOffset += 8;
    const sep = new Graphics();
    sep.rect(20, 0, this.panelW - 40, 1);
    sep.fill(0x2a3a50);
    sep.y = yOffset;
    this.scrollContainer.addChild(sep);
    yOffset += 12;

    // Branches
    const branches: AscensionBranch[] = ['sigma', 'grind', 'speed', 'crit', 'chaos'];
    for (const branch of branches) {
      const branchUpgrades = ASCENSION_UPGRADES.filter(u => u.branch === branch);

      const branchLabel = new Text({
        text: BRANCH_LABELS[branch],
        style: createTextStyle({ fontSize: 20, fill: BRANCH_COLORS[branch] }),
        resolution: window.devicePixelRatio || 2,
      });
      branchLabel.x = 20;
      branchLabel.y = yOffset;
      this.scrollContainer.addChild(branchLabel);
      yOffset += 32;

      for (const upg of branchUpgrades) {
        const level = AscensionManager.getUpgradeLevel(upg.id);
        const canAfford = AscensionManager.canAffordUpgrade(upg.id);
        const maxed = level >= upg.maxLevel;
        const cost = maxed ? 0 : upg.cost * (level + 1);

        const cardBg = new Graphics();
        cardBg.roundRect(20, 0, this.panelW - 40, 78, 8);
        cardBg.fill(0x0d1926);
        cardBg.roundRect(20, 0, this.panelW - 40, 78, 8);
        cardBg.stroke({ width: 1.5, color: maxed ? BRANCH_COLORS[branch] : 0x1e2d3e });
        cardBg.y = yOffset;
        this.scrollContainer.addChild(cardBg);

        const upgName = new Text({
          text: `${upg.name} (${level}/${upg.maxLevel})`,
          style: createTextStyle({ fontSize: 18, fill: maxed ? BRANCH_COLORS[branch] : 0xffffff }),
          resolution: window.devicePixelRatio || 2,
        });
        upgName.x = 35;
        upgName.y = yOffset + 12;
        this.scrollContainer.addChild(upgName);

        const upgDesc = new Text({
          text: upg.description,
          style: createTextStyle({ fontSize: 15, fill: 0x8899aa }),
          resolution: window.devicePixelRatio || 2,
        });
        upgDesc.x = 35;
        upgDesc.y = yOffset + 40;
        this.scrollContainer.addChild(upgDesc);

        if (!maxed) {
          const btnW = 120;
          const btnH = 42;
          const btn = new Graphics();
          btn.roundRect(this.panelW - 35 - btnW, 18, btnW, btnH, 8);
          btn.fill(canAfford ? 0x6a35c8 : 0x1a2332);
          btn.y = yOffset;
          this.scrollContainer.addChild(btn);

          const btnText = new Text({
            text: `${cost}🌀`,
            style: createTextStyle({ fontSize: 16, fill: canAfford ? 0xffffff : 0x556677 }),
            resolution: window.devicePixelRatio || 2,
          });
          btnText.anchor.set(0.5);
          btnText.x = this.panelW - 35 - btnW / 2;
          btnText.y = yOffset + 18 + btnH / 2;
          this.scrollContainer.addChild(btnText);

          if (canAfford) {
            btn.eventMode = 'static';
            btn.cursor = 'pointer';
            const upgId = upg.id;
            btn.on('pointerdown', () => {
              AscensionManager.buyUpgrade(upgId);
              this.build();
            });
          }
        } else {
          const maxedText = new Text({
            text: 'MAX',
            style: createTextStyle({ fontSize: 16, fill: BRANCH_COLORS[branch] }),
            resolution: window.devicePixelRatio || 2,
          });
          maxedText.anchor.set(0.5);
          maxedText.x = this.panelW - 65;
          maxedText.y = yOffset + 39;
          this.scrollContainer.addChild(maxedText);
        }

        yOffset += 88;
      }
      yOffset += 8;
    }

    this.totalContentH = yOffset + 20;
  }

  private refreshAscendButton(): void {
    this.build();
  }

  update(_deltaSeconds: number): void {}
}
