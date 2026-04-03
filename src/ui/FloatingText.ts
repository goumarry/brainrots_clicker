import { Container, Text, TextStyle, Ticker } from 'pixi.js';
import { createTextStyle } from './styles/Typography';

interface FloatingTextInstance {
  text: Text;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export class FloatingTextManager {
  private container: Container;
  private instances: FloatingTextInstance[] = [];
  private pool: Text[] = [];
  private static readonly STYLE = createTextStyle({
    fontSize: 20,
    fill: 0xffff44,
    stroke: { color: 0x000000, width: 3 },
    dropShadow: { color: 0x000000, blur: 2, distance: 1 },
    padding: 4,
  });

  constructor(container: Container) {
    this.container = container;
  }

  spawn(message: string, x: number, y: number, color: number = 0xffff44): void {
    if (this.instances.length >= 30) return;

    let text: Text;
    if (this.pool.length > 0) {
      text = this.pool.pop()!;
      text.visible = true;
      text.alpha = 1;
      text.text = message;
      text.style.fill = color;
    } else {
      text = new Text({
        text: message,
        style: FloatingTextManager.STYLE,
        resolution: 2,
      });
      text.anchor.set(0.5, 0.5);
    }

    text.x = x + (Math.random() - 0.5) * 40;
    text.y = y;
    this.container.addChild(text);

    this.instances.push({
      text,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -2.5 - Math.random() * 1.5,
      life: 0.8,
      maxLife: 0.8,
    });
  }

  update(deltaSeconds: number): void {
    for (let i = this.instances.length - 1; i >= 0; i--) {
      const inst = this.instances[i];
      inst.life -= deltaSeconds;

      if (inst.life <= 0) {
        inst.text.visible = false;
        this.container.removeChild(inst.text);
        this.pool.push(inst.text);
        this.instances.splice(i, 1);
        continue;
      }

      inst.text.x += inst.vx;
      inst.text.y += inst.vy;
      inst.vy += 0.05; // gravity drag
      inst.text.alpha = inst.life / inst.maxLife;

      const scale = 0.8 + 0.2 * (inst.life / inst.maxLife);
      inst.text.scale.set(scale);
    }
  }

  destroy(): void {
    for (const inst of this.instances) {
      inst.text.destroy();
    }
    this.instances = [];
  }
}
