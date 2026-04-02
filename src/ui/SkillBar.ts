import { Container, Graphics, Text } from 'pixi.js';
import { SKILL_DATA } from '../config/SkillData';
import { SkillManager } from '../core/SkillManager';
import { GameState } from '../core/GameState';
import { EventBus, Events } from '../systems/EventBus';

const SKILL_BTN_SIZE = 64;
const SKILL_BTN_GAP = 8;

export class SkillBar {
  container: Container;
  private buttons: SkillButton[] = [];
  private barW: number;

  constructor(width: number) {
    this.barW = width;
    this.container = new Container();
    this.buildButtons();

    EventBus.on(Events.SKILL_ACTIVATED, (index: unknown) => {
      this.buttons[index as number]?.refresh();
    });
    EventBus.on(Events.SKILL_READY, (index: unknown) => {
      this.buttons[index as number]?.refresh();
    });
  }

  private buildButtons(): void {
    const totalWidth = SKILL_DATA.length * (SKILL_BTN_SIZE + SKILL_BTN_GAP) - SKILL_BTN_GAP;
    const startX = (this.barW - totalWidth) / 2;

    for (let i = 0; i < SKILL_DATA.length; i++) {
      const btn = new SkillButton(i, SKILL_BTN_SIZE);
      btn.container.x = startX + i * (SKILL_BTN_SIZE + SKILL_BTN_GAP);
      btn.container.y = (70 - SKILL_BTN_SIZE) / 2;
      this.container.addChild(btn.container);
      this.buttons.push(btn);
    }
  }

  update(deltaSeconds: number): void {
    for (const btn of this.buttons) {
      btn.update(deltaSeconds);
    }
  }

  get height(): number {
    return 70;
  }
}

class SkillButton {
  container: Container;
  private bg: Graphics;
  private emojiText: Text;
  private cooldownOverlay: Graphics;
  private cooldownText: Text;
  private index: number;
  private size: number;

  constructor(index: number, size: number) {
    this.index = index;
    this.size = size;
    this.container = new Container();
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';

    const def = SKILL_DATA[index];

    // Background
    this.bg = new Graphics();
    this.drawBg(false);
    this.container.addChild(this.bg);

    // Emoji
    this.emojiText = new Text({ text: def.emoji, style: { fontSize: size * 0.5, align: 'center' } });
    this.emojiText.anchor.set(0.5);
    this.emojiText.x = size / 2;
    this.emojiText.y = size / 2 - 2;
    this.emojiText.eventMode = 'none';
    this.container.addChild(this.emojiText);

    // Cooldown overlay (darkened rectangle)
    this.cooldownOverlay = new Graphics();
    this.cooldownOverlay.eventMode = 'none';
    this.container.addChild(this.cooldownOverlay);

    // Cooldown text
    this.cooldownText = new Text({ text: '', style: { fontSize: 11, fill: 0xffffff, align: 'center', fontWeight: 'bold' } });
    this.cooldownText.anchor.set(0.5);
    this.cooldownText.x = size / 2;
    this.cooldownText.y = size / 2;
    this.cooldownText.eventMode = 'none';
    this.container.addChild(this.cooldownText);

    // Click handler
    this.container.on('pointerdown', () => {
      SkillManager.activateSkill(this.index);
      this.refresh();
    });

    this.refresh();
  }

  private drawBg(isActive: boolean): void {
    const def = SKILL_DATA[this.index];
    this.bg.clear();
    this.bg.roundRect(0, 0, this.size, this.size, 8);
    this.bg.fill(isActive ? def.color : 0x1a2332);
    this.bg.roundRect(0, 0, this.size, this.size, 8);
    this.bg.stroke({ width: 2, color: def.color });
  }

  refresh(): void {
    if (!GameState.skills[this.index]) return;
    const skill = GameState.skills[this.index];
    this.drawBg(skill.isActive);
    this.updateCooldownOverlay();
  }

  private updateCooldownOverlay(): void {
    const skill = GameState.skills[this.index];
    const def = SKILL_DATA[this.index];
    this.cooldownOverlay.clear();

    if (skill && skill.cooldownRemaining > 0) {
      this.cooldownOverlay.roundRect(0, 0, this.size, this.size, 8);
      this.cooldownOverlay.fill({ color: 0x000000, alpha: 0.65 });
      const secs = Math.ceil(skill.cooldownRemaining);
      this.cooldownText.text = secs >= 60 ? `${Math.ceil(secs / 60)}m` : `${secs}s`;
    } else {
      this.cooldownText.text = '';
    }
  }

  update(_deltaSeconds: number): void {
    this.updateCooldownOverlay();
  }
}
