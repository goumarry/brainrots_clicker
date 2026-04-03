import { Container, Graphics, Text, Sprite } from 'pixi.js';
import { createTextStyle } from './styles/Typography';
import { SKILL_DATA } from '../config/SkillData';
import { SkillManager } from '../core/SkillManager';
import { GameState } from '../core/GameState';
import { EventBus, Events } from '../systems/EventBus';
import { HERO_DATA } from '../config/HeroData';
import { StatTooltip } from './StatTooltip';

const SKILL_BTN_BASE_SIZE = 85; 
const UNIFORM_COLOR = 0x4a9eff;
const BORDER_THICKNESS = 3;

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

    EventBus.on(Events.SKILL_ACTIVATED, (idx: unknown) => { this.buttons[idx as number]?.refresh(); });
    EventBus.on(Events.SKILL_READY, (idx: unknown) => { this.buttons[idx as number]?.refresh(); });
    EventBus.on(Events.HERO_BOUGHT, (idx: unknown) => {
      const sIdx = (idx as number) % 12;
      if (sIdx < this.buttons.length) {
        this.buttons[sIdx].refresh();
        this.repositionButtons();
      }
    });

    EventBus.on(Events.ASCENSION_COMPLETE, () => {
      this.buttons.forEach(b => b.refresh());
      this.repositionButtons();
    });
  }

  private buildButtons(): void {
    for (let i = 0; i < SKILL_DATA.length; i++) {
        const btn = new SkillButton(i, SKILL_BTN_BASE_SIZE, this);
        this.container.addChild(btn.container);
        this.buttons.push(btn);
    }
    this.repositionButtons();
  }

  public repositionButtons(): void {
    const count = this.buttons.length;
    const gap = (this.barW - (count * SKILL_BTN_BASE_SIZE)) / (count + 1);
    
    let curX = gap;
    for (let i = 0; i < count; i++) {
        this.buttons[i].container.x = curX;
        this.buttons[i].container.y = (this.height - SKILL_BTN_BASE_SIZE) / 2 + 10;
        curX += SKILL_BTN_BASE_SIZE + gap;
    }
  }

  showTooltip(index: number, x: number, y: number): void {
    const glPos = this.container.toGlobal({ x, y });
    const local = this.uiOverlay.toLocal(glPos);
    const power = GameState.getSkillPower(index);
    const def = SKILL_DATA[index];
    const hDef = HERO_DATA.find(h => h.id === def.heroId);
    const hSt = GameState.heroes.find(h => h.id === def.heroId);

    if (hSt && hSt.level > 0) {
        this.tooltip.show({
            label: def.name + (power > 1 ? ` (Fusion x${power})` : ''),
            base: def.description,
            multipliers: [
                { label: 'Cooldown', value: `${def.cooldownSeconds}s`, type: 'add' },
                { label: 'Sigma-Power', value: `x${power}`, type: 'mult' }
            ],
            total: def.durationSeconds > 0 ? `${def.durationSeconds}s d'effet` : 'Effet Instantané'
        }, local.x, local.y - 55);
    } else {
        this.tooltip.show({ label: 'VERROUILLÉ', base: `Héros ${hDef?.name} requis`, multipliers: [], total: '' }, local.x, local.y - 55);
    }
  }

  hideTooltip(): void { this.tooltip.hide(); }
  update(delta: number): void { this.buttons.forEach(b => b.update(delta)); }
  get height(): number { return 120; }
}

class SkillButton {
  container: Container;
  private bg: Graphics;
  private content: Container;
  private cooldownOverlay: Graphics;
  private cooldownText: Text;
  private index: number;
  private size: number;
  public width: number;

