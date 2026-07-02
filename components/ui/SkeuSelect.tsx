'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SkeuSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Custom-styled dropdown that replaces the native <select>. On mobile,
 * a native <select> hands control to the OS picker (varies wildly across
 * browsers and can visually take over the page); this always drops the
 * option panel down in place, right under the field.
 */
export default function SkeuSelect({ value, onChange, options, placeholder = 'Select…', disabled }: SkeuSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="skeu-select"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        style={{
          textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer', backgroundImage: 'none',
        }}
      >
        <span style={{
          color: selected ? 'var(--text-head)' : '#8a8478',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          style={{ flexShrink: 0, marginLeft: 8, transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s', opacity: 0.6 }}
        />
      </button>

      {open && !disabled && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          maxHeight: 240, overflowY: 'auto', zIndex: 60,
          background: '#fff', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 9,
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        }}>
          {options.length === 0 ? (
            <div style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No options</div>
          ) : options.map(o => (
            <div
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              style={{
                padding: '10px 14px', fontSize: '0.9rem', cursor: 'pointer',
                background: o.value === value ? 'rgba(37,79,122,0.08)' : 'transparent',
                color: 'var(--text-head)',
              }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
