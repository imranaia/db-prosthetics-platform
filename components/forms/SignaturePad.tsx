'use client';

import { useRef, useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  value?: string | null;
  onChange?: (dataUrl: string | null) => void;
  label?: string;
  height?: number;
  disabled?: boolean;
}

// Canvas-based signature capture. Draws via the Pointer Events API so a
// single set of handlers covers mouse, touch, and stylus input. Signed
// strokes are exported as a PNG data URL and stored as plain TEXT in the
// database, the same way photo URLs and other captured media are stored
// elsewhere in this app.
export default function SignaturePad({ value, onChange, label, height = 140, disabled }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [isEmpty, setIsEmpty] = useState(!value);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111827';

    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = value;
      setIsEmpty(false);
    } else {
      setIsEmpty(true);
    }
  }, [value]);

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getPoint(e);
    setIsEmpty(false);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled || !drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const point = getPoint(e);
    const last = lastPointRef.current;
    if (last) {
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
    lastPointRef.current = point;
  }

  function handlePointerUp() {
    if (disabled || !drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) onChange?.(canvas.toDataURL('image/png'));
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setIsEmpty(true);
    onChange?.(null);
  }

  return (
    <div>
      {label && <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>{label}</label>}
      <div style={{ position: 'relative', border: `2px ${disabled ? 'solid' : 'dashed'} var(--border-card)`, borderRadius: 10, background: '#fff', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height, display: 'block', touchAction: 'none', cursor: disabled ? 'default' : 'crosshair' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
        {isEmpty && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', pointerEvents: 'none', textAlign: 'center', padding: '0 12px' }}>
            {disabled ? 'Not signed' : 'Sign here with your finger, stylus, or mouse'}
          </div>
        )}
      </div>
      {!disabled && (
        <button
          type="button"
          onClick={handleClear}
          disabled={isEmpty}
          style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', fontSize: '0.75rem', borderRadius: 6, border: '1px solid var(--border-card)', background: 'transparent', color: 'var(--text-muted)', cursor: isEmpty ? 'default' : 'pointer', opacity: isEmpty ? 0.5 : 1 }}
        >
          <RotateCcw size={11} /> Clear
        </button>
      )}
    </div>
  );
}
