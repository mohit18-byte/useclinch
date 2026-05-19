'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useProposalEditor } from '@/store/proposal-editor';
import { TEMPLATE_REGISTRY, resolveTemplate } from '@/templates/registry';
import type { SectionKey, SectionDataMap } from '@/templates/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';

// ── Section display names ──
const SECTION_NAMES: Record<SectionKey, string> = {
  cover: 'Cover', problem: 'Problem', solution: 'Solution',
  approach: 'Approach', deliverables: 'Deliverables', timeline: 'Timeline',
  pricing: 'Pricing', about: 'About', faq: 'FAQ', cta: 'Call to Action',
};

interface EditorSidebarProps {
  proposalMeta: { projectTitle: string; clientName: string; clientEmail: string; amount: number; currency: string; createdAt: string };
  isLocked?: boolean;
}

export default function EditorSidebar({ proposalMeta, isLocked = false }: EditorSidebarProps) {
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>(null);
  const [copied, setCopied] = useState(false);

  const hostedToken = useProposalEditor((s) => s.hostedToken);
  const isSaving = useProposalEditor((s) => s.isSaving);
  const lastSaved = useProposalEditor((s) => s.lastSaved);
  const isDirty = useProposalEditor((s) => s.isDirty);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/p/${hostedToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [hostedToken]);

  return (
    <div className="ed-sidebar">
      {/* Header */}
      <div className="ed-sidebar__header">
        <div className="ed-sidebar__header-left">
          <a href="/proposals" className="ed-sidebar__back" title="Back to proposals">←</a>
          <div>
            <h2 className="ed-sidebar__title">{proposalMeta.projectTitle}</h2>
            <SaveStatus isSaving={isSaving} lastSaved={lastSaved} isDirty={isDirty} />
          </div>
        </div>
        <div className="ed-sidebar__actions">
          <a
            href={`/proposals/${useProposalEditor.getState().proposalId}/analytics`}
            className="ed-sidebar__share"
            title="View analytics"
          >
            📊
          </a>
          <button className="ed-sidebar__share" onClick={handleShare}>
            {copied ? '✓ Copied!' : '⤴ Share'}
          </button>
        </div>
      </div>

      {/* Section Controls + Editing */}
      <div className="ed-sidebar__group">
        <h3 className="ed-sidebar__group-title">Sections</h3>
        <SectionList expandedSection={expandedSection} onExpand={setExpandedSection} />
      </div>

      {/* Template Picker */}
      <div className="ed-sidebar__group">
        <h3 className="ed-sidebar__group-title">Template</h3>
        <TemplatePicker />
      </div>

      {/* Theme Picker */}
      <div className="ed-sidebar__group">
        <h3 className="ed-sidebar__group-title">Theme</h3>
        <ThemePicker />
      </div>

      {/* Expiry Picker */}
      <div className="ed-sidebar__group">
        <h3 className="ed-sidebar__group-title">Proposal Expiry</h3>
        <ExpiryPicker />
      </div>

      {/* Advance Payment */}
      <div className="ed-sidebar__group">
        <h3 className="ed-sidebar__group-title">Advance Payment</h3>
        <AdvancePaymentPanel proposalMeta={proposalMeta} />
      </div>

      {/* Version History + Publish — commented out, will tackle later
      <div className="ed-sidebar__group">
        <h3 className="ed-sidebar__group-title">Version History</h3>
        <VersionHistory />
      </div>
      */}

      <style>{SIDEBAR_CSS}</style>
    </div>
  );
}

// ── Save Status ──
function SaveStatus({ isSaving, lastSaved, isDirty }: { isSaving: boolean; lastSaved: Date | null; isDirty: boolean }) {
  if (isSaving) return <span className="ed-save-status saving">Saving...</span>;
  if (isDirty) return <span className="ed-save-status dirty">Unsaved changes</span>;
  if (lastSaved) {
    const ago = Math.round((Date.now() - lastSaved.getTime()) / 60000);
    const text = ago < 1 ? 'Saved just now' : `Saved ${ago}m ago`;
    return <span className="ed-save-status saved">{text}</span>;
  }
  return null;
}

// ── Version History ──

interface VersionItem {
  id: string;
  version_number: number;
  change_summary: string;
  changed_sections: string[];
  created_at: string;
}

