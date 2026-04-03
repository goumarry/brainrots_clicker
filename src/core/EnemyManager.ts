import { Decimal, toBigNum } from '../systems/BigNumber';
import { GameState } from './GameState';
import { EventBus, Events } from '../systems/EventBus';
import { BalanceConfig } from '../config/BalanceConfig';
import { HERO_DATA } from '../config/HeroData';
import { GoldManager } from './GoldManager';
import { ZoneManager } from './ZoneManager';
import { RelicManager } from './RelicManager';
import { AchievementManager } from './AchievementManager';
import { HeroManager } from './HeroManager';
import { AudioManager } from '../systems/AudioManager';
import { CrazyGamesSDK } from '../integrations/CrazyGamesSDK';

const ENEMY_NAMES_BY_ZONE: string[][] = [
  ['Slime', 'Grug', 'Doofy', 'Npc'],
  ['Reddit Mod', 'Sigma Pretender', 'Cringe Bot', 'NPC Army'],
  ['Beta Karen', 'Boomer', 'Zoomer Hater', 'Cap Lord'],
  ['Normie Boss', 'Anti-Rizz', 'Vibe Killer', 'Ratio Machine'],
  ['No Cap Demon', 'Sussy Baka', 'Chad Impostor', 'Drip Drain'],
  ['Brainrot Bandit', 'Skibidi Minion', 'Ohio Outcast', 'Mewing Fail'],
  ['L+Bozo Beast', 'Ratio Reptile', 'W-Less Warrior', 'Touch Grass Troll'],
  ['Gyatt Goblin', 'Rizz Robber', 'Aura Attacker', 'Fanum Tax Fiend'],
  ['Delulu Dragon', 'No-Rizz Necro', 'Cap Creature', 'Ohio Overlord'],
  ['Final Normie', 'Ultimate Bozo', 'Supreme NPC', 'Endgame Karen'],
];

const BOSS_NAMES = [
  'Mega Cringe Lord',
  'Super NPC King',
  'Hyper Boomer Beast',
  'Ultra Ratio Master',
  'Ohio Destroyer',
  'Gigachad Imposter',
  'Sigma Pretender Prime',
  'Rizz Vampire Lord',
  'Skibidi Titan',
  'FINAL OHIO BOSS',
];

function getEnemyName(zone: number, isBoss: boolean): string {
  if (isBoss) {
    // Special Brainrot Bosses at Zone 1 and every 10 zones (10, 20, 30...)
    if (zone === 1 || zone % 10 === 0) {
      const heroIndex = zone === 1 ? 1 : (zone / 10) + 1;
      if (HERO_DATA[heroIndex]) {
        return HERO_DATA[heroIndex].name;
      }
    }
    const bossIndex = Math.floor((zone - 1) / BalanceConfig.BOSS_ZONE_INTERVAL);
    return BOSS_NAMES[Math.min(bossIndex, BOSS_NAMES.length - 1)];
  }
  const tier = Math.floor((zone - 1) / 5);
  const names = ENEMY_NAMES_BY_ZONE[Math.min(tier, ENEMY_NAMES_BY_ZONE.length - 1)];
  return names[Math.floor(Math.random() * names.length)];
}

