export const VGA_PALETTE = {
  black: '#05060a',
  darkBlue: '#0b1730',
  blue: '#173a6b',
  lightBlue: '#4f8fd9',
  cyan: '#7fd8e8',
  darkRed: '#5c1420',
  red: '#b32430',
  orange: '#e07b2a',
  yellow: '#f2c14b',
  cream: '#f4e3c1',
  white: '#f7f7f2',
  darkGray: '#2b2f38',
  gray: '#565d68',
  lightGray: '#8f98a4',
  darkGreen: '#20402c',
  green: '#3f7d4a',
} as const;

export type PaletteColor = keyof typeof VGA_PALETTE;

export function color(name: PaletteColor): string {
  return VGA_PALETTE[name];
}

