'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DBLogo from '@/components/ui/DBLogo';

const REDIRECT_SECONDS = 10;

export default function NotFound() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);
  const cancelledRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (cancelledRef.current) { clearInterval(timer); return; }
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  function cancelRedirect() {
    cancelledRef.current = true;
    setSecondsLeft(-1);
  }

  return (
    <div className="auth-bg">
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', marginBottom: 22 }}>
            <DBLogo size={64} />
          </div>

          <p className="font-display" style={{ fontSize: '4.4rem', lineHeight: 1, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.02em', margin: '0 0 6px' }}>
            404
          </p>
          <div style={{ width: 56, height: 2, margin: '0 auto 22px', background: 'linear-gradient(90deg, var(--accent), var(--accent-light))', borderRadius: 2 }} />

          <h1 className="font-display" style={{ fontSize: '1.55rem', fontWeight: 600, color: 'var(--text-head)', margin: '0 0 12px', letterSpacing: '-0.01em' }}>
            We Couldn&apos;t Find That Page
          </h1>
          <p style={{ fontSize: '0.94rem', lineHeight: 1.65, color: 'var(--text-muted)', maxWidth: '34ch', margin: '0 auto 28px' }}>
            The page you&apos;re looking for may have been moved, renamed, or never existed. Let&apos;s get you back on track.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link href="/" className="skeu-btn-accent">Return to Homepage</Link>
            <Link
              href="/login"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px 28px', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: 600,
                letterSpacing: '0.03em', color: 'var(--primary)', background: 'transparent', borderRadius: 10,
                border: '1px solid var(--border-card)', textDecoration: 'none',
              }}
            >
              Go to My Dashboard
            </Link>
          </div>

          {secondsLeft >= 0 && (
            <div style={{ marginTop: 22, fontSize: '0.78rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
              Redirecting to the homepage in {secondsLeft}s
              <button
                onClick={cancelRedirect}
                style={{ background: 'none', border: 'none', padding: 0, marginLeft: 6, color: 'var(--primary)', fontWeight: 600, fontSize: '0.78rem', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Stay on this page
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
