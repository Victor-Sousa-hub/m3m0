/**
 * Design tokens for m3m0.
 *
 * Identity: dark "terminal that doesn't take itself too seriously" —
 * near-black background, single warm amber accent, monospaced type,
 * sharp/near-sharp corners, no gradients or soft shadows. GNU appears
 * only as a discreet easter egg (loading / empty states) — see
 * `src/components/GnuEasterEgg`.
 *
 * Base spacing unit is 3px — always use multiples of `spacing.unit`,
 * never raw pixel values, so rhythm stays consistent across screens.
 */

export type ThemeColors = {
  background: string;
  backgroundElevated: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textOnAccent: string;
  accent: string;
  accentPressed: string;
  accentMuted: string;
  correct: string;
  correctMuted: string;
  incorrect: string;
  incorrectMuted: string;
};

export const colors: ThemeColors = {
  // Core surfaces
  background: '#141313', // primary app background
  backgroundElevated: '#1c1b1b', // cards, modals, sheets — one step up from bg
  border: '#2a2828', // hairline borders, dividers

  // Text
  textPrimary: '#cccccc',
  textSecondary: '#8f8c8c', // de-emphasized labels, timestamps, hints
  textOnAccent: '#141313', // text placed on top of the accent color

  // Accent — the one warm color, used sparingly (primary buttons, active
  // states, progress, links). Don't introduce a second bright hue.
  accent: '#D9A441',
  accentPressed: '#C08F35', // darker, for pressed/active button states
  accentMuted: '#3a3220', // accent at low opacity baked into a dark tone,
  // for subtle backgrounds (e.g. selected option row) without glow/blur

  // Exam feedback — desaturated so they sit inside the same palette
  // instead of looking like a generic red/green Bootstrap alert.
  correct: '#6B8F71',
  correctMuted: '#1e2620',
  incorrect: '#B5473B',
  incorrectMuted: '#2a1c19',
};

export type ThemeSpacing = {
  unit: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
};

export const spacing: ThemeSpacing = {
  unit: 3,
  xs: 6,
  sm: 9,
  md: 12,
  lg: 18,
  xl: 24,
  xxl: 36,
  xxxl: 48,
};

export type ThemeRadius = {
  none: number;
  sm: number;
  md: number;
};

export const radius: ThemeRadius = {
  // Sharp by default — deliberately avoiding the rounded-2xl "generic AI
  // app" look. Use `sm` only where a fully sharp corner would hurt
  // tappability (e.g. small icon buttons).
  none: 0,
  sm: 2,
  md: 4,
};

export type ThemeTypography = {
  fontFamily: {
    regular: string;
    medium: string;
    bold: string;
  };
  size: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
};

export const typography: ThemeTypography = {
  // FiraCode ships as a variable/static font family; register it with
  // expo-font (or @expo-google-fonts/fira-code) under these exact family
  // names before using them. Ligatures (=>, !=, ->) render automatically
  // wherever FiraCode is set as the font — lean into that for anything
  // technical (exam codes, percentages, timers).
  fontFamily: {
    regular: 'FiraCode-Regular',
    medium: 'FiraCode-Medium',
    bold: 'FiraCode-Bold',
  },
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 28,
  },
};

export type ThemeElevation = {
  card: {
    borderWidth: number;
    borderColor: string;
  };
};

// Elevation without soft shadows/blur — a 1px hard border does the job of
// separating surfaces while staying flat and technical.
export const elevation: ThemeElevation = {
  card: {
    borderWidth: 1,
    borderColor: colors.border,
  },
};

export type Theme = {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  radius: ThemeRadius;
  typography: ThemeTypography;
  elevation: ThemeElevation;
};

export const theme: Theme = { colors, spacing, radius, typography, elevation };
