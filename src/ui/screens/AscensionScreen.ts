import { Container, Graphics, Text, Rectangle } from 'pixi.js';
import { createTextStyle } from '../styles/Typography';
import { AscensionManager } from '../../core/AscensionManager';
import { GameState } from '../../core/GameState';
import { EnemyManager } from '../../core/EnemyManager';
import { ASCENSION_UPGRADES, AscensionBranch } from '../../config/AscensionData';
import { EventBus, Events } from '../../systems/EventBus';
import { formatGold } from '../../systems/NumberFormatter';

const BRANCH_COLORS: Record<AscensionBranch, number> = {
  sigma: 0x9b59b6,
  grind: 0xf39c12,
  speed: 0x3498db,
  crit: 0xe74c3c,
  chaos: 0x1abc9c,
};

const BRANCH_LABELS: Record<AscensionBranch, string> = {
  sigma: '💪 Sigma Path',
  grind: '💰 Grind Path',
  speed: '⚡ Speed Path',
  crit: '🎯 Crit Path',
  chaos: '🌀 Chaos Path',
};

const BRANCH_ICONS: Record<AscensionBranch, string> = {
  sigma: '💪',
  grind: '💰',
  speed: '⚡',
  crit: '🎯',
  chaos: '🌀',
};

const CARD_HEIGHT = 140;
const PADDING = 8;
const BTN_WIDTH = 110;
const BTN_HEIGHT = 34;

interface AscensionCard {
  container: Container;
  bg: Graphics;
  nameText: Text;
  descText: Text;
  costText: Text;
  levelText: Text;
  buyBtn: Graphics;
  iconText: Text;
  isPressed: boolean;
  upgradeId: string;
}

export class AscensionScreen {
  container: Container;
  private scrollContainer: Container;
  private maskGraphic: Graphics;
  private panelW: number;
  private panelH: number;
  private scrollY: number = 0;
  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private dragStartScrollY: number = 0;
  private totalContentH: number = 0;
  private cards: AscensionCard[] = [];
  private hoverId: string | null = null;
  private soulsText!: Text;
  private reqText!: Text;
  private ascendBtn!: Graphics;
  private ascendBtnText!: Text;

  constructor(width: number, height: number) {
    this.panelW = width;
    this.panelH = height;
    this.container = new Container();

    const bg = new Graphics();
    bg.rect(0, 0, width, height).fill(0x0d1b2a);
    this.container.addChild(bg);

    this.scrollContainer = new Container();
    this.container.addChild(this.scrollContainer);

    this.maskGraphic = new Graphics();
    this.maskGraphic.rect(0, 0, width, height).fill(0xffffff);
    this.container.addChild(this.maskGraphic);
    this.scrollContainer.mask = this.maskGraphic;

    this.setupScroll();
    this.build();

    EventBus.on(Events.ASCENSION_COMPLETE, () => this.build());
    EventBus.on(Events.ZONE_CHANGED, () => this.refreshHeader());
  }

