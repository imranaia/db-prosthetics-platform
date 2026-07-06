import Link from 'next/link';
import Image from 'next/image';
import getDb from '@/lib/db';
import Navbar from '@/components/layout/Navbar';
import DBLogo from '@/components/ui/DBLogo';

export const dynamic = 'force-dynamic';

/* ─── types ─── */
interface TeamMember {
  id: number;
  name: string;
  position: string;
  photo_url: string | null;
  bio: string | null;
  display_order: number;
}

interface ServiceItem {
  title: string;
  description: string;
}

interface PortfolioItem {
  cat: string;
  label: string;
  sub: string;
  image_url: string;
}

/* ─── server-side data ─── */
function getTeamMembers(): TeamMember[] {
  try {
    const db = getDb();
    return db
      .prepare(
        `SELECT id, name, position, photo_url, bio, display_order
         FROM team_members
         ORDER BY display_order ASC, id ASC`
      )
      .all() as TeamMember[];
  } catch {
    return [];
  }
}

function getOperatingStates(): string[] {
  try {
    const db = getDb();
    const rows = db
      .prepare(`SELECT DISTINCT state FROM hospitals ORDER BY state ASC`)
      .all() as { state: string }[];
    return rows.map((r) => r.state);
  } catch {
    return [];
  }
}

