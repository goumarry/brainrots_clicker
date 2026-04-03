import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { createTextStyle } from '../styles/Typography';
import { GameState } from '../../core/GameState';
import { EventBus, Events } from '../../systems/EventBus';
import { RELIC_POOL, RARITY_ORDER, RARITY_MULTIPLIERS } from '../../core/RelicManager';

const RARITY_COLORS: Record<string, number> = {
  Bronze: 0xcd7f32,
  Silver: 0xc0c0c0,
  Gold: 0xffd700,
  Diamond: 0x44ddff,
};

export class RelicScreen {
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
  private isDirty: boolean = true;

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

    EventBus.on(Events.RELIC_DROPPED, () => { this.isDirty = true; });
    EventBus.on(Events.RELIC_FUSED, () => { this.isDirty = true; });
  }

  private setupScroll(): void {
    this.container.eventMode = 'static';
    this.container.on('pointerdown', (e) => { this.isDragging = true; this.dragStartY = e.global.y; this.dragStartScrollY = this.scrollY; });
    this.container.on('pointermove', (e) => { if (!this.isDragging) return; this.setScrollY(this.dragStartScrollY + (e.global.y - this.dragStartY)); });
    this.container.on('pointerup', () => { this.isDragging = false; });
    this.container.on('pointerupoutside', () => { this.isDragging = false; });
    this.container.on('wheel', (e) => { this.setScrollY(this.scrollY - (e as WheelEvent).deltaY * 0.5); });
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

    let yOffset = 16;
    const header = new Text({
      text: `🏺 Relic Collection (${GameState.relics.length} Active Types)`,
      style: createTextStyle({ fontSize: 22, fill: 0xffd700 }),
      resolution: window.devicePixelRatio || 2,
    });
    header.x = 24;
    header.y = yOffset;
    this.scrollContainer.addChild(header);
    yOffset += 50;

    // Loop through ALL possible relics in the pool
    for (const poolItem of RELIC_POOL) {
      // Loop through ALL possible rarities for each
      for (const rarity of RARITY_ORDER) {
        // Check if player OWNS this specific relic + rarity
        const ownedInstance = GameState.relics.find(r => r.name === poolItem.name && r.rarity === rarity);
        const isOwned = !!ownedInstance;
        
        const rarityColor = RARITY_COLORS[rarity] ?? 0xffffff;
        const card = new Graphics();
        card.roundRect(16, 0, this.panelW * 0.9, 102, 12);
        
        if (isOwned) {
          card.fill(0x0d1926);
          card.stroke({ width: 3, color: rarityColor });
          card.alpha = 1;
        } else {
          card.fill(0x0a141d);
          card.stroke({ width: 1.5, color: 0x334455 });
          card.alpha = 0.4; // Grisé / Ghost look
        }
        
        card.y = yOffset;
        this.scrollContainer.addChild(card);

        const emojiText = new Text({
          text: poolItem.emoji,
          style: createTextStyle({ fontSize: 36, fontWeight: 'normal', padding: 8 }),
          resolution: window.devicePixelRatio || 2,
        });
        emojiText.x = 32;
        emojiText.y = yOffset + 24;
        this.scrollContainer.addChild(emojiText);

        const nameText = new Text({
          text: poolItem.name,
          style: createTextStyle({ fontSize: 18, fill: isOwned ? rarityColor : 0x778899 }),
          resolution: window.devicePixelRatio || 2,
        });
        nameText.x = 88;
        nameText.y = yOffset + 18;
        this.scrollContainer.addChild(nameText);

        const statLabel = poolItem.statType.replace('_mult', '').replace('_', ' ').toUpperCase();
        const baseVal = poolItem.baseValue * RARITY_MULTIPLIERS[rarity];
        const displayVal = ownedInstance ? (baseVal * ownedInstance.count * 100) : (baseVal * 100);
        
        const statText = new Text({
          text: `+${Math.round(displayVal)}% ${statLabel}  [${rarity.toUpperCase()}]`,
          style: createTextStyle({ fontSize: 14, fill: isOwned ? 0x99aabb : 0x556677 }),
          resolution: window.devicePixelRatio || 2,
        });
        statText.x = 88;
        statText.y = yOffset + 50;
        this.scrollContainer.addChild(statText);

        // DIAMOND QUANTITY BADGE
        if (isOwned && ownedInstance.count > 1) {
          const badge = new Graphics();
          badge.circle(this.panelW * 0.9 - 25, 30, 20);
          badge.fill(0xff4444);
          badge.y = yOffset;
          this.scrollContainer.addChild(badge);

          const qText = new Text({
            text: `x${ownedInstance.count}`,
            style: createTextStyle({ fontSize: 14, fill: 0xffffff, fontWeight: '800' }),
            resolution: window.devicePixelRatio || 2,
          });
          qText.anchor.set(0.5);
          qText.x = this.panelW * 0.9 - 25;
          qText.y = yOffset + 30;
          this.scrollContainer.addChild(qText);
        }

        yOffset += 114;
      }
      
      // Extra space between different relic types
      yOffset += 20;
    }

    this.totalContentH = yOffset + 20;
  }

  update(_deltaSeconds: number): void {
    if (this.container.visible && this.isDirty) {
      this.build();
      this.isDirty = false;
    }
  }
}
