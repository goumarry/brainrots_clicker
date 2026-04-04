import { Container, Graphics, Text, Rectangle, Sprite } from 'pixi.js';
import { createTextStyle } from './styles/Typography';
import { HeroManager } from '../core/HeroManager';
import { formatGold, formatDPS } from '../systems/NumberFormatter';
import { GameState } from '../core/GameState';
import { EventBus, Events } from '../systems/EventBus';
import { HERO_DATA } from '../config/HeroData';

const CARD_HEIGHT = 160; 
const PADDING = 10;
const BTN_WIDTH = 140;
const BTN_HEIGHT = 48; 

interface HeroCard {
  container: Container;
  bg: Graphics;
  nameText: Text;
  levelText: Text;
  dpsText: Text;
  costText: Text;
  buyBtn: Graphics;
  actionGroup: Container; 
  iconContainer: Container;
  isPressed: boolean; 
}

export class HeroPanel {
  container: Container;
  private panelW: number;
  private panelH: number;
  private scrollContainer: Container;
  private cards: HeroCard[] = [];
  private scrollY: number = 0;
  private maxScroll: number = 0;
  private hoverIdx: number = -1;
  private pulseTimer: number = 0;

  constructor(width: number, height: number) {
    this.panelW = width;
    this.panelH = height;
    this.container = new Container();
    this.container.eventMode = 'static';
    this.container.hitArea = new Rectangle(0, 0, width, height);
    this.scrollContainer = new Container();
    this.container.addChild(this.scrollContainer);

    const mask = new Graphics();
    mask.rect(0, 0, width, height).fill(0xffffff); 
    this.container.addChild(mask);
    this.scrollContainer.mask = mask;

    this.build();
    this.setupInteractivity();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    EventBus.on(Events.GOLD_CHANGED, () => this.updateButtons());
    EventBus.on(Events.HERO_BOUGHT, (idx: unknown) => { 
        const i = idx as number;
        this.updateCard(i);
        if (i + 1 < this.cards.length) this.updateCard(i + 1);
        this.updateButtons();
    });
    EventBus.on(Events.ASCENSION_COMPLETE, () => this.build());
    EventBus.on(Events.BOSS_SPAWNED, () => this.refresh()); 
    EventBus.on(Events.ENEMY_DIED, (_g, isB) => { if (isB) this.refresh(); });
  }

  public refresh(): void {
    this.cards.forEach((_, i) => this.updateCard(i));
    this.updateButtons();
  }

  private build(): void {
    this.cards = [];
    this.scrollContainer.removeChildren();

    for (let i = 0; i < HERO_DATA.length; i++) {
        const cardCont = new Container();
        cardCont.x = PADDING;
        cardCont.y = PADDING + i * (CARD_HEIGHT + PADDING);
        cardCont.eventMode = 'static';
        cardCont.cursor = 'pointer';

        const cardBg = new Graphics();
        cardCont.addChild(cardBg);
        
        const sc = new Container();
        const m = new Graphics();
        m.roundRect(0, 0, this.panelW - PADDING * 2, CARD_HEIGHT, 12).fill(0xffffff);
        sc.mask = m;
        cardCont.addChild(m);
        cardCont.addChild(sc);

        const nT = new Text({ text: '', style: createTextStyle({ fontSize: 24, fill: 0xffffff, fontWeight: '900', padding: 8 }), resolution: 1.5 });
        nT.x = 20; nT.y = 15;
        cardCont.addChild(nT);
        const lT = new Text({ text: '', style: createTextStyle({ fontSize: 14, fill: 0x999999, padding: 4 }), resolution: 1.5 });
        lT.y = 22; cardCont.addChild(lT);
        const dT = new Text({ text: '', style: createTextStyle({ fontSize: 14, fill: 0x4a9eff, padding: 4 }), resolution: 1.5 });
        dT.y = 22; cardCont.addChild(dT);

        const actionGroup = new Container();
        actionGroup.x = this.panelW - PADDING * 2 - BTN_WIDTH - 15;
        actionGroup.y = CARD_HEIGHT - BTN_HEIGHT - 15;
        cardCont.addChild(actionGroup);

        const buyBtn = new Graphics();
        buyBtn.eventMode = 'none';
        actionGroup.addChild(buyBtn);

        const cT = new Text({ text: '', style: createTextStyle({ fontSize: 17, fill: 0xffffff, padding: 4 }), resolution: 1.5 });
        cT.anchor.set(0.5);
        cT.x = BTN_WIDTH / 2; cT.y = BTN_HEIGHT / 2;
        actionGroup.addChild(cT);

        const idx = i;
        cardCont.on('pointerdown', () => { 
            const card = this.cards[idx];
            card.isPressed = true;
            this.updateCard(idx);
            HeroManager.buyHero(idx); 
        });
        const resetS = () => {
            const card = this.cards[idx];
            if (card) {
                card.isPressed = false;
                this.updateCard(idx);
            }
        };
        cardCont.on('pointerup', resetS);
        cardCont.on('pointerupoutside', resetS);

        cardCont.on('pointerover', () => { this.hoverIdx = idx; this.updateCard(idx); });
        cardCont.on('pointerout', () => { this.hoverIdx = -1; this.updateCard(idx); });

        this.scrollContainer.addChild(cardCont);
        this.cards.push({ 
            container: cardCont, bg: cardBg, nameText: nT, levelText: lT, dpsText: dT, 
            costText: cT, buyBtn, actionGroup, iconContainer: sc,
            isPressed: false
        });
        this.updateCard(i);
    }
    this.maxScroll = Math.max(0, PADDING + this.cards.length * (CARD_HEIGHT + PADDING) - this.panelH);
    this.clampScroll();
    this.updateButtons();
  }

