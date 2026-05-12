'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

function useCountdown(expiresAt: string | null) {
  const getRemaining = useCallback(() => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return null;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }, [expiresAt]);

  const [remaining, setRemaining] = useState(getRemaining);
  const isUrgent = useMemo(() => {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() - Date.now() < 86400000;
  }, [expiresAt, remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setRemaining(getRemaining()), 60000);
    return () => clearInterval(id);
  }, [expiresAt, getRemaining]);

  return { remaining, isUrgent };
}
import { Confetti, type ConfettiRef } from '@/components/ui/confetti';

interface AcceptButtonProps {
  token: string;
  clientName: string;
  projectTitle: string;
  isAccepted: boolean;
  expiresAt: string | null;
  signerName: string | null;
  signedAt: string | null;
}

export default function AcceptButton({
  token,
  clientName,
  projectTitle,
  isAccepted: initialAccepted,
  expiresAt,
  signerName: initialSignerName,
  signedAt: initialSignedAt,
}: AcceptButtonProps) {
  const [accepted, setAccepted] = useState(initialAccepted);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signerName, setSignerName] = useState(initialSignerName || clientName);
  const [signedAt, setSignedAt] = useState(initialSignedAt);
  const [nameInput, setNameInput] = useState(clientName);
  const confettiRef = useRef<ConfettiRef>(null);

  // Signature canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const hasDrawn = useRef(false);

  const isExpired = expiresAt ? new Date(expiresAt).getTime() < Date.now() : false;
  const { remaining: expiryRemaining, isUrgent: expiryUrgent } = useCountdown(expiresAt);

  // ── Canvas drawing ──
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2; // 2x for retina
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Style
    ctx.strokeStyle = '#e0e0e8';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    if (confirming) {
      // Small delay for DOM to settle
      setTimeout(initCanvas, 50);
    }
  }, [confirming, initCanvas]);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    isDrawing.current = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!isDrawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    hasDrawn.current = true;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function endDraw() {
    isDrawing.current = false;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
  }

  function getSignatureData(): string | null {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn.current) return null;
    return canvas.toDataURL('image/png');
  }

  // ── Confetti ──
  const fireConfetti = useCallback(() => {
    const fire = confettiRef.current?.fire;
    if (!fire) return;

    fire({
      particleCount: 100,
      spread: 80,
      origin: { x: 0.5, y: 0.9 },
      colors: ['#6366f1', '#8b5cf6', '#22c55e', '#a78bfa', '#34d399'],
    });

    setTimeout(() => {
      fire({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.85 },
        colors: ['#6366f1', '#8b5cf6', '#22c55e', '#a78bfa', '#34d399'],
      });
    }, 150);

    setTimeout(() => {
      fire({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.85 },
        colors: ['#6366f1', '#8b5cf6', '#22c55e', '#a78bfa', '#34d399'],
      });
    }, 300);

    setTimeout(() => {
      fire({
        particleCount: 80,
        spread: 100,
        origin: { x: 0.5, y: 0.8 },
        startVelocity: 45,
        colors: ['#6366f1', '#8b5cf6', '#22c55e', '#a78bfa', '#34d399', '#fbbf24'],
      });
    }, 500);
  }, []);

  // ── Accept handler ──
  async function handleAccept() {
    const signatureData = getSignatureData();
    if (!signatureData) return; // require signature

    setLoading(true);
    try {
      const res = await fetch(`/api/hosted/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature_data: signatureData,
          signer_name: nameInput,
        }),
      });
      if (res.ok) {
        setAccepted(true);
        setConfirming(false);
        setSignerName(nameInput);
        setSignedAt(new Date().toISOString());
        setTimeout(fireConfetti, 200);
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
    }
  }

  // ── Accepted state ──
  if (accepted) {
    const signedDate = signedAt
      ? new Date(signedAt).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : null;

    return (
      <>
        <Confetti
          ref={confettiRef}
          manualstart
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 90,
          background: 'rgba(6, 78, 59, 0.95)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(34, 197, 94, 0.3)',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          fontFamily: "'Inter Variable', -apple-system, system-ui, sans-serif",
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 10l2.5 2.5L13 8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="10" cy="10" r="8" stroke="#22c55e" strokeWidth="1.5"/>
          </svg>
          <span style={{ color: '#bbf7d0', fontSize: '0.92rem', fontWeight: 500 }}>
            Proposal accepted{signerName ? ` — Signed by ${signerName}` : ''}{signedDate ? ` on ${signedDate}` : ''}
          </span>
        </div>
      </>
    );
  }

  // ── Sign & Accept modal ──
  if (confirming) {
    return (
      <>
        <Confetti
          ref={confettiRef}
          manualstart
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: '3rem',
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          fontFamily: "'Inter Variable', -apple-system, system-ui, sans-serif",
        }}>
          <div style={{
            background: '#18181b',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '460px',
            width: '90%',
          }}>
            <h3 style={{
              color: '#f4f4f5',
              fontSize: '1.15rem',
              fontWeight: 600,
              marginBottom: '0.35rem',
            }}>
              Sign &amp; Accept Proposal
            </h3>
            <p style={{
              color: '#a1a1aa',
              fontSize: '0.85rem',
              lineHeight: 1.6,
              marginBottom: '1.25rem',
            }}>
              You&apos;re accepting <strong style={{ color: '#d4d4d8' }}>&ldquo;{projectTitle}&rdquo;</strong>.
              Draw your signature below to confirm.
            </p>

            {/* Name input */}
            <label style={{
              display: 'block',
              marginBottom: '0.85rem',
            }}>
              <span style={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#71717a',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.35rem',
              }}>
                Full Name
              </span>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  background: '#09090b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#f4f4f5',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </label>

            {/* Signature pad */}
            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.35rem',
              }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#71717a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Signature
                </span>
                <button
                  onClick={clearCanvas}
                  style={{
                    fontSize: '0.72rem',
                    color: '#71717a',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    padding: 0,
                  }}
                >
                  Clear
                </button>
              </div>
              <div style={{
                background: '#09090b',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={endDraw}
                  style={{
                    width: '100%',
                    height: '140px',
                    cursor: 'crosshair',
                    touchAction: 'none', // prevent scroll while signing
                    display: 'block',
                  }}
                />
                {/* Signature line */}
                <div style={{
                  position: 'absolute',
                  bottom: '32px',
                  left: '16px',
                  right: '16px',
                  height: '1px',
                  background: 'rgba(255,255,255,0.06)',
                  pointerEvents: 'none',
                }} />
                {/* X mark */}
                <div style={{
                  position: 'absolute',
                  bottom: '28px',
                  left: '16px',
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.12)',
                  pointerEvents: 'none',
                  fontWeight: 600,
                }}>
                  ✕
                </div>
              </div>
            </div>

            <p style={{
              fontSize: '0.72rem',
              color: '#52525b',
              lineHeight: 1.5,
              marginBottom: '1.25rem',
            }}>
              By signing, you agree to proceed with this proposal. The freelancer will be notified immediately.
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setConfirming(false); clearCanvas(); }}
                disabled={loading}
                style={{
                  padding: '0.55rem 1.25rem',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  color: '#a1a1aa',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAccept}
                disabled={loading || !nameInput.trim()}
                style={{
                  padding: '0.55rem 1.5rem',
                  background: loading ? '#374151' : '#22c55e',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: loading ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                  opacity: !nameInput.trim() ? 0.5 : 1,
                }}
              >
                {loading ? 'Signing...' : 'Sign & Accept'}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Expired state ──
  if (isExpired) {
    return (
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 90,
        background: 'rgba(127, 29, 29, 0.92)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(239, 68, 68, 0.25)',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        fontFamily: "'Inter Variable', -apple-system, system-ui, sans-serif",
      }}>
        <span style={{
          color: '#fca5a5',
          fontSize: '0.85rem',
          fontWeight: 500,
        }}>
          This proposal has expired and can no longer be accepted.
        </span>
      </div>
    );
  }

  // ── Default state ──
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 90,
      background: 'rgba(10, 10, 14, 0.92)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      padding: '0.85rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      fontFamily: "'Inter Variable', -apple-system, system-ui, sans-serif",
    }}>
      <span style={{
        color: '#9ca3af',
        fontSize: '0.85rem',
      }}>
        Ready to move forward?
      </span>
      <button
        onClick={() => setConfirming(true)}
        style={{
          padding: '0.55rem 1.5rem',
          background: '#ffffff',
          border: 'none',
          borderRadius: '9999px',
          color: '#000000',
          fontSize: '0.88rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#e5e5e5')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
      >
        Accept Proposal
      </button>
      {expiryRemaining && (
        <span style={{
          fontSize: '0.78rem',
          fontWeight: 500,
          color: expiryUrgent ? '#fbbf24' : 'rgba(255,255,255,0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          whiteSpace: 'nowrap',
        }}>
          ⏱ Expires in {expiryRemaining}
        </span>
      )}
    </div>
  );
}
