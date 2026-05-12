'use client';

import { useEffect, useRef } from 'react';

interface ViewLoggerProps {
  token: string;
}

export default function ViewLogger({ token }: ViewLoggerProps) {
  const mountTime = useRef(Date.now());
  const sectionsLogged = useRef(new Set<string>());

  useEffect(() => {
    // ── 1. Log page view (fire and forget) ──
    fetch(`/api/hosted/${token}/view`, { method: 'POST' }).catch(() => {});

    // ── 2. Section scroll tracking via IntersectionObserver ──
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const sectionKey = (entry.target as HTMLElement).dataset.section;
          if (!sectionKey || sectionsLogged.current.has(sectionKey)) continue;

          sectionsLogged.current.add(sectionKey);
          const payload = JSON.stringify({
            type: 'section_view',
            sectionKey,
          });

          // Use sendBeacon — non-blocking, survives page close
          if (navigator.sendBeacon) {
            navigator.sendBeacon(
              `/api/hosted/${token}/events`,
              new Blob([payload], { type: 'application/json' })
            );
          }
        }
      },
      { threshold: 0.5 }
    );

    // Observe all elements with data-section attribute
    const sections = document.querySelectorAll('[data-section]');
    sections.forEach((el) => observer.observe(el));

    // ── 3. Time on page tracking ──
    function sendTimeOnPage() {
      const elapsed = Math.round((Date.now() - mountTime.current) / 1000);
      if (elapsed < 2) return; // ignore bounces

      const payload = JSON.stringify({
        type: 'time_on_page',
        metadata: { seconds: elapsed },
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          `/api/hosted/${token}/events`,
          new Blob([payload], { type: 'application/json' })
        );
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        sendTimeOnPage();
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', sendTimeOnPage);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', sendTimeOnPage);
    };
  }, [token]);

  // Renders nothing — pure side-effect component
  return null;
}
