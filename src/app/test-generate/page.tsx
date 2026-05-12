'use client';

import { useState } from 'react';

export default function TestGeneratePage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [response, setResponse] = useState<string>('');
  const [elapsed, setElapsed] = useState(0);

  async function handleGenerate() {
    setStatus('loading');
    setResponse('');
    const start = Date.now();

    try {
      const res = await fetch('/api/proposals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: 'Sarah Chen',
          client_email: 'sarah@acmecorp.com',
          project_type: 'Website Redesign',
          budget: '12500',
          timeline: '6-8 weeks',
          tone: 'formal',
          deliverables: [
            'Custom website design',
            'Front-end development',
            'CMS integration',
            'SEO optimization',
          ],
          job_description: `We need a complete redesign of our company website (acmecorp.com). 
The current site is 4 years old, loads slowly, and doesn't work well on mobile. 
We want a modern, fast, mobile-first website that reflects our brand and converts 
visitors into leads. Must include a blog, contact form, and integration with our 
HubSpot CRM. We have brand guidelines and a Figma design system to work from. 
Target launch is Q3 2026.`,
        }),
      });

      setElapsed(Date.now() - start);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
      setStatus(res.ok ? 'done' : 'error');
    } catch (err) {
      setElapsed(Date.now() - start);
      setResponse(String(err));
      setStatus('error');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#08090a',
      color: '#f0f0f3',
      fontFamily: 'monospace',
      padding: '2rem',
    }}>
      <h1 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>
        Test: POST /api/proposals/generate
      </h1>

      <button
        onClick={handleGenerate}
        disabled={status === 'loading'}
        style={{
          padding: '0.6rem 1.5rem',
          background: status === 'loading' ? '#333' : '#6366f1',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '0.9rem',
          cursor: status === 'loading' ? 'wait' : 'pointer',
          marginBottom: '1rem',
        }}
      >
        {status === 'loading' ? 'Generating... (takes 10-20s)' : 'Generate Proposal'}
      </button>

      {elapsed > 0 && (
        <p style={{ color: '#8b8b96', fontSize: '0.85rem' }}>
          Completed in {(elapsed / 1000).toFixed(1)}s
          {' · '}
          Status: <span style={{ color: status === 'done' ? '#22c55e' : '#f43f5e' }}>
            {status}
          </span>
        </p>
      )}

      {response && (
        <pre style={{
          background: '#141416',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '1.5rem',
          overflow: 'auto',
          maxHeight: '70vh',
          fontSize: '0.78rem',
          lineHeight: '1.5',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {response}
        </pre>
      )}
    </div>
  );
}
