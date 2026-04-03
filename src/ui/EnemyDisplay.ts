import { Container, Graphics, Text, Sprite } from 'pixi.js';
import { createTextStyle } from './styles/Typography';
import { formatNumber } from '../systems/NumberFormatter';
import { Decimal } from '../systems/BigNumber';
import { EventBus, Events } from '../systems/EventBus';
import { GameState } from '../core/GameState';
import { HERO_DATA } from '../config/HeroData';

interface Cloud {
  g: Graphics;
  x: number;
  y: number;
  speed: number;
  w: number;
}

interface Star {
  g: Graphics;
  blinkSpeed: number;
  blinkTime: number;
}

interface ShootingStar {
  g: Graphics;
  vx: number;
  vy: number;
  active: boolean;
}

interface Animal {
  g: Graphics;
  vx: number;
  active: boolean;
  type: 'bird' | 'ground';
}

interface Firefly {
  g: Graphics;
  baseX: number;
  baseY: number;
  time: number;
}

interface Leaf {
  g: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotSpeed: number;
  phase: number;
  active: boolean;
}

interface Pollen {
  g: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  active: boolean;
}

export class EnemyDisplay {
  container: Container;
  private areaW: number;
  private areaH: number;

  private enemyIconContainer: Container;
  private enemyShadow: Graphics;
  private enemyBody: Graphics;
  private enemyEyes: Graphics;
  private enemyNameText: Text;
  private hpText: Text;
  private hpBar: Graphics;
  private hpBarBg: Graphics;
  private mobProgressText: Text;
  private bossTimerText: Text;
  private bossTimerBar: Graphics;
  
  // Background Layers
  private backgroundLayer: Container;
  private skyLayer: Graphics;
  private starLayer: Container;
  private distantLayer: Graphics;
  private midLayer: Graphics;
  private eventLayer: Container; 
  private cloudLayer: Container;
  private groundLayer: Graphics;
  private detailLayer: Graphics;
  
  // Foreground Layer
  private foregroundLayer: Container;
  private bgMask: Graphics;

  private clouds: Cloud[] = [];
  private stars: Star[] = [];
  private shootingStars: ShootingStar[] = [];
  private animals: Animal[] = [];
  private fireflies: Firefly[] = [];
  private leaves: Leaf[] = [];
  private pollen: Pollen[] = [];
  private fgPlants: Graphics[] = [];
  
  private currentBgStage: number = -1;
  private currentSprite: Sprite | Text | Container | null = null;
  private floatOffset: number = 0;
  private floatTime: number = 0;

  // Track listeners for cleanup
  private boundOnEnemyUpdate: any;
  private boundUpdateHP: any;
  private boundUpdateBackground: any;