export const EnemyManager = {
  spawnEnemy(): void {
    const zone = GameState.zone;
    // Zone 1 is a Boss Zone (at mob 10), then every 5 zones as before
    const isBossZone = zone === 1 || zone % BalanceConfig.BOSS_ZONE_INTERVAL === 0;
    const isBoss = isBossZone && GameState.enemyKillCount >= BalanceConfig.ENEMIES_PER_ZONE;
    const maxHP = isBoss
      ? BalanceConfig.bossHP(zone - 1)
      : BalanceConfig.enemyHP(zone - 1);

    GameState.currentEnemy = {
      name: getEnemyName(zone, isBoss),
      currentHP: maxHP,
      maxHP,
      isBoss,
      killCount: 0,
    };

    if (isBoss) {
      GameState.bossTimerActive = true;
      GameState.bossTimeRemaining = BalanceConfig.BOSS_TIMER_SECONDS;
      EventBus.emit(Events.BOSS_SPAWNED, GameState.currentEnemy);
    } else {
      EventBus.emit(Events.ENEMY_SPAWNED, GameState.currentEnemy);
    }
  },

  dealDamage(amount: Decimal): void {
    const enemy = GameState.currentEnemy;
    // Clamp damage so HP doesn't go negative
    const actualDamage = Decimal.min(amount, enemy.currentHP);
    enemy.currentHP = enemy.currentHP.sub(actualDamage);

    EventBus.emit(Events.ENEMY_DAMAGED, amount, enemy.currentHP, enemy.maxHP);

    if (enemy.currentHP.lte(0)) {
      EnemyManager.killEnemy();
    }
  },

  killEnemy(): void {
    const enemy = GameState.currentEnemy;
    const isBoss = enemy.isBoss;
    const zone = GameState.zone;

    // Track stats
    GameState.stats.totalKills += 1;
    if (isBoss) GameState.stats.bossKills += 1;
    if (GameState.zone > GameState.stats.maxZoneReached) {
      GameState.stats.maxZoneReached = GameState.zone;
    }

    const goldEarned = GoldManager.awardKillGold(zone, isBoss);
    EventBus.emit(Events.ENEMY_DIED, goldEarned, isBoss);

    AudioManager.playDeathSound();

    // Relic drop
    RelicManager.tryDropRelic(isBoss);

    // Check achievements
    AchievementManager.checkAll();

    if (isBoss) {
      GameState.bossTimerActive = false;
      GameState.bossTimeRemaining = 0;
      GameState.enemyKillCount = 0;

      // Unlock new hero if it's Zone 1 or a deca-zone (10, 20, 30...)
      if (zone === 1 || zone % 10 === 0) {
        const heroIndex = zone === 1 ? 1 : (zone / 10) + 1;
        HeroManager.unlockHero(heroIndex);
      }

      CrazyGamesSDK.happyTime();
      ZoneManager.advanceZone();
    } else {
      GameState.enemyKillCount += 1;
      EnemyManager.checkBossSpawn();
    }
  },

  checkBossSpawn(): void {
    const zone = GameState.zone;
    const isBossZone = zone === 1 || zone % BalanceConfig.BOSS_ZONE_INTERVAL === 0;

    if (GameState.enemyKillCount >= BalanceConfig.ENEMIES_PER_ZONE) {
      if (isBossZone) {
        // Spawn boss
        const maxHP = BalanceConfig.bossHP(zone - 1);
        GameState.currentEnemy = {
          name: getEnemyName(zone, true),
          currentHP: maxHP,
          maxHP,
          isBoss: true,
          killCount: GameState.enemyKillCount,
        };
        GameState.bossTimerActive = true;
        GameState.bossTimeRemaining = BalanceConfig.BOSS_TIMER_SECONDS;
        EventBus.emit(Events.BOSS_SPAWNED, GameState.currentEnemy);
      } else {
        // Non-boss zone complete → advance to next zone
        ZoneManager.advanceZone();
      }
    } else {
      EnemyManager.spawnNextNormal();
    }
  },

  spawnNextNormal(): void {
    const zone = GameState.zone;
    const maxHP = BalanceConfig.enemyHP(zone - 1);
    const name = getEnemyName(zone, false);

    GameState.currentEnemy = {
      name,
      currentHP: maxHP,
      maxHP,
      isBoss: false,
      killCount: GameState.enemyKillCount,
    };

    EventBus.emit(Events.ENEMY_SPAWNED, GameState.currentEnemy);
  },

  bossTimerTick(deltaSeconds: number): void {
    if (!GameState.bossTimerActive) return;

    GameState.bossTimeRemaining -= deltaSeconds;

    if (GameState.bossTimeRemaining <= 0) {
      GameState.bossTimerActive = false;
      GameState.bossTimeRemaining = 0;
      EventBus.emit(Events.BOSS_TIMER_EXPIRED);
      ZoneManager.retreatZone();
    }
  },

  initialSpawn(): void {
    const zone = GameState.zone;
    const maxHP = BalanceConfig.enemyHP(zone - 1);
    const name = getEnemyName(zone, false);

    GameState.currentEnemy = {
      name,
      currentHP: maxHP,
      maxHP,
      isBoss: false,
      killCount: 0,
    };

    EventBus.emit(Events.ENEMY_SPAWNED, GameState.currentEnemy);
  },
};
