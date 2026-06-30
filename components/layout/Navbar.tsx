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
      <nav className="section-container flex items-center justify-between h-18 py-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 no-underline">
          <DBLogo size={42} />
          <div className="hidden sm:block">
            <div
              className="font-display text-lg font-semibold leading-tight"
              style={{ color: '#f0ece4', letterSpacing: '0.02em' }}
            >
              DB Prosthetics
            </div>
            <div
              className="text-xs font-medium tracking-widest uppercase"
              style={{ color: 'rgba(181,117,31,0.9)', fontSize: '0.62rem' }}
            >
              & Orthotics Ltd
            </div>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {[
            ['Services', '#services'],
            ['Our Work', '#portfolio'],
            ['Team', '#team'],
            ['Coverage', '#coverage'],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="text-sm font-medium transition-colors no-underline"
              style={{ color: 'rgba(240,236,228,0.75)', letterSpacing: '0.02em' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f0ece4')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,236,228,0.75)')}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Desktop CTA buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="skeu-btn-ghost text-sm">
            Sign In
          </Link>
          <Link href="/register" className="skeu-btn-accent text-sm" style={{ padding: '10px 20px' }}>
            Book Appointment
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          style={{ color: '#f0ece4' }}
        >
          <span
            style={{
              display: 'block', width: 22, height: 2,
              background: 'currentColor', borderRadius: 2,
              transition: 'transform 0.2s',
              transform: open ? 'translateY(6px) rotate(45deg)' : 'none',
            }}
          />
          <span
            style={{
              display: 'block', width: 22, height: 2,
              background: 'currentColor', borderRadius: 2,
              transition: 'opacity 0.2s',
              opacity: open ? 0 : 1,
            }}
          />
          <span
            style={{
              display: 'block', width: 22, height: 2,
              background: 'currentColor', borderRadius: 2,
              transition: 'transform 0.2s',
              transform: open ? 'translateY(-6px) rotate(-45deg)' : 'none',
            }}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden"
          style={{
            background: 'rgba(15,36,56,0.98)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '20px 24px 28px',
          }}
        >
          <div className="flex flex-col gap-4">
            {[
              ['Services', '#services'],
              ['Our Work', '#portfolio'],
              ['Team', '#team'],
              ['Coverage', '#coverage'],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="text-base font-medium no-underline"
                style={{ color: 'rgba(240,236,228,0.85)' }}
              >
                {label}
              </a>
            ))}
            <div className="skeu-divider my-2" style={{ opacity: 0.3 }} />
            <Link href="/login" className="skeu-btn-ghost text-sm w-full justify-center">
              Sign In
            </Link>
            <Link href="/register" className="skeu-btn-accent text-sm w-full justify-center">
              Book Appointment
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
