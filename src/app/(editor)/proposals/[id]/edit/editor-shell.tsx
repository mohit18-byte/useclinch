'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useProposalEditor } from '@/store/proposal-editor';
import type { SectionDataMap, SectionsConfig } from '@/templates/types';
import ProposalPreview from './proposal-preview';
import EditorSidebar from './editor-sidebar';

interface EditorShellProps {
  proposalId: string;
  hostedToken: string;
  proposalStatus: string;
  editedContent: SectionDataMap;
  sectionsConfig: SectionsConfig;
  templateId: string;
  themeId: string;
  proposalMeta: {
    projectTitle: string;
    clientName: string;
    clientEmail: string;
    amount: number;
    currency: string;
    createdAt: string;
    expiresAt: string | null;
  };
  profileMeta: {
    fullName: string;
    professionalTitle: string;
    bio: string;
    services: string[];
    logoUrl: string | null;
    brandColor: string;
  };
}

export default function EditorShell({
  proposalId,
  hostedToken,
  proposalStatus,
  editedContent,
  sectionsConfig,
  templateId,
  themeId,
  proposalMeta,
  profileMeta,
}: EditorShellProps) {
  const init = useProposalEditor((s) => s.init);
  const isDirty = useProposalEditor((s) => s.isDirty);
  const storeEditedContent = useProposalEditor((s) => s.editedContent);
  const storeSectionsConfig = useProposalEditor((s) => s.sectionsConfig);
  const storeTemplateId = useProposalEditor((s) => s.templateId);
  const storeThemeId = useProposalEditor((s) => s.themeId);
  const storeExpiresAt = useProposalEditor((s) => s.expiresAt);
  const setSaving = useProposalEditor((s) => s.setSaving);
  const setLastSaved = useProposalEditor((s) => s.setLastSaved);

  const isLocked = proposalStatus === 'accepted';

  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialized = useRef(false);

  // ── Initialize store on mount ──
  useEffect(() => {
    if (!initialized.current) {
      init({ proposalId, hostedToken, editedContent, sectionsConfig, templateId, themeId, expiresAt: proposalMeta.expiresAt });
      initialized.current = true;
    }
  }, [init, proposalId, hostedToken, editedContent, sectionsConfig, templateId, themeId]);

  // ── Auto-save with 2s debounce ──
  const save = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSaving(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          edited_content_json: storeEditedContent,
          sections_config: storeSectionsConfig,
          template_id: storeTemplateId,
          theme_id: storeThemeId,
          expires_at: storeExpiresAt,
        }),
      });
      if (res.ok) {
        setLastSaved(new Date());
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Auto-save failed:', err);
      }
    } finally {
      setSaving(false);
    }
  }, [proposalId, storeEditedContent, storeSectionsConfig, storeTemplateId, storeThemeId, storeExpiresAt, setSaving, setLastSaved]);

  useEffect(() => {
    if (isLocked || !isDirty || !initialized.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLocked, isDirty, save]);

  // ── Flush save on unmount ──
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        // Fire immediate save on unmount if dirty
        if (!isLocked && useProposalEditor.getState().isDirty) {
          save();
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Locked banner for accepted proposals */}
      {isLocked && (
        <div className="editor-locked-banner">
          <span className="editor-locked-banner__icon">🔒</span>
          <span>This proposal was accepted by your client and can no longer be edited.</span>
        </div>
      )}

      {/* Desktop: split layout — sidebar LEFT, preview RIGHT */}
      <div className={`editor-shell ${isLocked ? 'editor-shell--locked' : ''}`}>
        <div className="editor-shell__sidebar">
          <EditorSidebar proposalMeta={proposalMeta} isLocked={isLocked} />
        </div>
        <div className="editor-shell__preview">
          <ProposalPreview proposalMeta={proposalMeta} profileMeta={profileMeta} />
        </div>
      </div>

      {/* Mobile: tab layout */}
      <div className={`editor-shell-mobile ${isLocked ? 'editor-shell--locked' : ''}`}>
        <div className="editor-shell-mobile__tabs">
          <button
            className={`editor-shell-mobile__tab ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            {isLocked ? 'Details' : 'Edit'}
          </button>
          <button
            className={`editor-shell-mobile__tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
        </div>
        <div className="editor-shell-mobile__content">
          {activeTab === 'preview' ? (
            <ProposalPreview proposalMeta={proposalMeta} profileMeta={profileMeta} />
          ) : (
            <EditorSidebar proposalMeta={proposalMeta} isLocked={isLocked} />
          )}
        </div>
      </div>

      <style>{EDITOR_SHELL_CSS}</style>
    </>
  );
}

const EDITOR_SHELL_CSS = `
  .editor-locked-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%);
    border-bottom: 1px solid rgba(34, 197, 94, 0.15);
    color: #4ade80;
    font-size: 13px;
    font-weight: 500;
    font-family: 'Inter Variable', -apple-system, system-ui, sans-serif;
    letter-spacing: -0.01em;
  }
  .editor-locked-banner__icon {
    font-size: 14px;
  }
  .editor-shell--locked .ed-field__input,
  .editor-shell--locked .ed-field__textarea,
  .editor-shell--locked .ed-list-add,
  .editor-shell--locked .ed-list-delete,
  .editor-shell--locked .ed-section-row__toggle,
  .editor-shell--locked .ed-section-row__drag,
  .editor-shell--locked .ed-template-card,
  .editor-shell--locked .ed-theme-dot,
  .editor-shell--locked .ed-expiry__btn {
    pointer-events: none;
    opacity: 0.4;
  }
  .editor-shell {
    display: grid;
    grid-template-columns: 380px 1fr;
    height: 100vh;
    overflow: hidden;
    background: #08090a;
    padding: 1rem;
    gap: 1rem;
  }
  .editor-shell__sidebar {
    overflow-y: auto;
    background: #0f1011;
    border: 1px solid #23252a;
    border-radius: 12px;
  }
  .editor-shell__preview {
    overflow-y: auto;
    background: #0f1011;
    border: 1px solid #23252a;
    border-radius: 12px;
  }
  .editor-shell-mobile {
    display: none;
  }

  @media (max-width: 1024px) {
    .editor-shell { display: none; }
    .editor-shell-mobile {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #08090a;
    }
    .editor-shell-mobile__tabs {
      display: flex;
      border-bottom: 1px solid #23252a;
      flex-shrink: 0;
      background: #0f1011;
    }
    .editor-shell-mobile__tab {
      flex: 1;
      padding: 0.75rem;
      background: transparent;
      border: none;
      color: #62666d;
      font-size: 0.88rem;
      font-weight: 520;
      cursor: pointer;
      font-family: inherit;
      transition: color 0.15s, border-color 0.15s;
      border-bottom: 2px solid transparent;
    }
    .editor-shell-mobile__tab.active {
      color: white;
      border-bottom-color: #6366f1;
    }
    .editor-shell-mobile__content {
      flex: 1;
      overflow-y: auto;
      background: #0f1011;
    }
  }
`;
