/**
 * CLI module
 * Handles command line argument parsing
 */

import { Command } from 'commander';
import fs from 'fs/promises';
import type { CLIOptions, EmojiMode, OutputFormat, Theme } from './types.js';
import { DEFAULT_FONT_NAME } from './fonts.js';

/**
 * Valid emoji modes
 */
const VALID_MODES: EmojiMode[] = [
  'random',
  'row',
  'column',
  'row-gradient',
  'column-gradient',
];

/**
 * Valid output formats
 */
const VALID_FORMATS: OutputFormat[] = ['text', 'slack'];

/**
 * Valid themes
 */
const VALID_THEMES: Theme[] = ['default', 'github'];

/**
 * Create and configure the CLI program
 */
export function createCLI(): Command {
  const program = new Command();

  program
    .name('emoji-banner')
    .description(
      'Convert text to emoji banner art for CLI display\n\n' +
      'Examples:\n' +
      '  $ emoji-banner "Hello" -e 🔥\n' +
      '  $ emoji-banner "World" -e fire\n' +
      '  $ emoji-banner "Test" -e "🔥,⭐,💎" -m row-gradient\n' +
      '  $ emoji-banner "GitHub" --theme github\n' +
      '  $ emoji-banner "Slack" -e 🎉 --format slack'
    )
    .version('1.0.0')
    .argument('[text]', 'Text to convert to emoji banner')
    .option('-e, --emoji <emoji>', 'Emoji to use (can be emoji or alias, comma-separated for multiple)', '🔥')
    .option('-b, --background <emoji>', 'Background emoji (default: space)')
    .option('-f, --file <path>', 'Read text from file instead of argument')
    .option('-c, --copy', 'Copy result to clipboard')
    .option('--format <format>', 'Output format (text, slack)', 'text')
    .option('--theme <theme>', 'Theme to use (default, github)', 'default')
    .option(
      '-m, --mode <mode>',
      'Emoji selection mode when multiple emojis provided (random, row, column, row-gradient, column-gradient)',
      'random'
    )
    .option('--font <font>', 'Pixel font to use', DEFAULT_FONT_NAME)
    .option(
      '--border [emoji]',
      'Add an outer border. Emoji optional; defaults to the background emoji when omitted.'
    )
    .addHelpText(
      'after',
      `
Emoji Input:
  You can specify emojis in several ways:
  - Direct emoji: 🔥, ⭐, 💎
  - Alias with colons: :fire:, :star:
  - Alias without colons: fire, star
  - Multiple emojis (comma-separated): 🔥,⭐,💎 or fire,star,gem

Emoji Modes (when multiple emojis provided):
  - random: Random emoji for each dot
  - row: Different emoji per row
  - column: Different emoji per column  
  - row-gradient: Gradient across rows
  - column-gradient: Gradient across columns

Themes:
  - default: Uses the specified emoji(s)
  - github: GitHub contribution graph style with green squares

Output Formats:
  - text: Plain text (default)
  - slack: Slack Block Kit JSON format
`
    );

  return program;
}

/**
 * Parse and validate CLI options
 */
export async function parseCLIOptions(program: Command): Promise<CLIOptions> {
  const opts = program.opts();
  const args = program.args;

  // Get text from argument or file
  let text = args[0];

  if (opts.file) {
    // Read from file
    text = await readTextFromFile(opts.file);
  }

  // Validate mode
  const mode = opts.mode as EmojiMode;
  if (!VALID_MODES.includes(mode)) {
    throw new Error(
      `Invalid mode: ${mode}. Valid modes are: ${VALID_MODES.join(', ')}`
    );
  }

  // Validate format
  const format = opts.format as OutputFormat;
  if (!VALID_FORMATS.includes(format)) {
    throw new Error(
      `Invalid format: ${format}. Valid formats are: ${VALID_FORMATS.join(', ')}`
    );
  }

  // Validate theme
  const theme = opts.theme as Theme;
  if (!VALID_THEMES.includes(theme)) {
    throw new Error(
      `Invalid theme: ${theme}. Valid themes are: ${VALID_THEMES.join(', ')}`
    );
  }

  return {
    text,
    file: opts.file,
    emoji: opts.emoji,
    background: opts.background,
    copy: opts.copy || false,
    format,
    theme,
    mode,
    font: opts.font,
    border: opts.border,
  };
}

/**
 * Read text from file with validation
 */
async function readTextFromFile(filePath: string): Promise<string> {
  // Validate file path
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid file path');
  }

  // Check for path traversal attempts
  if (filePath.includes('..')) {
    throw new Error('Path traversal not allowed');
  }

  try {
    // Check file exists and is readable
    await fs.access(filePath, fs.constants.R_OK);
    
    // Get file stats
    const stats = await fs.stat(filePath);
    
    // Limit file size (1MB max)
    const maxSize = 1024 * 1024;
    if (stats.size > maxSize) {
      throw new Error(`File too large. Maximum size is ${maxSize} bytes`);
    }

    // Read file content
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Return trimmed content
    return content.trim();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        throw new Error(`File not found: ${filePath}`);
      }
      if (error.message.includes('EACCES')) {
        throw new Error(`Permission denied: ${filePath}`);
      }
      throw error;
    }
    throw new Error(`Failed to read file: ${filePath}`);
  }
}

/**
 * Validate that required options are provided
 */
export function validateOptions(options: CLIOptions): void {
  if (!options.text && !options.file) {
    throw new Error(
      'Text is required. Provide text as an argument or use --file option.\n' +
      'Run with --help for usage information.'
    );
  }

  if (!options.emoji) {
    throw new Error('Emoji is required. Use --emoji option.');
  }

  if (options.border) {
    const backgroundProvided = Boolean(options.background) || options.theme === 'github';
    if (!backgroundProvided) {
      throw new Error('Border requires a background emoji. Specify --background <emoji>.');
    }
  }
}
