/**
 * Type definitions for emoji-banner-generator
 */

/**
 * Bitmap representation - 2D array of boolean values
 * true = foreground (character pixel), false = background
 */
export type Bitmap = boolean[][];

/**
 * Emoji selection mode when multiple emojis are provided
 */
export type EmojiMode =
  | 'random'           // Random emoji for each dot
  | 'row'              // Different emoji per row
  | 'column'           // Different emoji per column
  | 'row-gradient'     // Gradient across rows
  | 'column-gradient'; // Gradient across columns

/**
 * Output format options
 */
export type OutputFormat = 'text' | 'slack';

/**
 * Theme options
 */
export type Theme = 'default' | 'github';

/**
 * CLI options parsed from command line arguments
 */
export interface CLIOptions {
  /** Text to convert (positional argument or from file) */
  text?: string;
  /** Input file path to read text from */
  file?: string;
  /** Emoji(s) to use for foreground - can be comma-separated */
  emoji: string;
  /** Emoji to use for background (default: space) */
  background?: string;
  /** Copy result to clipboard */
  copy?: boolean;
  /** Output format */
  format?: OutputFormat;
  /** Theme to use */
  theme?: Theme;
  /** Emoji selection mode */
  mode?: EmojiMode;
  /** Font to use for text rendering */
  font?: string;
  /** Render text vertically (one character per line) */
  vertical?: boolean;
  /** Border option (boolean to use background, or emoji string) */
  border?: boolean | string;
}

/**
 * Rendered banner result
 */
export interface BannerResult {
  /** The rendered text with emojis */
  text: string;
  /** Background emoji used */
  backgroundEmoji: string;
  /** Border emoji used (if any) */
  borderEmoji?: string;
  /** The bitmap data */
  bitmap: Bitmap;
  /** Width of the banner in characters */
  width: number;
  /** Height of the banner in characters */
  height: number;
}

/**
 * Slack Block Kit message structure
 */
export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  elements?: Array<{
    type: string;
    text: string;
    emoji?: boolean;
  }>;
}

/**
 * Slack Block Kit message format
 */
export interface SlackMessage {
  blocks: SlackBlock[];
}

/**
 * GitHub theme color levels (0-4, like contribution graph)
 */
export type GitHubLevel = 0 | 1 | 2 | 3 | 4;

/**
 * Configuration for rendering
 */
export interface RenderConfig {
  /** Emojis for foreground */
  foregroundEmojis: string[];
  /** Emoji for background */
  backgroundEmoji: string;
  /** Emoji for border (if provided) */
  borderEmoji?: string;
  /** Emoji selection mode */
  mode: EmojiMode;
  /** Theme to apply */
  theme: Theme;
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  /** Speed in milliseconds per frame */
  speed: number;
  /** Terminal width */
  terminalWidth: number;
}
