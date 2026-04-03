import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { createTextStyle } from './styles/Typography';
import { Decimal } from '../systems/BigNumber';
import { formatGold, formatDPS, formatNumber } from '../systems/NumberFormatter';
import { EventBus, Events } from '../systems/EventBus';
import { GameState } from '../core/GameState';
import { StatCalculator } from '../core/StatCalculator';
import { StatTooltip } from './StatTooltip';
import { DamageManager } from '../core/DamageManager';

export class StatsDisplay {
  container: Container;
  private topBar: Graphics;
  private goldText: Text;
  private zoneText: Text;
  private dpsText: Text;
  private clickDmgText: Text;
  private goldMultText: Text;
  private critText: Text;
  private soulsText: Text;
  private tooltip: StatTooltip;
  private barWidth: number;
  private barHeight: number;
  private updateTimer: number = 0;
  private overlay: Container;

  constructor(width: number, overlay: Container, height: number = 56) {
    this.barWidth = width;
    this.barHeight = height;
    this.overlay = overlay;
    this.container = new Container();

    // Top bar background
    this.topBar = new Graphics();
    this.topBar.rect(0, 0, width, height);
    this.topBar.fill(0x0d1b2a);
    this.container.addChild(this.topBar);

    const cy = height / 2;

    // Gold text — left
    this.goldText = new Text({
      text: '💰 0',
      style: createTextStyle({ fontSize: 24, fill: 0xffd700, padding: 8 }),
      resolution: window.devicePixelRatio || 2,
    });
    this.goldText.anchor.set(0, 0.5);
    this.goldText.x = 12;
    this.goldText.y = cy;
    this.container.addChild(this.goldText);

    // Zone text
    this.zoneText = new Text({
      text: 'Zone 1',
      style: createTextStyle({ fontSize: 18, fontWeight: '800', fill: 0x7ec8e3, padding: 4 }),
      resolution: window.devicePixelRatio || 2,
    });
    this.zoneText.anchor.set(0.5, 0.5);
    this.zoneText.x = width * 0.20;
    this.zoneText.y = cy;
    this.container.addChild(this.zoneText);

    // DPS text
    this.dpsText = new Text({
      text: '⚔️ 0/s',
      style: createTextStyle({ fontSize: 20, fill: 0x88ccff, padding: 8 }),
      resolution: window.devicePixelRatio || 2,
    });
    this.dpsText.anchor.set(0.5, 0.5);
    this.dpsText.x = width * 0.38;
    this.dpsText.y = cy;
    this.dpsText.eventMode = 'static';
    this.dpsText.cursor = 'help';
    this.container.addChild(this.dpsText);

    // Click dmg text
    this.clickDmgText = new Text({
      text: '🖱️ 1',
      style: createTextStyle({ fontSize: 20, fill: 0xffcc66, padding: 8 }),
      resolution: window.devicePixelRatio || 2,
    });
    this.clickDmgText.anchor.set(0.5, 0.5);
    this.clickDmgText.x = width * 0.54;
    this.clickDmgText.y = cy;
    this.clickDmgText.eventMode = 'static';
    this.clickDmgText.cursor = 'help';
    this.container.addChild(this.clickDmgText);

    // Gold Multiplier text
    this.goldMultText = new Text({
      text: '💰% x1.0',
      style: createTextStyle({ fontSize: 20, fill: 0xf1c40f, padding: 8 }),
      resolution: window.devicePixelRatio || 2,
    });
    this.goldMultText.anchor.set(0.5, 0.5);
    this.goldMultText.x = width * 0.70;
    this.goldMultText.y = cy;
    this.goldMultText.eventMode = 'static';
    this.goldMultText.cursor = 'help';
    this.container.addChild(this.goldMultText);

    // Crit text
    this.critText = new Text({
      text: '🎯 5%',
      style: createTextStyle({ fontSize: 20, fill: 0xff9944, padding: 8 }),
      resolution: window.devicePixelRatio || 2,
    });
    this.critText.anchor.set(0.5, 0.5);
    this.critText.x = width * 0.84;
    this.critText.y = cy;
    this.critText.eventMode = 'static';
    this.critText.cursor = 'help';
    this.container.addChild(this.critText);

    // Souls text — right
    this.soulsText = new Text({
      text: '🌀 0',
      style: createTextStyle({ fontSize: 20, fill: 0xbb88ff, padding: 8 }),
      resolution: window.devicePixelRatio || 2,
    });
    this.soulsText.anchor.set(1, 0.5);
    this.soulsText.x = width - 12;
    this.soulsText.y = cy;
    this.container.addChild(this.soulsText);

    // Tooltip
    this.tooltip = new StatTooltip();
    this.overlay.addChild(this.tooltip.container);

    this.setupInteractivity();

    // Subscribe to events
    EventBus.on(Events.GOLD_CHANGED, () => {});
    EventBus.on(Events.ZONE_CHANGED, (zone: unknown) => {
      this.updateZoneText(zone as number);
    });
    EventBus.on(Events.DPS_CHANGED, () => {});
    EventBus.on(Events.ASCENSION_COMPLETE, () => { this.refresh(); });
    EventBus.on(Events.SAVE_LOADED, () => { this.refresh(); });
  }

