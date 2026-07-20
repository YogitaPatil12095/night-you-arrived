import type { ThemeName } from '../types/card';

export interface ThemeTokens {
  label: string;
  bg: string;
  ink: string;
  muted: string;
  line: string;
  star: string;
}

/**
 * Curated, print-ready color themes. Deliberately closed set — the brief
 * calls for no arbitrary user colors, so this is the only place new
 * themes should ever be added.
 */
export const THEMES: Record<ThemeName, ThemeTokens> = {
  ivory:     { label: 'Ivory',      bg: '#F7F4EC', ink: '#201E1A', muted: '#8C8574', line: '#DAD3C2', star: '#B69A5E' },
  charcoal:  { label: 'Charcoal',   bg: '#201F1D', ink: '#EDE9E0', muted: '#A39D8E', line: '#3A3936', star: '#C9A15A' },
  forest:    { label: 'Forest green', bg: '#1B2620', ink: '#E8E6DD', muted: '#93A08F', line: '#33413A', star: '#B9A46A' },
  navy:      { label: 'Deep navy',  bg: '#171C26', ink: '#E7E6E0', muted: '#8F97A6', line: '#2B323F', star: '#C2B27A' },
  warmgrey:  { label: 'Warm grey',  bg: '#EDEAE4', ink: '#2A2822', muted: '#8A8477', line: '#D2CDC2', star: '#9C8A5E' },
  sand:      { label: 'Sand',       bg: '#EFE6D6', ink: '#2B2418', muted: '#93815F', line: '#DCCFB4', star: '#A6813F' },
  sage:      { label: 'Sage',       bg: '#E4E7DD', ink: '#262B22', muted: '#7C8873', line: '#CBD1C0', star: '#7C8A5E' },
  dustyblue: { label: 'Dusty blue', bg: '#DCE2E6', ink: '#222A2E', muted: '#6E7F87', line: '#C0CBD1', star: '#5E7A8A' },
  burgundy:  { label: 'Burgundy',   bg: '#241417', ink: '#E9DFDD', muted: '#A98D8F', line: '#3E262B', star: '#A65E6A' },
  midnightcopper: { label: 'Midnight copper', bg: '#0F1730', ink: '#E7E2D6', muted: '#8B93AC', line: '#26304F', star: '#C66218' },
};

export const THEME_ORDER: ThemeName[] = [
  'ivory', 'charcoal', 'forest', 'navy', 'warmgrey', 'sand', 'sage', 'dustyblue', 'burgundy', 'midnightcopper',
];