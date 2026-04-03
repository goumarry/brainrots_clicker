import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { createTextStyle } from './styles/Typography';

export type TabName = 'heroes' | 'ascension' | 'relics' | 'achievements' | 'settings';

const TABS: { name: TabName; emoji: string; label: string }[] = [
  { name: 'heroes', emoji: '🦸', label: 'Heroes' },
  { name: 'ascension', emoji: '🌀', label: 'Ascend' },
  { name: 'relics', emoji: '🏺', label: 'Relics' },
  { name: 'achievements', emoji: '🏆', label: 'Achieve' },
  { name: 'settings', emoji: '⚙️', label: 'Settings' },
];

export class TabBar {
  container: Container;
  private barWidth: number;
  private barHeight: number;
  private activeTab: TabName = 'heroes';
  private onTabChange: (tab: TabName) => void;
  private tabBgs: Graphics[] = [];

  constructor(width: number, height: number = 48, onTabChange: (tab: TabName) => void) {
    this.barWidth = width;
    this.barHeight = height;
    this.onTabChange = onTabChange;
    this.container = new Container();
    this.build();
  }

  private build(): void {
    const tabW = this.barWidth / TABS.length;
    const h = this.barHeight;

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, this.barWidth, h);
    bg.fill(0x0d1926);
    this.container.addChild(bg);

    // Top separator
    const sep = new Graphics();
    sep.rect(0, 0, this.barWidth, 2);
    sep.fill(0x2a3a50);
    this.container.addChild(sep);

    for (let i = 0; i < TABS.length; i++) {
      const tab = TABS[i];
      const tabContainer = new Container();
      tabContainer.x = i * tabW;
      tabContainer.eventMode = 'static';
      tabContainer.cursor = 'pointer';

      const tabBg = new Graphics();
      this.tabBgs.push(tabBg);
      tabContainer.addChild(tabBg);

      const emoji = new Text({
        text: tab.emoji,
        style: createTextStyle({ fontSize: 28, fontWeight: 'normal', padding: 8 }),
        resolution: window.devicePixelRatio || 2,
      });
      emoji.anchor.set(0.5);
      emoji.x = tabW / 2;
      emoji.y = h * 0.38;
      tabContainer.addChild(emoji);

      const label = new Text({
        text: tab.label,
        style: createTextStyle({
          fontSize: 16,
          fill: 0x8899aa,
          align: 'center',
          padding: 4
        }),
        resolution: window.devicePixelRatio || 2
      });
      label.anchor.set(0.5);
      label.x = tabW / 2;
      label.y = h * 0.76;
      tabContainer.addChild(label);

      const idx = i;
      tabContainer.on('pointerdown', () => {
        this.activeTab = TABS[idx].name;
        this.refresh();
        this.onTabChange(TABS[idx].name);
      });

      this.container.addChild(tabContainer);
    }

    this.refresh();
  }

  private refresh(): void {
    const tabW = this.barWidth / TABS.length;
    const h = this.barHeight;
    for (let i = 0; i < TABS.length; i++) {
      const isActive = TABS[i].name === this.activeTab;
      const bg = this.tabBgs[i];
      bg.clear();
      bg.rect(0, 0, tabW, h);
      bg.fill(isActive ? 0x1a2d42 : 0x0d1926);
      if (isActive) {
        bg.rect(0, 0, tabW, 3);
        bg.fill(0x4a9eff);
      }
    }
  }

  setActiveTab(tab: TabName): void {
    this.activeTab = tab;
    this.refresh();
  }

  get height(): number { return this.barHeight; }
}
