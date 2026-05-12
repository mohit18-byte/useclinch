import type { ThemeVariables } from '../types';

// ═══════════════════════════════════════════════════════════════
// Dark Editorial — 5 Color Themes
// Rich, cinematic dark themes with strong accent colors.
// ═══════════════════════════════════════════════════════════════

export const darkEditorialThemes: Record<string, ThemeVariables> = {
  midnight: {
    accent: '#6366f1',
    accentForeground: '#ffffff',
    background: '#0a0a0b',
    surface: '#141416',
    surfaceAlt: '#1c1c20',
    text: '#f0f0f3',
    textMuted: '#8b8b96',
    border: 'rgba(255, 255, 255, 0.08)',
  },
  ember: {
    accent: '#f97316',
    accentForeground: '#ffffff',
    background: '#0c0907',
    surface: '#171210',
    surfaceAlt: '#201a16',
    text: '#f5ede6',
    textMuted: '#9e8e80',
    border: 'rgba(249, 115, 22, 0.12)',
  },
  forest: {
    accent: '#22c55e',
    accentForeground: '#ffffff',
    background: '#060d08',
    surface: '#0e1610',
    surfaceAlt: '#151f17',
    text: '#e8f5eb',
    textMuted: '#7da685',
    border: 'rgba(34, 197, 94, 0.10)',
  },
  rose: {
    accent: '#f43f5e',
    accentForeground: '#ffffff',
    background: '#0c0608',
    surface: '#16101',
    surfaceAlt: '#201418',
    text: '#f8ecef',
    textMuted: '#a6808a',
    border: 'rgba(244, 63, 94, 0.10)',
  },
  ocean: {
    accent: '#06b6d4',
    accentForeground: '#ffffff',
    background: '#060b0d',
    surface: '#0e1518',
    surfaceAlt: '#151e22',
    text: '#e8f4f7',
    textMuted: '#7da8b3',
    border: 'rgba(6, 182, 212, 0.10)',
  },
};

export default darkEditorialThemes;
