import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Decimal, toBigNum, bigNumMax } from '../systems/BigNumber';
import { formatGold, formatDPS, formatNumber } from '../systems/NumberFormatter';
import { EventBus, Events } from '../systems/EventBus';
import { GameState } from '../core/GameState';

export class StatsDisplay {
  container: Container;
  private topBar: Graphics;
  private goldText: Text;
  private zoneText: Text;
  private dpsText: Text;
  private clickDmgText: Text;
  private soulsText: Text;
  private barWidth: number;
  private barHeight: number;

  constructor(width: number, height: number = 56) {
    this.barWidth = width;
    this.barHeight = height;
    this.container = new Container();

    // Top bar background
    this.topBar = new Graphics();
    this.topBar.rect(0, 0, width, height);
    this.topBar.fill(0x0d1b2a);
    // Bottom border line
    this.topBar.rect(0, height - 1, width, 1);
    this.topBar.fill(0x1e3a5f);
    this.container.addChild(this.topBar);

    const cy = height / 2;

    // Gold text — left
    this.goldText = new Text({
      text: '💰 0',
      style: new TextStyle({ fontSize: 16, fontWeight: 'bold', fill: 0xffd700 }),
    });
    this.goldText.anchor.set(0, 0.5);
    this.goldText.x = 16;
    this.goldText.y = cy;
    this.container.addChild(this.goldText);

    // Zone text — center-left
    this.zoneText = new Text({
      text: 'Zone 1',
      style: new TextStyle({ fontSize: 16, fontWeight: 'bold', fill: 0x7ec8e3 }),
    });
    this.zoneText.anchor.set(0.5, 0.5);
    this.zoneText.x = width * 0.35;
    this.zoneText.y = cy;
    this.container.addChild(this.zoneText);

    // DPS text — center
    this.dpsText = new Text({
      text: '⚔️ DPS: 0/s',
      style: new TextStyle({ fontSize: 15, fill: 0x88ccff }),
    });
    this.dpsText.anchor.set(0.5, 0.5);
    this.dpsText.x = width * 0.5;
    this.dpsText.y = cy;
    this.container.addChild(this.dpsText);

    // Click dmg text — center-right
    this.clickDmgText = new Text({
      text: '🖱️ Click: 1',
      style: new TextStyle({ fontSize: 15, fill: 0xffcc66 }),
    });
    this.clickDmgText.anchor.set(0.5, 0.5);
    this.clickDmgText.x = width * 0.65;
    this.clickDmgText.y = cy;
    this.container.addChild(this.clickDmgText);

    // Souls text — right
    this.soulsText = new Text({
      text: '🌀 0 souls',
      style: new TextStyle({ fontSize: 15, fill: 0xbb88ff }),
    });
    this.soulsText.anchor.set(1, 0.5);
    this.soulsText.x = width - 16;
    this.soulsText.y = cy;
    this.container.addChild(this.soulsText);

    // Subscribe to events
    EventBus.on(Events.GOLD_CHANGED, (gold: unknown) => {
      this.goldText.text = `💰 ${formatGold(gold as Decimal)}`;
    });

    EventBus.on(Events.ZONE_CHANGED, (zone: unknown) => {
      this.updateZoneText(zone as number);
    });

    EventBus.on(Events.DPS_CHANGED, (dps: unknown) => {
      this.updateDPS(dps as Decimal);
    });

    EventBus.on(Events.ASCENSION_COMPLETE, () => {
      this.soulsText.text = `🌀 ${GameState.sigmaSOuls} souls`;
    });

    EventBus.on(Events.SAVE_LOADED, () => {
      this.refresh();
    });
  }

  private updateZoneText(zone: number): void {
    const isBoss = zone % 5 === 0;
    this.zoneText.text = isBoss ? `⚔️ Zone ${zone} BOSS` : `Zone ${zone}`;
    this.zoneText.style.fill = isBoss ? 0xff6666 : 0x7ec8e3;
  }

  private updateDPS(dps: Decimal): void {
    this.dpsText.text = `⚔️ DPS: ${formatDPS(dps)}/s`;
    const clickDmg = bigNumMax(dps.mul(0.05), toBigNum(1));
    this.clickDmgText.text = `🖱️ Click: ${formatNumber(clickDmg)}`;
  }

  refresh(): void {
    this.goldText.text = `💰 ${formatGold(GameState.gold)}`;
    this.updateZoneText(GameState.zone);
    this.updateDPS(GameState.totalDPS);
    this.soulsText.text = `🌀 ${GameState.sigmaSOuls} souls`;
  }
}
