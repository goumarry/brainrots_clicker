import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { createTextStyle } from './styles/Typography';
import { SKILL_DATA } from '../config/SkillData';
import { SkillManager } from '../core/SkillManager';
import { GameState } from '../core/GameState';
import { EventBus, Events } from '../systems/EventBus';
import { HERO_DATA } from '../config/HeroData';
import { Sprite, Texture } from 'pixi.js';
import { StatTooltip } from './StatTooltip';

const SKILL_BTN_SIZE = 80; // Large icons as requested
const SKILL_BTN_GAP = 2; // Very tight gap for single-row fit

export class SkillBar {
  container: Container;
  private buttons: SkillButton[] = [];
  private barW: number;
  private tooltip: StatTooltip;
  private uiOverlay: Container;

  constructor(width: number, overlay: Container) {
    this.barW = width;
    this.uiOverlay = overlay;
    this.container = new Container();
    this.tooltip = new StatTooltip();
    overlay.addChild(this.tooltip.container);
    this.buildButtons();

    EventBus.on(Events.SKILL_ACTIVATED, (index: unknown) => {
      this.buttons[index as number]?.refresh();
    });
    EventBus.on(Events.SKILL_READY, (index: unknown) => {
      this.buttons[index as number]?.refresh();
    });
 
    EventBus.on(Events.HERO_BOUGHT, (index: unknown) => {
      const idx = index as number;
      const skillIdx = idx % 12;
      if (skillIdx < this.buttons.length) {
        this.buttons[skillIdx].refresh();
        this.repositionButtons();
      }
    });

    EventBus.on(Events.ASCENSION_COMPLETE, () => {
      this.buttons.forEach(btn => btn.refresh());
      this.repositionButtons();
    });
  }

  private buildButtons(): void {
    for (let i = 0; i < SKILL_DATA.length; i++) {
      const btn = new SkillButton(i, SKILL_BTN_SIZE, this);
      this.container.addChild(btn.container);
      this.buttons.push(btn);
    }
    this.repositionButtons();
  }

  public repositionButtons(): void {
    const count = this.buttons.length;
    let totalButtonsW = 0;
    for (const btn of this.buttons) {
      totalButtonsW += btn.width;
    }

    const totalGapsW = this.barW - totalButtonsW;
    const gap = totalGapsW / (count + 1); 
 
    let currentX = gap;
    for (let i = 0; i < count; i++) {
      const btn = this.buttons[i];
      btn.container.x = currentX;
      btn.container.y = (this.height - SKILL_BTN_SIZE) / 2;
      currentX += btn.width + gap;
    }
  }
 
  get overlay(): Container {
    return this.uiOverlay;
  }
 
  showTooltip(index: number, x: number, y: number): void {
    const def = SKILL_DATA[index];
    const heroDef = HERO_DATA.find(h => h.id === def.heroId);
    const heroState = GameState.heroes.find(h => h.id === def.heroId);
    const unlocked = heroState && heroState.level > 0;
 
    const globalPos = this.container.toGlobal({ x: x, y: y });
    const localInOverlay = this.uiOverlay.toLocal(globalPos);
    const tx = localInOverlay.x;
    const ty = localInOverlay.y - 15; // Centered exactly above button top, with small gap
 
    const power = GameState.getSkillPower(index);
    const powerLabel = power > 1 ? ` (Fusion Lvl ${power})` : '';

    if (unlocked) {
      this.tooltip.show({
        label: def.name + powerLabel,
        base: def.description,
        multipliers: [
          { label: 'Cooldown', value: `${def.cooldownSeconds}s`, type: 'add' },
          { label: 'Puissance Σ', value: `x${power}`, type: 'mult' }
        ],
        total: def.durationSeconds > 0 ? `${def.durationSeconds}s de durée` : 'Effet Instantané'
      }, tx, ty);
    } else {
      this.tooltip.show({
        label: 'VERROUILLÉ',
        base: `Recrute ${heroDef?.name || '???'} pour débloquer ce sort`,
        multipliers: [],
        total: 'Sort indisponible'
      }, tx, ty);
    }
  }
 
  hideTooltip(): void {
    this.tooltip.hide();
  }

  update(deltaSeconds: number): void {
    for (const btn of this.buttons) {
      btn.update(deltaSeconds);
    }
  }

  get height(): number {
    return 120;
  }
}

class SkillButton {
  container: Container;
  private bg: Graphics;
  private iconContainer: Container;
  private parentBar: SkillBar;
  private cooldownOverlay: Graphics;
  private cooldownText: Text;
  private index: number;
  private size: number; // This is the BASE size (height)
  public width: number;

