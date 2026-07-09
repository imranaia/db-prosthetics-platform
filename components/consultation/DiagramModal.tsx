'use client';

import { X } from 'lucide-react';
import BodyPartPicker from './BodyPartPicker';
import type { BodyPart } from './BodySelector';

interface Props {
  bodyParts: BodyPart[];
  category?: string;
  onClose: () => void;
}

// Shows a single order's affected-area diagram in an overlay, isolated from
// the rest of the order list — so opening it never affects the layout or
// state of any other order card.
export default function DiagramModal({ bodyParts, category, onClose }: Props) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}
      onClick={onClose}
    >
      <div
        className="skeu-card"
        style={{ maxWidth: 420, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24, cursor: 'default' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>
            Affected Area
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}
          >
            <X size={20} />
          </button>
        </div>
        <BodyPartPicker value={bodyParts} onChange={() => {}} category={category} readOnly />
      </div>
    </div>
  );
}
