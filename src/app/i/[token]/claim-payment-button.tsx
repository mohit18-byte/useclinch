'use client';

import { useState } from 'react';

interface Props {
  invoiceId: string;
  hostedToken: string;
  accent: string;
}

export default function ClaimPaymentButton({ invoiceId, hostedToken, accent }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function handleClick() {
    setState('loading');
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/claim-payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hosted_token: hostedToken }),
      });

      if (res.ok) {
        setState('done');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div className="mt-5 rounded-lg border border-green-500/25 bg-green-500/8 px-5 py-4 flex items-start gap-3"
        style={{ background: 'rgba(34,197,94,0.06)' }}>
        <svg className="h-5 w-5 text-green-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24"
          strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <div>
          <p className="text-[14px] font-medium text-green-400">Payment reported — thank you!</p>
          <p className="text-[12px] text-green-400/60 mt-0.5">
            Your freelancer will verify and confirm the payment shortly.
          </p>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/5 px-5 py-4">
        <p className="text-[13px] text-red-400">Something went wrong. Please try again or contact your freelancer.</p>
        <button
          onClick={() => setState('idle')}
          className="mt-2 text-[12px] text-red-400/70 hover:text-red-400 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      className="mt-5 w-full flex items-center justify-center gap-2 rounded-lg py-3.5 text-[14px] font-medium transition-all hover:bg-neutral-200 disabled:opacity-60"
      style={{
        background: '#ffffff',
        color: '#000000',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {state === 'loading' ? (
        <>
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Submitting…
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          I&apos;ve Made Payment
        </>
      )}
    </button>
  );
}
