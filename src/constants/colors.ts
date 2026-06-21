/**
 * Focus App — Dark Theme Design Tokens
 */
export const Colors = {
  // Backgrounds
  background: '#0A0A1A',
  surface: '#141428',
  surfaceElevated: '#1E1E3A',
  surfaceHighlight: '#252545',

  // Primary palette
  primary: '#7C5CFC',
  primaryLight: '#9B7FFF',
  primaryDark: '#5A3DD4',
  primaryMuted: 'rgba(124, 92, 252, 0.15)',

  // Accents
  secondary: '#00D4AA',
  secondaryMuted: 'rgba(0, 212, 170, 0.15)',
  accent: '#FF6B9D',
  accentMuted: 'rgba(255, 107, 157, 0.15)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8888AA',
  textMuted: '#555577',
  textInverse: '#0A0A1A',

  // Borders
  border: '#2A2A4A',
  borderLight: '#3A3A5A',

  // Status
  success: '#00D4AA',
  warning: '#FFB444',
  error: '#FF5577',

  // Gradients (use with LinearGradient)
  gradientPrimary: ['#7C5CFC', '#5A3DD4'] as const,
  gradientAccent: ['#FF6B9D', '#FF4081'] as const,
  gradientDark: ['#141428', '#0A0A1A'] as const,
  gradientTimer: ['#7C5CFC', '#00D4AA'] as const,

  // Shadows
  shadowColor: '#000000',

  // Overlay
  overlay: 'rgba(10, 10, 26, 0.85)',
  overlayLight: 'rgba(10, 10, 26, 0.5)',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  hero: 48,
} as const;
