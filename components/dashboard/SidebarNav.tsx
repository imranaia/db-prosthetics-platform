'use client';

import Link from 'next/link';

const NAV_LINKS = [
  { label: 'Overview',      href: '/dashboard/super-admin' },
  { label: 'Hospitals',     href: '/dashboard/super-admin/hospitals' },
  { label: 'Products',      href: '/dashboard/super-admin/products' },
  { label: 'Patients',      href: '/dashboard/super-admin/patients' },
  { label: 'Orders',        href: '/dashboard/super-admin/orders' },
  { label: 'Appointments',  href: '/dashboard/super-admin/appointments' },
  { label: 'Consultations', href: '/dashboard/super-admin/consultations' },
  { label: 'Inventory',     href: '/dashboard/super-admin/inventory' },
];

export default function SidebarNav() {
  return (
    <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="sidebar-nav-link"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
