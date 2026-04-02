import { Container, Graphics, Text } from 'pixi.js';
import { GameState } from '../../core/GameState';
import { EventBus, Events } from '../../systems/EventBus';

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

  constructor(width: number, height: number) {
    this.panelW = width;
    this.panelH = height;
    this.container = new Container();

    const bg = new Graphics();
    bg.rect(0, 0, width, height);
    bg.fill(0x060d16);
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

    EventBus.on(Events.RELIC_DROPPED, () => this.build());
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
    while (this.scrollContainer.children.length > 0) this.scrollContainer.removeChildAt(0);
    let yOffset = 10;

    const header = new Text({
      text: `🏺 Relics (${GameState.relics.length}/10)`,
      style: { fontSize: 16, fill: 0xffd700, fontWeight: 'bold' }
    });
    header.x = 20;
    header.y = yOffset;
    this.scrollContainer.addChild(header);
    yOffset += 36;

    if (GameState.relics.length === 0) {
      const empty = new Text({
        text: 'No relics yet.\nDefeat bosses to earn relics!',
        style: { fontSize: 13, fill: 0x8899aa, align: 'center' }
      });
      empty.anchor.set(0.5, 0);
      empty.x = this.panelW / 2;
      empty.y = yOffset + 40;
      this.scrollContainer.addChild(empty);
      this.totalContentH = yOffset + 120;
      return;
    }

    for (const relic of GameState.relics) {
      const rarityColor = RARITY_COLORS[relic.rarity] ?? 0xffffff;
      const card = new Graphics();
      card.roundRect(10, 0, this.panelW - 20, 60, 8);
      card.fill(0x0d1926);
      card.roundRect(10, 0, this.panelW - 20, 60, 8);
      card.stroke({ width: 2, color: rarityColor });
      card.y = yOffset;
      this.scrollContainer.addChild(card);

      const emojiText = new Text({ text: relic.emoji, style: { fontSize: 22 } });
      emojiText.x = 22;
      emojiText.y = yOffset + 16;
      this.scrollContainer.addChild(emojiText);

      const nameText = new Text({
        text: `${relic.name}`,
        style: { fontSize: 13, fill: rarityColor, fontWeight: 'bold' }
      });
      nameText.x = 56;
      nameText.y = yOffset + 8;
      this.scrollContainer.addChild(nameText);

      const statLabel = relic.statType.replace('_mult', '').replace('_', ' ').toUpperCase();
      const statText = new Text({
        text: `+${Math.round(relic.statValue * 100)}% ${statLabel}  [${relic.rarity}]`,
        style: { fontSize: 11, fill: 0x99aabb }
      });
      statText.x = 56;
      statText.y = yOffset + 32;
      this.scrollContainer.addChild(statText);

      yOffset += 68;
    }

    this.totalContentH = yOffset + 20;
  }

  update(_deltaSeconds: number): void {}
}