  private updateCard(i: number): void {
    const card = this.cards[i];
    const hero = HERO_DATA[i];
    const state = GameState.heroes[i];
    const isUnlocked = state.isUnlocked;
    const isNext = i === GameState.heroes.reduce((max, h, idx) => h.isUnlocked ? idx : max, 0) + 1;
    const isHovered = this.hoverIdx === i;

    card.bg.clear();
    card.bg.roundRect(0, 0, this.panelW - 20, CARD_HEIGHT, 12);
    if (isUnlocked) {
        card.bg.fill(0x1a2433);
        const sColor = card.isPressed ? 0xffffff : (isHovered ? 0x4a9eff : 0x3d4a60);
        const sWidth = (card.isPressed || isHovered) ? 2 : 1.5;
        card.bg.stroke({ color: sColor, width: sWidth, alpha: isHovered ? 1.0 : 0.8 });
    } else if (isNext) {
        card.bg.fill(0x0c131d); 
        // Pulsing border for NEXT hero is handled in updatePulse()
    } else {
        card.bg.fill(0x02050a);
        
        // Add diagonal stripes pattern to locked cards
        const stripeSpacing = 20;
        const cardW = this.panelW - 20;
        for (let x = -CARD_HEIGHT; x < cardW; x += stripeSpacing) {
            card.bg.moveTo(x, 0);
            card.bg.lineTo(x + CARD_HEIGHT, CARD_HEIGHT);
            card.bg.stroke({ color: 0xffffff, width: 1, alpha: 0.03 });
        }
    }

    const bgC = card.iconContainer;
    if (bgC.children.length === 0) {
        const sprOrTxt = hero.image ? Sprite.from(hero.image) : new Text({ text: hero.emoji, style: createTextStyle({ fontSize: 70 }) });
        (sprOrTxt as any).anchor?.set(0.5); (sprOrTxt as any).x = this.panelW - 130; 
        (sprOrTxt as any).y = CARD_HEIGHT / 2;
        (sprOrTxt as any).rotation = -Math.PI / 2; (sprOrTxt as any).alpha = hero.image ? 0.20 : 0.10;
        if(hero.image) (sprOrTxt as Sprite).scale.set(0.6); 
        bgC.addChild(sprOrTxt);
    }
    bgC.children[0].visible = true; // Always show silhouette for discovery
    bgC.children[0].alpha = isUnlocked ? (hero.image ? 0.20 : 0.10) : (isNext ? 0.06 : 0.03);
    if (!isUnlocked) (bgC.children[0] as any).tint = 0x000000; // Silhouette effect
    else (bgC.children[0] as any).tint = 0xffffff;

    card.nameText.text = isUnlocked ? hero.name : `REQUIS : ZONE ${hero.unlockZone} 🔒`;
    card.nameText.style.fill = isUnlocked ? 0xffffff : (isNext ? 0x4a9eff : 0x2c3e50);
    card.nameText.style.fontSize = isUnlocked ? 24 : 16;

    if (isUnlocked) {
        card.levelText.visible = true; card.levelText.text = `LVL ${state.level}`;
        card.levelText.x = card.nameText.x + card.nameText.width + 12;
        card.dpsText.visible = true;
        card.dpsText.text = i === 0 ? `Clic: +${state.level}` : `DPS: +${formatDPS(HeroManager.getHeroDPS(i))}`;
        card.dpsText.x = this.panelW - 35; card.dpsText.anchor.set(1, 0); 
    } else { card.levelText.visible = false; card.dpsText.visible = false; }

    const canBuy = HeroManager.canBuyHero(i);
    card.actionGroup.visible = isUnlocked;
    
    if (isUnlocked) {
        if (canBuy) {
            card.costText.text = `${formatGold(HeroManager.getHeroCost(i))}💰`;
            card.costText.style.fill = 0xffffff;
        } else {
            card.costText.text = `ACHÈTE LE PRÉCÉDENT`;
            card.costText.style.fill = 0xffaaaa;
            card.costText.style.fontSize = 12;
        }
        this.updateButtonGraphics(i);
    }
  }

