import { Container, Graphics, Text, Sprite } from 'pixi.js';
import { createTextStyle } from './styles/Typography';
import { SKILL_DATA } from '../config/SkillData';
import { SkillManager } from '../core/SkillManager';
import { GameState } from '../core/GameState';
import { EventBus, Events } from '../systems/EventBus';
import { HERO_DATA } from '../config/HeroData';
import { StatTooltip } from './StatTooltip';

const SKILL_BTN_BASE_SIZE = 85; 

export class HeroCombatDisplay {
  container: Container;
  private buttons: CombatHero[] = [];
  private areaW: number;
  private areaH: number;
  private tooltip: StatTooltip;
  private uiOverlay: Container;

  constructor(width: number, height: number, overlay: Container) {
    this.areaW = width;
    this.areaH = height;
    this.uiOverlay = overlay;
    this.container = new Container();
    this.tooltip = new StatTooltip();
    overlay.addChild(this.tooltip.container);
    this.buildButtons();

    EventBus.on(Events.SKILL_ACTIVATED, (idx: unknown) => { this.buttons[idx as number]?.refresh(); });
    EventBus.on(Events.SKILL_READY, (idx: unknown) => { this.buttons[idx as number]?.refresh(); });
    EventBus.on(Events.HERO_BOUGHT, (idx: unknown) => { this.buttons.forEach(b => b.refresh()); });
    EventBus.on(Events.ASCENSION_COMPLETE, () => { this.buttons.forEach(b => b.refresh()); });
  }

  private buildButtons(): void {
    for (let i = 0; i < SKILL_DATA.length; i++) {
        const btn = new CombatHero(i, SKILL_BTN_BASE_SIZE, this);
        this.container.addChild(btn.container);
        this.buttons.push(btn);
    }
    this.repositionButtons();
  }

  /**
   * Arrange heroes in an ellipse around the monster center
   */
  public repositionButtons(): void {
    const centerX = this.areaW / 2;
    const centerY = this.areaH / 2 - 20;
    
    // ~270 degree Arc (1.5 PI) for deep wrapping
    const arcLength = Math.PI * 1.5;   
    const startAngle = (Math.PI / 2) - (arcLength / 2); // Center on PI/2 (bottom center)
    const radiusX = 460; 
    const radiusY = 210; 
    const groundOffset = 110;

    const minY = centerY + groundOffset - radiusY;
    const maxY = centerY + groundOffset + radiusY;

    for (let i = 0; i < this.buttons.length; i++) {
        const angle = startAngle + (i / (this.buttons.length - 1)) * arcLength;
        const elevator = 0;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const tx = centerX + (cos * radiusX);
        const ty = centerY + (sin * radiusY) + groundOffset + elevator;
        
        // Calculate depth (0 = furthest back, 1 = closest)
        const depth = (ty - minY) / (maxY - minY);
        
        this.buttons[i].setBasePosition(tx, ty, angle, depth);
    }

    // Z-SORT: Sort children by Y position so front heroes overlap back ones
    this.container.children.sort((a, b) => a.y - b.y);
  }

  showTooltip(index: number): void {
    const hero = this.buttons[index];
    if (!hero) return;

    // Use hero's local container to get real global position
    // Adjusted Y offset to -200 for a better balance
    const glPos = hero.container.toGlobal({ x: 0, y: -200 });
    const power = GameState.getSkillPower(index);
    const def = SKILL_DATA[index];
    const hDef = HERO_DATA.find(h => h.id === def.heroId);
    const hSt = GameState.heroes.find(h => h.id === def.heroId);
    const parent = this.tooltip.container.parent || this.uiOverlay;
    const localPos = parent.toLocal(glPos);

    if (hSt && hSt.level > 0) {
        this.tooltip.show({
            label: def.name + (power > 1 ? ` (Fusion x${power})` : ''),
            base: def.description,
            multipliers: [
                { label: 'Cooldown', value: `${def.cooldownSeconds}s`, type: 'add' },
                { label: 'Sigma-Power', value: `x${power}`, type: 'mult' }
            ],
            total: def.durationSeconds > 0 ? `${def.durationSeconds}s d'effet` : 'Effet Instantané'
        }, localPos.x, localPos.y, 'top');
    } else {
        // We don't show tooltips for empty/invisible combat slots
    }
  }

  hideTooltip(): void { this.tooltip.hide(); }
  update(delta: number): void { this.buttons.forEach(b => b.update(delta)); }
}

class CombatHero {
  container: Container;
  private content: Container;
  private cooldownContent: Container;
  private cooldownMask: Graphics;
  private cooldownText: Text;
  private index: number;
  private size: number;
  public width: number;
  
  private baseX: number = 0;
  private baseY: number = 0;
  private baseScale: number = 1.0;
  private shadow: Graphics;

  constructor(index: number, size: number, private parent: HeroCombatDisplay) {
    this.index = index;
    this.size = size;
    this.width = size;
    this.container = new Container();
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';
    this.container.hitArea = { contains: (x: number, y: number) => x >= -10 && x <= size + 10 && y >= -10 && y <= size + 10 };

    this.shadow = new Graphics();
    this.container.addChild(this.shadow);

    this.content = new Container();
    this.container.addChild(this.content);
    
    this.cooldownContent = new Container();
    this.cooldownContent.visible = false;
    this.container.addChild(this.cooldownContent);

    this.cooldownMask = new Graphics();
    this.cooldownContent.mask = this.cooldownMask;
    this.container.addChild(this.cooldownMask);

    this.cooldownText = new Text({ 
      text: '', 
      style: createTextStyle({ fontSize: 18, fontWeight: '900', fill: 0xffffff, stroke: { color: 0x000000, width: 3 } }), 
      resolution: 2 
    });
    this.cooldownText.anchor.set(0.5);
    this.container.addChild(this.cooldownText);

    this.container.on('pointerdown', () => { 
        this.container.scale.set(this.baseScale * 0.9); 
        SkillManager.activateSkill(this.index); 
        this.refresh(); 
    });
    this.container.on('pointerup', () => this.container.scale.set(this.baseScale));
    this.container.on('pointerupoutside', () => this.container.scale.set(this.baseScale));
    this.container.on('pointerover', () => { this.parent.showTooltip(this.index); });
    this.container.on('pointerout', () => { this.parent.hideTooltip(); });

    this.refresh();
  }

