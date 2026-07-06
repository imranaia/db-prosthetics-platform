'use client';

import { useState } from 'react';

export interface BodyPart {
  region: string;
  label: string;
  subParts: string[];
}

interface Props {
  value: BodyPart[];
  onChange: (parts: BodyPart[]) => void;
}

/* ─── Region definitions ─── */
interface RegionDef {
  region: string;
  label: string;
  abbr: string;
  subPartOptions?: string[];
  shape:
    | { type: 'circle'; cx: number; cy: number; r: number }
    | { type: 'rect'; x: number; y: number; w: number; h: number; rx: number }
    | { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number };
}

const REGIONS: RegionDef[] = [
  { region: 'head',           label: 'Head',          abbr: 'Hd', shape: { type: 'circle',  cx: 110, cy: 36,  r: 28 } },
  { region: 'neck',           label: 'Neck',          abbr: 'Nk', shape: { type: 'rect',    x: 96,  y: 62,  w: 28, h: 20, rx: 5 } },
  { region: 'chest',          label: 'Chest',         abbr: 'Ch', shape: { type: 'rect',    x: 73,  y: 78,  w: 74, h: 58, rx: 6 } },
  { region: 'abdomen',        label: 'Abdomen',       abbr: 'Ab', shape: { type: 'rect',    x: 73,  y: 136, w: 74, h: 50, rx: 6 } },
  { region: 'left_shoulder',  label: 'L. Shoulder',   abbr: 'LS', shape: { type: 'ellipse', cx: 53,  cy: 89,  rx: 20, ry: 13 } },
  { region: 'right_shoulder', label: 'R. Shoulder',   abbr: 'RS', shape: { type: 'ellipse', cx: 167, cy: 89,  rx: 20, ry: 13 } },
  { region: 'left_upper_arm', label: 'L. Upper Arm',  abbr: 'LU', shape: { type: 'rect',    x: 35,  y: 88,  w: 32, h: 50, rx: 6 } },
  { region: 'left_elbow',     label: 'L. Elbow',      abbr: 'LE', shape: { type: 'ellipse', cx: 51,  cy: 141, rx: 16, ry: 10 } },
  { region: 'left_forearm',   label: 'L. Forearm',    abbr: 'LF', shape: { type: 'rect',    x: 35,  y: 151, w: 32, h: 48, rx: 6 } },
  { region: 'left_wrist',     label: 'L. Wrist',      abbr: 'LW', shape: { type: 'ellipse', cx: 51,  cy: 202, rx: 14, ry: 8 } },
  {
    region: 'left_hand', label: 'L. Hand', abbr: 'LH',
    subPartOptions: ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'],
    shape: { type: 'rect', x: 31, y: 210, w: 40, h: 52, rx: 7 },
  },
  { region: 'right_upper_arm', label: 'R. Upper Arm', abbr: 'RU', shape: { type: 'rect',    x: 153, y: 88,  w: 32, h: 50, rx: 6 } },
  { region: 'right_elbow',     label: 'R. Elbow',     abbr: 'RE', shape: { type: 'ellipse', cx: 169, cy: 141, rx: 16, ry: 10 } },
  { region: 'right_forearm',   label: 'R. Forearm',   abbr: 'RF', shape: { type: 'rect',    x: 153, y: 151, w: 32, h: 48, rx: 6 } },
  { region: 'right_wrist',     label: 'R. Wrist',     abbr: 'RW', shape: { type: 'ellipse', cx: 169, cy: 202, rx: 14, ry: 8 } },
  {
    region: 'right_hand', label: 'R. Hand', abbr: 'RH',
    subPartOptions: ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'],
    shape: { type: 'rect', x: 149, y: 210, w: 40, h: 52, rx: 7 },
  },
  { region: 'left_hip',   label: 'L. Hip',   abbr: 'LHp', shape: { type: 'rect',    x: 73,  y: 186, w: 35, h: 30, rx: 5 } },
  { region: 'right_hip',  label: 'R. Hip',   abbr: 'RHp', shape: { type: 'rect',    x: 112, y: 186, w: 35, h: 30, rx: 5 } },
  { region: 'left_thigh', label: 'L. Thigh', abbr: 'LT', shape: { type: 'rect',    x: 73,  y: 216, w: 34, h: 70, rx: 6 } },
  { region: 'left_knee',  label: 'L. Knee',  abbr: 'LK', shape: { type: 'ellipse', cx: 90,  cy: 289, rx: 17, ry: 11 } },
  { region: 'left_shin',  label: 'L. Shin',  abbr: 'LSh', shape: { type: 'rect',    x: 73,  y: 300, w: 34, h: 65, rx: 6 } },
  { region: 'left_ankle', label: 'L. Ankle', abbr: 'LA', shape: { type: 'ellipse', cx: 90,  cy: 368, rx: 15, ry: 9 } },
  {
    region: 'left_foot', label: 'L. Foot', abbr: 'LFt',
    subPartOptions: ['Big Toe', '2nd', '3rd', '4th', 'Pinky Toe'],
    shape: { type: 'rect', x: 64, y: 377, w: 48, h: 28, rx: 6 },
  },
  { region: 'right_thigh', label: 'R. Thigh', abbr: 'RT', shape: { type: 'rect',    x: 113, y: 216, w: 34, h: 70, rx: 6 } },
  { region: 'right_knee',  label: 'R. Knee',  abbr: 'RK', shape: { type: 'ellipse', cx: 130, cy: 289, rx: 17, ry: 11 } },
  { region: 'right_shin',  label: 'R. Shin',  abbr: 'RSh', shape: { type: 'rect',    x: 113, y: 300, w: 34, h: 65, rx: 6 } },
  { region: 'right_ankle', label: 'R. Ankle', abbr: 'RA', shape: { type: 'ellipse', cx: 130, cy: 368, rx: 15, ry: 9 } },
  {
    region: 'right_foot', label: 'R. Foot', abbr: 'RFt',
    subPartOptions: ['Big Toe', '2nd', '3rd', '4th', 'Pinky Toe'],
    shape: { type: 'rect', x: 108, y: 377, w: 48, h: 28, rx: 6 },
  },
];

