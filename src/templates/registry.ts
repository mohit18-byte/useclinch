import type { ThemeVariables, TemplateRegistryEntry } from './types';
import DarkEditorialTemplate from './dark-editorial';
import { darkEditorialThemes } from './dark-editorial/themes';
import AppleMinimalTemplate from './apple-minimal';
import { appleMinimalThemes } from './apple-minimal/themes';

// ═══════════════════════════════════════════════════════════════
// Template Registry
// Maps template_id → { component, themes, defaultTheme }
// Adding a template = add folder + one line here.
// ═══════════════════════════════════════════════════════════════

export const TEMPLATE_REGISTRY: Record<string, TemplateRegistryEntry> = {
  'dark-editorial': {
    name: 'Dark Editorial',
    component: DarkEditorialTemplate,
    themes: darkEditorialThemes,
    defaultTheme: 'midnight',
  },
  'apple-minimal': {
    name: 'Ivory',
    component: AppleMinimalTemplate,
    themes: appleMinimalThemes,
    defaultTheme: 'snow',
  },
};

/** Resolve a template from the registry with fallback */
export function resolveTemplate(templateId: string): TemplateRegistryEntry {
  return TEMPLATE_REGISTRY[templateId] ?? TEMPLATE_REGISTRY['dark-editorial'];
}

/** Resolve a theme from a template with fallback */
export function resolveTheme(templateId: string, themeId: string): ThemeVariables {
  const entry = resolveTemplate(templateId);
  return entry.themes[themeId] ?? entry.themes[entry.defaultTheme];
}

/** Get all template IDs */
export function getTemplateIds(): string[] {
  return Object.keys(TEMPLATE_REGISTRY);
}

/** Get all theme IDs for a template */
export function getThemeIds(templateId: string): string[] {
  const entry = resolveTemplate(templateId);
  return Object.keys(entry.themes);
}