  public setBasePosition(x: number, y: number, angle: number, depth: number): void {
    this.baseX = x;
    this.baseY = y;
    this.container.position.set(x, y);

    // Apply depth scaling: back (depth 0) = 0.82, front (depth 1) = 1.15
    this.baseScale = 0.82 + (depth * 0.33);
    this.container.scale.set(this.baseScale);

    // Apply atmospheric tint (darker when further back)
    const tintVal = Math.floor(180 + depth * 75); // 180 to 255
    const tintColor = (tintVal << 16) | (tintVal << 8) | tintVal;
    this.content.tint = tintColor;
  }

  refresh(): void {
    const hSt = GameState.heroes[this.index];
    const power = GameState.getSkillPower(this.index);
    const isUnlocked = hSt && hSt.level > 0;

    this.container.visible = isUnlocked; // ONLY SHOW BOUGHT HEROES
    if (!isUnlocked) return;

    this.content.removeChildren();
    this.cooldownContent.removeChildren();

    const pSize = 85; 
    const overlap = 30; 
    const totalIconsW = pSize + (power - 1) * (pSize - overlap);
    this.width = totalIconsW;

    // Update hitArea to match dynamic width, centered around 0
    this.container.hitArea = { 
      contains: (x: number, y: number) => x >= -totalIconsW/2 && x <= totalIconsW/2 && y >= -pSize/2 && y <= pSize/2 
    };

    // Center the group of icons around the container's 0,0
    const startX = - (totalIconsW / 2) + (pSize / 2);

    for (let p = 0; p < power; p++) {
        const h = HERO_DATA[this.index + (p * 12)];
        if (!h || !h.image) break;

        const sprC = new Container();
        sprC.x = startX + p * (pSize - overlap); 
        sprC.y = 0; 
        
        const img = h.image;
        const sSize = pSize * 1.1;
        
        // 1. OUTLINE
        const offsets = [
            {x: 1.5, y: 0}, {x: -1.5, y: 0}, {x: 0, y: 1.5}, {x: 0, y: -1.5},
            {x: 1, y: 1}, {x: -1, y: -1}, {x: 1, y: -1}, {x: -1, y: 1}
        ];
        offsets.forEach(off => {
            const outline = Sprite.from(img); outline.width = outline.height = sSize;
            outline.anchor.set(0.5); outline.position.set(off.x, off.y); outline.tint = 0xffffff;
            sprC.addChild(outline);
        });

        // 2. MAIN
        const s = Sprite.from(img); s.width = s.height = sSize; s.anchor.set(0.5);
        sprC.addChild(s);
        this.content.addChild(sprC);
        
        // 3. DARK COPY (FOR COOLDOWN)
        const darkSprC = new Container();
        darkSprC.x = sprC.x; darkSprC.y = sprC.y;
        sprC.children.forEach(child => {
            if (child instanceof Sprite) {
                const clone = new Sprite(child.texture);
                clone.width = child.width; clone.height = child.height;
                clone.anchor.set(child.anchor.x, child.anchor.y);
                clone.position.set(child.x, child.y);
                clone.tint = 0x000000; clone.alpha = 0.75;
                darkSprC.addChild(clone);
            }
        });
        this.cooldownContent.addChild(darkSprC);
    }
    this.cooldownText.position.set(0, 0);
  }

  update(delta: number): void {
    if (!this.container.visible) return;
    const s = GameState.skills[this.index];
    const def = SKILL_DATA[this.index];
    if (!s) return;

    // Static placement
    this.content.position.set(0, 0);

    // Static Shadow
    this.shadow.clear();
    const shadowAlpha = 0.25; 
    const shadowScale = 1.0;  
    this.shadow.ellipse(0, 42, (this.width / 2.2) * shadowScale, 12 * shadowScale).fill({ color: 0x000000, alpha: shadowAlpha });

    // Cooldown Masking
    this.cooldownMask.clear();
    if (s.cooldownRemaining > 0) {
        const ratio = s.cooldownRemaining / def.cooldownSeconds;
        const fillH = (SKILL_BTN_BASE_SIZE + 20) * ratio;
        
        // Correctly center the mask rectangle over the icons
        this.cooldownMask.rect(-this.width/2 - 10, (SKILL_BTN_BASE_SIZE/2 + 10) - fillH, this.width + 20, fillH).fill(0xffffff);
        this.cooldownMask.position.set(0, 0);
        this.cooldownContent.visible = true;
        this.cooldownContent.position.set(0, 0);
        this.cooldownText.text = s.cooldownRemaining >= 60 ? `${Math.ceil(s.cooldownRemaining / 60)}m` : `${Math.ceil(s.cooldownRemaining)}s`;
        this.cooldownText.visible = true; 
        this.cooldownText.position.set(0, 0);
    } else { 
        this.cooldownText.visible = false; 
        this.cooldownContent.visible = false;
    }
  }
}