  constructor(width: number, height: number) {
    this.areaW = width;
    this.areaH = height;
    this.container = new Container();

    // 1. Setup Layers
    this.backgroundLayer = new Container();
    this.container.addChild(this.backgroundLayer);

    this.skyLayer = new Graphics();
    this.backgroundLayer.addChild(this.skyLayer);

    this.starLayer = new Container();
    this.backgroundLayer.addChild(this.starLayer);

    this.distantLayer = new Graphics();
    this.backgroundLayer.addChild(this.distantLayer);

    this.midLayer = new Graphics();
    this.backgroundLayer.addChild(this.midLayer);

    this.eventLayer = new Container();
    this.backgroundLayer.addChild(this.eventLayer);

    this.cloudLayer = new Container();
    this.backgroundLayer.addChild(this.cloudLayer);

    this.groundLayer = new Graphics();
    this.backgroundLayer.addChild(this.groundLayer);

    this.detailLayer = new Graphics();
    this.backgroundLayer.addChild(this.detailLayer);

    // Initial draw
    this.updateBackground(GameState.zone);

    // 2. Enemy Components
    this.enemyIconContainer = new Container();
    this.enemyIconContainer.x = Math.floor(width / 2);
    this.enemyIconContainer.y = Math.floor(height / 2 - 20);
    this.container.addChild(this.enemyIconContainer);

    this.enemyShadow = new Graphics();
    this.enemyIconContainer.addChild(this.enemyShadow);
    this.enemyBody = new Graphics();
    this.enemyIconContainer.addChild(this.enemyBody);
    this.enemyEyes = new Graphics();
    this.enemyIconContainer.addChild(this.enemyEyes);

    // 3. Foreground Layer (Before UI, After Enemy)
    this.foregroundLayer = new Container();
    this.container.addChild(this.foregroundLayer);

    // Mask setup
    this.bgMask = new Graphics();
    this.bgMask.roundRect(0, 0, width, height, 15).fill(0xffffff);
    this.container.addChild(this.bgMask); 
    this.bgMask.alpha = 0; 
    this.backgroundLayer.mask = this.bgMask;
    this.foregroundLayer.mask = this.bgMask;

    // UI Bars
    const barW = Math.floor(width * 0.6);
    const barH = 33; 
    const barX = Math.floor((width - barW) / 2);
    const barY = Math.floor(height - 85); 

    this.hpBarBg = new Graphics();
    this.hpBarBg.roundRect(barX, barY, barW, barH, 4).fill(0x1a1a1a);
    this.container.addChild(this.hpBarBg);

    this.hpBar = new Graphics();
    this.container.addChild(this.hpBar);

    this.hpText = new Text({
      text: '',
      style: createTextStyle({ fontSize: 20, fill: 0xffffff, stroke: { color: 0x000000, width: 2.5 }, padding: 8 }),
      resolution: window.devicePixelRatio || 2,
    });
    this.hpText.anchor.set(0.5, 0.5);
    this.hpText.x = Math.floor(width / 2);
    this.hpText.y = Math.floor(barY + barH / 2);
    this.container.addChild(this.hpText);

    this.enemyNameText = new Text({
      text: '',
      style: createTextStyle({ fontSize: 26, fill: 0xffffff, fontWeight: '900', stroke: { color: 0x000000, width: 4 }, padding: 10 }),
      resolution: window.devicePixelRatio || 2,
    });
    this.enemyNameText.anchor.set(0.5, 0);
    this.enemyNameText.x = Math.floor(width / 2);
    this.enemyNameText.y = 15; 
    this.container.addChild(this.enemyNameText);

    this.mobProgressText = new Text({
      text: '',
      style: createTextStyle({ fontSize: 18, fill: 0x7ec8e3, padding: 8 }),
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
      style: createTextStyle({ fontSize: 18, fill: 0xffffff, padding: 8 }),
      resolution: window.devicePixelRatio || 2,
    });
    this.bossTimerText.anchor.set(0.5, 0.5);
    this.bossTimerText.x = Math.floor(width / 2);
    this.bossTimerText.y = 0; 
    this.container.addChild(this.bossTimerText);

    this.initPools();
    this.setupEventListeners();
  }

