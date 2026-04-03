import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { createTextStyle } from '../styles/Typography';
import { SaveManager } from '../../core/SaveManager';
import { EventBus, Events } from '../../systems/EventBus';

export class SettingsScreen {
  container: Container;
  private panelW: number;
  private panelH: number;

  constructor(width: number, height: number) {
    this.panelW = width;
    this.panelH = height;
    this.container = new Container();
    this.build();
  }

  private build(): void {
    while (this.container.children.length > 0) this.container.removeChildAt(0);

    const bg = new Graphics();
    bg.rect(0, 0, this.panelW, this.panelH);
    bg.fill(0x0d1b2a);
    this.container.addChild(bg);

    let y = 30;

    const title = new Text({
      text: '⚙️ Settings',
      style: createTextStyle({ fontSize: 20, fill: 0xffffff }),
      resolution: window.devicePixelRatio || 2,
    });
    title.x = 24;
    title.y = y;
    title.eventMode = 'none';
    this.container.addChild(title);
    y += 50;

    // Save game button
    y = this.addButton(y, '💾 Save Game', 0x27ae60, () => {
      SaveManager.save();
      EventBus.emit(Events.FLOATING_TEXT, '✅ Game saved!', 640, 360, 0x44ff88);
    });

    y += 12;

    // Delete save button
    y = this.addButton(y, '🗑️ Delete Save & Restart', 0xe74c3c, () => {
      if (confirm('Delete all progress? This cannot be undone!')) {
        SaveManager.deleteSave();
        window.location.reload();
      }
    });

    y += 24;

    // Version info
    const version = new Text({
      text: 'BrainrotClicker v1.0\nPhases 1-4 complete',
      style: createTextStyle({ fontSize: 13, fill: 0x556677, align: 'center', fontWeight: 'normal', padding: 4 }),
      resolution: window.devicePixelRatio || 2,
    });
    version.anchor.set(0.5, 0);
    version.x = this.panelW / 2;
    version.y = y;
    version.eventMode = 'none';
    this.container.addChild(version);
  }

  private addButton(y: number, label: string, color: number, onClick: () => void): number {
    const btnH = 48;
    const btn = new Graphics();
    btn.roundRect(24, y, this.panelW - 48, btnH, 8);
    btn.fill(0x0d1926);
    btn.stroke({ color, width: 2 });
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', onClick);
    this.container.addChild(btn);

    const text = new Text({
      text: label,
      style: createTextStyle({ fontSize: 16, fill: color }),
      resolution: window.devicePixelRatio || 2,
    });
    text.anchor.set(0.5);
    text.x = this.panelW / 2;
    text.y = y + btnH / 2;
    text.eventMode = 'none';
    this.container.addChild(text);

    return y + btnH + 10;
  }

  update(_dt: number): void {}
}
