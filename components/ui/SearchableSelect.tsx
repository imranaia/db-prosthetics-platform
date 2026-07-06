'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}

/**
 * Like SkeuSelect, but for long lists (e.g. patients) — opens with a search
 * box so you can filter by typing instead of scrolling past everyone else.
 */
export default function SearchableSelect({
  value, onChange, options, placeholder = 'Select…', searchPlaceholder = 'Search…', disabled,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(''); }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); setQuery(''); }
    }
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 10); }, [open]);

  const selected = options.find(o => o.value === value);
  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter(o => o.label.toLowerCase().includes(q)) : options;

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
          zIndex: 60,
          background: '#fff', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 9,
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        }}>
          <div style={{ position: 'relative', padding: 8, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <Search size={13} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                width: '100%', padding: '7px 10px 7px 30px', borderRadius: 6, border: '1px solid var(--border-card)',
                fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No matches</div>
            ) : filtered.map(o => (
              <div
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); setQuery(''); }}
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
        </div>
      )}
    </div>
  );
}