  private updateZoneText(zone: number): void {
    const isBoss = zone % 5 === 0;
    this.zoneText.text = isBoss ? `⚔️ Zone ${zone} BOSS` : `Zone ${zone}`;
    this.zoneText.style.fill = isBoss ? 0xff6666 : 0x7ec8e3;
  }

  refresh(): void {
    this.goldText.text = `💰 ${formatGold(GameState.gold)}`;
    this.updateZoneText(GameState.zone);
    
    // DPS
    const dps = GameState.totalDPS;
    this.dpsText.text = `⚔️ ${formatDPS(dps)}`;

    // Click
    const clickDmg = DamageManager.getClickDamage();
    this.clickDmgText.text = `🖱️ ${formatNumber(clickDmg)}`;

    // Gold Per Kill
    const goldBreakdown = StatCalculator.getGoldBreakdown();
    this.goldMultText.text = `💰 ${formatNumber(goldBreakdown.total as Decimal)}`;

    // Crit
    const totalCrit = StatCalculator.getTotalCritChance();
    this.critText.text = `🎯 ${(totalCrit * 100).toFixed(1)}%`;

    this.soulsText.text = `🌀 ${GameState.sigmaSouls}`;
  }

  private setupInteractivity(): void {
    const attachTooltip = (element: Text, type: 'dps' | 'click' | 'gold' | 'crit') => {
      element.on('pointerover', (e) => {
        let breakdown;
        if (type === 'dps') breakdown = StatCalculator.getDPSBreakdown();
        else if (type === 'click') breakdown = StatCalculator.getClickBreakdown();
        else if (type === 'gold') breakdown = StatCalculator.getGoldBreakdown();
        else breakdown = StatCalculator.getCritBreakdown();
        
        // Center tooltip directly under the mouse
        const localPos = this.overlay.toLocal(e.global);
        // Clamping based on overlay width (total screen) instead of barWidth
        const sw = window.innerWidth;
        const tx = Math.max(120, Math.min(sw - 120, localPos.x));
        const ty = this.barHeight + 15; 
        this.tooltip.show(breakdown, tx, ty);
      });
      element.on('pointerout', () => this.tooltip.hide());
    };

    attachTooltip(this.dpsText, 'dps');
    attachTooltip(this.clickDmgText, 'click');
    attachTooltip(this.goldMultText, 'gold');
    attachTooltip(this.critText, 'crit');
  }

  update(deltaSeconds: number): void {
    this.updateTimer -= deltaSeconds;
    if (this.updateTimer <= 0) {
      this.updateTimer = 0.1;
      this.refresh();
    }
  }
}
