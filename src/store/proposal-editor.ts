import { create } from 'zustand';
import type { SectionDataMap, SectionsConfig, SectionKey } from '@/templates/types';
import { resolveTemplate } from '@/templates/registry';

// ═══════════════════════════════════════════════════════════════
// Clinch — Proposal Editor Store (Zustand)
// Single source of truth for the editor state.
// ═══════════════════════════════════════════════════════════════

export interface ProposalEditorState {
  proposalId: string;
  hostedToken: string;
  editedContent: SectionDataMap;
  sectionsConfig: SectionsConfig;
  templateId: string;
  themeId: string;
  expiresAt: string | null;
  isSaving: boolean;
  lastSaved: Date | null;
  isDirty: boolean;
}

export interface ProposalEditorActions {
  /** Initialize store with proposal data */
  init: (data: {
    proposalId: string;
    hostedToken: string;
    editedContent: SectionDataMap;
    sectionsConfig: SectionsConfig;
    templateId: string;
    themeId: string;
    expiresAt: string | null;
  }) => void;

  /** Update a single section's data */
  updateSection: <K extends SectionKey>(key: K, data: SectionDataMap[K]) => void;

  /** Replace full sections config */
  setSectionsConfig: (config: SectionsConfig) => void;

  /** Toggle one section's visibility (cannot toggle cover or cta) */
  toggleSectionVisibility: (key: SectionKey) => void;

  /** Reorder sections (cover stays first, cta stays last) */
  reorderSections: (newOrder: SectionKey[]) => void;

  /** Set template, reset theme to that template's default */
  setTemplate: (templateId: string) => void;

  /** Set theme */
  setTheme: (themeId: string) => void;

  /** Set proposal expiry */
  setExpiresAt: (expiresAt: string | null) => void;

  /** Saving state management */
  setSaving: (saving: boolean) => void;
  setLastSaved: (date: Date) => void;
  setDirty: (dirty: boolean) => void;
}

export type ProposalEditorStore = ProposalEditorState & ProposalEditorActions;

export const useProposalEditor = create<ProposalEditorStore>((set) => ({
  // ── Initial state ──
  proposalId: '',
  hostedToken: '',
  editedContent: {} as SectionDataMap,
  sectionsConfig: { order: [], visibility: {} as Record<SectionKey, boolean> },
  templateId: 'dark-editorial',
  themeId: 'midnight',
  expiresAt: null,
  isSaving: false,
  lastSaved: null,
  isDirty: false,

  // ── Actions ──

  init: (data) =>
    set({
      proposalId: data.proposalId,
      hostedToken: data.hostedToken,
      editedContent: data.editedContent,
      sectionsConfig: data.sectionsConfig,
      templateId: data.templateId,
      themeId: data.themeId,
      expiresAt: data.expiresAt,
      isDirty: false,
      lastSaved: null,
    }),

  updateSection: (key, data) =>
    set((state) => ({
      editedContent: { ...state.editedContent, [key]: data },
      isDirty: true,
    })),

  setSectionsConfig: (config) =>
    set({ sectionsConfig: config, isDirty: true }),

  toggleSectionVisibility: (key) => {
    // Cannot toggle cover or cta
    if (key === 'cover' || key === 'cta') return;
    set((state) => ({
      sectionsConfig: {
        ...state.sectionsConfig,
        visibility: {
          ...state.sectionsConfig.visibility,
          [key]: !state.sectionsConfig.visibility[key],
        },
      },
      isDirty: true,
    }));
  },

  reorderSections: (newOrder) =>
    set((state) => {
      // Enforce cover first, cta last
      const middle = newOrder.filter((k) => k !== 'cover' && k !== 'cta');
      const order: SectionKey[] = ['cover', ...middle, 'cta'];
      return {
        sectionsConfig: { ...state.sectionsConfig, order },
        isDirty: true,
      };
    }),

  setTemplate: (templateId) => {
    const entry = resolveTemplate(templateId);
    set({
      templateId,
      themeId: entry.defaultTheme,
      isDirty: true,
    });
  },

  setTheme: (themeId) =>
    set({ themeId, isDirty: true }),

  setExpiresAt: (expiresAt) =>
    set({ expiresAt, isDirty: true }),

  setSaving: (isSaving) => set({ isSaving }),
  setLastSaved: (lastSaved) => set({ lastSaved, isDirty: false }),
  setDirty: (isDirty) => set({ isDirty }),
}));
