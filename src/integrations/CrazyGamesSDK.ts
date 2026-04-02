// Type declarations for the CrazyGames SDK v3 loaded via CDN
declare global {
  interface Window {
    CrazyGames?: {
      SDK: {
        init(): Promise<void>;
        game: {
          sdkGameLoadingStart?(): void;
          sdkGameLoadingStop?(): void;
          gameLoadingStart?(): void;
          gameLoadingStop?(): void;
          gameplayStart(): void;
          gameplayStop(): void;
          happyTime(): void;
        };
        ad: {
          requestAd(type: 'rewarded' | 'midgame', callbacks: {
            adStarted?: () => void;
            adFinished?: () => void;
            adError?: (error: unknown) => void;
          }): void;
          hasAdblock(): Promise<boolean>;
        };
        user: {
          isUserAccountAvailable: boolean;
        };
      };
    };
  }
}

let sdkReady = false;
let gameplayStarted = false;

function safeCall(fn: (() => void) | undefined): void {
  try { fn?.(); } catch (e) { console.warn('[CrazyGames] SDK call failed:', e); }
}

export const CrazyGamesSDK = {
  async init(): Promise<void> {
    if (!window.CrazyGames?.SDK) {
      console.log('[CrazyGames] SDK not available (dev mode)');
      return;
    }
    try {
      await window.CrazyGames.SDK.init();
      sdkReady = true;
      console.log('[CrazyGames] SDK initialized');
    } catch (e) {
      console.warn('[CrazyGames] SDK init failed:', e);
    }
  },

  gameLoadingStart(): void {
    if (!sdkReady) return;
    const game = window.CrazyGames?.SDK?.game;
    try { game?.sdkGameLoadingStart?.() ?? game?.gameLoadingStart?.(); } catch (e) { /* noop */ }
  },

  gameLoadingStop(): void {
    if (!sdkReady) return;
    const game = window.CrazyGames?.SDK?.game;
    try { game?.sdkGameLoadingStop?.() ?? game?.gameLoadingStop?.(); } catch (e) { /* noop */ }
  },

  gameplayStart(): void {
    if (!sdkReady || gameplayStarted) return;
    try { window.CrazyGames?.SDK?.game?.gameplayStart?.(); } catch (e) { /* noop */ }
    gameplayStarted = true;
  },

  gameplayStop(): void {
    if (!sdkReady || !gameplayStarted) return;
    try { window.CrazyGames?.SDK?.game?.gameplayStop?.(); } catch (e) { /* noop */ }
    gameplayStarted = false;
  },

  happyTime(): void {
    if (!sdkReady) return;
    try { window.CrazyGames?.SDK?.game?.happyTime?.(); } catch (e) { /* noop */ }
  },

  requestRewardedAd(onFinished: () => void, onError?: () => void): void {
    if (!sdkReady) {
      // Dev mode: simulate ad with short delay
      setTimeout(onFinished, 500);
      return;
    }
    try {
      CrazyGamesSDK.gameplayStop();
      window.CrazyGames!.SDK.ad.requestAd('rewarded', {
        adStarted: () => {},
        adFinished: () => {
          CrazyGamesSDK.gameplayStart();
          onFinished();
        },
        adError: () => {
          CrazyGamesSDK.gameplayStart();
          onError?.();
        },
      });
    } catch (e) {
      console.warn('[CrazyGames] requestAd failed:', e);
      onError?.();
    }
  },
};