/* ─── Helpers ─── */
function getCentroid(def: RegionDef): { x: number; y: number } {
  const s = def.shape;
  if (s.type === 'circle')  return { x: s.cx, y: s.cy };
  if (s.type === 'ellipse') return { x: s.cx, y: s.cy };
  return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
}

/* ─── SVG shape renderer ─── */
function RegionShape({
  def,
  selected,
  hovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  def: RegionDef;
  selected: boolean;
  hovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const fill = selected
    ? 'rgba(27,61,94,0.65)'
    : hovered
    ? 'rgba(37,79,122,0.32)'
    : 'rgba(37,79,122,0.12)';
  const stroke  = selected ? '#1b3d5e' : '#254f7a';
  const strokeW = selected ? 2 : 1;

  const common = {
    fill,
    stroke,
    strokeWidth: strokeW,
    style: { cursor: 'pointer', transition: 'fill 0.15s, stroke 0.15s' },
    onClick,
    onMouseEnter,
    onMouseLeave,
  };

  const s = def.shape;
  const center = getCentroid(def);

  return (
    <g>
      {s.type === 'circle'  && <circle  cx={s.cx} cy={s.cy} r={s.r}                       {...common} />}
      {s.type === 'rect'    && <rect    x={s.x}  y={s.y}  width={s.w} height={s.h} rx={s.rx} {...common} />}
      {s.type === 'ellipse' && <ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry}            {...common} />}
      <text
        x={center.x}
        y={center.y + 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={6}
        fill={selected ? '#7a4d00' : '#254f7a'}
        style={{ pointerEvents: 'none', userSelect: 'none', fontWeight: selected ? 700 : 500 }}
      >
        {def.abbr}
      </text>
    </g>
  );
}

/* ─── Main component ─── */
export default function BodySelector({ value, onChange }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const selectedMap = new Map<string, BodyPart>(value.map(p => [p.region, p]));

  function toggleRegion(def: RegionDef) {
    if (selectedMap.has(def.region)) {
      // deselect — remove entirely (also clears subParts)
      onChange(value.filter(p => p.region !== def.region));
    } else {
      onChange([...value, { region: def.region, label: def.label, subParts: [] }]);
    }
  }

  function toggleSubPart(region: string, sub: string) {
    onChange(value.map(p => {
      if (p.region !== region) return p;
      const has = p.subParts.includes(sub);
      return { ...p, subParts: has ? p.subParts.filter(s => s !== sub) : [...p.subParts, sub] };
    }));
  }

  function removeRegion(region: string) {
    onChange(value.filter(p => p.region !== region));
  }

  // Regions that are selected AND have subPartOptions
  const subPartRegions = REGIONS.filter(
    def => def.subPartOptions && selectedMap.has(def.region)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>

      {/* SVG diagram */}
      <div style={{ width: '100%', maxWidth: '280px' }}>
        <svg
          viewBox="0 0 220 430"
          width="100%"
          style={{ display: 'block', overflow: 'visible' }}
          aria-label="Interactive human body diagram"
        >
          {/* Side orientation labels */}
          <text x={2}   y={10} fontSize={7} fill="rgba(0,0,0,0.35)" style={{ userSelect: 'none' }}>← Patient&apos;s Right</text>
          <text x={218} y={10} fontSize={7} fill="rgba(0,0,0,0.35)" textAnchor="end" style={{ userSelect: 'none' }}>Patient&apos;s Left →</text>

          {REGIONS.map(def => (
            <RegionShape
              key={def.region}
              def={def}
              selected={selectedMap.has(def.region)}
              hovered={hovered === def.region}
              onClick={() => toggleRegion(def)}
              onMouseEnter={() => setHovered(def.region)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted, #6b7280)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(27,61,94,0.65)', border: '1.5px solid #1b3d5e', display: 'inline-block' }} />
          Selected
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(37,79,122,0.12)', border: '1.5px solid #254f7a', display: 'inline-block' }} />
          Tap to select
        </span>
      </div>

      {/* Sub-part panels — one per selected hand/foot region */}
      {subPartRegions.length > 0 && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {subPartRegions.map(def => {
            const part = selectedMap.get(def.region)!;
            return (
              <div key={def.region} style={{ background: 'rgba(27,61,94,0.06)', border: '1px solid rgba(27,61,94,0.2)', borderRadius: '10px', padding: '10px 14px' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--primary, #1b3d5e)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {def.label} — Select fingers/toes
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {def.subPartOptions!.map(sub => {
                    const active = part.subParts.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => toggleSubPart(def.region, sub)}
                        style={{
                          padding: '4px 11px',
                          borderRadius: '20px',
                          border: active ? '1.5px solid #1b3d5e' : '1.5px solid rgba(37,79,122,0.3)',
                          background: active ? 'rgba(27,61,94,0.18)' : 'rgba(37,79,122,0.06)',
                          color: active ? '#1b3d5e' : '#254f7a',
                          fontSize: '0.78rem',
                          fontWeight: active ? 600 : 400,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected parts summary chips */}
      {value.length > 0 && (
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted, #6b7280)', marginBottom: '8px' }}>
            Selected Areas
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {value.map(part => {
              const label = part.subParts.length > 0
                ? `${part.label} — ${part.subParts.join(', ')}`
                : part.label;
              return (
                <span
                  key={part.region}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: 20,
                    background: 'rgba(27,61,94,0.12)',
                    border: '1px solid rgba(27,61,94,0.3)',
                    color: 'var(--primary, #1b3d5e)',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                  }}
                >
                  {label}
                  <button
                    type="button"
                    onClick={() => removeRegion(part.region)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: 'rgba(27,61,94,0.7)',
                      fontSize: '0.85rem',
                      lineHeight: 1,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    aria-label={`Remove ${part.label}`}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
