import { Container, Graphics, Text } from 'pixi.js';
import { AdManager } from '../integrations/AdManager';
import { GameState } from '../core/GameState';
import { EventBus, Events } from '../systems/EventBus';

export class AdRewardsPanel {
  container: Container;
  private width: number;

  constructor(width: number) {
    this.width = width;
    this.container = new Container();
    this.build();

    // Rebuild when boss spawns (show boss retry button) or timer expires
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

    // Show boss retry only during boss fight
    if (GameState.currentEnemy?.isBoss && GameState.bossTimerActive) {
      buttons.push({ label: 'Boss\nRetry', emoji: '👑', fn: () => AdManager.watchAdBossRetry(), color: 0xe74c3c });
    }

    const btnW = 90;
    const btnH = 44;
    const gap = 8;
    const totalW = buttons.length * (btnW + gap) - gap;
    const startX = (this.width - totalW) / 2;

    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const x = startX + i * (btnW + gap);

      const bg = new Graphics();
      bg.roundRect(x, 4, btnW, btnH, 8);
      bg.fill(0x0d1926);
      bg.stroke({ color: btn.color, width: 1.5 });
      bg.eventMode = 'static';
      bg.cursor = 'pointer';
      bg.on('pointerdown', (e) => { e.stopPropagation(); btn.fn(); });
      this.container.addChild(bg);

      const emojiT = new Text({ text: `📺 ${btn.emoji}`, style: { fontSize: 13 } });
      emojiT.anchor.set(0.5, 0);
      emojiT.x = x + btnW / 2;
      emojiT.y = 8;
      emojiT.eventMode = 'none';
      this.container.addChild(emojiT);

      const labelT = new Text({ text: btn.label, style: { fontSize: 9, fill: btn.color, align: 'center' } });
      labelT.anchor.set(0.5, 0);
      labelT.x = x + btnW / 2;
      labelT.y = 26;
      labelT.eventMode = 'none';
      this.container.addChild(labelT);
    }
  }

  get height(): number { return 52; }
}
