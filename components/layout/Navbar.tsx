'use client';

import { useState } from 'react';
import Link from 'next/link';
import DBLogo from '@/components/ui/DBLogo';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header
      style={{
        background: 'linear-gradient(180deg, rgba(15,36,56,0.98) 0%, rgba(27,61,94,0.96) 100%)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
      className="sticky top-0 z-50"
    >
      <nav
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 20px',
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <DBLogo size={54} />
          <div>
            <div
              className="font-display font-semibold text-[0.85rem] sm:text-base"
              style={{ color: '#f0ece4', lineHeight: 1.2, letterSpacing: '0.01em', whiteSpace: 'nowrap' }}
            >
              DB Prosthetics
            </div>
            <div
              className="text-[0.52rem] sm:text-[0.6rem]"
              style={{ color: 'rgba(181,117,31,0.9)', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}
            >
              &amp; Orthotics Ltd
            </div>
          </div>
        </Link>

        {/* Desktop nav links — hidden below lg so there's room */}
        <div
          className="hidden lg:flex items-center"
          style={{ gap: 28, flex: 1, justifyContent: 'center' }}
        >
          {[
            ['Services',  '#services'],
            ['Our Work',  '#portfolio'],
            ['Team',      '#team'],
            ['Coverage',  '#coverage'],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              style={{ color: 'rgba(240,236,228,0.72)', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f0ece4')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,236,228,0.72)')}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Desktop CTA — shown at md+ */}
        <div className="hidden md:flex items-center" style={{ gap: 10, flexShrink: 0 }}>
          <Link
            href="/login"
            style={{
              padding: '9px 18px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(240,236,228,0.85)',
              fontSize: '0.85rem',
              fontWeight: 500,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.12)')}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.06)')}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="skeu-btn-accent"
            style={{ padding: '9px 18px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
          >
            Book Appointment
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f0ece4', padding: 8, display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}
        >
          <span style={{ display: 'block', width: 22, height: 2, background: 'currentColor', borderRadius: 2, transition: 'transform 0.2s', transform: open ? 'translateY(7px) rotate(45deg)' : 'none' }} />
          <span style={{ display: 'block', width: 22, height: 2, background: 'currentColor', borderRadius: 2, transition: 'opacity 0.2s', opacity: open ? 0 : 1 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: 'currentColor', borderRadius: 2, transition: 'transform 0.2s', transform: open ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div
          className="md:hidden"
          style={{
            background: 'rgba(12,30,48,0.99)',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            padding: '24px 24px 32px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              ['Services',  '#services'],
              ['Our Work',  '#portfolio'],
              ['Team',      '#team'],
              ['Coverage',  '#coverage'],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                style={{
                  color: 'rgba(240,236,228,0.8)',
                  fontSize: '1.05rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  padding: '14px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  display: 'block',
                }}
              >
                {label}
              </a>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '13px',
                  borderRadius: 9,
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(240,236,228,0.85)',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="skeu-btn-accent"
                style={{ display: 'block', textAlign: 'center', padding: '13px', fontSize: '0.95rem' }}
              >
                Book Appointment
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