  private setupScroll(): void {
    this.container.eventMode = 'static';
    this.container.hitArea = new Rectangle(0, 0, this.panelW, this.panelH);
    this.container.on('pointerdown', (e) => {
      this.isDragging = true;
      this.dragStartY = e.global.y;
      this.dragStartScrollY = this.scrollY;
    });
    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      const dy = e.clientY - this.dragStartY;
      this.setScrollY(this.dragStartScrollY + dy);
    });
    window.addEventListener('pointerup', () => { this.isDragging = false; });
    this.container.on('wheel', (e) => {
      this.setScrollY(this.scrollY - (e as WheelEvent).deltaY * 0.5);
    });
  }

  private setScrollY(y: number): void {
    const maxScroll = Math.max(0, this.totalContentH - this.panelH);
    this.scrollY = Math.max(-maxScroll, Math.min(0, y));
    this.scrollContainer.y = this.scrollY;
  }

  private build(): void {
    this.scrollContainer.removeChildren();
    this.cards = [];
    let yOffset = 10;

    // Header: Sigma Souls
    const soulsStyle = createTextStyle({ fontSize: 20, fill: 0xc39ef8, fontWeight: '800' });
    this.soulsText = new Text({
      text: `🌀 Sigma Souls: ${GameState.sigmaSouls}`,
      style: soulsStyle,
      resolution: window.devicePixelRatio || 2,
    });
    this.soulsText.x = 20;
    this.soulsText.y = yOffset;
    this.scrollContainer.addChild(this.soulsText);

    this.reqText = new Text({
      text: '',
      style: createTextStyle({ fontSize: 14, fill: 0xff8844 }),
      resolution: window.devicePixelRatio || 2,
    });
    this.reqText.anchor.set(1, 0.5); 
    this.reqText.x = this.panelW - 20;
    this.reqText.y = yOffset + this.soulsText.height / 2;
    this.scrollContainer.addChild(this.reqText);
    
    yOffset += 45;

    // Ascend button
    this.ascendBtn = new Graphics();
    this.ascendBtn.y = yOffset;
    this.scrollContainer.addChild(this.ascendBtn);

    this.ascendBtnText = new Text({
      text: '',
      style: createTextStyle({ fontSize: 18, fill: 0xffffff, fontWeight: '800' }),
      resolution: window.devicePixelRatio || 2,
    });
    this.ascendBtnText.anchor.set(0.5);
    this.ascendBtnText.x = this.panelW / 2;
    this.ascendBtnText.y = yOffset + 30;
    this.scrollContainer.addChild(this.ascendBtnText);

    this.ascendBtn.eventMode = 'static';
    this.ascendBtn.cursor = 'pointer';
    this.ascendBtn.on('pointerdown', () => {
      if (AscensionManager.canAscend()) {
        if (AscensionManager.ascend()) {
          EnemyManager.initialSpawn();
          this.build();
        }
      }
    });

    this.refreshHeader();
    yOffset += 80;

    const branches: AscensionBranch[] = ['sigma', 'grind', 'speed', 'crit', 'chaos'];
    const cardW = (this.panelW - PADDING * 3) / 2;

    for (const branch of branches) {
      const branchUpgrades = ASCENSION_UPGRADES.filter(u => u.branch === branch);

      const branchLabel = new Text({
        text: BRANCH_LABELS[branch],
        style: createTextStyle({ fontSize: 20, fill: BRANCH_COLORS[branch], fontWeight: '900' }),
        resolution: window.devicePixelRatio || 2,
      });
      branchLabel.x = 15;
      branchLabel.y = yOffset;
      this.scrollContainer.addChild(branchLabel);
      yOffset += 32;

      branchUpgrades.forEach((upg, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);

        const cardCont = new Container();
        cardCont.x = PADDING + col * (cardW + PADDING);
        cardCont.y = yOffset + row * (CARD_HEIGHT + PADDING);
        cardCont.eventMode = 'static';
        cardCont.cursor = 'pointer';

        const bg = new Graphics();
        cardCont.addChild(bg);
        
        // Icon Background
        const iconContainer = new Container();
        const iconMask = new Graphics();
        iconMask.roundRect(0, 0, cardW, CARD_HEIGHT, 10).fill(0xffffff);
        iconContainer.mask = iconMask;
        cardCont.addChild(iconMask);
        cardCont.addChild(iconContainer);

        const iconText = new Text({
          text: BRANCH_ICONS[upg.branch],
          style: createTextStyle({ fontSize: 60, fill: 0xffffff }),
          resolution: window.devicePixelRatio || 2,
        });
        iconText.anchor.set(0.5);
        iconText.x = cardW * 0.85;
        iconText.y = CARD_HEIGHT * 0.25;
        iconText.rotation = -Math.PI / 10;
        iconText.alpha = 0.08;
        iconContainer.addChild(iconText);

        const nameT = new Text({ text: '', style: createTextStyle({ fontSize: 16, fill: 0xffffff, fontWeight: '900' }), resolution: 1.5 });
        nameT.x = 12; nameT.y = 12;
        cardCont.addChild(nameT);

        const levelT = new Text({ text: '', style: createTextStyle({ fontSize: 11, fill: 0x999999 }), resolution: 1.5 });
        levelT.x = 12; levelT.y = 32;
        cardCont.addChild(levelT);

        const descT = new Text({ 
          text: upg.description, 
          style: createTextStyle({ fontSize: 11, fill: 0x8899aa, wordWrap: true, wordWrapWidth: cardW - 24 }), 
          resolution: 1.5 
        });
        descT.x = 12; descT.y = 52;
        cardCont.addChild(descT);

        const buyBtn = new Graphics();
        buyBtn.x = (cardW - BTN_WIDTH) / 2;
        buyBtn.y = CARD_HEIGHT - BTN_HEIGHT - 10;
        buyBtn.eventMode = 'none';
        cardCont.addChild(buyBtn);

        const costT = new Text({ text: '', style: createTextStyle({ fontSize: 14, fill: 0xffffff }), resolution: 1.5 });
        costT.anchor.set(0.5);
        costT.x = buyBtn.x + BTN_WIDTH / 2; 
        costT.y = buyBtn.y + BTN_HEIGHT / 2;
        cardCont.addChild(costT);

        const cardObj: AscensionCard = {
          container: cardCont, bg, nameText: nameT, descText: descT,
          costText: costT, levelText: levelT, buyBtn, iconText,
          isPressed: false, upgradeId: upg.id
        };

        const currentUpgId = upg.id;
        cardCont.on('pointerdown', () => {
          cardObj.isPressed = true;
          this.updateCard(cardObj);
          if (AscensionManager.buyUpgrade(currentUpgId)) {
            this.updateHeader();
            this.cards.forEach((c: AscensionCard) => this.updateCard(c));
          }
        });

        const resetPress = () => {
          cardObj.isPressed = false;
          this.updateCard(cardObj);
        };
        cardCont.on('pointerup', resetPress);
        cardCont.on('pointerupoutside', resetPress);
        cardCont.on('pointerover', () => { this.hoverId = upg.id; this.updateCard(cardObj); });
        cardCont.on('pointerout', () => { this.hoverId = null; this.updateCard(cardObj); });

        this.scrollContainer.addChild(cardCont);
        this.cards.push(cardObj);
        this.updateCard(cardObj);
      });
      
      const rows = Math.ceil(branchUpgrades.length / 2);
      yOffset += rows * (CARD_HEIGHT + PADDING) + 20;
    }

    this.totalContentH = yOffset + 30;
  }

  private updateCard(card: AscensionCard): void {
    const upg = ASCENSION_UPGRADES.find(u => u.id === card.upgradeId)!;
    const level = AscensionManager.getUpgradeLevel(upg.id);
    const cost = Math.floor(upg.cost * Math.pow(2, level));
    const canAfford = GameState.sigmaSouls >= cost;
    const isHovered = this.hoverId === upg.id;
    const maxed = upg.maxLevel !== undefined && level >= upg.maxLevel;

    const cardW = (this.panelW - PADDING * 3) / 2;
    // Background & Stroke
    card.bg.clear().roundRect(0, 0, cardW, CARD_HEIGHT, 10);
    card.bg.fill(0x1a2433);
    const sColor = card.isPressed ? 0xffffff : (isHovered ? BRANCH_COLORS[upg.branch] : 0x3d4a60);
    const sWidth = (card.isPressed || isHovered) ? 2 : 1;
    card.bg.stroke({ color: sColor, width: sWidth, alpha: isHovered ? 1.0 : 0.4 });

    // Texts
    card.nameText.text = upg.name;
    card.levelText.text = upg.maxLevel !== undefined ? `${level}/${upg.maxLevel}` : `Niveau ${level}`;
    card.levelText.y = 30; // Positioned under name
    
    // Icon Highlight
    card.iconText.alpha = isHovered ? 0.15 : 0.08;
    card.iconText.style.fill = isHovered ? BRANCH_COLORS[upg.branch] : 0xffffff;

    // Button
    card.buyBtn.clear().roundRect(0, 0, BTN_WIDTH, BTN_HEIGHT, 10);
    if (maxed) {
      card.buyBtn.fill(0x1a1a1a).stroke({ color: 0x444444, width: 1 });
      card.costText.text = 'MAX';
      card.costText.style.fill = 0x666666;
    } else if (canAfford) {
      card.buyBtn.fill(0x2d5a27).stroke({ color: 0x44ff88, width: 2, alpha: 0.8 });
      card.costText.text = `${cost}🌀`;
      card.costText.style.fill = 0xffffff;
    } else {
      card.buyBtn.fill(0x2a3544).stroke({ color: 0xffffff, width: 1, alpha: 0.2 });
      card.costText.text = `${cost}🌀`;
      card.costText.style.fill = 0x8899aa;
    }
  }

  private updateHeader(): void {
    this.cards.forEach((c: AscensionCard) => this.updateCard(c));
    this.refreshHeader();
  }

  private refreshHeader(): void {
    const pendingSouls = AscensionManager.getSigmaSoulsReward();
    const canAscend = AscensionManager.canAscend();
    const milestoneTarget = (Math.floor(GameState.highestZoneAscended / 10) + 1) * 10;

    this.soulsText.text = `🌀 Sigma Souls: ${GameState.sigmaSouls}`;
    
    this.reqText.text = canAscend ? `✅ Milestone: BEATEN` : `🔒 Goal: Reach Zone ${milestoneTarget + 1}`;
    this.reqText.style.fill = canAscend ? 0x44ff88 : 0xff8844;

    this.ascendBtn.clear().roundRect(20, 0, this.panelW - 40, 60, 12);
    this.ascendBtn.fill(canAscend ? 0x6a35c8 : 0x2a2a3a);
    this.ascendBtn.stroke({ width: 2, color: canAscend ? 0x9b59b6 : 0x3a3a4a });

    this.ascendBtnText.text = `🌀 ASCEND (+${pendingSouls} Sigma Souls)`;
    this.ascendBtnText.style.fill = canAscend ? 0xffffff : 0x555566;
  }

  update(_deltaSeconds: number): void {
    // No pulse yet, but icon animation could go here
  }
}
