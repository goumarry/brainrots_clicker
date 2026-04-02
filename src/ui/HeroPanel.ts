import {
  Container, Graphics, Text, TextStyle, Rectangle
} from 'pixi.js';
import { HERO_DATA } from '../config/HeroData';
import { GameState } from '../core/GameState';
import { HeroManager } from '../core/HeroManager';
import { GoldManager } from '../core/GoldManager';
import { EventBus, Events } from '../systems/EventBus';
import { formatNumber, formatGold, formatDPS } from '../systems/NumberFormatter';
import { Decimal } from '../systems/BigNumber';

const PANEL_PADDING = 8;
const HERO_CARD_H = 72;
const HERO_CARD_GAP = 6;

interface HeroCard {
  container: Container;
  bg: Graphics;
  nameText: Text;
  levelText: Text;
  dpsText: Text;
  costText: Text;
  buyBtn: Graphics;
  buyBtnText: Text;
  index: number;
}

export class HeroPanel {
  container: Container;
  private panelBg: Graphics;
  private scrollContainer: Container;
  private maskGraphic: Graphics;
  private panelW: number;
  private panelH: number;
  private cards: HeroCard[] = [];
  private scrollY: number = 0;
  private totalContentH: number = 0;
  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private dragStartScrollY: number = 0;

  constructor(width: number, height: number) {
    this.panelW = width;
    this.panelH = height;
    this.container = new Container();

    // Panel background
    this.panelBg = new Graphics();
    this.panelBg.roundRect(0, 0, width, height, 8);
    this.panelBg.fill(0x0d1b2a);
    this.panelBg.stroke({ color: 0x1e3a5f, width: 2 });
    this.container.addChild(this.panelBg);

    // Header
    const headerBg = new Graphics();
    headerBg.roundRect(0, 0, width, 30, 8);
    headerBg.fill(0x1e3a5f);
    this.container.addChild(headerBg);

    const headerText = new Text({
      text: '⚔️ HEROES',
      style: new TextStyle({ fontSize: 14, fontWeight: 'bold', fill: 0x7ec8e3 }),
    });
    headerText.x = PANEL_PADDING;
    headerText.y = 7;
    this.container.addChild(headerText);

    // Scroll container
    this.scrollContainer = new Container();
    this.scrollContainer.y = 32;
    this.container.addChild(this.scrollContainer);

    // Mask for scroll
    this.maskGraphic = new Graphics();
    this.maskGraphic.rect(0, 32, width, height - 32);
    this.maskGraphic.fill(0xffffff);
    this.container.addChild(this.maskGraphic);
    this.scrollContainer.mask = this.maskGraphic;

    // Create hero cards
    this.buildCards();

    // Scroll interaction
    this.container.eventMode = 'static';
    this.container.on('pointerdown', (e) => {
      this.isDragging = true;
      this.dragStartY = e.global.y;
      this.dragStartScrollY = this.scrollY;
    });
    this.container.on('pointermove', (e) => {
      if (!this.isDragging) return;
      const delta = e.global.y - this.dragStartY;
      this.setScrollY(this.dragStartScrollY + delta);
    });
    this.container.on('pointerup', () => { this.isDragging = false; });
    this.container.on('pointerupoutside', () => { this.isDragging = false; });

    // Wheel scroll
    this.container.on('wheel', (e: WheelEvent) => {
      this.setScrollY(this.scrollY - (e as any).deltaY * 0.5);
    });

    // Events
    EventBus.on(Events.GOLD_CHANGED, () => this.updateAllCards());
    EventBus.on(Events.HERO_BOUGHT, () => this.updateAllCards());
    EventBus.on(Events.DPS_CHANGED, () => this.updateAllCards());
    EventBus.on(Events.SAVE_LOADED, () => this.updateAllCards());
  }

