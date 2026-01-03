/**
 * Renderer module
 * Converts bitmap to emoji text with various modes
 */

import type { Bitmap, EmojiMode, RenderConfig, BannerResult } from './types.js';
import { getBackgroundEmoji } from './emoji.js';
import { getThemeEmojis } from './themes.js';

// Minimal emoji / wide-char detection for width calculation
const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}]/u;
const EXTENDED_PICTO_REGEX = /\p{Extended_Pictographic}/u;
const WIDE_CHAR_REGEX = /[\u3000\u3001-\u303F\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/u;

type MinimalSegmenter = {
  segment: (value: string) => Iterable<{ segment: string }>;
};

function isLikelyCustomEmoji(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (EXTENDED_PICTO_REGEX.test(trimmed) || EMOJI_REGEX.test(trimmed) || WIDE_CHAR_REGEX.test(trimmed)) {
    return false;
  }
  // Treat colon-wrapped or simple alias-like tokens as custom emoji (Slack-style)
  return /^:?[a-zA-Z0-9_-]{1,64}:?$/.test(trimmed) && !/\s/.test(trimmed);
}

const graphemeSegmenter = (() => {
  try {
    if (
      typeof Intl !== 'undefined' &&
      typeof (Intl as { Segmenter?: new (locale: string, options: { granularity: 'grapheme' }) => MinimalSegmenter })
        .Segmenter === 'function'
    ) {
      return new (
        Intl as { Segmenter: new (locale: string, options: { granularity: 'grapheme' }) => MinimalSegmenter }
      ).Segmenter('en', { granularity: 'grapheme' });
    }
  } catch {
    // ignore
  }
  return null;
})();

function getGraphemes(str: string): string[] {
  if (graphemeSegmenter) {
    return Array.from(graphemeSegmenter.segment(str), (segment) => segment.segment);
  }
  return [...str];
}

/**
 * Seeded random number generator for reproducible results
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
}

/**
 * Approximate display width (emoji treated as double-width).
 */
function getDisplayWidth(str: string): number {
  if (isLikelyCustomEmoji(str)) {
    return 2;
  }
  let width = 0;
  for (const char of getGraphemes(str)) {
    if (char === '\u3000') {
      width += 2;
    } else if (EXTENDED_PICTO_REGEX.test(char) || EMOJI_REGEX.test(char) || WIDE_CHAR_REGEX.test(char)) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

/**
 * Pad a string with spaces until it reaches the target display width.
 */
function padToWidth(str: string, targetWidth: number): string {
  let result = str;
  let width = getDisplayWidth(str);

  while (width < targetWidth) {
    result += ' ';
    width += 1;
  }

  return result;
}

/**
 * Fit text to the target width, padding or replacing when too wide to keep the grid stable.
 */
function fitToWidth(str: string, targetWidth: number): string {
  const current = getDisplayWidth(str);
  if (current === targetWidth) return str;
  if (current < targetWidth) {
    return padToWidth(str, targetWidth);
  }
  // If wider, fall back to spaces to avoid breaking alignment.
  return padToWidth('', targetWidth);
}

/**
 * Select emoji based on mode, position, and available emojis
 */
function selectEmoji(
  emojis: string[],
  row: number,
  col: number,
  totalRows: number,
  totalCols: number,
  mode: EmojiMode,
  random: SeededRandom
): string {
  if (emojis.length === 1) {
    return emojis[0];
  }

  switch (mode) {
    case 'random':
      return emojis[random.nextInt(emojis.length)];

    case 'row':
      return emojis[row % emojis.length];

    case 'column':
      return emojis[col % emojis.length];

    case 'row-gradient': {
      // Gradient across rows - smoothly transition through emojis
      const rowProgress = totalRows > 1 ? row / (totalRows - 1) : 0;
      const emojiIndex = Math.floor(rowProgress * (emojis.length - 1));
      return emojis[Math.min(emojiIndex, emojis.length - 1)];
    }

    case 'column-gradient': {
      // Gradient across columns - smoothly transition through emojis
      const colProgress = totalCols > 1 ? col / (totalCols - 1) : 0;
      const emojiIndex = Math.floor(colProgress * (emojis.length - 1));
      return emojis[Math.min(emojiIndex, emojis.length - 1)];
    }

    default:
      return emojis[0];
  }
}

/**
 * Render bitmap to emoji text
 */
export function renderBitmap(
  bitmap: Bitmap,
  config: RenderConfig
): BannerResult {
  const { foregroundEmojis, backgroundEmoji, mode, theme } = config;

  // Get theme emojis if applicable
  const emojis = theme === 'github'
    ? getThemeEmojis('github')
    : foregroundEmojis;

  // Use background emoji or default
  const bgEmoji = backgroundEmoji || getBackgroundEmoji();

  // Normalize cell width so backgrounds and foregrounds align visually
  const sampleEmojis = theme === 'github' ? emojis : foregroundEmojis;
  const maxFgWidth = Math.max(...sampleEmojis.map(getDisplayWidth));
  // Anchor width to foreground so non-emoji backgrounds don't widen cells unexpectedly
  const cellWidth = Math.max(maxFgWidth, 2);
  const paddedBackground = fitToWidth(bgEmoji, cellWidth);

  const height = bitmap.length;
  const width = height > 0 ? bitmap[0].length : 0;

  const random = new SeededRandom(42); // Fixed seed for reproducibility

  const lines: string[] = [];

  for (let row = 0; row < height; row++) {
    let line = '';
    for (let col = 0; col < width; col++) {
      const isForeground = bitmap[row][col];
      if (isForeground) {
        const rawEmoji = theme === 'github'
          ? emojis[calculateGitHubIntensity(row, col, height, width, random)]
          : selectEmoji(emojis, row, col, height, width, mode, random);

        const paddedEmoji = fitToWidth(rawEmoji, cellWidth);

        if (theme === 'github') {
          // For GitHub theme, vary intensity based on position
          line += paddedEmoji;
        } else {
          line += paddedEmoji;
        }
      } else {
        line += paddedBackground;
      }
    }
    lines.push(line);
  }

  const text = lines.join('\n');

  return {
    text,
    backgroundEmoji: bgEmoji,
    bitmap,
    width,
    height,
  };
}

/**
 * Calculate GitHub contribution-style intensity (0-4)
 */
function calculateGitHubIntensity(
  row: number,
  col: number,
  totalRows: number,
  totalCols: number,
  random: SeededRandom
): number {
  // Create a somewhat random but clustered pattern
  // Similar to how GitHub contributions look
  const baseIntensity = random.next();
  
  // Add some spatial coherence
  const spatialNoise = Math.sin(row * 0.5) * Math.cos(col * 0.5) * 0.3;
  
  const combined = baseIntensity + spatialNoise;
  
  // Map to 0-4 range (GitHub has 5 levels including 0)
  // But we only use 1-4 for foreground (0 is background)
  if (combined < 0.25) return 1;
  if (combined < 0.5) return 2;
  if (combined < 0.75) return 3;
  return 4;
}

/**
 * Render bitmap with custom selector function
 */
export function renderBitmapCustom(
  bitmap: Bitmap,
  selector: (row: number, col: number, isForeground: boolean) => string
): string {
  const lines: string[] = [];

  for (let row = 0; row < bitmap.length; row++) {
    let line = '';
    for (let col = 0; col < bitmap[row].length; col++) {
      line += selector(row, col, bitmap[row][col]);
    }
    lines.push(line);
  }

  return lines.join('\n');
}

/**
 * Create default render config
 */
export function createDefaultConfig(
  foregroundEmojis: string[],
  backgroundEmoji?: string,
  mode: EmojiMode = 'random',
  theme: string = 'default'
): RenderConfig {
  return {
    foregroundEmojis,
    backgroundEmoji: backgroundEmoji || getBackgroundEmoji(),
    mode,
    theme: theme as RenderConfig['theme'],
  };
}