  private updateButtonGraphics(i: number): void {
    const card = this.cards[i];
    const cost = HeroManager.getHeroCost(i);
    const canAfford = GameState.gold.gte(cost);
    const canBuy = HeroManager.canBuyHero(i);
    
    card.buyBtn.clear().roundRect(0, 0, BTN_WIDTH, BTN_HEIGHT, 12);
    
    if (!canBuy) {
        card.buyBtn.fill(0x1a1a1a); // Very dark gray for locked dependency
        card.buyBtn.stroke({ color: 0x444444, width: 1.5, alpha: 0.5 });
    } else if (canAfford) {
        card.buyBtn.fill(0x2d5a27);
        card.buyBtn.stroke({ color: 0x44ff88, width: 2, alpha: 0.8 });
    } else {
        card.buyBtn.fill(0x2a3544);
        card.buyBtn.stroke({ color: 0xffffff, width: 1, alpha: 0.2 });
    }
  }

  private updateButtons(): void {
    for (let i = 0; i < this.cards.length; i++) {
        const card = this.cards[i];
        if (card.actionGroup.visible) {
            this.updateButtonGraphics(i);
        }
    }
  }

  private setupInteractivity(): void {
    this.container.on('pointerdown', (e) => { this.dragging = true; this.lastY = e.global.y; });
    window.addEventListener('pointermove', (e) => {
        if (!this.dragging) return;
        this.scrollY += (e.clientY - this.lastY) * 1.6;
        this.lastY = e.clientY; this.clampScroll();
    });
    window.addEventListener('pointerup', () => { this.dragging = false; });
    this.container.on('wheel', (e) => { this.scrollY -= e.deltaY; this.clampScroll(); });
  }
  private dragging = false; private lastY = 0;
  private clampScroll(): void {
    this.scrollY = Math.min(0, Math.max(this.scrollY, -this.maxScroll));
    this.scrollContainer.y = Math.floor(this.scrollY);
  }

  public update(delta: number): void {
    this.pulseTimer += delta;
    this.updatePulse();
  }

  private updatePulse(): void {
    const nextIdx = GameState.heroes.findIndex(h => !h.isUnlocked);
    if (nextIdx === -1 || nextIdx >= this.cards.length) return;

    const card = this.cards[nextIdx];
    const isHovered = this.hoverIdx === nextIdx;
    
    // Only redraw the pulse border for the ONE "Next" card
    const pulse = (Math.sin(this.pulseTimer * 4) + 1) / 2; // 0 to 1
    const color = isHovered ? 0x4a9eff : 0x1e3a5f;
    const alpha = 0.3 + pulse * 0.7;

    card.bg.clear();
    card.bg.roundRect(0, 0, this.panelW - 20, CARD_HEIGHT, 12).fill(isHovered ? 0x121c2b : 0x0c131d);
    card.bg.stroke({ color: color, width: 2.5, alpha: alpha });
  }
}
