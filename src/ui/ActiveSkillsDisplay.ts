import { Container, Graphics, Text, Sprite } from 'pixi.js';
import { GameState } from '../core/GameState';
import { SKILL_DATA } from '../config/SkillData';
import { HERO_DATA } from '../config/HeroData';
import { createTextStyle } from './styles/Typography';

export class ActiveSkillsDisplay {
  container: Container;
  private skillItems: Map<string, ActiveSkillItem> = new Map();

  constructor() {
    this.container = new Container();
  }

  update(deltaSeconds: number): void {
    // Check current active skills in GameState
    const activeSkills = GameState.skills.filter(s => s.isActive && s.durationRemaining > 0);

    // Remove expired skills from UI
    for (const [id, item] of this.skillItems.entries()) {
      const stillActive = activeSkills.find(s => s.id === id);
      if (!stillActive) {
        this.container.removeChild(item.container);
        item.destroy();
        this.skillItems.delete(id);
      }
    }

    // Add or Update active skills
    activeSkills.forEach((skill, index) => {
      let item = this.skillItems.get(skill.id);
      if (!item) {
        const skillIdx = SKILL_DATA.findIndex(s => s.id === skill.id);
        const skillDef = SKILL_DATA[skillIdx];
        item = new ActiveSkillItem(skillIdx, skillDef?.color || 0xffffff);
        this.skillItems.set(skill.id, item);
        this.container.addChild(item.container);
      }
      
      item.update(skill.durationRemaining, deltaSeconds);
      // Re-position based on current active list order
      item.container.y = index * 50; 
    });
  }
}

class ActiveSkillItem {
  container: Container;
  private bar: Graphics;
  private timerText: Text;
  private maxDuration: number = 0;

  constructor(skillIndex: number, color: number) {
    this.container = new Container();

    const def = SKILL_DATA[skillIndex];
    const power = GameState.getSkillPower(skillIndex);

    // Background icon
    const bg = new Graphics();
    bg.roundRect(0, 0, 40, 40, 6);
    bg.fill({ color: 0x000000, alpha: 0.5 });
    bg.stroke({ color: color, width: 1.5 });
    this.container.addChild(bg);

    const totalWidth = 34; // Max width inside the 40x40 container
    const iconSize = power > 1 ? totalWidth / power : totalWidth;
    const startX = 20 - (totalWidth / 2) + (iconSize / 2);

    // Icons SIDE-BY-SIDE (Fusion)
    const iconContainer = new Container();
    this.container.addChild(iconContainer);

    for (let p = 0; p < power; p++) {
      const heroIdx = skillIndex + (p * 12);
      if (heroIdx >= HERO_DATA.length) break;
      
      const hDef = HERO_DATA[heroIdx];
      if (hDef.image) {
        const sprite = Sprite.from(hDef.image);
        sprite.width = iconSize * 0.95; 
        sprite.height = 34;
        sprite.x = startX + (p * iconSize);
        sprite.y = 20;
        sprite.anchor.set(0.5);
        sprite.alpha = 1.0;
        iconContainer.addChild(sprite);
      }
    }

    // Timer Bar
    this.bar = new Graphics();
    this.container.addChild(this.bar);

    this.timerText = new Text({
      text: '',
      style: createTextStyle({ fontSize: 13, fill: 0xffffff, fontWeight: 'bold' }),
      resolution: 2
    });
    this.timerText.x = 48;
    this.timerText.y = 12;
    this.container.addChild(this.timerText);
    
    // Find initial max duration from SKILL_DATA
    this.maxDuration = def?.durationSeconds || 1;
  }

  update(durationRemaining: number, _deltaSeconds: number): void {
    this.timerText.text = `${durationRemaining.toFixed(1)}s`;
    
    const barW = 60;
    const barH = 6;
    // CLAMP RATIO to [0, 1] to prevent bar from growing off-screen
    const ratio = Math.max(0, Math.min(1, durationRemaining / this.maxDuration));
    
    this.bar.clear();
    // Background bar
    this.bar.roundRect(48, 28, barW, barH, 2);
    this.bar.fill({ color: 0xffffff, alpha: 0.2 });
    
    // Active progress bar (Blue)
    if (ratio > 0) {
      this.bar.roundRect(48, 28, barW * ratio, barH, 2);
      this.bar.fill(0x3498db);
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
