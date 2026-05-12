import type { ThemeVariables } from '../types';

// ═══════════════════════════════════════════════════════════════
// Apple Minimal — 5 Color Themes
// Clean, bright, airy themes with subtle accent colors.
// ═══════════════════════════════════════════════════════════════

export const appleMinimalThemes: Record<string, ThemeVariables> = {
  snow: {
    accent: '#0071e3',
    accentForeground: '#ffffff',
    background: '#ffffff',
    surface: '#f5f5f7',
    surfaceAlt: '#ebebed',
    text: '#1d1d1f',
    textMuted: '#6e6e73',
    border: 'rgba(0, 0, 0, 0.08)',
  },
  slate: {
    accent: '#5856d6',
    accentForeground: '#ffffff',
    background: '#fafafa',
    surface: '#f0f0f2',
    surfaceAlt: '#e5e5ea',
    text: '#1d1d1f',
    textMuted: '#636366',
    border: 'rgba(0, 0, 0, 0.06)',
  },
  sand: {
    accent: '#bf5700',
    accentForeground: '#ffffff',
    background: '#fefcf9',
    surface: '#f8f4ef',
    surfaceAlt: '#efe9e0',
    text: '#2c2417',
    textMuted: '#8a7d6e',
    border: 'rgba(44, 36, 23, 0.08)',
  },
  mint: {
    accent: '#00856f',
    accentForeground: '#ffffff',
    background: '#f9fefb',
    surface: '#f0f9f4',
    surfaceAlt: '#e2f3ea',
    text: '#0f2e23',
    textMuted: '#5c8573',
    border: 'rgba(0, 133, 111, 0.10)',
  },
  dusk: {
    accent: '#af52de',
    accentForeground: '#ffffff',
    background: '#fdfafe',
    surface: '#f7f2f9',
    surfaceAlt: '#ede4f2',
    text: '#2a1438',
    textMuted: '#7e5f8e',
    border: 'rgba(175, 82, 222, 0.10)',
  },
};

export default appleMinimalThemes;
