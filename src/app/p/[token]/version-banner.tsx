'use client';

import { useState, useEffect } from 'react';

interface VersionBannerProps {
  currentVersion: number;
  clientSeenVersion: number | null;
  changedSections: string[];
  updatedAt: string;
  token: string;
}

const SECTION_LABELS: Record<string, string> = {
  cover: 'Cover', problem: 'Problem', solution: 'Solution',
  approach: 'Approach', deliverables: 'Deliverables', timeline: 'Timeline',
  pricing: 'Pricing', about: 'About', faq: 'FAQ', cta: 'Call to Action',
};

export default function VersionBanner({
  currentVersion,
  clientSeenVersion,
  changedSections,
  updatedAt,
  token,
}: VersionBannerProps) {
  const isNew = clientSeenVersion === null || clientSeenVersion < currentVersion;
  const [showHighlight, setShowHighlight] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Mark as seen on mount (fire and forget)
  useEffect(() => {
    if (isNew) {
      fetch(`/api/hosted/${token}/seen`, { method: 'POST' }).catch(() => {});
    }
  }, [isNew, token]);

  if (currentVersion <= 1 || dismissed) return null;

  const dateStr = new Date(updatedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });

  return (
    <>
      {/* Version badge — sticky pill */}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[96] flex items-center gap-2 rounded-full px-3 py-1.5 shadow-xl transition-all"
        style={{
          background: 'rgba(10, 10, 14, 0.88)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
          fontFamily: "'Inter Variable', -apple-system, system-ui, sans-serif",
        }}
      >
        <span className="text-[12px] font-[600] text-white">
          v{currentVersion}
        </span>
        {isNew && (
          <>
            <span className="text-[10px] text-[#3a3f45]">·</span>
            <span className="text-[11px] font-[500] text-indigo-400">
              Updated
            </span>
          </>
        )}
      </div>

      {/* Change banner — shows when new version not yet seen */}
      {isNew && changedSections.length > 0 && (
        <div
          className="relative z-[60]"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.04) 100%)',
            borderBottom: '1px solid rgba(99,102,241,0.12)',
            fontFamily: "'Inter Variable', -apple-system, system-ui, sans-serif",
          }}
        >
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v10M1 6h10" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-[520] text-white">
                  Updated {dateStr} — {changedSections.length} section{changedSections.length !== 1 ? 's' : ''} changed
                </p>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {changedSections.map((s) => (
                    <span
                      key={s}
                      className="rounded px-1.5 py-0.5 text-[10px] font-[500] uppercase tracking-wider bg-indigo-500/10 text-indigo-300"
                    >
                      {SECTION_LABELS[s] || s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowHighlight(!showHighlight);
                }}
                className="rounded-md px-3 py-1.5 text-[11px] font-[520] text-indigo-300 border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors"
              >
                {showHighlight ? 'Hide changes' : 'View changes'}
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="text-[#3a3f45] hover:text-white transition-colors text-[14px]"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inject change-highlighting CSS for changed sections */}
      {showHighlight && (
        <style>{`
          ${changedSections.map((key) => `
            [data-section="${key}"],
            #section-${key} {
              position: relative;
            }
            [data-section="${key}"]::before,
            #section-${key}::before {
              content: '';
              position: absolute;
              inset: 0;
              background: rgba(99, 102, 241, 0.04);
              border-left: 3px solid rgba(99, 102, 241, 0.35);
              pointer-events: none;
              z-index: 1;
              border-radius: 4px;
            }
          `).join('')}
        `}</style>
      )}
    </>
  );
}
