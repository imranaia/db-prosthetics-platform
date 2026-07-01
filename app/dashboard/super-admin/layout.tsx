import LogoutButton from '@/components/dashboard/LogoutButton';
import SidebarNav from '@/components/dashboard/SidebarNav';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Fixed sidebar */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '240px',
          height: '100vh',
          background: 'var(--primary)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          boxShadow: '4px 0 16px rgba(0,0,0,0.25)',
        }}
      >
        {/* Brand */}
        <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div
            className="font-display"
            style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.2 }}
          >
            DB Prosthetics
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '4px' }}>
            Admin Panel
          </div>
        </div>

        {/* Nav — client component handles hover interactivity */}
        <SidebarNav />

        {/* Logout */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: '240px', flex: 1, minHeight: '100vh', background: 'var(--bg-base)' }}>
        {children}
      </main>
    </div>
  );
}
