import { Container, Graphics, Text, TextStyle, Sprite } from 'pixi.js';
import { createTextStyle } from './styles/Typography';
import { formatNumber } from '../systems/NumberFormatter';
import { Decimal } from '../systems/BigNumber';
import { EventBus, Events } from '../systems/EventBus';
import { GameState } from '../core/GameState';
import { HERO_DATA } from '../config/HeroData';

export class EnemyDisplay {
  container: Container;
  private areaW: number;
  private areaH: number;

  private enemyIconContainer: Container;
  private enemyBody: Graphics;
  private enemyEyes: Graphics;
  private enemyNameText: Text;
  private hpText: Text;
  private hpBar: Graphics;
  private hpBarBg: Graphics;
  private mobProgressText: Text;
  private bossTimerText: Text;
  private bossTimerBar: Graphics;

  private currentSprite: Sprite | Text | Container | null = null;
  private floatOffset: number = 0;
  private floatTime: number = 0;

  constructor(width: number, height: number) {
    this.areaW = width;
    this.areaH = height;
    this.container = new Container();

    // Background for the rectangular combat zone (Grass color)
    const mainBg = new Graphics();
    mainBg.roundRect(0, 0, width, height, 15);
    mainBg.fill(0x3a5a40); // Lush Grass Green
    this.container.addChild(mainBg);

    // Enemy Sprite/Emoji Container (Centered)
    this.enemyIconContainer = new Container();
    this.enemyIconContainer.x = Math.floor(width / 2);
    this.enemyIconContainer.y = Math.floor(height / 2 - 20);
    this.container.addChild(this.enemyIconContainer);

    this.enemyBody = new Graphics();
    this.enemyIconContainer.addChild(this.enemyBody);

    this.enemyEyes = new Graphics();
    this.enemyIconContainer.addChild(this.enemyEyes);

    // HP Bar setup
    const barW = Math.floor(width * 0.6);
    const barH = 33; // Increased from 22
    const barX = Math.floor((width - barW) / 2);
    const barY = Math.floor(height - 85); // Shifted up slightly

    this.hpBarBg = new Graphics();
    this.hpBarBg.roundRect(barX, barY, barW, barH, 4);
    this.hpBarBg.fill(0x1a1a1a);
    this.container.addChild(this.hpBarBg);

    this.hpBar = new Graphics();
    this.container.addChild(this.hpBar);

    // HP Text
    this.hpText = new Text({
      text: '',
      style: createTextStyle({ 
        fontSize: 20, 
        fill: 0xffffff, 
        stroke: { color: 0x000000, width: 2.5 },
        padding: 8 
      }),
      resolution: window.devicePixelRatio || 2,
    });
    this.hpText.anchor.set(0.5, 0.5);
    this.hpText.x = Math.floor(width / 2);
    this.hpText.y = Math.floor(barY + barH / 2);
    this.container.addChild(this.hpText);

    // Enemy Name
    this.enemyNameText = new Text({
      text: '',
      style: createTextStyle({ 
        fontSize: 26, 
        fill: 0xffffff, 
        fontWeight: '900', 
        stroke: { color: 0x000000, width: 4 },
        padding: 10 
      }),
      resolution: window.devicePixelRatio || 2,
    });
    this.enemyNameText.anchor.set(0.5, 0);
    this.enemyNameText.x = Math.floor(width / 2);
    this.enemyNameText.y = 15; // Shifted up slightly for 90px header balance
    this.container.addChild(this.enemyNameText);

    // Mob Progress (Mob 3/10)
    this.mobProgressText = new Text({
      text: '',
      style: createTextStyle({ 
        fontSize: 18, 
        fill: 0x7ec8e3, 
        padding: 8 
      }),
      resolution: window.devicePixelRatio || 2,
    });
    this.mobProgressText.anchor.set(1, 0);
    this.mobProgressText.x = width - 40;
    this.mobProgressText.y = 20;
    this.container.addChild(this.mobProgressText);

    this.bossTimerBar = new Graphics();
    this.container.addChild(this.bossTimerBar);

    this.bossTimerText = new Text({
      text: '',
      style: createTextStyle({ 
        fontSize: 18, 
        fill: 0xffffff, 
        padding: 8 
      }),
      resolution: window.devicePixelRatio || 2,
    });
    this.bossTimerText.anchor.set(0.5, 0.5);
    this.bossTimerText.x = Math.floor(width / 2);
    this.bossTimerText.y = 0; // Value will be set in updateBossTimer
    this.container.addChild(this.bossTimerText);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    EventBus.on(Events.ENEMY_SPAWNED, (enemy) => this.onEnemyUpdate(enemy));
    EventBus.on(Events.BOSS_SPAWNED, (enemy) => this.onEnemyUpdate(enemy));
    EventBus.on(Events.ENEMY_DAMAGED, (_dmg, hp, max) => this.updateHP(hp as Decimal, max as Decimal));
  }

