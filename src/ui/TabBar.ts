import { Container, Graphics, Text } from 'pixi.js';
import { createTextStyle } from './styles/Typography';

export type TabName = 'heroes' | 'ascension' | 'relics' | 'achievements' | 'settings';

const TABS: { name: TabName; emoji: string; label: string }[] = [
  { name: 'heroes', emoji: '🦸', label: 'Heroes' },
  { name: 'ascension', emoji: '🌀', label: 'Ascend' },
  { name: 'relics', emoji: '🏺', label: 'Relics' },
  { name: 'achievements', emoji: '🏆', label: 'Achieve' },
  { name: 'settings', emoji: '⚙️', label: 'Settings' },
];

interface TabObject {
  container: Container;
  bg: Graphics;
  emoji: Text;
  label: Text;
}

export class TabBar {
  container: Container;
  private barWidth: number;
  private barHeight: number;
  private activeTab: TabName = 'heroes';
  private hoverIdx: number = -1;
  private onTabChange: (tab: TabName) => void;
  private tabs: TabObject[] = [];

  constructor(width: number, height: number = 90, onTabChange: (tab: TabName) => void) {
    this.barWidth = width;
    this.barHeight = height;
    this.onTabChange = onTabChange;
    this.container = new Container();
    this.build();
  }

  private build(): void {
    const tabW = this.barWidth / TABS.length;
    const h = this.barHeight;

    // Background Shadow (Outer Depth)
    const bg = new Graphics();
    bg.rect(0, 0, this.barWidth, h);
    bg.fill(0x0a1422);
    this.container.addChild(bg);

    for (let i = 0; i < TABS.length; i++) {
        const tabData = TABS[i];
        const tabContainer = new Container();
        tabContainer.x = i * tabW;
        tabContainer.eventMode = 'static';
        tabContainer.cursor = 'pointer';

        const tabBg = new Graphics();
        tabContainer.addChild(tabBg);

        const emoji = new Text({
            text: tabData.emoji,
            style: createTextStyle({ fontSize: 28, fontWeight: 'normal', padding: 8 }),
            resolution: 2,
        });
        emoji.anchor.set(0.5, 0.5);
        emoji.x = tabW / 2;
        emoji.y = h * 0.40;
        tabContainer.addChild(emoji);

        const label = new Text({
            text: tabData.label,
            style: createTextStyle({ fontSize: 13, fill: 0x8899aa, align: 'center', padding: 4 }),
            resolution: 2
        });
        label.anchor.set(0.5, 0.5);
        label.x = tabW / 2;
        label.y = h * 0.78;
        tabContainer.addChild(label);

        const idx = i;
        tabContainer.on('pointerdown', () => {
            this.activeTab = TABS[idx].name;
            this.refresh();
            this.onTabChange(TABS[idx].name);
        });

        tabContainer.on('pointerover', () => {
            this.hoverIdx = idx;
            this.refresh();
        });

        tabContainer.on('pointerout', () => {
            this.hoverIdx = -1;
            this.refresh();
        });

        this.container.addChild(tabContainer);
        this.tabs.push({
            container: tabContainer,
            bg: tabBg,
            emoji,
            label
        });
    }

    this.refresh();
  }

  private refresh(): void {
    const tabW = this.barWidth / TABS.length;
    const h = this.barHeight;

    for (let i = 0; i < this.tabs.length; i++) {
      const tab = this.tabs[i];
      const isActive = TABS[i].name === this.activeTab;
      const isHovered = this.hoverIdx === i;

      tab.bg.clear();
      
      // Background colors (Unified Dark Palette)
      let bgColor = 0x0a1422;
      if (isActive) bgColor = 0x1a2e44;
      else if (isHovered) bgColor = 0x14253a;
      
      tab.bg.rect(0, 0, tabW, h);
      tab.bg.fill(bgColor);

      // Active state effects
      if (isActive) {
        // TOP NEON UNDERLINE with GLOW
        // Outer Glow Effect (Subtle)
        tab.bg.rect(0, 0, tabW, 4);
        tab.bg.fill({ color: 0x4a9eff, alpha: 0.3 }); // Glow layer
        
        // Solid Neon Line
        tab.bg.rect(0, 0, tabW, 2);
        tab.bg.fill(0x4a9eff);
        
        // Text styling
        tab.label.style.fill = 0xffffff;
        tab.label.style.fontWeight = 'bold';
        tab.emoji.scale.set(1.15); // Slight pop
        tab.emoji.alpha = 1.0;
        
      } else {
        // Inactive state Reset
        tab.label.style.fill = isHovered ? 0xbbccdd : 0x667788;
        tab.label.style.fontWeight = 'normal';
        tab.emoji.scale.set(1.0);
        tab.emoji.alpha = isHovered ? 0.9 : 0.6; // Dimmed when not active
      }
    }
  }

  setActiveTab(tab: TabName): void {
    this.activeTab = tab;
    this.refresh();
  }

  get height(): number { return this.barHeight; }
}
