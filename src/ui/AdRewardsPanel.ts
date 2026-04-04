import { Container, Graphics, Text } from 'pixi.js';
import { createTextStyle } from './styles/Typography';
import { AdManager } from '../integrations/AdManager';
import { GameState } from '../core/GameState';
import { EventBus, Events } from '../systems/EventBus';

export class AdRewardsPanel {
  container: Container;
  private width: number;
  private panelH: number;
  
  private buttons: { 
    container: Container;
    g: Graphics; 
    overlay: Graphics; 
    timerT: Text; 
    type: string; 
    color: number 
  }[] = [];
  private pulseTimer: number = 0;

  private readonly BTN_W = 100;
  private readonly BTN_H = 92;
  private readonly GAP = 20;

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
    this.container.removeChildren();
    this.buttons = [];

    const adList = [
      { id: 'gold', label: 'Gold x2\n30min', emoji: '💰', color: 0xffd700, fn: () => AdManager.watchAdDoubleGold() },
      { id: 'dps', label: 'DPS x2\n30min', emoji: '⚔️', color: 0xff4444, fn: () => AdManager.watchAdDoubleDPS() },
      { id: 'relic', label: 'Diamond\nRelic', emoji: '💎', color: 0x00e5ff, fn: () => AdManager.watchAdDiamondRelic() },
      { id: 'hero', label: '+5 Lvl\nLatest', emoji: '🚀', color: 0x76ff03, fn: () => AdManager.watchAdHeroLevelUp() },
      { id: 'skills', label: 'Reset\nSkills', emoji: '⏱️', color: 0xffffff, fn: () => AdManager.watchAdResetSkills() },
    ];

    const totalH = adList.length * (this.BTN_H + this.GAP) - this.GAP;
    const startY = (this.panelH - totalH) / 2;

    for (let i = 0; i < adList.length; i++) {
        const ad = adList[i];
        
        const btnCont = new Container();
        btnCont.x = (this.width - this.BTN_W) / 2;
        btnCont.y = startY + i * (this.BTN_H + this.GAP);
        this.container.addChild(btnCont);

        const bg = new Graphics();
        btnCont.addChild(bg);
        
        bg.eventMode = 'static';
        bg.cursor = 'pointer';
        bg.on('pointerdown', (e) => { e.stopPropagation(); ad.fn(); });

        const overlay = new Graphics();
        overlay.roundRect(0, 0, this.BTN_W, this.BTN_H, 10).fill({ color: 0x000000, alpha: 0.6 });
        overlay.visible = false;
        overlay.eventMode = 'none';
        btnCont.addChild(overlay);

        const emojiT = new Text({
            text: ad.emoji,
            style: createTextStyle({ fontSize: 32, padding: 8 }),
            resolution: window.devicePixelRatio || 2,
        });
        emojiT.anchor.set(0.5, 0); emojiT.position.set(this.BTN_W / 2, 10);
        btnCont.addChild(emojiT);

        const labelT = new Text({
            text: ad.label,
            style: createTextStyle({ fontSize: 13, fill: ad.color, align: 'center', lineHeight: 15, padding: 4 }),
            resolution: window.devicePixelRatio || 2,
        });
        labelT.anchor.set(0.5, 0); labelT.position.set(this.BTN_W / 2, 48);
        btnCont.addChild(labelT);

        const timerT = new Text({
            text: '',
            style: createTextStyle({ fontSize: 16, fill: 0xffffff, fontWeight: 'bold' }),
            resolution: window.devicePixelRatio || 2,
        });
        timerT.anchor.set(0.5, 1); 
        timerT.position.set(this.BTN_W / 2, -5); 
        timerT.visible = false;
        btnCont.addChild(timerT);

        this.buttons.push({ container: btnCont, g: bg, overlay, timerT, type: ad.id, color: ad.color });
    }
  }

  public update(delta: number): void {
    this.buttons.forEach((btn, i) => {
        let timeLeft = 0;
        if (btn.type === 'gold') timeLeft = GameState.goldBoostTimeLeft;
        else if (btn.type === 'dps') timeLeft = GameState.dpsBoostTimeLeft;
        else if (btn.type === 'relic') timeLeft = GameState.relicBoostCooldown;
        else if (btn.type === 'hero') timeLeft = GameState.heroBoostCooldown;

        const isBoost = btn.type === 'gold' || btn.type === 'dps';
        const isActive = isBoost && timeLeft > 0;
        
        // Draw Premium Border
        btn.g.clear();
        btn.g.roundRect(0, 0, this.BTN_W, this.BTN_H, 12).fill({ color: 0x0a1018, alpha: 0.85 });
        
        if (isActive) {
            // PULSING BORDER when active (Only for timed boosts)
            const p = 0.5 + Math.sin(this.pulseTimer * 6) * 0.3;
            btn.g.stroke({ width: 3, color: btn.color, alpha: p });
            btn.g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.8 });
        } else {
            // Static border when ready
            btn.g.stroke({ width: 2, color: btn.color, alpha: 0.6 });
        }

        if (isActive) {
            btn.overlay.visible = true;
            btn.timerT.visible = true;
            btn.timerT.text = this.formatTime(timeLeft);
            btn.timerT.style.fill = 0xffffff;
            
            const totalDuration = 30 * 60;
            const ratio = timeLeft / totalDuration; 
            const fillH = this.BTN_H * ratio;
            
            btn.overlay.clear();
            btn.overlay.roundRect(0, this.BTN_H - fillH, this.BTN_W, fillH, 12).fill({ color: 0x000000, alpha: 0.6 });
        } else {
            btn.overlay.visible = false;
            btn.timerT.visible = false;
        }
    });
  }

  private formatTime(s: number): string {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  get height(): number { return 300; }
}
