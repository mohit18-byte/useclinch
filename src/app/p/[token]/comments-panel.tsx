'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Comment {
  id: string;
  section_key: string | null;
  author_name: string;
  message: string;
  created_at: string;
}

interface CommentsPanelProps {
  token: string;
  clientName: string;
  sectionKeys: string[];
}

const SECTION_LABELS: Record<string, string> = {
  cover: 'Cover', problem: 'Problem', solution: 'Solution',
  approach: 'Approach', deliverables: 'Deliverables', timeline: 'Timeline',
  pricing: 'Pricing', about: 'About', faq: 'FAQ', cta: 'Call to Action',
};

export default function CommentsPanel({ token, clientName, sectionKeys }: CommentsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [authorName, setAuthorName] = useState(clientName);
  const [sectionKey, setSectionKey] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasNewBadge, setHasNewBadge] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hosted/${token}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isOpen, comments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !authorName.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/hosted/${token}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_key: sectionKey || null,
          author_name: authorName.trim(),
          message: message.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setMessage('');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  // Visible sections (exclude cover and cta usually)
  const commentableSections = sectionKeys.filter((k) => k !== 'cover' && k !== 'cta');

  return (
    <>
      {/* ── Floating trigger button ── */}
      <button
        onClick={() => { setIsOpen(true); setHasNewBadge(false); }}
        className="fixed bottom-24 right-6 z-[85] flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-[520] shadow-2xl transition-all duration-200 hover:scale-105"
        style={{
          background: 'rgba(10, 10, 14, 0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#c9cdd3',
          fontFamily: "'Inter Variable', -apple-system, system-ui, sans-serif",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 3.5C2 2.67 2.67 2 3.5 2h9c.83 0 1.5.67 1.5 1.5v7c0 .83-.67 1.5-1.5 1.5H5.5L2 14.5V3.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          <circle cx="5.5" cy="7" r="0.75" fill="currentColor"/>
          <circle cx="8" cy="7" r="0.75" fill="currentColor"/>
          <circle cx="10.5" cy="7" r="0.75" fill="currentColor"/>
        </svg>
        Questions?
        {(hasNewBadge || comments.length > 0) && (
          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-[600] text-white">
            {comments.length}
          </span>
        )}
      </button>

      {/* ── Bottom-right popup ── */}
      {isOpen && (
        <div className="fixed inset-0 z-[100]" style={{ fontFamily: "'Inter Variable', -apple-system, system-ui, sans-serif" }}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsOpen(false)}
          />

          {/* Popup anchored above the button */}
          <div
            className="absolute bottom-24 right-6 flex flex-col w-[400px] max-h-[70vh] rounded-xl border shadow-2xl"
            style={{
              background: '#0f1011',
              borderColor: '#1a1c20',
              animation: 'popUp 0.2s ease-out',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#1a1c20' }}>
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: '#14161a' }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M2 3.5C2 2.67 2.67 2 3.5 2h9c.83 0 1.5.67 1.5 1.5v7c0 .83-.67 1.5-1.5 1.5H5.5L2 14.5V3.5z" stroke="#62666d" strokeWidth="1.2" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="text-[14px] font-[550] tracking-[-0.02em] text-white">
                  Questions & Comments
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[#62666d] transition-colors hover:bg-[#14161a] hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Comments list */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
              {loading && comments.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#23252a] border-t-[#62666d]" />
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: '#14161a' }}>
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                      <path d="M2 3.5C2 2.67 2.67 2 3.5 2h9c.83 0 1.5.67 1.5 1.5v7c0 .83-.67 1.5-1.5 1.5H5.5L2 14.5V3.5z" stroke="#3a3f45" strokeWidth="1.2" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-[13px] font-[500] text-[#62666d]">No comments yet</p>
                  <p className="mt-1 text-[12px] text-[#3a3f45]">
                    Have a question about this proposal? Ask below.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-lg p-3"
                      style={{ background: '#14161a', border: '1px solid #1a1c20' }}
                    >
                      {/* Section tag */}
                      {comment.section_key && (
                        <span
                          className="mb-2 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-[500] uppercase tracking-wider"
                          style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}
                        >
                          {SECTION_LABELS[comment.section_key] || comment.section_key}
                        </span>
                      )}
                      {!comment.section_key && (
                        <span
                          className="mb-2 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-[500] uppercase tracking-wider"
                          style={{ background: 'rgba(99,102,241,0.06)', color: '#6366f1' }}
                        >
                          General
                        </span>
                      )}

                      {/* Message */}
                      <p className="text-[13px] leading-[1.6] text-[#c9cdd3]">
                        {comment.message}
                      </p>

                      {/* Meta */}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[11px] font-[500] text-[#62666d]">
                          {comment.author_name}
                        </span>
                        <span className="text-[10px] text-[#3a3f45]">·</span>
                        <span className="text-[11px] text-[#3a3f45]">
                          {timeAgo(comment.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Success feedback */}
              {showSuccess && (
                <div
                  className="mt-3 rounded-lg px-3 py-2 text-center text-[12px] font-[500]"
                  style={{ background: 'rgba(34, 197, 94, 0.08)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.15)' }}
                >
                  ✓ Comment sent — the freelancer has been notified
                </div>
              )}
            </div>

            {/* Compose area */}
            <form
              onSubmit={handleSubmit}
              className="border-t px-5 py-4"
              style={{ borderColor: '#1a1c20' }}
            >
              {/* Name input */}
              <div className="mb-3">
                <label className="mb-1.5 block text-[11px] font-[600] uppercase tracking-wider text-[#3a3f45]">
                  Your Name
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-md px-3 py-2 text-[13px] text-white outline-none transition-colors placeholder:text-[#3a3f45]"
                  style={{
                    background: '#08090a',
                    border: '1px solid #1a1c20',
                  }}
                />
              </div>

              {/* Section selector */}
              <div className="mb-3">
                <label className="mb-1.5 block text-[11px] font-[600] uppercase tracking-wider text-[#3a3f45]">
                  About
                </label>
                <Select value={sectionKey || '__general__'} onValueChange={(val) => setSectionKey(val === '__general__' ? '' : val)}>
                  <SelectTrigger
                    className="w-full h-9 rounded-md border-[#1a1c20] bg-[#08090a] px-3 text-[13px] text-[#c9cdd3] hover:border-[#3a3f45] focus:border-indigo-500 focus:ring-indigo-500/20 transition-all cursor-pointer"
                  >
                    <SelectValue placeholder="General Question" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-[#23252a] bg-[#14161a] shadow-2xl">
                    <SelectItem value="__general__" className="text-[13px] text-[#c9cdd3] focus:bg-[#1a1c20] focus:text-white cursor-pointer">
                      General Question
                    </SelectItem>
                    <SelectSeparator className="bg-[#1a1c20]" />
                    {commentableSections.map((key) => (
                      <SelectItem
                        key={key}
                        value={key}
                        className="text-[13px] text-[#c9cdd3] focus:bg-[#1a1c20] focus:text-white cursor-pointer"
                      >
                        {SECTION_LABELS[key] || key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Message */}
              <div className="mb-3">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your question or comment..."
                  rows={3}
                  className="w-full resize-none rounded-md px-3 py-2 text-[13px] text-white outline-none transition-colors placeholder:text-[#3a3f45]"
                  style={{
                    background: '#08090a',
                    border: '1px solid #1a1c20',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={sending || !message.trim() || !authorName.trim()}
                className="w-full rounded-lg py-2.5 text-[13px] font-[550] text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: sending ? '#374151' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: sending ? 'none' : '0 2px 12px rgba(99,102,241,0.25)',
                }}
              >
                {sending ? 'Sending...' : 'Send Comment'}
              </button>
            </form>
          </div>

          <style>{`
            @keyframes popUp {
              from { transform: translateY(10px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
