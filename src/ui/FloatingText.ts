import { Container, Text, TextStyle, Ticker } from 'pixi.js';

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

  constructor(container: Container) {
    this.container = container;
  }

  spawn(message: string, x: number, y: number, color: number = 0xffff44): void {
    const style = new TextStyle({
      fontSize: 20,
      fontWeight: 'bold',
      fill: color,
      stroke: { color: 0x000000, width: 3 },
      dropShadow: {
        color: 0x000000,
        blur: 2,
        distance: 1,
      },
    });

    const text = new Text({ text: message, style });
    text.anchor.set(0.5, 0.5);
    text.x = x + (Math.random() - 0.5) * 40;
    text.y = y;
    text.alpha = 1;

    this.container.addChild(text);

    const instance: FloatingTextInstance = {
      text,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -2.5 - Math.random() * 1.5,
      life: 1.0,
      maxLife: 1.0,
    };

    this.instances.push(instance);
  }

  update(deltaSeconds: number): void {
    for (let i = this.instances.length - 1; i >= 0; i--) {
      const inst = this.instances[i];
      inst.life -= deltaSeconds;

      if (inst.life <= 0) {
        this.container.removeChild(inst.text);
        inst.text.destroy();
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
