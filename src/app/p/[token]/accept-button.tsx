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
  // Advance payment
  advancePaymentEnabled: boolean;
  advancePaymentClaimed: boolean;
  advancePaymentType: 'instructions' | 'link' | null;
  advancePaymentValue: string | null;
  advanceAmountCents: number | null;
  currency: string;
}

export default function AcceptButton({
  token,
  clientName,
  projectTitle,
  isAccepted: initialAccepted,
  expiresAt,
  signerName: initialSignerName,
  signedAt: initialSignedAt,
  advancePaymentEnabled,
  advancePaymentClaimed: initialAdvanceClaimed,
  advancePaymentType,
  advancePaymentValue,
  advanceAmountCents,
  currency,
}: AcceptButtonProps) {
  const [accepted, setAccepted] = useState(initialAccepted);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signerName, setSignerName] = useState(initialSignerName || clientName);
  const [signedAt, setSignedAt] = useState(initialSignedAt);
  const [nameInput, setNameInput] = useState(clientName);
  const confettiRef = useRef<ConfettiRef>(null);

  // Payment step state
  const [step, setStep] = useState<'sign' | 'pay' | 'done'>('sign');
  const [advanceClaimed, setAdvanceClaimed] = useState(initialAdvanceClaimed);
  const [paymentChecked, setPaymentChecked] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [signatureDataForAccept, setSignatureDataForAccept] = useState<string | null>(null);
  const [signerNameForAccept, setSignerNameForAccept] = useState<string>(clientName);

  // Signature canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const hasDrawn = useRef(false);

  const isExpired = expiresAt ? new Date(expiresAt).getTime() < Date.now() : false;
  const { remaining: expiryRemaining, isUrgent: expiryUrgent } = useCountdown(expiresAt);

  const fmtAmount = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() || 'USD' }).format(cents / 100);

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

  // ── Sign handler — Step 1 ──
  // If advance payment is enabled and not yet claimed → go to payment step
  // Otherwise → accept immediately
  async function handleSign() {
    const signatureData = getSignatureData();
    if (!signatureData) return;

    // Store signature for use after payment step
    if (advancePaymentEnabled && !advanceClaimed) {
      setSignatureDataForAccept(signatureData);
      setSignerNameForAccept(nameInput);
      setStep('pay');
      setConfirming(false);
      return;
    }

    // No advance payment → accept directly
    await submitAccept(signatureData, nameInput);
  }

  // ── Claim advance payment — Step 2 ──
  async function handleClaimAdvance() {
    if (!paymentChecked) return;
    setPaymentLoading(true);
    try {
      const res = await fetch(`/api/hosted/${token}/claim-advance`, { method: 'POST' });
      if (res.ok) {
        setAdvanceClaimed(true);
        setStep('done');
        // Now submit the accept with the stored signature
        if (signatureDataForAccept) {
          await submitAccept(signatureDataForAccept, signerNameForAccept);
        }
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setPaymentLoading(false);
    }
  }

  // ── Final accept API call ──
  async function submitAccept(signatureData: string, name: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/hosted/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature_data: signatureData,
          signer_name: name,
        }),
      });
      if (res.ok) {
        setAccepted(true);
        setConfirming(false);
        setStep('sign');
        setSignerName(name);
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
                onClick={handleSign}
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
                {loading ? 'Signing...' : advancePaymentEnabled && !advanceClaimed ? 'Sign & Continue →' : 'Sign & Accept'}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Payment Step (Step 2) — only shown when advance payment is enabled and not yet claimed ──
  if (step === 'pay' && advancePaymentEnabled && !advanceClaimed) {
    const fontFamily = "'Inter Variable', -apple-system, system-ui, sans-serif";
    return (
      <>
        <Confetti
          ref={confettiRef}
          manualstart
          style={{ position: 'fixed', inset: 0, zIndex: 200, width: '100%', height: '100%', pointerEvents: 'none' }}
        />
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          paddingBottom: '3rem',
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          fontFamily,
        }}>
          <div style={{
            background: '#18181b',
            border: '1px solid rgba(251,191,36,0.2)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '480px',
            width: '90%',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '8px',
                background: 'rgba(251,191,36,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem',
              }}>
                💰
              </div>
              <h3 style={{ color: '#f4f4f5', fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
                Advance Payment Required
              </h3>
            </div>
            <p style={{ color: '#a1a1aa', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              {advanceAmountCents && advanceAmountCents > 0
                ? <>The freelancer has requested an advance payment of <strong style={{ color: '#fbbf24' }}>{fmtAmount(advanceAmountCents)}</strong> before work begins.</>
                : 'The freelancer has requested an advance payment before work begins.'
              }
            </p>

            {/* Payment info */}
            <div style={{
              background: '#09090b',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1.25rem',
            }}>
              {advancePaymentType === 'link' ? (
                <>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                    Payment Link
                  </p>
                  <a
                    href={advancePaymentValue ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.6rem 1.25rem',
                      background: '#fbbf24',
                      borderRadius: '8px',
                      color: '#000',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      textDecoration: 'none',
                      fontFamily,
                    }}
                  >
                    Pay Now →
                  </a>
                  <p style={{ fontSize: '0.72rem', color: '#52525b', marginTop: '0.75rem', lineHeight: 1.5 }}>
                    Complete payment via the link above, then return to this page and confirm below.
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
                    Payment Instructions
                  </p>
                  <pre style={{
                    fontSize: '0.82rem', color: '#d4d4d8', lineHeight: 1.7,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
                    fontFamily,
                  }}>
                    {advancePaymentValue ?? 'No instructions provided.'}
                  </pre>
                </>
              )}
            </div>

            {/* Declaration checkbox */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', marginBottom: '1.25rem' }}>
              <input
                type="checkbox"
                checked={paymentChecked}
                onChange={(e) => setPaymentChecked(e.target.checked)}
                style={{ marginTop: '2px', accentColor: '#fbbf24', width: 15, height: 15, flexShrink: 0 }}
              />
              <span style={{ fontSize: '0.78rem', color: '#a1a1aa', lineHeight: 1.5 }}>
                I confirm I have initiated a payment of{' '}
                <strong style={{ color: '#f4f4f5' }}>
                  {advanceAmountCents && advanceAmountCents > 0 ? fmtAmount(advanceAmountCents) : 'the required amount'}
                </strong>{' '}
                as agreed in this proposal.
              </span>
            </label>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setStep('sign'); setConfirming(true); setPaymentChecked(false); }}
                disabled={paymentLoading}
                style={{
                  padding: '0.55rem 1.25rem',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  color: '#a1a1aa',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontFamily,
                }}
              >
                ← Back
              </button>
              <button
                onClick={handleClaimAdvance}
                disabled={!paymentChecked || paymentLoading || loading}
                style={{
                  padding: '0.55rem 1.5rem',
                  background: !paymentChecked || paymentLoading ? '#374151' : '#fbbf24',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: !paymentChecked || paymentLoading ? 'not-allowed' : 'pointer',
                  fontFamily,
                  opacity: !paymentChecked ? 0.5 : 1,
                  transition: 'background 0.15s, opacity 0.15s',
                }}
              >
                {paymentLoading || loading ? 'Processing...' : 'I Have Paid — Accept Proposal'}
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