  private initPools(): void {
    // Clouds
    for (let i = 0; i < 6; i++) {
        const g = new Graphics();
        this.drawProceduralCloud(g, 0, 0, (60 + Math.random() * 80) / 40);
        g.position.set(Math.random() * this.areaW, 30 + Math.random() * (this.areaH * 0.3));
        this.cloudLayer.addChild(g);
        this.clouds.push({ g, x: g.x, y: g.y, speed: 10 + Math.random() * 15, w: 100 });
    }
    // Stars
    for (let i = 0; i < 40; i++) {
        const g = new Graphics();
        g.circle(0, 0, 1 + Math.random() * 1.5).fill(0xffffff);
        g.position.set(Math.random() * this.areaW, Math.random() * (this.areaH * 0.45));
        this.starLayer.addChild(g);
        this.stars.push({ g, blinkSpeed: 2 + Math.random() * 4, blinkTime: Math.random() * Math.PI * 2 });
    }
    // Shooting Stars
    for (let i = 0; i < 2; i++) {
        const g = new Graphics();
        g.rect(0, 0, 40, 2).fill({ color: 0xffffff, alpha: 0.8 });
        g.visible = false;
        this.eventLayer.addChild(g);
        this.shootingStars.push({ g, vx: 0, vy: 0, active: false });
    }
    // Animals
    for (let i = 0; i < 3; i++) {
        const g = new Graphics();
        this.eventLayer.addChild(g);
        this.animals.push({ g, vx: 0, active: false, type: i === 0 ? 'bird' : 'ground' });
    }
    // Fireflies
    for (let i = 0; i < 12; i++) {
        const g = new Graphics();
        g.circle(0, 0, 2).fill(0xccff00);
        g.visible = false;
        this.detailLayer.addChild(g);
        this.fireflies.push({ g, baseX: 0, baseY: 0, time: Math.random() * Math.PI * 2 });
    }
    // Leaves
    for (let i = 0; i < 8; i++) {
        const g = new Graphics();
        const col = Math.random() > 0.4 ? 0x2e7d32 : 0xc62828;
        g.poly([-8, 0, 0, -4, 8, 0, 0, 4]).fill(col);
        g.visible = false;
        this.foregroundLayer.addChild(g);
        this.leaves.push({ g, x: 0, y: 0, vx: 0, vy: 0, rotSpeed: 0, phase: 0, active: false });
    }
    // Pollen
    for (let i = 0; i < 15; i++) {
        const g = new Graphics();
        g.circle(0, 0, 1.5).fill({ color: 0xffffff, alpha: 0.25 });
        g.visible = false;
        this.foregroundLayer.addChild(g);
        this.pollen.push({ g, x: 0, y: 0, vx: 0, vy: 0, phase: Math.random() * Math.PI * 2, active: false });
    }
    // Foreground Plants
    for (let i = 0; i < 3; i++) {
        const g = new Graphics();
        const px = i === 0 ? 30 : (i === 1 ? this.areaW - 30 : this.areaW * 0.4);
        g.poly([-40, 120, 0, 0, 40, 120, 0, 80]).fill({ color: 0x0a2205, alpha: 0.4 });
        g.position.set(px, this.areaH);
        this.foregroundLayer.addChild(g);
        this.fgPlants.push(g);
    }
  }

  private setupEventListeners(): void {
    this.boundOnEnemyUpdate = (enemy: any) => this.onEnemyUpdate(enemy);
    this.boundUpdateHP = (_dmg: any, hp: any, max: any) => this.updateHP(hp as Decimal, max as Decimal, GameState.currentEnemy?.isBoss);
    this.boundUpdateBackground = () => this.updateBackground(GameState.zone);

    EventBus.on(Events.ENEMY_SPAWNED, this.boundOnEnemyUpdate);
    EventBus.on(Events.BOSS_SPAWNED, this.boundOnEnemyUpdate);
    EventBus.on(Events.ENEMY_DAMAGED, this.boundUpdateHP);
    EventBus.on(Events.ZONE_CHANGED, this.boundUpdateBackground);
  }

  public destroy(): void {
    EventBus.off(Events.ENEMY_SPAWNED, this.boundOnEnemyUpdate);
    EventBus.off(Events.BOSS_SPAWNED, this.boundOnEnemyUpdate);
    EventBus.off(Events.ENEMY_DAMAGED, this.boundUpdateHP);
    EventBus.off(Events.ZONE_CHANGED, this.boundUpdateBackground);
    if (this.container) this.container.destroy({ children: true });
  }

  private onEnemyUpdate(enemy: any): void {
    if (!enemy) return;
    this.enemyNameText.text = enemy.name;
    this.enemyNameText.style.fill = enemy.isBoss ? 0xffcc00 : 0xffffff;
    this.updateHP(enemy.currentHP, enemy.maxHP, enemy.isBoss);
    this.updateVisuals(enemy.name, enemy.isBoss);
    this.updateMobProgress(enemy.killCount + 1, 10, enemy.isBoss);
    if (!enemy.isBoss) this.hideBossTimer();
  }

