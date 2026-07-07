'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { Rotate3d } from 'lucide-react';
import BodySelector3D from '@/components/consultation/BodySelector3D';
import BodySelector, { BodyPart } from '@/components/consultation/BodySelector';

export default function BodySelector3DDemoPage() {
  const { user, loading } = useAuth();
  const [parts3d, setParts3d] = useState<BodyPart[]>([]);
  const [parts2d, setParts2d] = useState<BodyPart[]>([]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'super_admin') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  return (
    <div className="dash-content">
      <div className="dash-page-header" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: '#7c3aed18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Rotate3d size={22} color="#7c3aed" />
        </div>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>3D Diagram Prototype</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
            An experimental rotatable version, side by side with the current 2D diagram. Not wired into any live form — try both and see which feels right.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <div className="skeu-card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 4 }}>New: 3D (rotatable)</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>Drag to spin it around, scroll to zoom, tap a region to mark it.</p>
          <BodySelector3D value={parts3d} onChange={setParts3d} />
        </div>

        <div className="skeu-card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 4 }}>Current: 2D (already live everywhere)</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>What consultations, custom orders, and measurements use today.</p>
          <BodySelector value={parts2d} onChange={setParts2d} />
        </div>
      </div>
    </div>
  );
}
