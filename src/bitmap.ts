/**
 * Bitmap conversion module
 * Converts text to bitmap representation using pixel fonts
 */

import type { Bitmap } from './types.js';
import type { PixelFont } from './fonts.js';
import {
  DEFAULT_FONT_NAME,
  getAvailableFonts as listPixelFonts,
  getFont,
} from './fonts.js';

const MAX_TEXT_LENGTH = 100;
type TextToBitmapOptions = {
  vertical?: boolean;
};

/**
 * Interpret escape sequences for newlines and backslashes.
 */
function decodeEscapes(text: string): string {
  let result = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char !== '\\') {
      result += char;
      continue;
    }

    const next = text[i + 1];
    if (next === 'n') {
      result += '\n';
      i++;
      continue;
    }

    if (next === '\\') {
      result += '\\';
      i++;
      continue;
    }

    if (next !== undefined) {
      result += '\\' + next;
      i++;
      continue;
    }

    // Trailing backslash, keep as-is
    result += '\\';
  }

  return result;
}

/**
 * Normalize text input:
 * - Handle escaped newlines/backslashes
 * - Normalize platform newlines
 * - Optionally stack characters vertically
 */
function normalizeTextInput(text: string, vertical: boolean): string {
  const decoded = decodeEscapes(text);
  const normalizedNewlines = decoded.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  if (!vertical) {
    return normalizedNewlines;
  }

  const verticalizedLines = normalizedNewlines.split('\n').map((line) => {
    if (line.length === 0) {
      return '';
    }
    return Array.from(line).join('\n');
  });

  return verticalizedLines.join('\n\n');
}

/**
 * Clean up bitmap by removing empty rows at start and end
 */
function trimBitmap(bitmap: Bitmap): Bitmap {
  if (bitmap.length === 0) return bitmap;

  // Find first non-empty row
  let startRow = 0;
  while (startRow < bitmap.length && bitmap[startRow].every((cell) => !cell)) {
    startRow++;
  }

  // Find last non-empty row
  let endRow = bitmap.length - 1;
  while (endRow >= 0 && bitmap[endRow].every((cell) => !cell)) {
    endRow--;
  }

  if (startRow > endRow) {
    return [[]]; // All empty
  }

  return bitmap.slice(startRow, endRow + 1);
}

/**
 * Get the pixel pattern for a character, with fallbacks.
 */
function getCharacterPattern(char: string, font: PixelFont): string[] {
  if (font.map[char]) {
    return font.map[char];
  }

  const upper = char.toUpperCase();
  if (font.map[upper]) {
    return font.map[upper];
  }

  return font.map['?'] || font.map[' '] || [];
}

/**
 * Render a single line of text to bitmap rows.
 */
function renderLineToBitmap(line: string, font: PixelFont): Bitmap {
  const rows: Bitmap = Array.from({ length: font.height }, () => []);
  const characters = Array.from(line);

  if (characters.length === 0) {
    return rows;
  }

  characters.forEach((char, charIndex) => {
    const pattern = getCharacterPattern(char, font);
    const width = pattern.reduce((max, row) => Math.max(max, row.length), 0);

    for (let rowIndex = 0; rowIndex < font.height; rowIndex++) {
      const rowPattern = pattern[rowIndex] || '';
      for (let colIndex = 0; colIndex < width; colIndex++) {
        rows[rowIndex].push(rowPattern[colIndex] === '#');
      }

      if (charIndex < characters.length - 1) {
        for (let space = 0; space < font.letterSpacing; space++) {
          rows[rowIndex].push(false);
        }
      }
    }
  });

  return rows;
}

/**
 * Merge multiple line bitmaps into a single bitmap with line spacing.
 */
function mergeLines(lineBitmaps: Bitmap[], lineSpacing: number): Bitmap {
  if (lineBitmaps.length === 0) return [[]];

  const width = Math.max(...lineBitmaps.map((line) => line[0]?.length ?? 0));
  const merged: Bitmap = [];

  lineBitmaps.forEach((lineBitmap, index) => {
    for (let row = 0; row < lineBitmap.length; row++) {
      const rowData = lineBitmap[row] || [];
      const paddedRow = rowData.slice();

      while (paddedRow.length < width) {
        paddedRow.push(false);
      }

      merged.push(paddedRow);
    }

    if (index < lineBitmaps.length - 1 && lineSpacing > 0) {
      for (let i = 0; i < lineSpacing; i++) {
        merged.push(new Array(width).fill(false));
      }
    }
  });

  return trimBitmap(merged);
}

/**
 * Convert text to bitmap using built-in pixel font
 */
export async function textToBitmap(
  text: string,
  fontName: string = DEFAULT_FONT_NAME,
  options: TextToBitmapOptions = {}
): Promise<Bitmap> {
  // Validate input
  if (!text || typeof text !== 'string') {
    throw new Error('Text input is required');
  }

  const normalizedText = normalizeTextInput(text, options.vertical ?? false);

  // Sanitize input - remove control characters except newlines
  const sanitizedText = normalizedText.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '');

  if (sanitizedText.length === 0) {
    throw new Error('Text input is empty after sanitization');
  }

  // Limit text length for security
  const truncatedText = sanitizedText.slice(0, MAX_TEXT_LENGTH);

  const font = getFont(fontName);
  const lines = truncatedText.split('\n');
  const lineBitmaps = lines.map((line) => renderLineToBitmap(line, font));

  return mergeLines(lineBitmaps, font.lineSpacing);
}

/**
 * Get available pixel fonts
 */
export function getAvailableFonts(): Promise<string[]> {
  return Promise.resolve(listPixelFonts());
}

/**
 * Get bitmap dimensions
 */
export function getBitmapDimensions(bitmap: Bitmap): {
  width: number;
  height: number;
} {
  if (bitmap.length === 0) {
    return { width: 0, height: 0 };
  }
  return {
    width: bitmap[0].length,
    height: bitmap.length,
  };
}

/**
 * Validate bitmap integrity
 */
export function validateBitmap(bitmap: Bitmap): boolean {
  if (!Array.isArray(bitmap)) return false;
  if (bitmap.length === 0) return true;

  const width = bitmap[0].length;
  return bitmap.every(
    (row) => Array.isArray(row) && row.length === width
  );
}
