import { Container, Graphics, Text, Sprite } from 'pixi.js';
import { GameState } from '../core/GameState';
import { SKILL_DATA } from '../config/SkillData';
import { HERO_DATA } from '../config/HeroData';
import { createTextStyle } from './styles/Typography';

const HUD_ITEM_SIZE = 54; // Increased from 48
const UNIFORM_COLOR = 0x4a9eff;
const BORDER_THICKNESS = 2; // Reduced from 3

export class ActiveSkillsDisplay {
  container: Container;
  private skillItems: Map<string, ActiveSkillItem> = new Map();

  constructor() {
    this.container = new Container();
  }

  update(deltaSeconds: number): void {
    const activeSkills = GameState.skills.filter(s => s.isActive && s.durationRemaining > 0);

    for (const [id, item] of this.skillItems.entries()) {
      if (!activeSkills.find(s => s.id === id)) {
        this.container.removeChild(item.container);
        item.destroy();
        this.skillItems.delete(id);
      }
    }

    activeSkills.forEach((skill, index) => {
      let item = this.skillItems.get(skill.id);
      if (!item) {
        const skillIdx = SKILL_DATA.findIndex(s => s.id === skill.id);
        item = new ActiveSkillItem(skillIdx);
        this.skillItems.set(skill.id, item);
        this.container.addChild(item.container);
      }
      
      item.update(skill.durationRemaining, deltaSeconds);
      // INVERTED STACK: Anchor at BOTTOM-LEFT and grow UP
      item.container.y = -index * (HUD_ITEM_SIZE + 15); 
    });
  }
}

class ActiveSkillItem {
  container: Container;
  private bg: Graphics;
  private bar: Graphics;
  private timerText: Text;
  private iconContainer: Container;
  private maxDuration: number = 0;

  constructor(skillIndex: number) {
    this.container = new Container();
    const def = SKILL_DATA[skillIndex];
    const power = GameState.getSkillPower(skillIndex);

    // 1. BACKGROUND & UNIFORM BORDER (2px Neon Blue)
    this.bg = new Graphics();
    this.bg.roundRect(0, 0, HUD_ITEM_SIZE, HUD_ITEM_SIZE, 10);
    this.bg.fill({ color: 0x000000, alpha: 0.75 });
    this.bg.stroke({ color: UNIFORM_COLOR, width: BORDER_THICKNESS });
    this.container.addChild(this.bg);

    // 2. RELIEF ICONS (Overflow like SkillBar)
    this.iconContainer = new Container();
    this.container.addChild(this.iconContainer);

    const pSize = HUD_ITEM_SIZE; 
    const overlap = 24; // Adjusted for 54px size
    const totalW = pSize + (power - 1) * (pSize - overlap);
    const startX = (HUD_ITEM_SIZE - totalW) / 2 + pSize/2;

    for (let p = 0; p < power; p++) {
      const heroIdx = skillIndex + (p * 12);
      if (heroIdx >= HERO_DATA.length) break;
      const hDef = HERO_DATA[heroIdx];
      
      const sprC = new Container();
      sprC.x = startX + p * (pSize - overlap);
      sprC.y = HUD_ITEM_SIZE / 2;
      
      if (hDef.image) {
        const s = Sprite.from(hDef.image);
        s.width = s.height = pSize * 0.95; // Slightly larger portrait fill
        s.anchor.set(0.5);
        sprC.addChild(s);
      } else {
        const e = new Text({ text: hDef.emoji, style: { fontSize: 38 } });
        e.anchor.set(0.5);
        sprC.addChild(e);
      }
      this.iconContainer.addChild(sprC);
    }

    // 3. TIMER DISPLAY
    this.bar = new Graphics();
    this.container.addChild(this.bar);

    this.timerText = new Text({
      text: '',
      style: createTextStyle({ fontSize: 13, fill: 0xffffff, fontWeight: '900', stroke: { color: 0x000000, width: 2 } }),
      resolution: 2
    });
    this.timerText.x = HUD_ITEM_SIZE + 16;
    this.timerText.y = 12;
    this.container.addChild(this.timerText);
    
    this.maxDuration = def?.durationSeconds || 1;
  }

  update(durationRemaining: number, _deltaSeconds: number): void {
    this.timerText.text = `${durationRemaining.toFixed(1)}s`;
    
    const barW = 90; // Slightly wider for 54px box
    const barH = 3;  // Even sleeker neon line
    const ratio = Math.max(0, Math.min(1, durationRemaining / this.maxDuration));
    
    this.bar.clear();
    // Shadow
    this.bar.roundRect(HUD_ITEM_SIZE + 16, 34, barW, barH, 2);
    this.bar.fill({ color: 0x000000, alpha: 0.5 });
    // Neon Progress
    if (ratio > 0) {
      this.bar.roundRect(HUD_ITEM_SIZE + 16, 34, barW * ratio, barH, 2);
      this.bar.fill(UNIFORM_COLOR);
      this.bar.stroke({ color: 0xffffff, width: 1, alpha: 0.3 });
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