  constructor(index: number, size: number, parentBar: SkillBar) {
    this.index = index;
    this.size = size;
    this.width = size;
    this.parentBar = parentBar;
    this.container = new Container();
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';

    // Background
    this.bg = new Graphics();
    this.container.addChild(this.bg);

    // Icon Container
    this.iconContainer = new Container();
    this.container.addChild(this.iconContainer);
 
    // Cooldown overlay (darkened rectangle)
    this.cooldownOverlay = new Graphics();
    this.cooldownOverlay.eventMode = 'none';
    this.container.addChild(this.cooldownOverlay);
 
    // Cooldown text
    this.cooldownText = new Text({
      text: '',
      style: createTextStyle({ 
        fontSize: 13, 
        fill: 0xffffff, 
        align: 'center', 
        padding: 4 
      }),
      resolution: 3
    });
    this.cooldownText.anchor.set(0.5);
    this.cooldownText.eventMode = 'none';
    this.container.addChild(this.cooldownText);
 
    // Click handler
    this.container.on('pointerdown', () => {
      SkillManager.activateSkill(this.index);
      this.refresh();
    });
 
    this.container.on('pointerover', () => {
      this.parentBar.showTooltip(this.index, this.container.x + this.width / 2, this.container.y);
    });
 
    this.container.on('pointerout', () => {
      this.parentBar.hideTooltip();
    });
 
    this.refresh();
  }

  private drawBg(isActive: boolean): void {
    const def = SKILL_DATA[this.index];
    this.bg.clear();
    this.bg.roundRect(0, 0, this.width, this.size, 8);
    this.bg.fill(0x1a2332);
    this.bg.roundRect(0, 0, this.width, this.size, 8);
    this.bg.stroke({ width: 4, color: def.color });
  }

  refresh(): void {
    const def = SKILL_DATA[this.index];
    const skill = GameState.skills[this.index];
    if (!skill) return;
 
    const heroState = GameState.heroes.find(h => h.id === def.heroId);
    const isUnlocked = heroState && heroState.level > 0;
    const power = GameState.getSkillPower(this.index);

    // UPDATE WIDTH based on fusion level (+10px on each side = +20 total)
    this.width = power > 1 ? this.size + 20 : this.size;
 
    this.container.eventMode = isUnlocked ? 'static' : 'none';
    this.container.cursor = isUnlocked ? 'pointer' : 'default';
    this.container.alpha = isUnlocked ? 1.0 : 0.5;
 
    this.drawBg(!!(skill.isActive && isUnlocked));
    this.updateIcon(!!isUnlocked);
    this.updateCooldownOverlay();

    // Re-center cooldown text
    this.cooldownText.x = this.width / 2;
    this.cooldownText.y = this.size / 2;
  }
 
  private updateIcon(unlocked: boolean): void {
    this.iconContainer.removeChildren();
    
    if (unlocked) {
      const power = GameState.getSkillPower(this.index);
      const totalWidth = this.width * 0.9;
      const iconSize = power > 1 ? (totalWidth / power) * 1.1 : totalWidth; // Slightly larger icons in wide buttons
      const startX = (this.width - (iconSize * power)) / 2 + iconSize / 2;

      for (let p = 0; p < power; p++) {
        const heroIdx = this.index + (p * 12);
        if (heroIdx >= HERO_DATA.length) break;
        
        const hDef = HERO_DATA[heroIdx];
        if (hDef.image) {
          const sprite = Sprite.from(hDef.image);
          sprite.width = Math.min(iconSize, this.size * 0.9); 
          sprite.height = this.size * 0.8;
          sprite.anchor.set(0.5);
          
          sprite.x = startX + p * (iconSize * 0.9);
          sprite.y = this.size / 2;
          sprite.alpha = 1.0; 
          
          this.iconContainer.addChild(sprite);
        } else {
          const txt = new Text({
            text: hDef.emoji,
            style: createTextStyle({ fontSize: iconSize * 0.6, align: 'center' }),
          });
          txt.anchor.set(0.5);
          txt.x = startX + p * iconSize;
          txt.y = this.size / 2;
          this.iconContainer.addChild(txt);
        }
      }
    } else {
      const lock = new Text({
        text: '🔒',
        style: createTextStyle({ fontSize: this.size * 0.4, align: 'center' }),
      });
      lock.anchor.set(0.5);
      lock.x = this.width / 2;
      lock.y = this.size / 2;
      this.iconContainer.addChild(lock);
    }
  }

  private updateCooldownOverlay(): void {
    const skill = GameState.skills[this.index];
    this.cooldownOverlay.clear();

    if (skill && skill.cooldownRemaining > 0) {
      this.cooldownOverlay.roundRect(0, 0, this.width, this.size, 8);
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