  private updateBackground(zone: number): void {
    const cyclePos = ((zone - 1) % 50); 
    const stage = Math.floor(cyclePos / 5); 
    if (stage === this.currentBgStage) return;
    this.currentBgStage = stage;

    this.skyLayer.clear();
    this.distantLayer.clear();
    this.midLayer.clear();
    this.groundLayer.clear();
    this.detailLayer.clear();

    const w = this.areaW;
    const h = this.areaH;
    const skyHeight = Math.floor(h * 0.45);

    let skyColor = 0x87CEEB; 
    let groundColor = 0x3a5a40; 
    let sunColor = 0xffdd22;
    let atmosphereAlpha = 0; 
    
    if (stage >= 4 && stage <= 5) { skyColor = 0x64b5f6; }
    else if (stage >= 6 && stage <= 7) { skyColor = 0xff7e5f; groundColor = 0x2e4b33; sunColor = 0xff4500; }
    else if (stage === 8) { skyColor = 0x4b3d8b; groundColor = 0x1a2e1b; sunColor = 0xff6666; atmosphereAlpha = 0.35; }
    else if (stage === 9) { skyColor = 0x0c0c28; groundColor = 0x1b2e1b; sunColor = 0xffffff; atmosphereAlpha = 0.65; }

    this.skyLayer.rect(0, 0, w, skyHeight).fill(skyColor);
    this.starLayer.alpha = stage >= 8 ? (stage === 9 ? 1.0 : 0.4) : 0;
    this.cloudLayer.alpha = stage === 9 ? 0.2 : 0.9;

    this.drawWilderness(skyHeight, groundColor, sunColor, stage);

    if (atmosphereAlpha > 0) {
        this.detailLayer.rect(0, 0, w, h).fill({ color: 0x000033, alpha: atmosphereAlpha * 0.3 });
    }
    
    this.fireflies.forEach(f => {
        if (stage >= 8) {
            f.g.visible = true;
            f.baseX = Math.random() * w; f.baseY = skyHeight + Math.random() * (h - skyHeight);
        } else f.g.visible = false;
    });
  }

  private drawWilderness(skyH: number, groundColor: number, sunColor: number, stage: number): void {
    const w = this.areaW; const h = this.areaH;
    const mtColor = stage >= 8 ? 0x20203a : 0x7a96a0;
    
    this.distantLayer.poly([0, skyH, w * 0.2, skyH - 65, w * 0.45, skyH - 20, w * 0.75, skyH - 80, w, skyH]).fill({ color: mtColor, alpha: 0.7 });
    this.groundLayer.rect(0, skyH, w, h - skyH).fill(groundColor);
    this.groundLayer.rect(0, h - 60, w, 60).fill({ color: 0x000000, alpha: 0.1 }); 
    
    this.drawSunMoon(sunColor, stage);
    [0.15, 0.42, 0.68, 0.92].forEach(p => this.drawPine(this.midLayer, w * p, skyH + 5, 0.7 + Math.random() * 0.4));
    
    for (let i = 0; i < 25; i++) {
        const gx = Math.random() * w; const gy = skyH + 5 + Math.random() * (h - skyH - 15);
        const r = Math.random();
        if (r > 0.8) { this.detailLayer.circle(gx, gy, 8 + Math.random()*12).fill(0x777777); }
        else if (r > 0.6) { this.detailLayer.circle(gx, gy, 15).fill(0x1b5e20); }
        else {
            this.detailLayer.poly([gx-3, gy, gx, gy-8, gx+3, gy]).fill({ color: 0x4caf50, alpha: 0.8 });
            if (stage < 8 && Math.random() > 0.6) this.detailLayer.circle(gx, gy-10, 2.5).fill([0xffffff, 0xff4081][Math.floor(Math.random()*2)]);
        }
    }
  }

  private drawSunMoon(color: number, stage: number): void {
    const w = this.areaW; const sunX = w - 85; const sunY = 75 + (stage * 20); 
    const r = stage >= 6 ? 48 : 38;
    this.distantLayer.circle(sunX, sunY, r * 1.5).fill({ color, alpha: 0.15 }).circle(sunX, sunY, r).fill(color);
  }

  private drawPine(g: Graphics, x: number, y: number, scale: number): void {
    const twist = (Math.random()-0.5)*5;
    g.rect(x - 6*scale, y, 12*scale, 28*scale).fill(0x3e2723);
    g.poly([x-45*scale+twist, y, x+45*scale+twist, y, x, y-65*scale]).fill(0x1b5e20);
  }

