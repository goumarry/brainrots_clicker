import {
  Container, Graphics, Text, TextStyle
} from 'pixi.js';
import { Decimal } from '../systems/BigNumber';
import { formatHP } from '../systems/NumberFormatter';
import { EventBus, Events } from '../systems/EventBus';
import { EnemyState } from '../core/GameState';
import { BalanceConfig } from '../config/BalanceConfig';
import { GameState } from '../core/GameState';

const DEFAULT_W = 780;
const DEFAULT_H = 554;
const ENEMY_COLORS_NORMAL = [
  0x4a6fa5, 0x5a8a4a, 0x8a4a4a, 0x7a5a8a, 0x4a8a7a,
];
const ENEMY_COLORS_BOSS = [
  0xc0392b, 0x8e44ad, 0xd35400, 0x1a252f, 0x922b21,
];

export class EnemyDisplay {
  container: Container;
  private background: Graphics;
  private enemyBody: Graphics;
  private hpBarBg: Graphics;
  private hpBarFill: Graphics;
  private enemyNameText: Text;
  private hpText: Text;
  private bossTimerBar: Graphics;
  private bossTimerText: Text;
  private bossTimerBg: Graphics;

  private shakeTime: number = 0;
  private shakeIntensity: number = 0;
  private baseX: number = 0;
  private baseY: number = 0;
  private currentColorIndex: number = 0;
  private isBoss: boolean = false;
  private areaW: number;
  private areaH: number;

