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

export const PLAYER_PALETTE = {
  gi: '#f7f7f2',
  giShade: '#c9cfd8',
  belt: '#05060a',
  headband: '#b32430',
  skin: '#f4e3c1',
  hair: '#05060a',
} as const;

export const CPU_PALETTE = {
  gi: '#38bdf8',
  giShade: '#0284c7',
  belt: '#b32430',
  headband: '#f2c14b',
  skin: '#f4e3c1',
  hair: '#05060a',
} as const;

export const UI_COLORS = {
  primary: '#7fd8e8',
  success: '#3f7d4a',
  danger: '#b32430',
  warning: '#f2c14b',
  text: '#f7f7f2',
  textMuted: '#8f98a4',
  panel: '#0b1730',
  panelBorder: '#173a6b',
  shadow: '#05060a',
} as const;

export const EFFECT_COLORS = {
  punch: '#f2c14b',
  kick: '#e07b2a',
  lowKick: '#b32430',
  backKick: '#5c1420',
  block: '#7fd8e8',
  ko: '#f7f7f2',
} as const;

export function color(name: keyof typeof VGA_PALETTE): string {
  return VGA_PALETTE[name];
}

export function uiColor(name: keyof typeof UI_COLORS): string {
  return UI_COLORS[name];
}

export function effectColor(
  name: keyof typeof EFFECT_COLORS,
): string {
  return EFFECT_COLORS[name];
}