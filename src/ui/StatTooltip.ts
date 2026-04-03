import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { createTextStyle } from './styles/Typography';
import { StatBreakdown } from '../core/StatCalculator';
import { formatNumber } from '../systems/NumberFormatter';
import { Decimal } from '../systems/BigNumber';

export class StatTooltip {
  container: Container;
  private bg: Graphics;
  private titleText: Text;
  private contentText: Text;

  private padding: number = 12;
  private maxWidth: number = 240;

  constructor() {
    this.container = new Container();
    this.container.visible = false;
    this.container.zIndex = 1000;

    this.bg = new Graphics();
    this.container.addChild(this.bg);
    
    // Pivot to center for easier alignment
    this.container.pivot.x = this.maxWidth / 2;

    this.titleText = new Text({
      text: '',
      style: createTextStyle({
        fontSize: 14,
        fill: 0xffffff,
        padding: 4,
      }),
      resolution: 3,
    });
    this.titleText.x = this.padding;
    this.titleText.y = this.padding;
    this.container.addChild(this.titleText);

    this.contentText = new Text({
      text: '',
      style: createTextStyle({
        fontSize: 12,
        fill: 0xcccccc,
        lineHeight: 18,
        fontWeight: 'normal',
        padding: 4,
      }),
      resolution: 3,
    });
    this.contentText.x = this.padding;
    this.contentText.y = this.padding + 22;
    this.container.addChild(this.contentText);
  }

  show(breakdown: StatBreakdown, x: number, y: number): void {
    this.titleText.text = breakdown.label;
    
    let content = `Base: ${this.formatVal(breakdown.base)}\n`;
    for (const m of breakdown.multipliers) {
      const valStr = m.type === 'mult' ? `x${this.formatVal(m.value)}` : `${m.value}`;
      content += `${m.label}: ${valStr}\n`;
    }
    content += `──────────────\n`;
    content += `Total: ${this.formatVal(breakdown.total)}`;
    
    this.contentText.text = content;

    // Draw background
    const width = this.maxWidth;
    const height = this.contentText.y + this.contentText.height + this.padding;
    
    this.bg.clear();
    // Glassmorphism look
    this.bg.roundRect(0, 0, width, height, 8);
    this.bg.fill({ color: 0x0a141f, alpha: 0.95 });
    this.bg.stroke({ color: 0x1e3a5f, width: 2 });

    // Anchor at BOTTOM-CENTER
    this.container.pivot.y = height;

    this.container.x = x;
    this.container.y = y;
    this.container.visible = true;
  }

  hide(): void {
    this.container.visible = false;
  }

  private formatVal(val: string | number | Decimal): string {
    if (val instanceof Decimal) {
      return formatNumber(val);
    }
    if (typeof val === 'number') {
      return val % 1 === 0 ? val.toString() : val.toFixed(2);
    }
    return val;
  }
}