  private onEnemyUpdate(enemy: any): void {
    this.enemyNameText.text = enemy.name;
    this.enemyNameText.style.fill = enemy.isBoss ? 0xffcc00 : 0xffffff;
    this.updateHP(enemy.currentHP, enemy.maxHP);
    this.updateVisuals(enemy.name, enemy.isBoss);
    this.updateMobProgress(enemy.killCount + 1, 10, enemy.isBoss);
    
    // Auto-hide boss timer for normal mobs
    if (!enemy.isBoss) {
        this.hideBossTimer();
    }
  }

  private updateVisuals(name: string, isBoss: boolean): void {
    this.enemyBody.clear();
    this.enemyEyes.clear();
    this.enemyIconContainer.removeChildren();
    this.enemyIconContainer.addChild(this.enemyBody);
    this.enemyIconContainer.addChild(this.enemyEyes);
    
    const zone = GameState.zone;
    const isMilestoneBoss = isBoss && (zone === 1 || zone % 10 === 0);
    const isIntermediateBoss = isBoss && !isMilestoneBoss;

    if (isMilestoneBoss) {
        // MILESTONE BOSS: Show Hero PNG
        const heroIdx = zone === 1 ? 1 : (zone / 10) + 1;
        const hero = HERO_DATA[heroIdx];
        if (hero && hero.image) {
            const sprite = Sprite.from(hero.image);
            sprite.anchor.set(0.5);
            sprite.width = 380; // INCREASED: Enlarged for Milestone impact
            sprite.height = 380;
            this.enemyIconContainer.addChild(sprite);
            this.currentSprite = sprite;
            
            // REMOVED: Aura per user request
        } else {
            this.generateProcedural(name, true, true);
        }
    } else {
        // NORMAL MOB or INTERMEDIATE BOSS
        this.generateProcedural(name, isBoss, isIntermediateBoss);
    }
  }

  private generateProcedural(name: string, isBoss: boolean, isSpecial: boolean): void {
    const color = this.getColorForName(name);
    let size = 120 + Math.random() * 60; // INCREASED: Enlarged from 60-100
    if (isSpecial) size *= 2.5; // INCREASED: Special bosses are HUGE (mult 2.5x)

    const shapeType = Math.floor(Math.random() * 3);

    // DEMONIC AURA (Behind body)
    if (isSpecial) {
        this.enemyBody.beginFill(0xff0000, 0.2);
        this.enemyBody.drawCircle(0, 0, size * 1.3);
        this.enemyBody.endFill();
    }

    // Body
    this.enemyBody.beginFill(isSpecial ? 0x000000 : color); // DEEP BLACK BODY
    if (isSpecial) {
        this.enemyBody.stroke({ color: 0xff0000, width: 8, alpha: 0.8 }); // THICK RED STROKE
    } else {
        this.enemyBody.stroke({ color: 0x000000, width: 4, alpha: 0.3 });
    }

    if (shapeType === 0) this.enemyBody.drawCircle(0, 0, size);
    else if (shapeType === 1) this.enemyBody.drawRoundedRect(-size, -size, size * 2, size * 2, 20);
    else {
        this.enemyBody.drawPolygon([
            0, -size, 
            size, -size/2, 
            size, size/2, 
            0, size, 
            -size, size/2, 
            -size, -size/2
        ]);
    }
    this.enemyBody.endFill();

    // PROCEDURAL SPIKES (Intermediate Bosses)
    if (isSpecial) {
        this.enemyBody.beginFill(0x000000);
        this.enemyBody.stroke({ color: 0xff0000, width: 4 });
        const spikeCount = 8 + Math.floor(Math.random() * 6);
        for (let i = 0; i < spikeCount; i++) {
            const angle = (i / spikeCount) * Math.PI * 2 + (Math.random() * 0.5);
            const tipX = Math.cos(angle) * (size * 1.5);
            const tipY = Math.sin(angle) * (size * 1.5);
            const baseAngle1 = angle - 0.2;
            const baseAngle2 = angle + 0.2;
            const b1X = Math.cos(baseAngle1) * (size * 0.9);
            const b1Y = Math.sin(baseAngle1) * (size * 0.9);
            const b2X = Math.cos(baseAngle2) * (size * 0.9);
            const b2Y = Math.sin(baseAngle2) * (size * 0.9);
            this.enemyBody.drawPolygon([b1X, b1Y, tipX, tipY, b2X, b2Y]);
        }
        this.enemyBody.endFill();
    }

    // Eyes
    const eyeCount = isSpecial ? 12 + Math.floor(Math.random() * 8) : (Math.random() > 0.7 ? 1 : 2);
    const eyeSize = size * (isSpecial ? 0.08 : 0.25);
    
    // RED EYES FOR SPECIALS, WHITE FOR NORMAL
    this.enemyEyes.beginFill(isSpecial ? 0xff0000 : 0xffffff);
    if (isSpecial) {
        for (let i = 0; i < eyeCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * size * 0.75;
            this.enemyEyes.drawCircle(Math.cos(angle) * dist, Math.sin(angle) * dist, eyeSize);
        }
    } else {
        if (eyeCount === 1) {
            this.enemyEyes.drawCircle(0, -size * 0.1, eyeSize);
        } else {
            this.enemyEyes.drawCircle(-size * 0.35, -size * 0.1, eyeSize);
            this.enemyEyes.drawCircle(size * 0.35, -size * 0.1, eyeSize);
        }
    }
    this.enemyEyes.endFill();

    // Pupils
    this.enemyEyes.beginFill(0x000000);
    // Redraw pupils at same positions
    // In a real app we'd store positions but this is procedural redraw
    // (Simplification: just fill black circles in the middle of currentEyeGraphics if we were more complex)
    // For now we re-randomize or we just skip pupils for special to look 'demonic'
    if (!isSpecial) {
        if (eyeCount === 1) {
            this.enemyEyes.drawCircle(0, -size * 0.1, eyeSize * 0.5);
        } else {
            this.enemyEyes.drawCircle(-size * 0.35, -size * 0.1, eyeSize * 0.5);
            this.enemyEyes.drawCircle(size * 0.35, -size * 0.1, eyeSize * 0.5);
        }
    }
    this.enemyEyes.endFill();
    
    this.currentSprite = this.enemyIconContainer;
  }