function getSiteContent(): Record<string, string> {
  try {
    const db = getDb();
    const rows = db.prepare(`SELECT key, value FROM site_content`).all() as { key: string; value: string }[];
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

const SERVICE_ICONS = [
  <svg key="0" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12l2 2 4-4" />
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
  </svg>,
  <svg key="1" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>,
  <svg key="2" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>,
];

/* ─── page ─── */
export default function LandingPage() {
  const team = getTeamMembers();
  const states = getOperatingStates();
  const sc = getSiteContent();

  const heroBadge     = sc.hero_badge     || 'Certified Prosthetics & Orthotics · Nigeria';
  const heroHeading   = sc.hero_heading   || 'Restoring Movement. Rebuilding Lives.';
  const heroSub       = sc.hero_subheading|| 'DB Prosthetics and Orthotics Ltd delivers precision prosthetic and orthotic solutions across Nigeria.';
  const heroCtaPrim   = sc.hero_cta_primary   || 'Book a Consultation';
  const heroCtaSec    = sc.hero_cta_secondary || 'For Healthcare Providers';
  const heroImageUrl  = sc.hero_image_url || '';
  const ctaHeading    = sc.cta_heading    || 'Ready to Begin Your Journey?';
  const ctaSubtext    = sc.cta_subtext    || 'Book a consultation — at a partnered hospital near you, or request a specialist home visit.';

  let services: ServiceItem[] = [];
  try { services = JSON.parse(sc.services || '[]'); } catch { services = []; }

  let portfolio: PortfolioItem[] = [];
  try { portfolio = JSON.parse(sc.portfolio || '[]'); } catch { portfolio = []; }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="section-dark texture-overlay relative" style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', paddingTop: '80px', paddingBottom: '80px' }}>
        <div className="section-container relative z-10 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

            {/* Left — copy */}
            <div className="flex-1 text-center lg:text-left">
              <div className="skeu-badge mb-6" style={{ display: 'inline-flex' }}>
                {heroBadge}
              </div>

              <h1
                className="font-display"
                style={{
                  fontSize: 'clamp(2.6rem, 5vw, 4.2rem)',
                  fontWeight: 600,
                  lineHeight: 1.12,
                  color: '#f0ece4',
                  letterSpacing: '-0.01em',
                  marginBottom: '1.5rem',
                }}
              >
                {(() => {
                  const dot = heroHeading.indexOf('. ');
                  if (dot === -1) return heroHeading;
                  return (
                    <>
                      {heroHeading.slice(0, dot + 1)}{' '}
                      <em style={{ color: '#d08c2a', fontStyle: 'italic' }}>
                        {heroHeading.slice(dot + 2)}
                      </em>
                    </>
                  );
                })()}
              </h1>

              <p
                style={{
                  fontSize: '1.1rem',
                  lineHeight: 1.75,
                  color: 'rgba(240,236,228,0.75)',
                  maxWidth: '520px',
                  marginBottom: '2.5rem',
                }}
                className="mx-auto lg:mx-0"
              >
                {heroSub}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/register" className="skeu-btn-accent">
                  {heroCtaPrim}
                </Link>
                <Link href="/login?role=hospital" className="skeu-btn-ghost">
                  {heroCtaSec}
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-x-8 gap-y-4 mt-8 justify-center lg:justify-start">
                {[
                  ['Certified', 'P&O Organisation'],
                  ['All 36', 'States Coverage'],
                  ['Hospital &', 'Home Visits'],
                ].map(([top, bottom]) => (
                  <div key={top} className="text-center lg:text-left">
                    <div
                      className="font-display font-semibold"
                      style={{ color: '#d08c2a', fontSize: '1.1rem' }}
                    >
                      {top}
                    </div>
                    <div style={{ color: 'rgba(240,236,228,0.55)', fontSize: '0.78rem', letterSpacing: '0.04em' }}>
                      {bottom}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — visual card */}
            <div className="flex-shrink-0 w-full max-w-xs sm:max-w-sm lg:max-w-md">
              <div
                className="relative overflow-hidden"
                style={{
                  aspectRatio: '4/5',
                  padding: 0,
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow:
                    '12px 16px 40px rgba(0,0,0,0.6), -4px -4px 20px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              >
                {heroImageUrl ? (
                  <Image
                    src={heroImageUrl}
                    alt="Hero"
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 400px, 448px"
                  />
                ) : (
                  <div
                    style={{
                      height: '100%',
                      background: 'linear-gradient(160deg, #1e4a72 0%, #0f2438 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '16px',
                      padding: '40px',
                    }}
                  >
                    <DBLogo size={72} />
                    <p
                      className="font-display text-center"
                      style={{ color: 'rgba(240,236,228,0.5)', fontSize: '0.9rem', lineHeight: 1.6 }}
                    >
                      Prosthetic portfolio photography
                      <br />
                      will be placed here
                    </p>
                  </div>
                )}

                {/* Overlay badge */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 20,
                    left: 20,
                    right: 20,
                    background: 'rgba(15,36,56,0.85)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '10px',
                    padding: '14px 18px',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div style={{ color: '#d08c2a', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    What we offer
                  </div>
                  <div style={{ color: '#f0ece4', fontSize: '0.88rem', marginTop: '4px' }}>
                    Upper limb · Lower limb · Spinal · Facial
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Clean bottom edge — dark shadow line, no bleeding into light section */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.4) 20%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.4) 80%, transparent)',
          }}
        />
      </section>

      {/* ══════════════════════════════════════
          SERVICES
      ══════════════════════════════════════ */}
      <section id="services" className="section-pad" style={{ background: 'var(--bg-base)', paddingTop: '80px' }}>
        <div className="section-container">

          <div className="text-center mb-14">
            <div className="skeu-badge mb-4" style={{ display: 'inline-flex' }}>What We Do</div>
            <h2
              className="font-display"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 600, color: 'var(--text-head)', letterSpacing: '-0.01em' }}
            >
              Comprehensive P&O Care
            </h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '12px', fontSize: '1rem', maxWidth: '480px', margin: '12px auto 0' }}>
              Every solution we deliver is custom-fitted, clinically assessed, and built for long-term mobility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {services.map((s, i) => (
              <div key={i} className="skeu-card p-8">
                <div
                  className="skeu-icon-well mb-6"
                  style={{ color: 'var(--primary)' }}
                >
                  {SERVICE_ICONS[i % SERVICE_ICONS.length]}
                </div>
                <h3
                  className="font-display font-semibold mb-3"
                  style={{ fontSize: '1.35rem', color: 'var(--text-head)' }}
                >
                  {s.title}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.75 }}>
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          PORTFOLIO / OUR WORK
      ══════════════════════════════════════ */}
      <section id="portfolio" className="section-pad" style={{ background: 'var(--bg-base)' }}>
        <div className="section-container">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <div className="skeu-badge mb-3" style={{ display: 'inline-flex' }}>Our Work</div>
              <h2
                className="font-display"
                style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 600, color: 'var(--text-head)' }}
              >
                Cases & Results
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '320px', lineHeight: 1.65 }}>
              A selection of prosthetic fittings and orthotic interventions we have delivered.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {portfolio.map((item, i) => (
              <div
                key={i}
                className="skeu-card overflow-hidden"
                style={{ padding: 0 }}
              >
                <div
                  style={{
                    height: '200px',
                    position: 'relative',
                    background: `linear-gradient(135deg,
                      hsl(${210 + i * 15}, 35%, ${22 + i * 3}%) 0%,
                      hsl(${215 + i * 10}, 40%, ${28 + i * 2}%) 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.label}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  )}
                </div>
                <div style={{ padding: '20px 22px' }}>
                  <span style={{
                    display: 'inline-block',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--accent)',
                    marginBottom: '6px',
                  }}>
                    {item.cat}
                  </span>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: '4px' }}>
                    {item.label}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          TEAM
      ══════════════════════════════════════ */}
      <section id="team" className="section-pad" style={{ background: 'var(--bg-base)' }}>
        <div className="section-container">

          <div className="text-center mb-14">
            <div className="skeu-badge mb-4" style={{ display: 'inline-flex' }}>The People</div>
            <h2
              className="font-display"
              style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 600, color: 'var(--text-head)' }}
            >
              Our Specialists
            </h2>
          </div>

          {team.length === 0 ? (
            /* Placeholder shown when DB has no team members yet */
            <div className="flex justify-center">
              <div className="skeu-card p-8 text-center" style={{ maxWidth: '360px' }}>
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'linear-gradient(145deg, #ddd8cf, #ede8df)',
                    boxShadow: 'inset 3px 3px 8px #c9c4bb, inset -3px -3px 8px #fff',
                    margin: '0 auto 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Team members will appear here once added by the Super Admin.
                </p>
              </div>
            </div>
          ) : (
            <div
              className="grid gap-8"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                justifyContent: team.length < 3 ? 'center' : undefined,
              }}
            >
              {team.map((member) => (
                <div key={member.id} className="skeu-card p-7 flex flex-col items-center text-center">
                  {/* Photo */}
                  <div
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      marginBottom: '18px',
                      boxShadow: '4px 4px 12px #c9c4bb, -4px -4px 12px #fff',
                      border: '3px solid rgba(255,255,255,0.8)',
                      flexShrink: 0,
                    }}
                  >
                    {member.photo_url ? (
                      <Image
                        src={member.photo_url}
                        alt={member.name}
                        width={96}
                        height={96}
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(145deg, #254f7a, #1b3d5e)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'rgba(240,236,228,0.6)',
                          fontSize: '2rem',
                          fontFamily: 'Cormorant Garamond, serif',
                          fontWeight: 600,
                        }}
                      >
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <h3 className="font-display font-semibold" style={{ fontSize: '1.2rem', color: 'var(--text-head)', marginBottom: '4px' }}>
                    {member.name}
                  </h3>
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '12px' }}>
                    {member.position}
                  </p>
                  {member.bio && (
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                      {member.bio}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════
          WHERE WE OPERATE
      ══════════════════════════════════════ */}
      <section id="coverage" className="section-pad" style={{ background: 'var(--bg-base)' }}>
        <div className="section-container">

          <div className="text-center mb-12">
            <div className="skeu-badge mb-4" style={{ display: 'inline-flex' }}>Coverage</div>
            <h2
              className="font-display"
              style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 600, color: 'var(--text-head)' }}
            >
              Where We Operate
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '10px' }}>
              {states.length > 0
                ? `Active in ${states.length} state${states.length !== 1 ? 's' : ''} — with more being onboarded.`
                : 'Hospital partners are being onboarded. Check back soon.'}
            </p>
          </div>

          {states.length > 0 ? (
            <div className="flex flex-wrap gap-3 justify-center">
              {states.map((state) => (
                <div key={state} className="state-pill">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" style={{ color: 'var(--accent)', flexShrink: 0 }}>
                    <circle cx="4" cy="4" r="4" />
                  </svg>
                  {state}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <div className="skeu-inset inline-flex items-center gap-3 px-8 py-5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Hospitals are being onboarded — coverage will display here.
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════ */}
      <section className="section-dark" style={{ padding: '80px 0' }}>
        <div className="section-container relative z-10 text-center">
          <h2
            className="font-display"
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 3rem)',
              fontWeight: 600,
              color: '#f0ece4',
              marginBottom: '16px',
              letterSpacing: '-0.01em',
            }}
          >
            {ctaHeading}
          </h2>
          <p style={{ color: 'rgba(240,236,228,0.65)', fontSize: '1rem', maxWidth: '460px', margin: '0 auto 36px', lineHeight: 1.7 }}>
            {ctaSubtext}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="skeu-btn-accent">
              {heroCtaPrim}
            </Link>
            <Link href="/login" className="skeu-btn-ghost">
              I Already Have an Account
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer
        style={{
          background: '#0a1e2e',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '52px 0 32px',
        }}
      >
        <div className="section-container">
          <div className="flex flex-col md:flex-row gap-10 justify-between">

            {/* Brand */}
            <div style={{ maxWidth: '280px' }}>
              <div className="flex items-center gap-3 mb-4">
                <DBLogo size={54} />
                <div>
                  <div className="font-display font-semibold" style={{ color: '#f0ece4', fontSize: '1rem' }}>
                    DB Prosthetics
                  </div>
                  <div style={{ color: 'rgba(181,117,31,0.8)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    & Orthotics Ltd
                  </div>
                </div>
              </div>
              <p style={{ color: 'rgba(240,236,228,0.45)', fontSize: '0.83rem', lineHeight: 1.75 }}>
                Certified Prosthetics &amp; Orthotics organisation delivering precision care and lifetime support to patients across Nigeria.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-12">
              <div>
                <div style={{ color: 'rgba(240,236,228,0.4)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>
                  Platform
                </div>
                {[
                  ['Patient Login', '/login'],
                  ['Book Appointment', '/register'],
                  ['Hospital Login', '/login?role=hospital'],
                ].map(([label, href]) => (
                  <div key={label} style={{ marginBottom: '10px' }}>
                    <Link href={href} className="footer-link">
                      {label}
                    </Link>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ color: 'rgba(240,236,228,0.4)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>
                  Organisation
                </div>
                {[
                  ['Our Services', '#services'],
                  ['Our Work', '#portfolio'],
                  ['Our Team', '#team'],
                  ['Coverage', '#coverage'],
                ].map(([label, href]) => (
                  <div key={label} style={{ marginBottom: '10px' }}>
                    <a href={href} className="footer-link">
                      {label}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              height: '1px',
              background: 'rgba(255,255,255,0.06)',
              margin: '36px 0 24px',
            }}
          />
          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <p style={{ color: 'rgba(240,236,228,0.3)', fontSize: '0.78rem' }}>
              © {new Date().getFullYear()} DB Prosthetics and Orthotics Ltd. All rights reserved.
            </p>
            <p style={{ color: 'rgba(240,236,228,0.3)', fontSize: '0.78rem' }}>
              Nigeria · Prosthetics & Orthotics
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
