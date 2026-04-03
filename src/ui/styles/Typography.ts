import { TextStyle, TextStyleOptions, Assets } from 'pixi.js';

/**
 * Single source of truth for the game's typography.
 * Prevents font regressions by enforcing 'Outfit' as the default font.
 */
export const GAME_FONT = 'Outfit';

/**
 * Explicitly register the custom font with PixiJS Asset Manager.
 * This ensures total font coverage in PixiJS v8.
 */
export function registerFonts(): void {
  Assets.add({
    alias: 'Outfit',
    src: 'https://fonts.googleapis.com/css2?family=Outfit:wght@800&display=swap',
  });
}

/**
 * Creates a standard game text style with default configurations.
 * Enforces 'Outfit' font and '800' weight (ExtraBold) to match Google Fonts.
 */
export function createTextStyle(options: Partial<TextStyleOptions> = {}): TextStyleOptions {
  return {
    fontFamily: GAME_FONT,
    fontWeight: '800',  // Match loaded Google Fonts (800)
    padding: 6,         // Prevent glyph cropping
    ...options
  };
}

/**
 * Standard text style presets to ensure UI consistency.
 */
export const Styles = {
  HEADER: createTextStyle({ fontSize: 24, fill: 0xffffff }),
  GOLD: createTextStyle({ fontSize: 24, fill: 0xffd700 }),
  SOULS: createTextStyle({ fontSize: 24, fill: 0xc39ef8 }),
  CARD_TITLE: createTextStyle({ fontSize: 22, fill: 0xffffff }),
  CARD_SUBTITLE: createTextStyle({ fontSize: 16, fill: 0x8899aa }),
  CARD_STAT: createTextStyle({ fontSize: 16, fill: 0x4a9eff }),
  BUTTON_LABEL: createTextStyle({ fontSize: 18, fill: 0xffffff }),
  EMOJI_LARGE: createTextStyle({ fontSize: 48, fontWeight: 'normal' }),
  EMOJI_MEDIUM: createTextStyle({ fontSize: 32, fontWeight: 'normal' }),
  EMOJI_SMALL: createTextStyle({ fontSize: 24, fontWeight: 'normal' }),
  TOOLTIP_TITLE: createTextStyle({ fontSize: 14, fill: 0xffffff }),
  TOOLTIP_BODY: createTextStyle({ fontSize: 12, fill: 0xcccccc, fontWeight: 'normal' }),
};
