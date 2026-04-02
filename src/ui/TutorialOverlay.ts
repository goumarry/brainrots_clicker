import { Container, Graphics, Text } from 'pixi.js';

const TUTORIAL_KEY = 'brainrot_tutorial_done';

interface TutorialStep {
  text: string;
  highlight: 'enemy' | 'heroes' | 'skills' | 'done';
  emoji: string;
}

const STEPS: TutorialStep[] = [
  { emoji: '👆', text: 'Click the enemy on the right\nto deal damage!', highlight: 'enemy' },
  { emoji: '💰', text: 'Kill enemies to earn Gold.\nUse it to buy Heroes!', highlight: 'heroes' },
  { emoji: '🦸', text: 'Heroes deal automatic DPS.\nUpgrade them to get stronger!', highlight: 'heroes' },
  { emoji: '⚡', text: 'Use Skills for powerful\ntemporary boosts!', highlight: 'skills' },
  { emoji: '🎯', text: 'Kill 10 enemies to advance\nto the next zone!', highlight: 'enemy' },
  { emoji: '🚀', text: "You're ready!\nGo brainrot the world! 🧠", highlight: 'done' },
];

export class TutorialOverlay {
  container: Container;
  private stepIndex: number = 0;
  private overlay: Graphics;
  private bubble: Graphics;
  private emojiText: Text;
  private messageText: Text;
  private nextBtn: Graphics;
  private nextBtnText: Text;
  private skipBtn: Graphics;
  private gameW: number;
  private gameH: number;
  private onDone: () => void;

  constructor(gameW: number, gameH: number, onDone: () => void) {
    this.gameW = gameW;
    this.gameH = gameH;
    this.onDone = onDone;
    this.container = new Container();
    this.container.eventMode = 'static';

    // Semi-transparent dark overlay
    this.overlay = new Graphics();
    this.overlay.rect(0, 0, gameW, gameH);
    this.overlay.fill({ color: 0x000000, alpha: 0.55 });
    this.overlay.eventMode = 'none';
    this.container.addChild(this.overlay);

    // Tutorial bubble (centered)
    const bW = 420;
    const bH = 220;
    const bX = (gameW - bW) / 2;
    const bY = (gameH - bH) / 2;

    this.bubble = new Graphics();
    this.bubble.roundRect(bX, bY, bW, bH, 16);
    this.bubble.fill(0x0d1b2a);
    this.bubble.stroke({ color: 0x4a9eff, width: 3 });
    this.bubble.eventMode = 'none';
    this.container.addChild(this.bubble);

    // Emoji
    this.emojiText = new Text({ text: '👆', style: { fontSize: 48 } });
    this.emojiText.anchor.set(0.5);
    this.emojiText.x = gameW / 2;
    this.emojiText.y = bY + 56;
    this.emojiText.eventMode = 'none';
    this.container.addChild(this.emojiText);

    // Message
    this.messageText = new Text({
      text: '',
      style: {
        fontSize: 18,
        fill: 0xffffff,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: bW - 40,
        lineHeight: 26,
      }
    });
    this.messageText.anchor.set(0.5, 0);
    this.messageText.x = gameW / 2;
    this.messageText.y = bY + 106;
    this.messageText.eventMode = 'none';
    this.container.addChild(this.messageText);

    // Next button
    this.nextBtn = new Graphics();
    this.nextBtn.roundRect(bX + bW / 2 - 70, bY + bH - 54, 140, 36, 8);
    this.nextBtn.fill(0x4a9eff);
    this.nextBtn.eventMode = 'static';
    this.nextBtn.cursor = 'pointer';
    this.container.addChild(this.nextBtn);
    this.nextBtn.on('pointerdown', () => this.nextStep());

    this.nextBtnText = new Text({ text: 'Next ▶', style: { fontSize: 16, fill: 0xffffff, fontWeight: 'bold' } });
    this.nextBtnText.anchor.set(0.5);
    this.nextBtnText.x = bX + bW / 2;
    this.nextBtnText.y = bY + bH - 36;
    this.nextBtnText.eventMode = 'none';
    this.container.addChild(this.nextBtnText);

    // Skip button
    this.skipBtn = new Graphics();
    this.skipBtn.rect(bX + bW - 70, bY + 8, 62, 24);
    this.skipBtn.fill({ color: 0x334455, alpha: 0.8 });
    this.skipBtn.eventMode = 'static';
    this.skipBtn.cursor = 'pointer';
    this.container.addChild(this.skipBtn);
    this.skipBtn.on('pointerdown', () => this.finish());

    const skipText = new Text({ text: 'Skip', style: { fontSize: 12, fill: 0x8899aa } });
    skipText.anchor.set(0.5);
    skipText.x = bX + bW - 39;
    skipText.y = bY + 20;
    skipText.eventMode = 'none';
    this.container.addChild(skipText);

    this.showStep(0);
  }

  static shouldShow(): boolean {
    return !localStorage.getItem(TUTORIAL_KEY);
  }

  private showStep(index: number): void {
    const step = STEPS[index];
    this.emojiText.text = step.emoji;
    this.messageText.text = step.text;

    const isLast = index === STEPS.length - 1;
    this.nextBtnText.text = isLast ? 'Play! 🚀' : 'Next ▶';
    this.nextBtn.tint = isLast ? 0x44cc44 : 0xffffff;
  }

  private nextStep(): void {
    this.stepIndex += 1;
    if (this.stepIndex >= STEPS.length) {
      this.finish();
    } else {
      this.showStep(this.stepIndex);
    }
  }

  private finish(): void {
    localStorage.setItem(TUTORIAL_KEY, '1');
    this.container.visible = false;
    this.onDone();
  }
}
