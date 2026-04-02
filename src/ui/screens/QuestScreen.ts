import { Container, Graphics, Text } from 'pixi.js';
import { GameState } from '../../core/GameState';
import { QuestManager } from '../../core/QuestManager';
import { EventBus, Events } from '../../systems/EventBus';

export class QuestScreen {
  container: Container;
  private panelW: number;
  private panelH: number;
  private contentContainer: Container;

  constructor(width: number, height: number) {
    this.panelW = width;
    this.panelH = height;
    this.container = new Container();

    const bg = new Graphics();
    bg.rect(0, 0, width, height);
    bg.fill(0x060d16);
    this.container.addChild(bg);

    this.contentContainer = new Container();
    this.container.addChild(this.contentContainer);

    this.build();
    EventBus.on(Events.QUEST_PROGRESS, () => this.build());
    EventBus.on(Events.QUEST_COMPLETED, () => this.build());
  }

  private build(): void {
    while (this.contentContainer.children.length > 0) this.contentContainer.removeChildAt(0);
    let yOffset = 10;

    const timeLeft = QuestManager.getTimeUntilReset();
    const h = Math.floor(timeLeft / 3600000);
    const m = Math.floor((timeLeft % 3600000) / 60000);
    const header = new Text({
      text: `📋 Daily Quests  (reset in ${h}h ${m}m)`,
      style: { fontSize: 14, fill: 0x88aaff, fontWeight: 'bold' }
    });
    header.x = 16;
    header.y = yOffset;
    this.contentContainer.addChild(header);
    yOffset += 36;

    for (const quest of GameState.quests) {
      const done = quest.completed;
      const progress = Math.min(quest.current / quest.target, 1);

      const card = new Graphics();
      card.roundRect(10, 0, this.panelW - 20, 76, 8);
      card.fill(done ? 0x0d2a1a : 0x0d1926);
      card.roundRect(10, 0, this.panelW - 20, 76, 8);
      card.stroke({ width: 2, color: done ? 0x44ff88 : 0x1e2d3e });
      card.y = yOffset;
      this.contentContainer.addChild(card);

      const titleText = new Text({
        text: `${done ? '✅ ' : ''}${quest.name}`,
        style: { fontSize: 14, fill: done ? 0x44ff88 : 0xffffff, fontWeight: 'bold' }
      });
      titleText.x = 20;
      titleText.y = yOffset + 8;
      this.contentContainer.addChild(titleText);

      const descText = new Text({
        text: quest.description,
        style: { fontSize: 11, fill: 0x8899aa }
      });
      descText.x = 20;
      descText.y = yOffset + 28;
      this.contentContainer.addChild(descText);

      // Progress bar
      const barW = this.panelW - 80;
      const barBg = new Graphics();
      barBg.roundRect(20, 52, barW, 12, 4);
      barBg.fill(0x1a2332);
      barBg.y = yOffset;
      this.contentContainer.addChild(barBg);

      if (progress > 0) {
        const barFill = new Graphics();
        barFill.roundRect(20, 52, barW * progress, 12, 4);
        barFill.fill(done ? 0x44ff88 : 0x4a9eff);
        barFill.y = yOffset;
        this.contentContainer.addChild(barFill);
      }

      const progressText = new Text({
        text: `${Math.floor(quest.current)}/${quest.target}`,
        style: { fontSize: 10, fill: 0x99aabb }
      });
      progressText.anchor.set(1, 0);
      progressText.x = this.panelW - 14;
      progressText.y = yOffset + 52;
      this.contentContainer.addChild(progressText);

      yOffset += 84;
    }

    if (GameState.quests.length === 0) {
      const empty = new Text({
        text: 'No quests available.\nCheck back tomorrow!',
        style: { fontSize: 13, fill: 0x8899aa, align: 'center' }
      });
      empty.anchor.set(0.5, 0);
      empty.x = this.panelW / 2;
      empty.y = 80;
      this.contentContainer.addChild(empty);
    }

    // Suppress unused variable warning
    void this.panelH;
  }

  update(_deltaSeconds: number): void {}
}