  private drawProceduralCloud(g: Graphics, x: number, y: number, scale: number): void {
    const baseR = 18 * scale;
    g.circle(x, y, baseR).fill({ color: 0xffffff, alpha: 0.8 });
    g.circle(x + baseR, y - baseR*0.4, baseR*1.3).fill({ color: 0xffffff, alpha: 0.8 });
    g.circle(x + baseR*2.1, y, baseR).fill({ color: 0xffffff, alpha: 0.8 });
  }

  private updateVisuals(name: string, isBoss: boolean): void {
    this.enemyShadow.clear(); this.enemyBody.clear(); this.enemyEyes.clear();
    this.enemyIconContainer.removeChildren();
    this.enemyIconContainer.addChild(this.enemyShadow, this.enemyBody, this.enemyEyes);
    
    const zone = GameState.zone;
    const isMilestoneBoss = isBoss && (zone === 1 || zone % 10 === 0);
    const isIntermediateBoss = isBoss && !isMilestoneBoss;

    if (isMilestoneBoss) {
        const heroIdx = zone === 1 ? 1 : Math.floor(zone / 10) + 1;
        const hero = HERO_DATA[heroIdx];
        if (hero && hero.image) {
            const s = Sprite.from(hero.image); s.anchor.set(0.5); s.width = 380; s.height = 380;
            const shadow = Sprite.from(hero.image); shadow.anchor.set(0.5); shadow.width = 380; shadow.height = 380;
            shadow.tint = 0x000000; shadow.alpha = 0.3; shadow.position.set(25, 25);
            this.enemyIconContainer.addChild(shadow, s);
            this.currentSprite = s;
        } else this.generateProcedural(name, true, true);
    } else this.generateProcedural(name, isBoss, isIntermediateBoss);
  }

  private generateProcedural(name: string, isBoss: boolean, isSpecial: boolean): void {
    const colors = [0x4a9eff, 0xff4a9e, 0x9eff4a, 0xffd700, 0x8a2be2];
    const color = colors[Math.floor(Math.random() * colors.length)];
    let size = 120 + Math.random() * 60; if (isSpecial) size *= 2.4; 
    const shapeType = Math.floor(Math.random() * 3); const sOff = size * 0.12;

    const sg = this.enemyShadow; sg.clear();
    const sAlpha = 0.3; const sCol = 0x000000;
    if (shapeType === 0) sg.circle(sOff, sOff, size).fill({ color: sCol, alpha: sAlpha });
    else if (shapeType === 1) sg.roundRect(-size + sOff, -size + sOff, size * 2, size * 2, 20).fill({ color: sCol, alpha: sAlpha });
    else sg.poly([sOff, -size+sOff, size+sOff, -size/2+sOff, size+sOff, size/2+sOff, sOff, size+sOff, -size+sOff, size/2+sOff, -size+sOff, -size/2+sOff]).fill({ color: sCol, alpha: sAlpha });
    
    const bg = this.enemyBody; bg.clear();
    const bodyCol = isSpecial ? 0x000000 : color;
    const strokeParams = isSpecial ? { color: 0xff4444, width: 8 } : { color: 0x000000, width: 4, alpha: 0.15 };
    if (shapeType === 0) bg.circle(0, 0, size).fill(bodyCol).stroke(strokeParams);
    else if (shapeType === 1) bg.roundRect(-size, -size, size * 2, size * 2, 20).fill(bodyCol).stroke(strokeParams);
    else bg.poly([0,-size, size,-size/2, size,size/2, 0,size, -size,size/2, -size,-size/2]).fill(bodyCol).stroke(strokeParams);

    if (isSpecial) {
      const spikes = 10;
      for (let i = 0; i < spikes; i++) {
        const ang = (i / spikes) * Math.PI * 2;
        const tx = Math.cos(ang) * size * 1.5; const ty = Math.sin(ang) * size * 1.5;
        const b1x = Math.cos(ang-0.2)*size*0.9; const b1y = Math.sin(ang-0.2)*size*0.9;
        const b2x = Math.cos(ang+0.2)*size*0.9; const b2y = Math.sin(ang+0.2)*size*0.9;
        bg.poly([b1x,b1y, tx,ty, b2x,b2y]).fill(0x000000).stroke({ color: 0xff0000, width: 3 });
      }
    }
    bg.circle(-size*0.4, -size*0.4, size*0.15).fill({ color: 0xffffff, alpha: 0.15 });

    const eg = this.enemyEyes; eg.clear();
    const eyeS = size * (isSpecial ? 0.09 : 0.28);
    if (isSpecial) {
        for (let i = 0; i < 15; i++) {
            const ex = (Math.random()-0.5)*size*1.5; const ey = (Math.random()-0.5)*size*1.5;
            eg.circle(ex, ey, eyeS).fill(0xcc0000).circle(ex, ey, eyeS * 0.4).fill(0xff0000);
        }
    } else {
        const eyeY = -size * 0.15;
        eg.circle(-size*0.35, eyeY, eyeS).fill(0xffffff).circle(size*0.35, eyeY, eyeS).fill(0xffffff);
        eg.circle(-size*0.35, eyeY, eyeS*0.55).fill(0x000000).circle(size*0.35, eyeY, eyeS*0.55).fill(0x000000);
        eg.circle(-size*0.35 - eyeS*0.2, eyeY-eyeS*0.2, eyeS*0.2).fill(0xffffff).circle(size*0.35-eyeS*0.2, eyeY-eyeS*0.2, eyeS*0.2).fill(0xffffff);
    }
    this.currentSprite = this.enemyIconContainer;
  }

