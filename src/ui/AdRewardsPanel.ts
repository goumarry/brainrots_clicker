import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { createTextStyle } from './styles/Typography';
import { AdManager } from '../integrations/AdManager';
import { GameState } from '../core/GameState';
import { EventBus, Events } from '../systems/EventBus';

export class AdRewardsPanel {
  container: Container;
  private width: number;
  private panelH: number;

  constructor(width: number, height: number = 540) {
    this.width = width;
    this.panelH = height;
    this.container = new Container();
    this.build();

    EventBus.on(Events.BOSS_SPAWNED, () => this.build());
    EventBus.on(Events.BOSS_TIMER_EXPIRED, () => this.build());
    EventBus.on(Events.ENEMY_DIED, (_g: unknown, isBoss: unknown) => {
      if (isBoss) this.build();
    });
  }

  private build(): void {
    while (this.container.children.length > 0) this.container.removeChildAt(0);

    const buttons: { label: string; emoji: string; fn: () => void; color: number }[] = [
      { label: 'x2 Gold\n30min', emoji: '💰', fn: () => AdManager.watchAdDoubleGold(), color: 0xf39c12 },
      { label: 'Reset\nCooldowns', emoji: '⚡', fn: () => AdManager.watchAdResetCooldowns(), color: 0x3498db },
      { label: 'Free\nRelic', emoji: '🏺', fn: () => AdManager.watchAdFreeRelic(), color: 0x9b59b6 },
    ];

    if (GameState.currentEnemy?.isBoss && GameState.bossTimerActive) {
      buttons.push({ label: 'Boss\nRetry', emoji: '👑', fn: () => AdManager.watchAdBossRetry(), color: 0xe74c3c });
    }

    const btnW = 100; // Increased from 80
    const btnH = 92;  // Increased from 68
    const gap = 16;
    const totalH = buttons.length * (btnH + gap) - gap;
    const startY = (this.panelH - totalH) / 2; 

    // Background for the ad panel area (optional but helpful for visual)
    const panelBg = new Graphics();
    panelBg.rect(0, 0, this.width, this.panelH);
    panelBg.fill({ color: 0x000000, alpha: 0.1 }); // Very subtle
    this.container.addChild(panelBg);

    for (let i = 0; i < buttons.length; i++) {
        const btn = buttons[i];
        const y = startY + i * (btnH + gap);
        const x = (this.width - btnW) / 2; // Center horizontally in the 100px space

        const bg = new Graphics();
        bg.roundRect(x, y, btnW, btnH, 8);
        bg.fill(0x0d1926);
        bg.stroke({ color: btn.color, width: 2 });
        bg.eventMode = 'static';
        bg.cursor = 'pointer';
        bg.on('pointerdown', (e) => { e.stopPropagation(); btn.fn(); });
        this.container.addChild(bg);

        const emojiT = new Text({
            text: btn.emoji,
            style: createTextStyle({ fontSize: 32, fontWeight: 'normal', padding: 8 }),
            resolution: window.devicePixelRatio || 2,
        });
        emojiT.anchor.set(0.5, 0);
        emojiT.x = x + btnW / 2;
        emojiT.y = y + 10;
        emojiT.eventMode = 'none';
        this.container.addChild(emojiT);

        const labelT = new Text({
            text: btn.label,
            style: createTextStyle({ 
              fontSize: 14, 
              fill: btn.color, 
              align: 'center', 
              lineHeight: 16, 
              padding: 4 
            }),
            resolution: window.devicePixelRatio || 2,
        });
        labelT.anchor.set(0.5, 0);
        labelT.x = x + btnW / 2;
        labelT.y = y + 48;
        labelT.eventMode = 'none';
        this.container.addChild(labelT);
    }
  }

  get height(): number { return 300; }
}
