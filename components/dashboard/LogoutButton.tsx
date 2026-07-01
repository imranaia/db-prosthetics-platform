'use client';

import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 500,
      }}
    >
      <LogOut size={15} />
      Sign Out
    </button>
  );
}
