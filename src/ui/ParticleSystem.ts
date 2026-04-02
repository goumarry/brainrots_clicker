import { Container, Graphics } from 'pixi.js';

interface Particle {
  gfx: Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
}

export class ParticleSystem {
  private container: Container;
  private particles: Particle[] = [];
  private pool: Graphics[] = [];

  constructor(container: Container) {
    this.container = container;
  }

  private getGraphics(): Graphics {
    return this.pool.pop() ?? new Graphics();
  }

  private returnGraphics(gfx: Graphics): void {
    gfx.clear();
    gfx.visible = false;
    this.pool.push(gfx);
    this.container.removeChild(gfx);
  }

  // Burst of particles on enemy kill
  spawnKillBurst(x: number, y: number, color: number, count: number = 12): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 80 + Math.random() * 120;
      const size = 4 + Math.random() * 6;
      const life = 0.4 + Math.random() * 0.4;

      const gfx = this.getGraphics();
      gfx.clear();
      gfx.circle(0, 0, size);
      gfx.fill(color);
      gfx.x = x;
      gfx.y = y;
      gfx.visible = true;
      gfx.alpha = 1;
      this.container.addChild(gfx);

      this.particles.push({
        gfx,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        color,
        size,
      });
    }
  }

  // Small sparks on click/crit
  spawnClickSparks(x: number, y: number, isCrit: boolean): void {
    const count = isCrit ? 8 : 4;
    const color = isCrit ? 0xff4444 : 0xffee44;
    this.spawnKillBurst(x, y, color, count);
  }

  // Star burst on zone advance
  spawnZoneCelebration(x: number, y: number): void {
    const colors = [0xffd700, 0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96e6a1];
    for (let i = 0; i < 20; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.spawnKillBurst(x, y, color, 1);
    }
  }

  update(deltaSeconds: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= deltaSeconds;

      if (p.life <= 0) {
        this.returnGraphics(p.gfx);
        this.particles.splice(i, 1);
        continue;
      }

      // Apply gravity and movement
      p.vy += 200 * deltaSeconds;
      p.gfx.x += p.vx * deltaSeconds;
      p.gfx.y += p.vy * deltaSeconds;
      p.gfx.alpha = p.life / p.maxLife;
      p.gfx.scale.set(p.life / p.maxLife);
    }
  }

  destroy(): void {
    for (const p of this.particles) {
      this.container.removeChild(p.gfx);
    }
    this.particles = [];
  }
}