  constructor(index: number, size: number, private parent: SkillBar) {
    this.index = index;
    this.size = size;
    this.width = size;
    this.container = new Container();
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';

    this.bg = new Graphics();
    this.container.addChild(this.bg);
    this.content = new Container();
    this.container.addChild(this.content);
    this.cooldownOverlay = new Graphics();
    this.container.addChild(this.cooldownOverlay);
    this.cooldownText = new Text({ text: '', style: createTextStyle({ fontSize: 13, fontWeight: 'bold' }), resolution: 2 });
    this.cooldownText.anchor.set(0.5);
    this.container.addChild(this.cooldownText);

    this.container.on('pointerdown', () => { this.container.scale.set(0.92); SkillManager.activateSkill(this.index); this.refresh(); });
    this.container.on('pointerup', () => this.container.scale.set(1.0));
    this.container.on('pointerupoutside', () => this.container.scale.set(1.0));
    this.container.on('pointerover', () => { this.parent.showTooltip(this.index, this.container.x + this.width / 2, this.container.y); });
    this.container.on('pointerout', () => { this.parent.hideTooltip(); });

    this.refresh();
  }

  refresh(): void {
    const s = GameState.skills[this.index];
    const hSt = GameState.heroes[this.index];
    const power = GameState.getSkillPower(this.index);
    const isU = hSt && hSt.level > 0;
    const isActive = s && s.isActive;

    this.width = SKILL_BTN_BASE_SIZE;
    this.container.alpha = isU ? 1.0 : 0.6;
    this.container.eventMode = isU ? 'static' : 'none';

    // 1. UNIFORM BACKGROUND & BORDER
    this.bg.clear().roundRect(0, 0, this.width, this.size, 10).fill(0x0d141e);
    // FIXED 3PX BORDER
    this.bg.stroke({ width: BORDER_THICKNESS, color: isU ? UNIFORM_COLOR : 0x444444, alpha: (isActive || isU) ? 1.0 : 0.7 });

    // 2. ICONS (STILL OVERLAPPING/OVERFLOWING ON SIDES)
    this.content.removeChildren();
    if (isU) {
        const pSize = 85; const overlap = 30; 
        const totalIconsW = pSize + (power - 1) * (pSize - overlap);
        const startX = (this.width - totalIconsW) / 2 + pSize/2;

        for (let p = 0; p < power; p++) {
            const h = HERO_DATA[this.index + (p * 12)];
            if (!h) break;
            const sprC = new Container();
            sprC.x = startX + p * (pSize - overlap); 
            sprC.y = (this.size / 2) - 10;
            if (h.image) {
                const s = Sprite.from(h.image); s.width = s.height = pSize * 1.1; s.anchor.set(0.5);
                sprC.addChild(s);
            } else {
                const e = new Text({ text: h.emoji, style: { fontSize: 48 } }); e.anchor.set(0.5);
                sprC.addChild(e);
            }
            this.content.addChild(sprC);
        }
    } else {
        const lock = new Text({ text: '🔒', style: createTextStyle({ fontSize: 24 }) });
        lock.anchor.set(0.5); lock.x = this.width / 2; lock.y = this.size / 2;
        this.content.addChild(lock);
    }
    this.cooldownText.x = this.width / 2; this.cooldownText.y = this.size / 2;
  }

  update(_d: number): void {
    const s = GameState.skills[this.index];
    const def = SKILL_DATA[this.index];
    if (!s) return;

    this.cooldownOverlay.clear();
    if (s.cooldownRemaining > 0) {
        const ratio = s.cooldownRemaining / def.cooldownSeconds;
        const fillH = this.size * ratio;
        
        // SINGLE DARK FILTER: Drains from top to bottom
        this.cooldownOverlay.roundRect(0, this.size - fillH, this.width, fillH, 8).fill({ color: 0x000000, alpha: 0.6 });

        this.cooldownText.text = s.cooldownRemaining >= 60 ? `${Math.ceil(s.cooldownRemaining / 60)}m` : `${Math.ceil(s.cooldownRemaining)}s`;
        this.cooldownText.style.fill = 0xffffff;
        this.cooldownText.visible = true; 
        this.content.alpha = 0.5; // Dimmed until cleared
    } else { 
        this.cooldownText.visible = false; 
        this.content.alpha = 1.0; 
    }
  }
}
