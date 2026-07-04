'use client';

import { useCallback, useRef, useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface DialogState {
  mode: 'confirm' | 'alert';
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

/**
 * Replaces window.confirm()/window.alert() with a styled modal matching
 * the rest of the app, since browser-native dialogs can't be styled and
 * look out of place. Renders nothing until confirm()/alertUser() is
 * called; mount the returned `dialog` once near the root of the page.
 */
export function useConfirmDialog() {
  const [state, setState] = useState<DialogState | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((message: string, options?: { title?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean }) => {
    setState({ mode: 'confirm', message, ...options });
    return new Promise<boolean>(resolve => { resolver.current = resolve; });
  }, []);

  const alertUser = useCallback((message: string, options?: { title?: string }) => {
    setState({ mode: 'alert', message, ...options });
    return new Promise<void>(resolve => { resolver.current = () => resolve(); });
  }, []);

  function close(result: boolean) {
    setState(null);
    resolver.current?.(result);
    resolver.current = null;
  }

  const dialog = state ? (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 300, padding: 20,
      }}
      onClick={() => close(false)}
    >
      <div
        className="skeu-card"
        style={{ maxWidth: 420, width: '100%', padding: 24, cursor: 'default' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: state.danger ? '#fee2e2' : 'rgba(27,61,94,0.1)',
          }}>
            {state.danger
              ? <AlertTriangle size={18} color="#b91c1c" />
              : <Info size={18} color="var(--primary)" />}
          </div>
          <div>
            {state.title && (
              <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-head)', margin: '0 0 6px' }}>{state.title}</h3>
            )}
            <p style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{state.message}</p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          {state.mode === 'confirm' && (
            <button
              type="button"
              onClick={() => close(false)}
              style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}
            >
              {state.cancelLabel || 'Cancel'}
            </button>
          )}
          <button
            type="button"
            onClick={() => close(true)}
            style={{
              padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 600, color: '#fff',
              background: state.danger ? '#b91c1c' : 'var(--primary)',
            }}
          >
            {state.mode === 'alert' ? 'OK' : (state.confirmLabel || 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, alertUser, dialog };
}