  private updateHP(hp: Decimal, maxHp: Decimal, isBoss: boolean = false): void {
    this.hpText.text = formatNumber(hp);
    const ratio = hp.div(maxHp).toNumber(); const barW = Math.floor(this.areaW * 0.6);
    this.hpBar.clear();
    if (ratio > 0) {
        this.hpBar.roundRect(Math.floor((this.areaW - barW)/2), this.areaH - 85, Math.max(1, barW * ratio), 33, 4).fill(isBoss ? 0xff4444 : 0x44ff44);
    }
  }

  public triggerHitShake(): void {
    if (!this.enemyIconContainer) return;
    this.enemyIconContainer.scale.set(1.18); 
    setTimeout(() => this.enemyIconContainer?.scale.set(1.0), 50);
  }

  updateMobProgress(current: number, target: number, isBoss: boolean): void {
    this.mobProgressText.text = isBoss ? 'BOSS' : `Mob ${Math.min(current, target)}/${target}`;
    this.mobProgressText.style.fill = isBoss ? 0xff6666 : 0x7ec8e3;
  }

  updateBossTimer(timeLeft: number, totalTime: number): void {
    this.bossTimerText.text = `TIME: ${Math.ceil(timeLeft)}s`;
    const barW = Math.floor(this.areaW * 0.6); const ratio = timeLeft / totalTime;
    this.bossTimerBar.clear();
    if (ratio > 0) {
        this.bossTimerBar.roundRect(Math.floor((this.areaW - barW)/2), this.areaH - 130, Math.max(4, barW * ratio), 33, 4).fill(0xff6666);
    }
    this.bossTimerText.position.set(Math.floor(this.areaW / 2), this.areaH - 113.5);
    this.bossTimerText.visible = true; this.bossTimerBar.visible = true;
  }

  public setBasePosition(x: number, y: number): void { this.container.x = x; this.container.y = y; }
  hideBossTimer(): void { this.bossTimerText.visible = false; this.bossTimerBar.visible = false; }

