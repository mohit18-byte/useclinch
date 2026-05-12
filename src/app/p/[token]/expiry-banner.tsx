'use client';

import { useState, useEffect } from 'react';

interface ExpiryBannerProps {
  expiresAt: string;
}

function getTimeRemaining(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

export default function ExpiryBanner({ expiresAt }: ExpiryBannerProps) {
  const [remaining, setRemaining] = useState(() => getTimeRemaining(expiresAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(getTimeRemaining(expiresAt));
    }, 60_000); // update every minute
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpired = remaining === null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  const isUrgent = diff > 0 && diff < 24 * 60 * 60 * 1000; // under 24 hours

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 95,
          background: isExpired
            ? 'rgba(127, 29, 29, 0.92)'
            : isUrgent
              ? 'rgba(120, 53, 15, 0.92)'
              : 'rgba(10, 10, 14, 0.88)',
          backdropFilter: 'blur(12px)',
          borderBottom: isExpired
            ? '1px solid rgba(239, 68, 68, 0.3)'
            : isUrgent
              ? '1px solid rgba(251, 191, 36, 0.3)'
              : '1px solid rgba(255,255,255,0.08)',
          padding: '0.6rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          fontFamily: "'Inter Variable', -apple-system, system-ui, sans-serif",
        }}
      >
        <span
          style={{
            fontSize: '0.82rem',
            fontWeight: 500,
            color: isExpired
              ? '#fca5a5'
              : isUrgent
                ? '#fbbf24'
                : 'rgba(255,255,255,0.55)',
            letterSpacing: '-0.01em',
          }}
        >
          {isExpired ? (
            <>⏱ This proposal has expired</>
          ) : (
            <>⏱ This proposal expires in {remaining}</>
          )}
        </span>
      </div>

      {/* Spacer so content below doesn't get hidden behind the fixed banner */}
      <div style={{ height: '2.5rem' }} />
    </>
  );
}
