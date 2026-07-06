'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import DBLogo from '@/components/ui/DBLogo';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[error boundary]', error);
  }, [error]);

  return (
    <div className="auth-bg">
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', marginBottom: 22 }}>
            <DBLogo size={64} />
          </div>

          <p className="font-display" style={{ fontSize: '4.4rem', lineHeight: 1, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.02em', margin: '0 0 6px' }}>
            500
          </p>
          <div style={{ width: 56, height: 2, margin: '0 auto 22px', background: 'linear-gradient(90deg, var(--accent), var(--accent-light))', borderRadius: 2 }} />

          <h1 className="font-display" style={{ fontSize: '1.55rem', fontWeight: 600, color: 'var(--text-head)', margin: '0 0 12px', letterSpacing: '-0.01em' }}>
            Something Went Wrong on Our End
          </h1>
          <p style={{ fontSize: '0.94rem', lineHeight: 1.65, color: 'var(--text-muted)', maxWidth: '34ch', margin: '0 auto 28px' }}>
            This isn&apos;t something you did. Our team has been notified automatically and is looking into it — please try again in a moment.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={reset} className="skeu-btn-accent" style={{ width: '100%' }}>Try Again</button>
            <Link
              href="/"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px 28px', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: 600,
                letterSpacing: '0.03em', color: 'var(--primary)', background: 'transparent', borderRadius: 10,
                border: '1px solid var(--border-card)', textDecoration: 'none',
              }}
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