  update(deltaSeconds: number): void {
    if (!this.container) return;
    this.floatTime += deltaSeconds * 3;
    this.floatOffset = Math.sin(this.floatTime) * 8;
    this.enemyIconContainer.y = Math.floor(this.areaH / 2 - 20) + this.floatOffset;

    // Clouds & Stars
    this.clouds.forEach(c => { c.x += c.speed * deltaSeconds; if (c.x > this.areaW + 100) c.x = -100; c.g.x = c.x; });
    this.stars.forEach(s => { s.blinkTime += deltaSeconds * s.blinkSpeed; s.g.alpha = 0.4 + Math.abs(Math.sin(s.blinkTime)) * 0.6; });

    // Shooting Stars (Night)
    if (this.currentBgStage >= 8 && Math.random() < 0.005) {
        const ss = this.shootingStars.find(s => !s.active);
        if (ss) { ss.active = true; ss.g.visible = true; ss.g.position.set(-50, Math.random() * this.areaH * 0.3); ss.vx = 400 + Math.random() * 300; ss.vy = 50 + Math.random() * 100; }
    }
    this.shootingStars.forEach(ss => { if (!ss.active) return; ss.g.x += ss.vx * deltaSeconds; ss.g.y += ss.vy * deltaSeconds; if (ss.g.x > this.areaW + 100) { ss.active = false; ss.g.visible = false; } });

    // Animals
    if (Math.random() < 0.003) {
        const ani = this.animals.find(a => !a.active);
        if (ani) {
            ani.active = true; ani.g.visible = true; ani.g.clear(); const col = ani.type === 'bird' ? 0x000000 : 0x2e1a10;
            if (ani.type === 'bird') { ani.g.poly([-10, 0, 0, -5, 10, 0, 0, 5]).fill(col); ani.g.y = 40 + Math.random() * 60; ani.vx = 120 + Math.random()*80; }
            else { ani.g.roundRect(-15, -10, 30, 20, 5).fill(col); ani.g.y = this.areaH - 40; ani.vx = 50 + Math.random()*40; }
            ani.g.x = -50;
        }
    }
    this.animals.forEach(ani => { if (!ani.active) return; ani.g.x += ani.vx * deltaSeconds; if (ani.type === 'bird') ani.g.y += Math.sin(this.floatTime * 2) * 0.5; if (ani.g.x > this.areaW + 50) { ani.active = false; ani.g.visible = false; } });

    // Fireflies / Leaves / Pollen
    if (this.currentBgStage >= 8) {
        this.fireflies.forEach(f => { f.time += deltaSeconds * 2; f.g.x = f.baseX + Math.sin(f.time) * 15; f.g.y = f.baseY + Math.cos(f.time * 0.8) * 15; f.g.alpha = 0.5 + Math.sin(f.time * 3) * 0.5; });
    }

    // Leaves (Procedural Foreground)
    if (this.currentBgStage < 8 && Math.random() < 0.02) {
        const leaf = this.leaves.find(l => !l.active);
        if (leaf) { leaf.active = true; leaf.g.visible = true; leaf.x = -20; leaf.y = Math.random() * this.areaH; leaf.vx = 60 + Math.random() * 40; leaf.vy = 20 + Math.random() * 30; leaf.phase = Math.random() * Math.PI; leaf.rotSpeed = 1 + Math.random() * 2; }
    }
    this.leaves.forEach(l => { if (!l.active) return; l.x += l.vx * deltaSeconds; l.y = l.y + l.vy * deltaSeconds + Math.sin(l.phase + this.floatTime) * 0.5; l.g.position.set(l.x, l.y); l.g.rotation += l.rotSpeed * deltaSeconds; if (l.x > this.areaW + 20) { l.active = false; l.g.visible = false; } });

    // Pollen
    this.pollen.forEach(p => {
        if (!p.active && Math.random() < 0.01) { p.active = true; p.g.visible = true; p.x = Math.random() * this.areaW; p.y = this.areaH + 10; p.vx = (Math.random()-0.5) * 20; p.vy = -15 - Math.random() * 25; }
        if (p.active) { p.x += p.vx * deltaSeconds; p.y += p.vy * deltaSeconds; p.g.position.set(p.x, p.y); p.g.alpha = 0.3 + Math.abs(Math.sin(this.floatTime * 0.5 + p.phase)) * 0.4; if (p.y < -10) { p.active = false; p.g.visible = false; } }
    });

    // Foreground Plants swaying
    this.fgPlants.forEach((p, i) => { p.skew.x = Math.sin(this.floatTime * 0.6 + i) * 0.08; });
  }
}
