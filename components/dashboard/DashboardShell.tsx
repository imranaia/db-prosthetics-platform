'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, Package, Users, ShoppingCart,
  CalendarDays, Boxes, Menu, X, LogOut, Stethoscope,
  Layout, UserCircle, ClipboardCheck, Repeat,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}

interface SwitchLink {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface DashboardShellProps {
  children: React.ReactNode;
  navItems?: NavItem[];
  brandLabel?: string;
  overviewHref?: string;
  switchLink?: SwitchLink;
}

const DEFAULT_NAV: NavItem[] = [
  { label: 'Overview',        href: '/dashboard/super-admin',                icon: LayoutDashboard },
  { label: 'Hospitals',       href: '/dashboard/super-admin/hospitals',       icon: Building2 },
  { label: 'Products',        href: '/dashboard/super-admin/products',        icon: Package },
  { label: 'Patients',        href: '/dashboard/super-admin/patients',        icon: Users },
  { label: 'Consultations',   href: '/dashboard/super-admin/consultations',   icon: Stethoscope },
  { label: 'Orders',          href: '/dashboard/super-admin/orders',          icon: ShoppingCart },
  { label: 'Appointments',    href: '/dashboard/super-admin/appointments',    icon: CalendarDays },
  { label: 'Inventory',       href: '/dashboard/super-admin/inventory',       icon: Boxes },
  { label: 'Discharge Forms', href: '/dashboard/super-admin/discharge',       icon: ClipboardCheck },
  { label: 'Edit Landing Page', href: '/dashboard/super-admin/landing-editor', icon: Layout },
  { label: 'My Profile',      href: '/dashboard/super-admin/profile',         icon: UserCircle },
];

function makeIsActive(overviewHref: string) {
  return function isActive(href: string, pathname: string) {
    if (href === overviewHref) return pathname === href;
    return pathname.startsWith(href);
  };
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
}

export default function DashboardShell({ children, navItems, brandLabel, overviewHref, switchLink }: DashboardShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);

  const NAV = navItems ?? DEFAULT_NAV;
  const resolvedBrandLabel = brandLabel ?? 'Admin Panel';
  const resolvedOverviewHref = overviewHref ?? '/dashboard/super-admin';
  const isActive = makeIsActive(resolvedOverviewHref);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close on outside click (mobile)
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (open && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${open ? ' open' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`sidebar-drawer${open ? ' open' : ''}`}
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '240px', height: '100vh',
          background: 'var(--primary)',
          display: 'flex', flexDirection: 'column',
          zIndex: 100,
          boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
        }}
      >
        {/* Brand */}
        <div style={{
          padding: '24px 20px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div className="font-display" style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.2 }}>
              DB Prosthetics
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '4px' }}>
              {resolvedBrandLabel}
            </div>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={() => setOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: '4px', display: 'flex' }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Switch (top, high-visibility) */}
        {switchLink && (
          <div style={{ padding: '12px 16px 4px' }}>
            {switchLink.href ? (
              <Link
                href={switchLink.href}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', borderRadius: '8px',
                  background: 'rgba(208,140,42,0.16)', border: '1px solid rgba(208,140,42,0.35)',
                  color: '#f0d9b5', fontSize: '0.875rem', fontWeight: 600,
                  textDecoration: 'none', boxSizing: 'border-box',
                }}
              >
                <Repeat size={15} />
                {switchLink.label}
              </Link>
            ) : (
              <button
                onClick={switchLink.onClick}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                  background: 'rgba(208,140,42,0.16)', border: '1px solid rgba(208,140,42,0.35)',
                  color: '#f0d9b5', fontSize: '0.875rem', fontWeight: 600,
                }}
              >
                <Repeat size={15} />
                {switchLink.label}
              </button>
            )}
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
          {NAV.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`sidebar-nav-link${isActive(href, pathname) ? ' active' : ''}`}
            >
              <Icon size={15} style={{ flexShrink: 0, opacity: 0.85 }} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={logout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 500,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.13)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)'; }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="main-with-sidebar" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Mobile topbar */}
        <div className="mobile-topbar">
          <button
            onClick={() => setOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', padding: '4px' }}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <span className="font-display" style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>
            DB Prosthetics
          </span>
        </div>

        <main style={{ flex: 1, background: 'var(--bg-base)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