  constructor(width: number = DEFAULT_W, height: number = DEFAULT_H) {
    this.areaW = width;
    this.areaH = height;
    this.container = new Container();

    // Background
    this.background = new Graphics();
    this.background.roundRect(0, 0, this.areaW, this.areaH, 12);
    this.background.fill(0x0d1b2a);
    this.background.stroke({ color: 0x1e3a5f, width: 2 });
    this.container.addChild(this.background);

    // Enemy body (colored rectangle representing enemy)
    this.enemyBody = new Graphics();
    this.container.addChild(this.enemyBody);

    // Enemy name text
    const nameStyle = new TextStyle({
      fontSize: 22,
      fontWeight: 'bold',
      fill: 0xffffff,
      stroke: { color: 0x000000, width: 3 },
    });
    this.enemyNameText = new Text({ text: 'Enemy', style: nameStyle });
    this.enemyNameText.anchor.set(0.5, 0);
    this.enemyNameText.x = this.areaW / 2;
    this.enemyNameText.y = 14;
    this.container.addChild(this.enemyNameText);

    // HP bar background
    const hpBarY = this.areaH - 60;
    const hpBarX = 20;
    const hpBarW = this.areaW - 40;
    const hpBarH = 22;

    this.hpBarBg = new Graphics();
    this.hpBarBg.roundRect(hpBarX, hpBarY, hpBarW, hpBarH, 4);
    this.hpBarBg.fill(0x1a1a2e);
    this.hpBarBg.stroke({ color: 0x333355, width: 1 });
    this.container.addChild(this.hpBarBg);

    this.hpBarFill = new Graphics();
    this.container.addChild(this.hpBarFill);

    // HP text
    const hpStyle = new TextStyle({
      fontSize: 13,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    this.hpText = new Text({ text: '', style: hpStyle });
    this.hpText.anchor.set(0.5, 0.5);
    this.hpText.x = this.areaW / 2;
    this.hpText.y = hpBarY + hpBarH / 2;
    this.container.addChild(this.hpText);

    // Boss timer bar
    this.bossTimerBg = new Graphics();
    this.bossTimerBg.roundRect(hpBarX, hpBarY - 30, hpBarW, 18, 4);
    this.bossTimerBg.fill(0x1a1a2e);
    this.bossTimerBg.stroke({ color: 0x553333, width: 1 });
    this.bossTimerBg.visible = false;
    this.container.addChild(this.bossTimerBg);

    this.bossTimerBar = new Graphics();
    this.bossTimerBar.visible = false;
    this.container.addChild(this.bossTimerBar);

    const timerStyle = new TextStyle({
      fontSize: 12,
      fill: 0xff6666,
      fontWeight: 'bold',
    });
    this.bossTimerText = new Text({ text: '', style: timerStyle });
    this.bossTimerText.anchor.set(0.5, 0.5);
    this.bossTimerText.x = this.areaW / 2;
    this.bossTimerText.y = hpBarY - 30 + 9;
    this.bossTimerText.visible = false;
    this.container.addChild(this.bossTimerText);

    // Make clickable
    this.background.eventMode = 'static';
    this.background.cursor = 'pointer';
    this.enemyBody.eventMode = 'static';
    this.enemyBody.cursor = 'pointer';

    // Subscribe to events
    EventBus.on(Events.ENEMY_SPAWNED, (enemy: unknown) => {
      this.onEnemySpawned(enemy as EnemyState);
    });
    EventBus.on(Events.BOSS_SPAWNED, (enemy: unknown) => {
      this.onEnemySpawned(enemy as EnemyState);
    });
    EventBus.on(Events.ENEMY_DAMAGED, (dmg: unknown, currentHP: unknown, maxHP: unknown) => {
      this.onDamaged(dmg as Decimal, currentHP as Decimal, maxHP as Decimal);
    });
    EventBus.on(Events.BOSS_TIMER_EXPIRED, () => {
      this.isBoss = false;
      this.bossTimerBg.visible = false;
      this.bossTimerBar.visible = false;
      this.bossTimerText.visible = false;
    });
  }

  private onEnemySpawned(enemy: EnemyState): void {
    this.isBoss = enemy.isBoss;
    this.currentColorIndex = (this.currentColorIndex + 1) % ENEMY_COLORS_NORMAL.length;
    this.updateHPBar(enemy.currentHP, enemy.maxHP);
    this.enemyNameText.text = enemy.isBoss ? `👑 ${enemy.name} 👑` : enemy.name;
    this.enemyNameText.style.fill = enemy.isBoss ? 0xffd700 : 0xffffff;
    this.drawEnemyBody(enemy.isBoss);

    this.bossTimerBg.visible = enemy.isBoss;
    this.bossTimerBar.visible = enemy.isBoss;
    this.bossTimerText.visible = enemy.isBoss;
  }

  private onDamaged(dmg: Decimal, currentHP: Decimal, maxHP: Decimal): void {
    this.updateHPBar(currentHP, maxHP);
    this.triggerShake(3, 0.15);
  }

  private drawEnemyBody(isBoss: boolean): void {
    this.enemyBody.clear();
    const colors = isBoss ? ENEMY_COLORS_BOSS : ENEMY_COLORS_NORMAL;
    const color = colors[this.currentColorIndex % colors.length];

    const cx = this.areaW / 2;
    const cy = this.areaH / 2 - 20;

    if (isBoss) {
      // Boss: larger diamond shape
      const size = 150;
      this.enemyBody.moveTo(cx, cy - size);
      this.enemyBody.lineTo(cx + size * 0.7, cy);
      this.enemyBody.lineTo(cx, cy + size);
      this.enemyBody.lineTo(cx - size * 0.7, cy);
      this.enemyBody.closePath();
      this.enemyBody.fill(color);
      this.enemyBody.stroke({ color: 0xffd700, width: 4 });

      // Inner decoration
      const innerSize = 75;
      this.enemyBody.moveTo(cx, cy - innerSize);
      this.enemyBody.lineTo(cx + innerSize * 0.7, cy);
      this.enemyBody.lineTo(cx, cy + innerSize);
      this.enemyBody.lineTo(cx - innerSize * 0.7, cy);
      this.enemyBody.closePath();
      this.enemyBody.fill({ color: 0xffd700, alpha: 0.3 });
    } else {
      // Normal enemy: rounded rectangle — bigger for the large right panel
      const w = 120 + Math.random() * 30;
      const h = 120 + Math.random() * 30;
      this.enemyBody.roundRect(cx - w / 2, cy - h / 2, w, h, 16);
      this.enemyBody.fill(color);
      this.enemyBody.stroke({ color: 0xffffff, alpha: 0.4, width: 2 });

      // Eyes
      this.enemyBody.circle(cx - 22, cy - 15, 12);
      this.enemyBody.fill(0xffffff);
      this.enemyBody.circle(cx + 22, cy - 15, 12);
      this.enemyBody.fill(0xffffff);
      this.enemyBody.circle(cx - 21, cy - 13, 6);
      this.enemyBody.fill(0x000000);
      this.enemyBody.circle(cx + 23, cy - 13, 6);
      this.enemyBody.fill(0x000000);
    }

    this.enemyBody.eventMode = 'static';
    this.enemyBody.cursor = 'pointer';
  }

  private updateHPBar(currentHP: Decimal, maxHP: Decimal): void {
    const hpBarX = 20;
    const hpBarY = this.areaH - 60;
    const hpBarW = this.areaW - 40;
    const hpBarH = 22;

    const ratio = Math.max(0, Math.min(1, currentHP.div(maxHP).toNumber()));
    const fillColor = this.isBoss
      ? 0xc0392b
      : ratio > 0.5 ? 0x27ae60 : ratio > 0.25 ? 0xf39c12 : 0xe74c3c;

    this.hpBarFill.clear();
    if (ratio > 0) {
      this.hpBarFill.roundRect(hpBarX, hpBarY, hpBarW * ratio, hpBarH, 4);
      this.hpBarFill.fill(fillColor);
    }

    this.hpText.text = formatHP(currentHP, maxHP);
  }

  updateBossTimer(timeRemaining: number, maxTime: number): void {
    if (!this.isBoss || !GameState.bossTimerActive) return;

    const hpBarX = 20;
    const hpBarY = this.areaH - 60;
    const hpBarW = this.areaW - 40;

    const ratio = Math.max(0, timeRemaining / maxTime);
    const timerColor = ratio > 0.5 ? 0xf39c12 : ratio > 0.25 ? 0xe67e22 : 0xe74c3c;

    this.bossTimerBar.clear();
    if (ratio > 0) {
      this.bossTimerBar.roundRect(hpBarX, hpBarY - 30, hpBarW * ratio, 18, 4);
      this.bossTimerBar.fill(timerColor);
    }

    this.bossTimerText.text = `BOSS TIMER: ${Math.ceil(timeRemaining)}s`;
  }

  private triggerShake(intensity: number, duration: number): void {
    this.shakeIntensity = intensity;
    this.shakeTime = duration;
  }

  update(deltaSeconds: number): void {
    if (this.shakeTime > 0) {
      this.shakeTime -= deltaSeconds;
      if (this.shakeTime <= 0) {
        this.shakeTime = 0;
        this.container.x = this.baseX;
        this.container.y = this.baseY;
      } else {
        this.container.x = this.baseX + (Math.random() - 0.5) * this.shakeIntensity * 2;
        this.container.y = this.baseY + (Math.random() - 0.5) * this.shakeIntensity * 2;
      }
    }
  }

  setBasePosition(x: number, y: number): void {
    this.baseX = x;
    this.baseY = y;
    this.container.x = x;
    this.container.y = y;
  }

  onClickAt(x: number, y: number): void {
    // Visual feedback only, actual damage handled by ClickManager
  }

  get width(): number {
    return this.areaW;
  }

  get height(): number {
    return this.areaH;
  }
}