function VersionHistory() {
  const proposalId = useProposalEditor((s) => s.proposalId);
  const updateSection = useProposalEditor((s) => s.updateSection);
  const setSectionsConfig = useProposalEditor((s) => s.setSectionsConfig);
  const setLastSaved = useProposalEditor((s) => s.setLastSaved);
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [currentVersion, setCurrentVersion] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showPublish, setShowPublish] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    if (!proposalId) return;
    try {
      const res = await fetch(`/api/proposals/${proposalId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
        setCurrentVersion(data.currentVersion || 1);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  // Fetch on mount
  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  async function handlePublish() {
    if (!changeSummary.trim() || publishing) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ change_summary: changeSummary }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentVersion(data.version);
        setChangeSummary('');
        setShowPublish(false);
        fetchVersions();
        toast.success(`Published v${data.version}`, { description: 'Client has been notified.' });
      }
    } catch {
      toast.error('Failed to publish');
    } finally {
      setPublishing(false);
    }
  }

  async function handleRestore(versionId: string, versionNumber: number) {
    setRestoring(versionId);
    setConfirmRestoreId(null);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version_id: versionId }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update Zustand store directly — no page reload needed
        const content = data.content as Record<string, unknown>;
        const sectionsConfig = data.sectionsConfig;
        if (content) {
          for (const [key, value] of Object.entries(content)) {
            updateSection(key as SectionKey, value as SectionDataMap[SectionKey]);
          }
        }
        if (sectionsConfig) {
          setSectionsConfig(sectionsConfig);
        }
        setLastSaved(new Date());
        toast.success(`Restored to v${versionNumber}`, {
          description: 'Publish to notify your client of the changes.',
        });
      }
    } catch {
      toast.error('Failed to restore version');
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div className="ed-versions">
      {/* Publish button */}
      <button
        onClick={() => setShowPublish(true)}
        className="w-full rounded-lg py-2 px-3 text-[12px] font-[550] text-white transition-all hover:opacity-90"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
          fontFamily: 'inherit',
        }}
      >
        Publish &amp; Notify Client
      </button>

      <p className="mt-1.5 mb-3 text-[10px] text-[#3a3f45] text-center">
        Current: v{currentVersion}
      </p>

      {/* Publish modal */}
      {showPublish && (
        <div className="mb-3 rounded-lg border border-[#23252a] bg-[#0c0d0e] p-3">
          <p className="text-[11px] font-[600] uppercase tracking-wider text-[#3a3f45] mb-2">
            What changed?
          </p>
          <textarea
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
            placeholder="e.g. Revised timeline to 8 weeks, split payment into 3 milestones"
            rows={3}
            className="w-full resize-none rounded-md px-2.5 py-2 text-[12px] text-white bg-[#08090a] border border-[#1a1c20] outline-none placeholder:text-[#3a3f45] focus:border-[#6366f1] transition-colors"
            style={{ fontFamily: 'inherit' }}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => { setShowPublish(false); setChangeSummary(''); }}
              className="flex-1 rounded-md py-1.5 text-[11px] font-[500] text-[#62666d] border border-[#1a1c20] bg-transparent hover:text-white transition-colors"
              style={{ fontFamily: 'inherit' }}
            >
              Cancel
            </button>
            <button
              onClick={handlePublish}
              disabled={!changeSummary.trim() || publishing}
              className="flex-1 rounded-md py-1.5 text-[11px] font-[550] text-white disabled:opacity-40 transition-all"
              style={{
                fontFamily: 'inherit',
                background: publishing ? '#374151' : '#6366f1',
              }}
            >
              {publishing ? 'Publishing...' : `Publish v${currentVersion + 1}`}
            </button>
          </div>
        </div>
      )}

      {/* Version list */}
      {loading && versions.length === 0 ? (
        <div className="text-center py-4">
          <div className="h-3 w-3 mx-auto animate-spin rounded-full border-2 border-[#23252a] border-t-[#62666d]" />
        </div>
      ) : versions.length === 0 ? (
        <p className="text-[11px] text-[#3a3f45] text-center py-2">
          No published versions yet
        </p>
      ) : (
        <div className="space-y-1.5">
          {versions.map((v) => (
            <div
              key={v.id}
              className="rounded-md border border-[#1a1c20] bg-[#0c0d0e] px-3 py-2 group transition-colors hover:border-[#23252a]"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] font-[600] text-[#8a8f98]">
                  v{v.version_number}
                </span>
                <span className="text-[10px] text-[#3a3f45]">
                  {new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-[11px] text-[#62666d] leading-[1.5] line-clamp-2">
                {v.change_summary || 'Initial version'}
              </p>
              {v.changed_sections.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {v.changed_sections.slice(0, 3).map((s) => (
                    <span key={s} className="inline-block rounded px-1 py-0.5 text-[9px] font-[500] uppercase tracking-wider bg-indigo-500/10 text-indigo-400">
                      {SECTION_NAMES[s as SectionKey] || s}
                    </span>
                  ))}
                  {v.changed_sections.length > 3 && (
                    <span className="text-[9px] text-[#3a3f45]">+{v.changed_sections.length - 3}</span>
                  )}
                </div>
              )}
              {/* Restore feature — commented out, backend logic preserved for future use
              {v.version_number !== currentVersion && (
                <>
                  {confirmRestoreId === v.id ? (
                    <div className="mt-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-2.5 py-2">
                      <p className="text-[11px] text-amber-300/80 mb-2">
                        Restore to v{v.version_number}? Your current draft will be replaced.
                      </p>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setConfirmRestoreId(null)}
                          className="flex-1 rounded py-1 text-[10px] font-[500] text-[#62666d] border border-[#1a1c20] bg-transparent hover:text-white transition-colors"
                          style={{ fontFamily: 'inherit' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleRestore(v.id, v.version_number)}
                          disabled={restoring === v.id}
                          className="flex-1 rounded py-1 text-[10px] font-[550] text-white bg-amber-600 hover:bg-amber-500 transition-colors disabled:opacity-50"
                          style={{ fontFamily: 'inherit' }}
                        >
                          {restoring === v.id ? 'Restoring...' : 'Confirm'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRestoreId(v.id)}
                      disabled={restoring === v.id}
                      className="mt-1.5 text-[10px] font-[500] text-[#3a3f45] hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100"
                      style={{ fontFamily: 'inherit' }}
                    >
                      {restoring === v.id ? 'Restoring...' : '↩ Restore this version'}
                    </button>
                  )}
                </>
              )}
              */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Section List with DnD ──
function SectionList({ expandedSection, onExpand }: { expandedSection: SectionKey | null; onExpand: (k: SectionKey | null) => void }) {
  const sectionsConfig = useProposalEditor((s) => s.sectionsConfig);
  const toggleVis = useProposalEditor((s) => s.toggleSectionVisibility);
  const reorder = useProposalEditor((s) => s.reorderSections);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor));
  const middleKeys = sectionsConfig.order.filter((k) => k !== 'cover' && k !== 'cta');

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = middleKeys.indexOf(active.id as string as typeof middleKeys[number]);
    const newIdx = middleKeys.indexOf(over.id as string as typeof middleKeys[number]);
    if (oldIdx === -1 || newIdx === -1) return;
    const newMiddle = arrayMove(middleKeys, oldIdx, newIdx);
    reorder(['cover', ...newMiddle, 'cta']);
  }

  return (
    <div>
      {/* Cover — fixed, always shown */}
      <SectionRow sectionKey="cover" isVisible={true} locked onToggle={() => {}} isExpanded={expandedSection === 'cover'} onExpand={() => onExpand(expandedSection === 'cover' ? null : 'cover')} />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={middleKeys} strategy={verticalListSortingStrategy}>
          {middleKeys.map((key) => (
            <SortableSectionRow
              key={key}
              sectionKey={key}
              isVisible={sectionsConfig.visibility[key]}
              onToggle={() => toggleVis(key)}
              isExpanded={expandedSection === key}
              onExpand={() => onExpand(expandedSection === key ? null : key)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* CTA — fixed, always shown */}
      <SectionRow sectionKey="cta" isVisible={true} locked onToggle={() => {}} isExpanded={expandedSection === 'cta'} onExpand={() => onExpand(expandedSection === 'cta' ? null : 'cta')} />
    </div>
  );
}

// ── Sortable wrapper ──
function SortableSectionRow(props: { sectionKey: SectionKey; isVisible: boolean; onToggle: () => void; isExpanded: boolean; onExpand: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: props.sectionKey });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style}>
      <SectionRow {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

// ── Section Row ──
function SectionRow({ sectionKey, isVisible, locked, onToggle, dragHandleProps, isExpanded, onExpand }: {
  sectionKey: SectionKey; isVisible: boolean; locked?: boolean; onToggle: () => void;
  dragHandleProps?: Record<string, unknown>; isExpanded: boolean; onExpand: () => void;
}) {
  return (
    <div className="ed-section-row">
      <div className="ed-section-row__header">
        {dragHandleProps ? (
          <span className="ed-section-row__drag" {...dragHandleProps}>⋮⋮</span>
        ) : (
          <span className="ed-section-row__drag locked">⊙</span>
        )}
        <button className="ed-section-row__name" onClick={onExpand}>
          {SECTION_NAMES[sectionKey]}
          <span className="ed-section-row__chevron" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)' }}>›</span>
        </button>
        {!locked && (
          <button className={`ed-section-row__toggle ${isVisible ? 'on' : 'off'}`} onClick={onToggle} title={isVisible ? 'Hide section' : 'Show section'}>
            <span className="ed-section-row__toggle-dot" />
          </button>
        )}
      </div>
      {isExpanded && <SectionEditor sectionKey={sectionKey} />}
    </div>
  );
}

// ── Section Editor (accordion content) ──
function SectionEditor({ sectionKey }: { sectionKey: SectionKey }) {
  const editedContent = useProposalEditor((s) => s.editedContent);
  const updateSection = useProposalEditor((s) => s.updateSection);
  const data = editedContent[sectionKey];
  if (!data) return null;

  // Helper to update a field
  const update = (field: string, value: unknown) => {
    updateSection(sectionKey, { ...data, [field]: value } as SectionDataMap[typeof sectionKey]);
  };

  switch (sectionKey) {
    case 'cover': {
      const d = data as SectionDataMap['cover'];
      return (
        <div className="ed-fields">
          <FieldInput label="Title" value={d.title} onChange={(v) => update('title', v)} />
          <FieldInput label="Subtitle" value={d.subtitle} onChange={(v) => update('subtitle', v)} />
        </div>
      );
    }
    case 'problem':
    case 'solution':
    case 'about': {
      const d = data as SectionDataMap['problem'];
      return (
        <div className="ed-fields">
          <FieldInput label="Headline" value={d.headline} onChange={(v) => update('headline', v)} />
          <FieldTextarea label="Body" value={d.body} onChange={(v) => update('body', v)} />
        </div>
      );
    }
    case 'approach': {
      const d = data as SectionDataMap['approach'];
      return (
        <div className="ed-fields">
          <FieldInput label="Headline" value={d.headline} onChange={(v) => update('headline', v)} />
          <ListEditor
            items={d.steps}
            renderItem={(step, i, onUpdate, onDelete) => (
              <div key={i} className="ed-list-item">
                <FieldInput label={`Step ${i + 1}`} value={step.title} onChange={(v) => onUpdate({ ...step, title: v })} />
                <FieldTextarea label="Description" value={step.description} onChange={(v) => onUpdate({ ...step, description: v })} />
                <button className="ed-list-delete" onClick={onDelete}>Remove</button>
              </div>
            )}
            onUpdate={(steps) => update('steps', steps)}
            newItem={() => ({ title: '', description: '' })}
            addLabel="Add Step"
          />
        </div>
      );
    }
    case 'deliverables': {
      const d = data as SectionDataMap['deliverables'];
      return (
        <div className="ed-fields">
          <FieldInput label="Headline" value={d.headline} onChange={(v) => update('headline', v)} />
          <ListEditor
            items={d.items}
            renderItem={(item, i, onUpdate, onDelete) => (
              <div key={i} className="ed-list-item">
                <FieldInput label={`Item ${i + 1}`} value={item.name} onChange={(v) => onUpdate({ ...item, name: v })} />
                <FieldTextarea label="Description" value={item.description} onChange={(v) => onUpdate({ ...item, description: v })} />
                <button className="ed-list-delete" onClick={onDelete}>Remove</button>
              </div>
            )}
            onUpdate={(items) => update('items', items)}
            newItem={() => ({ name: '', description: '' })}
            addLabel="Add Deliverable"
          />
        </div>
      );
    }
    case 'timeline': {
      const d = data as SectionDataMap['timeline'];
      return (
        <div className="ed-fields">
          <FieldInput label="Headline" value={d.headline} onChange={(v) => update('headline', v)} />
          <ListEditor
            items={d.phases}
            renderItem={(phase, i, onUpdate, onDelete) => (
              <div key={i} className="ed-list-item">
                <FieldInput label="Phase" value={phase.phase} onChange={(v) => onUpdate({ ...phase, phase: v })} />
                <FieldInput label="Duration" value={phase.duration} onChange={(v) => onUpdate({ ...phase, duration: v })} />
                <FieldTextarea label="Description" value={phase.description} onChange={(v) => onUpdate({ ...phase, description: v })} />
                <button className="ed-list-delete" onClick={onDelete}>Remove</button>
              </div>
            )}
            onUpdate={(phases) => update('phases', phases)}
            newItem={() => ({ phase: '', duration: '', description: '' })}
            addLabel="Add Phase"
          />
        </div>
      );
    }
    case 'pricing': {
      const d = data as SectionDataMap['pricing'];
      return (
        <div className="ed-fields">
          <FieldInput label="Headline" value={d.headline} onChange={(v) => update('headline', v)} />
          <FieldTextarea label="Summary" value={d.summary} onChange={(v) => update('summary', v)} />
          <FieldInput label="Note" value={d.note} onChange={(v) => update('note', v)} />
          <ListEditor
            items={d.lineItems}
            renderItem={(item, i, onUpdate, onDelete) => (
              <div key={i} className="ed-list-item ed-list-item--row">
                <FieldInput label="Label" value={item.label} onChange={(v) => onUpdate({ ...item, label: v })} />
                <FieldInput label="Amount ($)" value={String(item.amount / 100)} onChange={(v) => onUpdate({ ...item, amount: Math.round(parseFloat(v || '0') * 100) })} />
                <button className="ed-list-delete" onClick={onDelete}>×</button>
              </div>
            )}
            onUpdate={(lineItems) => {
              const total = lineItems.reduce((sum, li) => sum + li.amount, 0);
              updateSection('pricing', { ...d, lineItems, total });
            }}
            newItem={() => ({ label: '', amount: 0 })}
            addLabel="Add Line Item"
          />
          <div className="ed-field-total">Total: ${((d.total || 0) / 100).toLocaleString()}</div>
        </div>
      );
    }
    case 'faq': {
      const d = data as SectionDataMap['faq'];
      return (
        <div className="ed-fields">
          <FieldInput label="Headline" value={d.headline} onChange={(v) => update('headline', v)} />
          <ListEditor
            items={d.items}
            renderItem={(item, i, onUpdate, onDelete) => (
              <div key={i} className="ed-list-item">
                <FieldInput label="Question" value={item.question} onChange={(v) => onUpdate({ ...item, question: v })} />
                <FieldTextarea label="Answer" value={item.answer} onChange={(v) => onUpdate({ ...item, answer: v })} />
                <button className="ed-list-delete" onClick={onDelete}>Remove</button>
              </div>
            )}
            onUpdate={(items) => update('items', items)}
            newItem={() => ({ question: '', answer: '' })}
            addLabel="Add FAQ"
          />
        </div>
      );
    }
    case 'cta': {
      const d = data as SectionDataMap['cta'];
      return (
        <div className="ed-fields">
          <FieldInput label="Headline" value={d.headline} onChange={(v) => update('headline', v)} />
          <FieldTextarea label="Body" value={d.body} onChange={(v) => update('body', v)} />
          <FieldInput label="Button Label" value={d.buttonLabel} onChange={(v) => update('buttonLabel', v)} />
        </div>
      );
    }
    default: return null;
  }
}

// ── Template Picker ──
function TemplatePicker() {
  const templateId = useProposalEditor((s) => s.templateId);
  const setTemplate = useProposalEditor((s) => s.setTemplate);

  return (
    <div className="ed-template-grid">
      {Object.entries(TEMPLATE_REGISTRY).map(([id, entry]) => (
        <button key={id} className={`ed-template-card ${id === templateId ? 'active' : ''}`} onClick={() => setTemplate(id)}>
          <div className="ed-template-card__preview" style={{ background: id === 'dark-editorial' ? '#0c0c10' : '#fafafa' }}>
            <span style={{ color: id === 'dark-editorial' ? '#e0e0e8' : '#1a1a1a', fontSize: '0.65rem' }}>{entry.name.charAt(0)}</span>
          </div>
          <span className="ed-template-card__name">{entry.name}</span>
        </button>
      ))}
    </div>
  );
}

// ── Theme Picker ──
function ThemePicker() {
  const templateId = useProposalEditor((s) => s.templateId);
  const themeId = useProposalEditor((s) => s.themeId);
  const setTheme = useProposalEditor((s) => s.setTheme);
  const entry = resolveTemplate(templateId);

  return (
    <div className="ed-theme-row">
      {Object.entries(entry.themes).map(([id, theme]) => (
        <button
          key={id}
          className={`ed-theme-dot ${id === themeId ? 'active' : ''}`}
          onClick={() => setTheme(id)}
          title={id}
          style={{ background: theme.accent, borderColor: id === themeId ? theme.accent : 'transparent' }}
        />
      ))}
    </div>
  );
}

// ── Expiry Picker ──
const EXPIRY_OPTIONS = [
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
  { label: 'No expiry', days: 0 },
];

function ExpiryPicker() {
  const expiresAt = useProposalEditor((s) => s.expiresAt);
  const setExpiresAt = useProposalEditor((s) => s.setExpiresAt);

  // Determine the closest matching option from the current expiresAt
  function getSelectedDays(): number {
    if (!expiresAt) return 0;
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 7; // expired — default to 7 days if they change it
    const days = Math.round(diff / (24 * 60 * 60 * 1000));
    if (days <= 10) return 7;
    if (days <= 21) return 14;
    return 30;
  }

  function handleChange(days: number) {
    if (days === 0) {
      setExpiresAt(null);
    } else {
      setExpiresAt(new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString());
    }
  }

  const selectedDays = getSelectedDays();

  // Format the expiry date for display
  const expiryDisplay = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="ed-expiry">
      <div className="ed-expiry__buttons">
        {EXPIRY_OPTIONS.map((opt) => (
          <button
            key={opt.days}
            className={`ed-expiry__btn ${selectedDays === opt.days ? 'active' : ''}`}
            onClick={() => handleChange(opt.days)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {expiryDisplay && (
        <div className="ed-expiry__date">
          Expires: {expiryDisplay}
        </div>
      )}
    </div>
  );
}

// ── Advance Payment Panel ──────────────────────────────────────
function AdvancePaymentPanel({ proposalMeta }: { proposalMeta: { projectTitle: string; clientName: string; clientEmail: string; amount: number; currency: string; createdAt: string } }) {
  const proposalId = useProposalEditor((s) => s.proposalId);

  // Local state — loaded from DB on mount
  const [enabled, setEnabled] = useState(false);
  const [amountType, setAmountType] = useState<'percent' | 'fixed'>('percent');
  const [percent, setPercent] = useState<string>('50');
  const [fixedAmount, setFixedAmount] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'instructions' | 'link'>('instructions');
  const [value, setValue] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load existing values from the proposal
  useEffect(() => {
    if (!proposalId || loaded) return;
    fetch(`/api/proposals/${proposalId}`)
      .then((r) => r.json())
      .then((p) => {
        if (p.advance_payment_enabled) setEnabled(true);
        if (p.advance_payment_type) setPaymentType(p.advance_payment_type);
        if (p.advance_payment_value) setValue(p.advance_payment_value);
        if (p.advance_payment_percent != null) {
          setAmountType('percent');
          setPercent(String(p.advance_payment_percent));
        } else if (p.advance_payment_amount != null) {
          setAmountType('fixed');
          setFixedAmount(String(p.advance_payment_amount / 100));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [proposalId, loaded]);

  const save = useCallback(async (patch: Record<string, unknown>) => {
    if (!proposalId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error('Failed to save advance payment settings');
    } finally {
      setSaving(false);
    }
  }, [proposalId]);

  function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    save({ advance_payment_enabled: next });
  }

  function handleSaveAll() {
    const patch: Record<string, unknown> = {
      advance_payment_enabled: enabled,
      advance_payment_type: paymentType,
      advance_payment_value: value.trim() || null,
      advance_payment_amount: null,
      advance_payment_percent: null,
    };
    if (amountType === 'percent') {
      patch.advance_payment_percent = Math.min(100, Math.max(1, parseInt(percent) || 50));
    } else {
      patch.advance_payment_amount = Math.round(parseFloat(fixedAmount || '0') * 100);
    }
    save(patch).then(() => toast.success('Advance payment settings saved'));
  }

  // Compute preview amount
  const previewAmount = (() => {
    const total = proposalMeta.amount || 0;
    if (amountType === 'percent') {
      const pct = parseInt(percent) || 0;
      return total > 0 ? Math.round(total * pct / 100) : null;
    } else {
      const fixed = Math.round(parseFloat(fixedAmount || '0') * 100);
      return fixed > 0 ? fixed : null;
    }
  })();

  const fmt = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: proposalMeta.currency?.toUpperCase() || 'USD' }).format(cents / 100);

  return (
    <div>
      {/* Toggle row */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[13px] font-[520] text-[#c9cdd3]">Request advance payment</p>
          <p className="text-[11px] text-[#3a3f45] mt-0.5">Client must pay before accepting</p>
        </div>
        <button
          onClick={handleToggle}
          className="relative flex-shrink-0"
          style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', background: enabled ? '#6366f1' : '#23252a', transition: 'background 0.22s', padding: 0 }}
          aria-label={enabled ? 'Disable advance payment' : 'Enable advance payment'}
        >
          <motion.span
            animate={{ x: enabled ? 16 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            style={{
              display: 'block', width: 16, height: 16, borderRadius: '50%',
              background: '#fff', position: 'absolute', top: 2,
            }}
          />
        </button>
      </div>

      {/* Collapsible panel */}
      <AnimatePresence>
        {enabled && (
          <motion.div
            key="ap-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="space-y-3">

              {/* Amount type */}
              <div>
                <p className="text-[11px] font-[600] uppercase tracking-wider text-[#3a3f45] mb-1.5">Amount</p>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {(['percent', 'fixed'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setAmountType(t)}
                      className={`rounded-md py-1.5 text-[12px] font-[520] transition-all border ${
                        amountType === t
                          ? 'border-[#6366f1] bg-[#6366f1]/10 text-[#c9cdd3]'
                          : 'border-[#1a1c20] bg-[#08090a] text-[#62666d] hover:border-[#23252a] hover:text-[#8a8f98]'
                      }`}
                      style={{ fontFamily: 'inherit' }}
                    >
                      {t === 'percent' ? 'Percentage' : 'Fixed Amount'}
                    </button>
                  ))}
                </div>

                {amountType === 'percent' ? (
                  <div className="relative">
                    <input
                      type="number" min={1} max={100}
                      value={percent}
                      onChange={(e) => setPercent(e.target.value)}
                      className="w-full rounded-md border border-[#1a1c20] bg-[#08090a] px-3 py-2 pr-8 text-[13px] text-white outline-none focus:border-[#3a3f45] transition-colors"
                      style={{ fontFamily: 'inherit' }}
                      placeholder="50"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#3a3f45]">%</span>
                  </div>
                ) : (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#3a3f45]">
                      {proposalMeta.currency?.toUpperCase() === 'INR' ? '₹' : '$'}
                    </span>
                    <input
                      type="number" min={0}
                      value={fixedAmount}
                      onChange={(e) => setFixedAmount(e.target.value)}
                      className="w-full rounded-md border border-[#1a1c20] bg-[#08090a] pl-7 pr-3 py-2 text-[13px] text-white outline-none focus:border-[#3a3f45] transition-colors"
                      style={{ fontFamily: 'inherit' }}
                      placeholder="5000"
                    />
                  </div>
                )}

                {/* Amount preview */}
                {previewAmount && previewAmount > 0 && (
                  <p className="mt-1.5 text-[11px] text-[#6366f1] font-[500]">
                    Client pays {fmt(previewAmount)} upfront
                  </p>
                )}
              </div>

              {/* Payment method */}
              <div>
                <p className="text-[11px] font-[600] uppercase tracking-wider text-[#3a3f45] mb-1.5">Payment Method</p>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {(['instructions', 'link'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setPaymentType(t)}
                      className={`rounded-md py-1.5 text-[12px] font-[520] transition-all border ${
                        paymentType === t
                          ? 'border-[#6366f1] bg-[#6366f1]/10 text-[#c9cdd3]'
                          : 'border-[#1a1c20] bg-[#08090a] text-[#62666d] hover:border-[#23252a] hover:text-[#8a8f98]'
                      }`}
                      style={{ fontFamily: 'inherit' }}
                    >
                      {t === 'instructions' ? 'Instructions' : 'Payment Link'}
                    </button>
                  ))}
                </div>

                {paymentType === 'instructions' ? (
                  <textarea
                    rows={3}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="e.g. UPI ID: 9327603241@ybl&#10;Bank: HDFC — Acc: 50100...&#10;SWIFT: HDFCINBB"
                    className="w-full resize-none rounded-md border border-[#1a1c20] bg-[#08090a] px-3 py-2 text-[12px] text-[#c9cdd3] outline-none focus:border-[#3a3f45] placeholder:text-[#3a3f45] transition-colors"
                    style={{ fontFamily: 'inherit' }}
                  />
                ) : (
                  <input
                    type="url"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="https://buy.stripe.com/..."
                    className="w-full rounded-md border border-[#1a1c20] bg-[#08090a] px-3 py-2 text-[12px] text-[#c9cdd3] outline-none focus:border-[#3a3f45] placeholder:text-[#3a3f45] transition-colors"
                    style={{ fontFamily: 'inherit' }}
                  />
                )}
              </div>

              {/* Save */}
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="w-full rounded-md py-2 text-[12px] font-[550] text-white transition-all disabled:opacity-50"
                style={{
                  fontFamily: 'inherit',
                  background: saving ? '#374151' : '#6366f1',
                }}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Field Components ──
function FieldInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="ed-field">
      <span className="ed-field__label">{label}</span>
      <input className="ed-field__input" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function FieldTextarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="ed-field">
      <span className="ed-field__label">{label}</span>
      <textarea className="ed-field__textarea" value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
    </label>
  );
}

// ── Generic List Editor ──
function ListEditor<T>({ items, renderItem, onUpdate, newItem, addLabel }: {
  items: T[]; renderItem: (item: T, index: number, onUpdate: (item: T) => void, onDelete: () => void) => React.ReactNode;
  onUpdate: (items: T[]) => void; newItem: () => T; addLabel: string;
}) {
  return (
    <div className="ed-list">
      {items.map((item, i) =>
        renderItem(
          item, i,
          (updated) => { const next = [...items]; next[i] = updated; onUpdate(next); },
          () => { const next = items.filter((_, j) => j !== i); onUpdate(next); }
        )
      )}
      <button className="ed-list-add" onClick={() => onUpdate([...items, newItem()])}>+ {addLabel}</button>
    </div>
  );
}

// ── Styles — matched to dashboard design tokens ──
const SIDEBAR_CSS = `
.ed-sidebar { padding: 0; font-family: 'Inter Variable', -apple-system, system-ui, sans-serif; }
.ed-sidebar__header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem;
  padding: 1rem 1rem; border-bottom: 1px solid #23252a;
}
.ed-sidebar__header-left {
  display: flex; align-items: flex-start; gap: 0.6rem; min-width: 0;
}
.ed-sidebar__back {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0;
  color: #62666d; text-decoration: none; font-size: 0.9rem;
  transition: background 0.15s, color 0.15s; margin-top: 1px;
}
.ed-sidebar__back:hover { background: #14161a; color: white; }
.ed-sidebar__title {
  font-size: 14px; font-weight: 550; letter-spacing: -0.02em;
  color: white; margin: 0 0 0.25rem;
}
.ed-sidebar__actions {
  display: flex; align-items: center; gap: 0.35rem;
}
.ed-sidebar__share {
  padding: 0.4rem 0.8rem; font-size: 12px; font-weight: 500;
  background: #0c0d0e; border: 1px solid #1a1c20;
  color: #8a8f98; border-radius: 6px; cursor: pointer;
  white-space: nowrap; font-family: inherit;
  transition: background 0.15s, color 0.15s;
}
.ed-sidebar__share:hover { background: #14161a; color: white; }
.ed-save-status { font-size: 11px; font-weight: 500; }
.ed-save-status.saving { color: #fbbf24; }
.ed-save-status.dirty { color: #62666d; }
.ed-save-status.saved { color: #4ade80; }

.ed-sidebar__group { border-bottom: 1px solid #23252a; padding: 1rem; }
.ed-sidebar__group-title {
  font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
  color: #3a3f45; margin: 0 0 0.75rem;
}

/* Section rows */
.ed-section-row { border-bottom: 1px solid #1a1c20; }
.ed-section-row:last-child { border-bottom: none; }
.ed-section-row__header {
  display: flex; align-items: center; gap: 0.5rem; padding: 0.55rem 0;
}
.ed-section-row__drag {
  font-size: 0.7rem; color: #3a3f45; cursor: grab; user-select: none; width: 16px; text-align: center;
}
.ed-section-row__drag.locked { cursor: default; color: #23252a; }
.ed-section-row__name {
  flex: 1; text-align: left; background: none; border: none; color: #c9cdd3;
  font-size: 13px; font-weight: 520; cursor: pointer; font-family: inherit;
  display: flex; align-items: center; gap: 0.4rem;
  transition: color 0.15s;
}
.ed-section-row__name:hover { color: white; }
.ed-section-row__chevron {
  font-size: 0.85rem; color: #3a3f45; transition: transform 0.15s;
}
.ed-section-row__toggle {
  width: 32px; height: 18px; border-radius: 9px; border: none; cursor: pointer;
  position: relative; transition: background 0.2s;
}
.ed-section-row__toggle.on { background: #6366f1; }
.ed-section-row__toggle.off { background: #23252a; }
.ed-section-row__toggle-dot {
  position: absolute; top: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff;
  transition: left 0.2s;
}
.ed-section-row__toggle.on .ed-section-row__toggle-dot { left: 16px; }
.ed-section-row__toggle.off .ed-section-row__toggle-dot { left: 2px; }

/* Fields */
.ed-fields { padding: 0.5rem 0 0.75rem 1.5rem; display: flex; flex-direction: column; gap: 0.6rem; }
.ed-field { display: flex; flex-direction: column; gap: 0.25rem; }
.ed-field__label {
  font-size: 11px; font-weight: 600; color: #3a3f45;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.ed-field__input, .ed-field__textarea {
  padding: 0.5rem 0.6rem; font-size: 13px; font-weight: 400;
  background: #0c0d0e; border: 1px solid #1a1c20;
  border-radius: 6px; color: #c9cdd3; font-family: inherit;
  resize: vertical; outline: none; transition: border-color 0.15s;
}
.ed-field__input:focus, .ed-field__textarea:focus { border-color: #3a3f45; }
.ed-field__input::placeholder, .ed-field__textarea::placeholder { color: #3a3f45; }

/* Lists */
.ed-list { display: flex; flex-direction: column; gap: 0.5rem; }
.ed-list-item {
  padding: 0.5rem; background: #0c0d0e; border: 1px solid #1a1c20;
  border-radius: 6px; display: flex; flex-direction: column; gap: 0.4rem;
}
.ed-list-item--row { flex-direction: row; align-items: flex-end; gap: 0.5rem; }
.ed-list-item--row .ed-field { flex: 1; }
.ed-list-delete {
  font-size: 12px; color: #62666d; background: none; border: none; cursor: pointer;
  padding: 0.2rem 0; font-family: inherit; text-align: left;
  transition: color 0.15s;
}
.ed-list-delete:hover { color: #f87171; }
.ed-list-add {
  font-size: 12px; font-weight: 500; color: #62666d;
  background: none; border: 1px dashed #23252a;
  border-radius: 6px; padding: 0.5rem; cursor: pointer; font-family: inherit;
  transition: color 0.15s, border-color 0.15s;
}
.ed-list-add:hover { color: #8a8f98; border-color: #3a3f45; }
.ed-field-total {
  font-size: 13px; font-weight: 600; color: white; padding: 0.5rem 0;
}

/* Template picker */
.ed-template-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
.ed-template-card {
  padding: 0.5rem; background: #0c0d0e; border: 1px solid #1a1c20;
  border-radius: 8px; cursor: pointer; text-align: center; font-family: inherit;
  transition: border-color 0.15s;
}
.ed-template-card:hover { border-color: #3a3f45; }
.ed-template-card.active { border-color: #6366f1; background: rgba(99,102,241,0.06); }
.ed-template-card__preview {
  width: 100%; aspect-ratio: 4/3; border-radius: 4px; display: flex;
  align-items: center; justify-content: center; margin-bottom: 0.35rem;
}
.ed-template-card__name { font-size: 11px; color: #62666d; font-weight: 520; }

/* Theme picker */
.ed-theme-row { display: flex; gap: 0.6rem; flex-wrap: wrap; }
.ed-theme-dot {
  width: 26px; height: 26px; border-radius: 50%; border: 2px solid transparent;
  cursor: pointer; transition: border-color 0.15s, transform 0.15s;
}
.ed-theme-dot.active { transform: scale(1.15); border-color: white; }
.ed-theme-dot:hover { transform: scale(1.1); }

/* Expiry picker */
.ed-expiry { display: flex; flex-direction: column; gap: 0.5rem; }
.ed-expiry__buttons {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem;
}
.ed-expiry__btn {
  padding: 0.45rem 0.5rem; font-size: 12px; font-weight: 500;
  background: #0c0d0e; border: 1px solid #1a1c20;
  color: #62666d; border-radius: 6px; cursor: pointer;
  font-family: inherit; transition: all 0.15s;
}
.ed-expiry__btn:hover { border-color: #3a3f45; color: #8a8f98; }
.ed-expiry__btn.active {
  border-color: #6366f1; color: #c9cdd3;
  background: rgba(99,102,241,0.08);
}
.ed-expiry__date {
  font-size: 11px; color: #3a3f45; font-weight: 500;
  padding-left: 0.1rem;
}

/* Version history */
.ed-versions { display: flex; flex-direction: column; }
`;
