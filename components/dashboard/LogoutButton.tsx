'use client';

export default function LogoutButton() {
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <button
      onClick={handleLogout}
      className="skeu-btn-ghost"
      style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 16px', fontSize: '0.85rem' }}
    >
      Sign Out
    </button>
  );
}