  private getColorForName(name: string): number {
    const n = name.toLowerCase();
    if (n.includes('skibidi')) return 0xcccccc; 
    if (n.includes('sigma')) return 0x888888; 
    if (n.includes('ohio')) return 0xffaa00; 
    if (n.includes('karen')) return 0xff66bb; 
    if (n.includes('boomer')) return 0x55aa55; 
    if (n.includes('grug')) return 0xaa7744; 
    if (n.includes('slime')) return 0x44ff44; 
    if (n.includes('reddit')) return 0xff4400; 
    if (n.includes('sussy') || n.includes('impostor')) return 0xff0000; 
    
    const colors = [0x4a9eff, 0xff4a9e, 0x9eff4a, 0xffd700, 0x8a2be2];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private updateHP(hp: Decimal, maxHp: Decimal): void {
    this.hpText.text = formatNumber(hp);
    const ratio = hp.div(maxHp).toNumber();
    const barW = Math.floor(this.areaW * 0.6);
    const barH = 33;
    const barX = Math.floor((this.areaW - barW) / 2);
    const barY = Math.floor(this.areaH - 85);

    this.hpBar.clear();
    if (ratio > 0) {
        const isBoss = GameState.currentEnemy.isBoss;
        this.hpBar.roundRect(barX, barY, Math.max(1, barW * ratio), barH, 4);
        this.hpBar.fill(isBoss ? 0xff4444 : 0x44ff44);
    }
  }

  public triggerHitShake(): void {
    this.enemyIconContainer.scale.set(1.15); // INCREASED scale impact
    const shake = 15; // INCREASED shake for large enemies
    this.enemyIconContainer.x = Math.floor(this.areaW / 2) + (Math.random() - 0.5) * shake;
    this.enemyIconContainer.y = Math.floor(this.areaH / 2 - 20) + (Math.random() - 0.5) * shake;

    setTimeout(() => {
        this.enemyIconContainer.scale.set(1.0);
        this.enemyIconContainer.x = Math.floor(this.areaW / 2);
        this.enemyIconContainer.y = Math.floor(this.areaH / 2 - 20);
    }, 50);
  }

  updateMobProgress(current: number, target: number, isBoss: boolean): void {
    if (isBoss) {
      this.mobProgressText.text = 'BOSS';
      this.mobProgressText.style.fill = 0xff6666;
    } else {
      this.mobProgressText.text = `Mob ${Math.min(current, target)}/${target}`;
      this.mobProgressText.style.fill = 0x7ec8e3;
    }
  }

  updateBossTimer(timeLeft: number, totalTime: number): void {
    this.bossTimerText.text = `TIME: ${Math.ceil(timeLeft)}s`;
    const barW = Math.floor(this.areaW * 0.6); // MATCH HP BAR WIDTH
    const barH = 33;
    const barX = Math.floor((this.areaW - barW) / 2);
    const barY = Math.floor(this.areaH - 130); // Shifted further up to not overlap HP bar
    const ratio = timeLeft / totalTime;

    this.bossTimerBar.clear();
    if (ratio > 0) {
        this.bossTimerBar.roundRect(barX, barY, Math.max(4, barW * ratio), barH, 4);
        this.bossTimerBar.fill(0xff6666);
    }
    
    this.bossTimerText.x = Math.floor(this.areaW / 2);
    this.bossTimerText.y = Math.floor(barY + barH / 2);
    this.bossTimerText.style.fill = 0xffffff; // WHITE TEXT FOR CONTRAST
    this.bossTimerText.visible = true;
    this.bossTimerBar.visible = true;
  }

  setBasePosition(x: number, y: number): void {
    this.container.x = Math.floor(x);
    this.container.y = Math.floor(y);
  }

  hideBossTimer(): void {
    this.bossTimerText.visible = false;
    this.bossTimerBar.visible = false;
  }

  update(deltaSeconds: number): void {
    this.floatTime += deltaSeconds * 3;
    this.floatOffset = Math.sin(this.floatTime) * 8;
    this.enemyIconContainer.y = Math.floor(this.areaH / 2 - 20) + this.floatOffset;
  }
}