  private buildCards(): void {
    const contentW = this.panelW - PANEL_PADDING * 2;

    for (let i = 0; i < HERO_DATA.length; i++) {
      const hero = HERO_DATA[i];
      const y = i * (HERO_CARD_H + HERO_CARD_GAP);

      const cardContainer = new Container();
      cardContainer.x = PANEL_PADDING;
      cardContainer.y = y + PANEL_PADDING;
      this.scrollContainer.addChild(cardContainer);

      // Card background
      const bg = new Graphics();
      bg.roundRect(0, 0, contentW, HERO_CARD_H, 8);
      bg.fill(0x0f2233);
      bg.stroke({ color: hero.color, width: 1.5 });
      cardContainer.addChild(bg);

      // Hero color accent strip
      const accent = new Graphics();
      accent.roundRect(0, 0, 4, HERO_CARD_H, 4);
      accent.fill(hero.color);
      accent.eventMode = 'none';
      cardContainer.addChild(accent);

      // Emoji icon
      const emojiText = new Text({
        text: hero.emoji,
        style: new TextStyle({ fontSize: 28 }),
      });
      emojiText.x = 12;
      emojiText.y = HERO_CARD_H / 2 - 16;
      emojiText.eventMode = 'none';
      cardContainer.addChild(emojiText);

      // Name
      const nameText = new Text({
        text: hero.name,
        style: new TextStyle({ fontSize: 13, fontWeight: 'bold', fill: 0xffffff }),
      });
      nameText.x = 52;
      nameText.y = 8;
      nameText.eventMode = 'none';
      cardContainer.addChild(nameText);

      // Level text
      const levelText = new Text({
        text: 'Lv. 0',
        style: new TextStyle({ fontSize: 11, fill: 0xaaaaaa }),
      });
      levelText.x = 52;
      levelText.y = 26;
      levelText.eventMode = 'none';
      cardContainer.addChild(levelText);

      // DPS text
      const dpsText = new Text({
        text: 'DPS: 0/s',
        style: new TextStyle({ fontSize: 11, fill: 0x88ccff }),
      });
      dpsText.x = 52;
      dpsText.y = 42;
      dpsText.eventMode = 'none';
      cardContainer.addChild(dpsText);

      // Buy button — use a Container so clicks on the label also register
      const btnW = 90;
      const btnH = 38;
      const btnX = contentW - btnW - 8;
      const btnY = (HERO_CARD_H - btnH) / 2;

      const buyBtn = new Graphics();
      buyBtn.roundRect(btnX, btnY, btnW, btnH, 6);
      buyBtn.fill(0x27ae60);
      buyBtn.eventMode = 'static';
      buyBtn.cursor = 'pointer';
      cardContainer.addChild(buyBtn);

      const costText = new Text({
        text: `💰${formatGold(hero.baseCost)}`,
        style: new TextStyle({ fontSize: 11, fontWeight: 'bold', fill: 0xffffff }),
      });
      costText.anchor.set(0.5, 0.5);
      costText.x = btnX + btnW / 2;
      costText.y = btnY + btnH / 2;
      costText.eventMode = 'none';
      cardContainer.addChild(costText);

      // Click buy button
      buyBtn.on('pointerdown', (e) => {
        e.stopPropagation();
        HeroManager.buyHero(i);
      });

      const card: HeroCard = {
        container: cardContainer,
        bg,
        nameText,
        levelText,
        dpsText,
        costText,
        buyBtn,
        buyBtnText: costText,
        index: i,
      };

      this.cards.push(card);
    }

    this.totalContentH = HERO_DATA.length * (HERO_CARD_H + HERO_CARD_GAP) + PANEL_PADDING * 2;
    this.updateAllCards();
  }

  private updateAllCards(): void {
    for (let i = 0; i < this.cards.length; i++) {
      this.updateCard(i);
    }
  }

  private updateCard(i: number): void {
    const card = this.cards[i];
    const heroState = GameState.heroes[i];
    const heroDef = HERO_DATA[i];

    const level = heroState.level;
    const cost = HeroManager.getHeroCost(i);
    const dps = HeroManager.getHeroDPS(i);
    const canAfford = GoldManager.canAfford(cost);

    card.levelText.text = `Lv. ${level}`;
    card.dpsText.text = `DPS: ${formatDPS(dps)}/s`;
    card.costText.text = `💰 ${formatGold(cost)}`;

    // Button color based on affordability
    card.buyBtn.clear();
    const btnW = 90;
    const btnH = 38;
    const btnX = (this.panelW - PANEL_PADDING * 2) - btnW - 8;
    const btnY = (HERO_CARD_H - btnH) / 2;

    const btnColor = canAfford ? 0x27ae60 : 0x555555;
    card.buyBtn.roundRect(btnX, btnY, btnW, btnH, 6);
    card.buyBtn.fill(btnColor);
    card.buyBtn.stroke({ color: canAfford ? 0x2ecc71 : 0x333333, width: 1 });

    card.costText.style.fill = canAfford ? 0xffffff : 0x888888;

    // Milestone indicator
    if (level > 0 && level % 25 === 0) {
      card.bg.clear();
      card.bg.roundRect(0, 0, this.panelW - PANEL_PADDING * 2, HERO_CARD_H, 8);
      card.bg.fill(0x1a2e1a);
      card.bg.stroke({ color: 0x2ecc71, width: 2 });
    }
  }

  private setScrollY(y: number): void {
    const maxScroll = Math.max(0, this.totalContentH - (this.panelH - 32));
    this.scrollY = Math.max(-maxScroll, Math.min(0, y));
    this.scrollContainer.y = 32 + this.scrollY;
  }
}
