'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Box, RotateCw } from 'lucide-react';
import BodySelector, { type BodyPart } from './BodySelector';

// The 3D renderer pulls in three.js/@react-three/fiber, so it's only loaded
// once someone actually switches to it — no cost for the common 2D path,
// and no SSR attempt (it needs a real WebGL canvas).
const BodySelector3D = dynamic(() => import('./BodySelector3D'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', maxWidth: 360, height: 420, margin: '0 auto', borderRadius: 12, background: 'var(--surface-2, #f1ede3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted, #6b7280)', fontSize: '0.85rem' }}>
      Loading 3D view…
    </div>
  ),
});

interface Props {
  value: BodyPart[];
  onChange: (parts: BodyPart[]) => void;
  category?: string;
  readOnly?: boolean;
}

// Wraps the production 2D diagram and the 3D prototype behind a single
// visible toggle, defaulting to 2D. Both read/write the same BodyPart[]
// shape, so switching mid-form doesn't lose any selection.
export default function BodyPartPicker({ value, onChange, category, readOnly }: Props) {
  const [mode, setMode] = useState<'2d' | '3d'>('2d');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 10 }}>
        <button
          type="button"
          onClick={() => setMode('2d')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20,
            border: mode === '2d' ? '1.5px solid #d08c2a' : '1.5px solid rgba(37,79,122,0.25)',
            background: mode === '2d' ? 'rgba(208,140,42,0.14)' : 'transparent',
            color: mode === '2d' ? '#8a5d00' : 'var(--text-muted, #6b7280)',
            fontSize: '0.78rem', fontWeight: mode === '2d' ? 600 : 500, cursor: 'pointer',
          }}
        >
          <Box size={13} /> 2D
        </button>
        <button
          type="button"
          onClick={() => setMode('3d')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20,
            border: mode === '3d' ? '1.5px solid #d08c2a' : '1.5px solid rgba(37,79,122,0.25)',
            background: mode === '3d' ? 'rgba(208,140,42,0.14)' : 'transparent',
            color: mode === '3d' ? '#8a5d00' : 'var(--text-muted, #6b7280)',
            fontSize: '0.78rem', fontWeight: mode === '3d' ? 600 : 500, cursor: 'pointer',
          }}
        >
          <RotateCw size={13} /> 3D
        </button>
      </div>

      {mode === '2d' ? (
        <BodySelector value={value} onChange={onChange} category={category} readOnly={readOnly} />
      ) : (
        <BodySelector3D value={value} onChange={onChange} category={category} readOnly={readOnly} />
      )}
    </div>
  );
}
