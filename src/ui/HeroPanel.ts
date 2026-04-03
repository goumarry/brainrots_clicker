import { Container, Graphics, Text, TextStyle, Sprite, Rectangle } from 'pixi.js';
import { createTextStyle } from './styles/Typography';
import { HeroManager } from '../core/HeroManager';
import { formatGold, formatDPS } from '../systems/NumberFormatter';
import { GameState } from '../core/GameState';
import { EventBus, Events } from '../systems/EventBus';
import { HERO_DATA } from '../config/HeroData';

interface HeroCard {
  container: Container;
  bg: Graphics;
  nameText: Text;
  levelText: Text;
  dpsText: Text;
  costText: Text | null;
  buyBtn: Graphics | null;
  iconContainer: Container;
  isNext?: boolean;
}

export class HeroPanel {
  container: Container;
  private panelW: number;
  private panelH: number;
  private scrollContainer: Container;
  private cards: HeroCard[] = [];
  private scrollY: number = 0;
  private maxScroll: number = 0;

  constructor(width: number, height: number) {
    this.panelW = width;
    this.panelH = height;
    this.container = new Container();
    this.container.eventMode = 'static';
    this.container.hitArea = new Rectangle(0, 0, width, height);

    this.scrollContainer = new Container();
    this.container.addChild(this.scrollContainer);

    // MASK TO PREVENT ELEMENTS FROM OVERFLOWING
    const mask = new Graphics();
    mask.rect(0, 0, width, height);
    mask.fill(0xffffff); // Color doesn't matter for mask
    this.container.addChild(mask);
    this.scrollContainer.mask = mask;

    this.build();
    this.setupInteractivity();

    EventBus.on(Events.GOLD_CHANGED, () => this.updateButtons());
    EventBus.on(Events.HERO_BOUGHT, () => this.refresh());
    EventBus.on(Events.ASCENSION_COMPLETE, () => this.refresh());
    EventBus.on(Events.BOSS_SPAWNED, () => this.refresh()); // In case a boss kill just happened but event is different
    EventBus.on(Events.ENEMY_DIED, (gold, isBoss) => { if(isBoss) this.refresh(); });
  }

  public refresh(): void {
    this.build();
  }

