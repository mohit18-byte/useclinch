'use client';

import React, { useState } from 'react';
import {
  TEMPLATE_REGISTRY,
  resolveTemplate,
  resolveTheme,
  getTemplateIds,
  getThemeIds,
} from '@/templates/registry';
import { MOCK_CONTENT, MOCK_SECTIONS, MOCK_PROPOSAL, MOCK_PROFILE } from '@/templates/mock-data';

export default function TestTemplatesPage() {
  const templateIds = getTemplateIds();
  const [templateId, setTemplateId] = useState(templateIds[0]);
  const themeIds = getThemeIds(templateId);
  const [themeId, setThemeId] = useState(resolveTemplate(templateId).defaultTheme);

  const entry = resolveTemplate(templateId);
  const theme = resolveTheme(templateId, themeId);
  const TemplateComponent = entry.component;

  // When switching templates, reset theme to that template's default
  function handleTemplateSwitch(newTemplateId: string) {
    setTemplateId(newTemplateId);
    const newEntry = resolveTemplate(newTemplateId);
    setThemeId(newEntry.defaultTheme);
  }

  // Enable FAQ for testing (it's off by default in mock)
  const testSections = {
    ...MOCK_SECTIONS,
    visibility: { ...MOCK_SECTIONS.visibility, faq: true },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      {/* ── Toolbar ──────────────────────────────────── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(10, 10, 12, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap',
        fontFamily: '-apple-system, system-ui, sans-serif',
        fontSize: '0.85rem',
        color: '#d0d6e0',
      }}>
        <span style={{ fontWeight: 700, color: '#f7f8f8', letterSpacing: '-0.02em' }}>
          Template Test
        </span>

        {/* Template Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ color: '#8a8f98', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Template:
          </span>
          {templateIds.map((id) => (
            <button
              key={id}
              onClick={() => handleTemplateSwitch(id)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: templateId === id ? '#6366f1' : 'rgba(255,255,255,0.08)',
                background: templateId === id ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: templateId === id ? '#a5b4fc' : '#8a8f98',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 500,
                fontFamily: 'inherit',
              }}
            >
              {TEMPLATE_REGISTRY[id].name}
            </button>
          ))}
        </div>

        {/* Theme Switcher */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <span style={{ color: '#8a8f98', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Theme:
          </span>
          {themeIds.map((id) => {
            const t = entry.themes[id];
            return (
              <button
                key={id}
                onClick={() => setThemeId(id)}
                title={id}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '2px solid',
                  borderColor: themeId === id ? t.accent : 'rgba(255,255,255,0.1)',
                  background: t.accent,
                  cursor: 'pointer',
                  transition: 'transform 0.15s',
                  transform: themeId === id ? 'scale(1.15)' : 'scale(1)',
                }}
              />
            );
          })}
          <span style={{ marginLeft: '0.25rem', color: '#8a8f98', fontSize: '0.78rem' }}>
            {themeId}
          </span>
        </div>
      </div>

      {/* ── Template Preview ─────────────────────────── */}
      <div style={{ isolation: 'isolate', contain: 'content' }}>
        <TemplateComponent
          proposal={MOCK_PROPOSAL}
          content={MOCK_CONTENT}
          sections={testSections}
          profile={MOCK_PROFILE}
          theme={theme}
        />
      </div>
    </div>
  );
}
