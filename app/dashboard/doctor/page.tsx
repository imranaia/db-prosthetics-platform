export default function Dashboard() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="skeu-card" style={{ padding: '48px', textAlign: 'center', maxWidth: '400px' }}>
        <h1 className="font-display" style={{ fontSize: '1.8rem', color: 'var(--text-head)', marginBottom: '12px' }}>
          Doctor Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          This dashboard is being built. Check back soon.
        </p>
      </div>
    </div>
  );
}
