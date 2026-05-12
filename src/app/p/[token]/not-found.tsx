import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#08090a',
        color: '#f0f0f3',
        fontFamily: "'Inter Variable', -apple-system, system-ui, sans-serif",
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          fontSize: '5rem',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '1rem',
        }}
      >
        404
      </div>
      <h1
        style={{
          fontSize: '1.3rem',
          fontWeight: 600,
          color: '#d0d0d8',
          marginBottom: '0.5rem',
        }}
      >
        Proposal not found
      </h1>
      <p
        style={{
          fontSize: '0.95rem',
          color: '#6b6b78',
          maxWidth: '360px',
          lineHeight: 1.6,
          marginBottom: '2rem',
        }}
      >
        This proposal link may have expired, been removed, or never existed.
        If you believe this is a mistake, contact the person who sent it.
      </p>
      <Link
        href="/"
        style={{
          padding: '0.6rem 1.5rem',
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.25)',
          color: '#a5b4fc',
          borderRadius: '8px',
          fontSize: '0.88rem',
          fontWeight: 500,
          textDecoration: 'none',
        }}
      >
        Go to Clinch
      </Link>
    </div>
  );
}