  private build(): void {
    const cardH = 110;
    const padding = 10;
    this.cards = [];
    this.scrollContainer.removeChildren();

    const lastUnlockedIdx = GameState.heroes.reduce((max, h, idx) => h.isUnlocked ? idx : max, 0);
    const nextLockedIdx = lastUnlockedIdx + 1;

    for (let i = 0; i < HERO_DATA.length; i++) {
        const hero = HERO_DATA[i];
        const isUnlocked = GameState.heroes[i].isUnlocked;
        const isNext = i === nextLockedIdx;
        
        const cardContainer = new Container();
        cardContainer.x = padding;
        cardContainer.y = padding + (this.cards.length) * (cardH + padding);

        const cardBg = new Graphics();
        cardBg.roundRect(0, 0, this.panelW - padding * 2, cardH, 8);
        if (isUnlocked) cardBg.fill(0x1a2d42);
        else if (isNext) cardBg.fill(0x0a1b2a); // "Next Hero" highlight color
        else cardBg.fill(0x02050a); // Deep black for others
        
        cardBg.stroke({ color: isUnlocked ? 0x2a3a50 : (isNext ? 0x2a3a50 : 0x0a101a), width: 1.5 });
        cardContainer.addChild(cardBg);
        
        const cardW = this.panelW - padding * 2;

        // Icon
        const iconContainer = new Container();
        iconContainer.x = 10;
        iconContainer.y = 12;
        cardContainer.addChild(iconContainer);

        if (hero.image) {
            const sprite = Sprite.from(hero.image);
            sprite.width = 90;
            sprite.height = 90;
            if (!isUnlocked) {
                sprite.tint = isNext ? 0x222222 : 0x000000; // Next hero is visible silhouette
            }
            iconContainer.addChild(sprite);
        } else {
            if (isUnlocked) {
                const emoji = new Text({
                    text: hero.emoji,
                    style: createTextStyle({ fontSize: 32, fontWeight: 'normal', padding: 8 }),
                    resolution: window.devicePixelRatio || 2,
                });
                emoji.anchor.set(0.5);
                emoji.x = 45;
                emoji.y = 45;
                iconContainer.addChild(emoji);
            } else {
                // Emoji placeholder silhouette correctly centered
                const placeholder = new Graphics();
                placeholder.circle(45, 45, 38);
                placeholder.fill(0x000000);
                iconContainer.addChild(placeholder);
            }
        }

        // REMOVED lockOverlay from iconContainer per user request

        // Name
        const nameText = new Text({
            text: isUnlocked ? hero.name : `(Defeat Zone ${hero.unlockZone} Boss)`,
            style: createTextStyle({ 
                fontSize: isUnlocked ? 22 : 16, 
                fill: isUnlocked ? 0xffffff : (isNext ? 0x7fbfff : 0x4a5a6a), 
                padding: 8 
            }),
            resolution: window.devicePixelRatio || 2,
        });
        nameText.x = isUnlocked ? 110 : Math.floor(cardW / 2);
        nameText.anchor.set(isUnlocked ? 0 : 0.5, 0.5);
        nameText.y = isUnlocked ? 28 : cardH / 2;
        cardContainer.addChild(nameText);

        // Stats (Only if unlocked)
        let levelText: Text;
        let dpsText: Text;

        if (isUnlocked) {
            const state = GameState.heroes[i];
            levelText = new Text({
                text: `Level ${state.level}`,
                style: createTextStyle({ fontSize: 16, fill: 0x8899aa, padding: 4 }),
                resolution: window.devicePixelRatio || 2,
            });
            levelText.x = 110;
            levelText.y = 48;
            cardContainer.addChild(levelText);

            dpsText = new Text({
                text: i === 0 
                    ? `Click Bonus: +${state.level}` 
                    : `Damage: +${formatDPS(HeroManager.getHeroDPS(i))}/s`,
                style: createTextStyle({ fontSize: 16, fill: 0x4a9eff, padding: 4 }),
                resolution: window.devicePixelRatio || 2,
            });
            dpsText.x = 110;
            dpsText.y = 74;
            cardContainer.addChild(dpsText);
        } else {
            // Placeholder text for locked stats
            levelText = new Text({ text: '', style: createTextStyle({ fontSize: 0 }) });
            dpsText = new Text({ text: '', style: createTextStyle({ fontSize: 0 }) });
        }

        let buyBtn: Graphics | null = null;
        let costText: Text | null = null;

        if (isUnlocked) {
            const btnW = 140;
            const btnH = 54;
            buyBtn = new Graphics();
            buyBtn.roundRect(this.panelW - padding * 2 - btnW - 10, cardH / 2 - btnH / 2, btnW, btnH, 10);
            buyBtn.fill(0x2d5a27);
            buyBtn.eventMode = 'static';
            buyBtn.cursor = 'pointer';
            
            const idx = i;
            buyBtn.on('pointerdown', () => {
                if (HeroManager.buyHero(idx)) {
                    this.refresh();
                }
            });
            cardContainer.addChild(buyBtn);

            const cost = HeroManager.getHeroCost(i);
            costText = new Text({
                text: `${formatGold(cost)}💰`,
                style: createTextStyle({ fontSize: 18, fill: 0xffffff, padding: 4 }),
                resolution: window.devicePixelRatio || 2,
            });
            costText.anchor.set(0.5);
            costText.x = this.panelW - padding * 2 - btnW / 2 - 10;
            costText.y = cardH / 2;
            cardContainer.addChild(costText);
        } else {
            // Show LOCKED badge
            const lockBadge = new Graphics();
            lockBadge.roundRect(this.panelW - padding * 2 - 140, (cardH - 50) / 2, 130, 50, 10);
            lockBadge.fill(0x1a1a1a);
            lockBadge.stroke({ color: 0x3a2a1a, width: 2.5 });
            cardContainer.addChild(lockBadge);

            const lockBadgeText = new Text({
                text: '🔒 LOCKED',
                style: createTextStyle({ fontSize: 16, fill: 0xaaaaaa, padding: 4 }),
                resolution: window.devicePixelRatio || 2,
            });
            lockBadgeText.anchor.set(0.5);
            lockBadgeText.x = this.panelW - padding * 2 - 75;
            lockBadgeText.y = cardH / 2;
            cardContainer.addChild(lockBadgeText);
        }

        this.scrollContainer.addChild(cardContainer);
        this.cards.push({
            container: cardContainer,
            bg: cardBg,
            nameText,
            levelText,
            dpsText,
            costText,
            buyBtn,
            iconContainer
        });
    }

    this.maxScroll = Math.max(0, padding + this.cards.length * (cardH + padding) - this.panelH);
    this.clampScroll();
  }

  private updateButtons(): void {
    for (let i = 0; i < this.cards.length; i++) {
        const card = this.cards[i];
        if (!card.buyBtn) continue;

        const cost = HeroManager.getHeroCost(i);
        const canAfford = GameState.gold.gte(cost);
        card.buyBtn.fill(canAfford ? 0x2d5a27 : 0x334455);
        if (card.costText) card.costText.text = `${formatGold(cost)}💰`;
    }
  }

  private setupInteractivity(): void {
    this.container.eventMode = 'static';
    this.container.on('wheel', (e) => {
        this.scrollY -= e.deltaY;
        this.clampScroll();
    });

    let dragging = false;
    let lastY = 0;
    
    this.container.on('pointerdown', (e) => { 
        dragging = true; 
        lastY = e.global.y; 
        
        // Ensure no other component handles this event purely if we are scrolling
        // e.stopPropagation(); 
    });
    
    window.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dy = e.clientY - lastY;
        this.scrollY += dy * 1.5;
        lastY = e.clientY;
        this.clampScroll();
    });
    
    window.addEventListener('pointerup', () => { 
        dragging = false; 
    });
  }

  private clampScroll(): void {
    if (this.scrollY > 0) this.scrollY = 0;
    if (this.scrollY < -this.maxScroll) this.scrollY = -this.maxScroll;
    this.scrollContainer.y = Math.floor(this.scrollY);
  }

  updateAllCards(): void {
    this.refresh();
  }
}
