'use client';

import { useProposalEditor } from '@/store/proposal-editor';
import { resolveTemplate, resolveTheme } from '@/templates/registry';
import type { ThemeVariables } from '@/templates/types';
import React from 'react';

interface ProposalPreviewProps {
  proposalMeta: {
    projectTitle: string;
    clientName: string;
    clientEmail: string;
    amount: number;
    currency: string;
    createdAt: string;
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

export default function ProposalPreview({ proposalMeta, profileMeta }: ProposalPreviewProps) {
  const editedContent = useProposalEditor((s) => s.editedContent);
  const sectionsConfig = useProposalEditor((s) => s.sectionsConfig);
  const templateId = useProposalEditor((s) => s.templateId);
  const themeId = useProposalEditor((s) => s.themeId);

  // Don't render until store is initialized
  if (!editedContent || !editedContent.cover) {
    return (
      <div style={{ padding: '2rem', color: '#62666d', textAlign: 'center' }}>
        Loading preview...
      </div>
    );
  }

  const entry = resolveTemplate(templateId);
  const theme = resolveTheme(templateId, themeId);
  const TemplateComponent = entry.component;

  const cssVars = themeToCssVars(theme);

  // Use amount from pricing if available
  const amount = editedContent.pricing?.total || proposalMeta.amount;

  return (
    <div className="preview-panel">
      {/* Template render — 100% width, no zoom */}
      <div className="preview-panel__viewport">
        <div className="preview-panel__canvas" style={cssVars}>
          <TemplateComponent
            proposal={{ ...proposalMeta, amount }}
            content={editedContent}
            sections={sectionsConfig}
            profile={profileMeta}
            theme={theme}
            isPdf={false}
          />
        </div>
      </div>

      <style>{PREVIEW_CSS}</style>
    </div>
  );
}

function themeToCssVars(theme: ThemeVariables): React.CSSProperties {
  return {
    '--proposal-accent': theme.accent,
    '--proposal-accent-fg': theme.accentForeground,
    '--proposal-bg': theme.background,
    '--proposal-surface': theme.surface,
    '--proposal-surface-alt': theme.surfaceAlt,
    '--proposal-text': theme.text,
    '--proposal-text-muted': theme.textMuted,
    '--proposal-border': theme.border,
  } as React.CSSProperties;
}

const PREVIEW_CSS = `
  .preview-panel {
    min-height: 100%;
    display: flex;
    flex-direction: column;
  }
  .preview-panel__viewport {
    flex: 1;
    overflow: hidden;
  }
  .preview-panel__canvas {
    width: 100%;
  }
`;
