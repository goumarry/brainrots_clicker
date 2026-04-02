import { Container, Graphics, Text } from 'pixi.js';
import { ACHIEVEMENT_DATA } from '../../config/AchievementData';
import { GameState } from '../../core/GameState';
import { EventBus, Events } from '../../systems/EventBus';

const CATEGORY_COLORS: Record<string, number> = {
  kills: 0xe74c3c,
  gold: 0xf39c12,
  zone: 0x3498db,
  heroes: 0x9b59b6,
  clicks: 0x1abc9c,
  skills: 0xe91e8c,
  ascension: 0xc39ef8,
  misc: 0x95a5a6,
};

export class AchievementScreen {
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
    EventBus.on(Events.ACHIEVEMENT_UNLOCKED, () => this.build());
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

    const unlocked = GameState.achievements.length;
    const total = ACHIEVEMENT_DATA.length;

    let yOffset = 10;
    const header = new Text({
      text: `🏆 Achievements (${unlocked}/${total})`,
      style: { fontSize: 16, fill: 0xffd700, fontWeight: 'bold' }
    });
    header.x = 16;
    header.y = yOffset;
    this.scrollContainer.addChild(header);
    yOffset += 36;

    const categories = ['kills', 'gold', 'zone', 'heroes', 'clicks', 'skills', 'ascension', 'misc'];
    for (const cat of categories) {
      const catAchs = ACHIEVEMENT_DATA.filter(a => a.category === cat);
      const catUnlocked = catAchs.filter(a => GameState.achievements.includes(a.id)).length;

      const catLabel = new Text({
        text: `${cat.toUpperCase()} (${catUnlocked}/${catAchs.length})`,
        style: { fontSize: 12, fill: CATEGORY_COLORS[cat] ?? 0x8899aa, fontWeight: 'bold' }
      });
      catLabel.x = 16;
      catLabel.y = yOffset;
      this.scrollContainer.addChild(catLabel);
      yOffset += 24;

      for (const ach of catAchs) {
        const isUnlocked = GameState.achievements.includes(ach.id);
        const card = new Graphics();
        card.roundRect(10, 0, this.panelW - 20, 46, 6);
        card.fill(isUnlocked ? 0x0d2a1a : 0x0a0f18);
        card.roundRect(10, 0, this.panelW - 20, 46, 6);
        card.stroke({ width: 1, color: isUnlocked ? CATEGORY_COLORS[cat] : 0x1a2332 });
        card.y = yOffset;
        this.scrollContainer.addChild(card);

        const emojiT = new Text({ text: ach.emoji, style: { fontSize: 18 } });
        emojiT.x = 18;
        emojiT.y = yOffset + 12;
        this.scrollContainer.addChild(emojiT);

        const nameT = new Text({
          text: ach.name,
          style: { fontSize: 12, fill: isUnlocked ? 0xffffff : 0x556677, fontWeight: 'bold' }
        });
        nameT.x = 46;
        nameT.y = yOffset + 6;
        this.scrollContainer.addChild(nameT);

        const descT = new Text({
          text: isUnlocked ? ach.description : '???',
          style: { fontSize: 10, fill: 0x667788 }
        });
        descT.x = 46;
        descT.y = yOffset + 24;
        this.scrollContainer.addChild(descT);

        if (isUnlocked) {
          const rewardT = new Text({
            text: `+${Math.round(ach.reward.value * 100)}% ${ach.reward.type.replace('_', ' ')}`,
            style: { fontSize: 10, fill: 0x44ff88 }
          });
          rewardT.anchor.set(1, 0);
          rewardT.x = this.panelW - 14;
          rewardT.y = yOffset + 14;
          this.scrollContainer.addChild(rewardT);
        }

        yOffset += 52;
      }
      yOffset += 4;
    }

    this.totalContentH = yOffset + 20;
  }

  update(_deltaSeconds: number): void {}
}
