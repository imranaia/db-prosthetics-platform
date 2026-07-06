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

/* ─── Region definitions ───
   Clinical amputation levels (per the reference chart), not generic body
   parts — this diagram exists to record WHERE and AT WHAT LEVEL a patient
   is amputated, matching standard P&O assessment terminology.

   Side naming: for a front-facing figure, the patient's own right side
   appears on the LEFT of the image (mirror convention) — shapes at low x
   are "right_*", shapes at high x are "left_*".

   Limb segments use the 'taper' shape (wide at the joint end, narrower at
   the distal end) instead of uniform-width rectangles so the diagram reads
   as an actual limb rather than a stack of capsules.
*/
interface RegionDef {
  region: string;
  label: string;
  abbr: string;
  subPartOptions?: string[];
  // Hand/foot digits are a multi-select (several fingers/toes can be
  // affected at once); knee/ankle variants are mutually exclusive.
  multiSubParts?: boolean;
  shape:
    | { type: 'circle'; cx: number; cy: number; r: number }
    | { type: 'rect'; x: number; y: number; w: number; h: number; rx: number }
    | { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
    | { type: 'taper'; x1: number; y1: number; r1: number; x2: number; y2: number; r2: number };
  // Purely decorative — draws finger/toe bumps over the shape so a hand or
  // foot region reads visually as a hand or foot, not a plain rounded box.
  decoration?: 'hand' | 'foot';
}

const KNEE_DISARTICULATION_OPTIONS = ['Standard', 'Rotationplasty (Van Ness Rotation)', 'PFFD (Proximal Femoral Focal Deficiency)'];
const ANKLE_LEVEL_OPTIONS = ['Ankle Disarticulation', "Syme's"];
const HAND_DIGIT_OPTIONS = ['Thumb', 'Index Finger', 'Middle Finger', 'Ring Finger', 'Little Finger'];
const FOOT_DIGIT_OPTIONS = ['Great Toe (Hallux)', '2nd Toe', '3rd Toe', '4th Toe', '5th Toe (Little Toe)'];

const REGIONS: RegionDef[] = [
  // Head/torso outline only — not amputation sites, not selectable — kept
  // implicitly by NOT defining regions for them (see the static outline
  // rendered separately below).

  /* ─ Right side (low x) — upper limb ─ */
  { region: 'right_forequarter',                label: 'Forequarter',                          abbr: 'FQ',  shape: { type: 'ellipse', cx: 62,  cy: 68,  rx: 11, ry: 7 } },
  { region: 'right_shoulder_disarticulation',   label: 'Shoulder Disarticulation',              abbr: 'SD',  shape: { type: 'ellipse', cx: 53,  cy: 89,  rx: 20, ry: 13 } },
  { region: 'right_above_elbow',                label: 'Above Elbow (Transhumeral)',            abbr: 'AE',  shape: { type: 'taper', x1: 51, y1: 90,  r1: 17, x2: 51, y2: 136, r2: 11 } },
  { region: 'right_elbow_disarticulation',      label: 'Elbow Disarticulation',                 abbr: 'ED',  shape: { type: 'ellipse', cx: 51,  cy: 141, rx: 16, ry: 10 } },
  { region: 'right_below_elbow',                label: 'Below Elbow (Transradial)',             abbr: 'BE',  shape: { type: 'taper', x1: 51, y1: 152, r1: 15, x2: 51, y2: 198, r2: 10 } },
  { region: 'right_hand_wrist_disarticulation', label: 'Hand and Wrist Disarticulation',        abbr: 'HWD', shape: { type: 'ellipse', cx: 51,  cy: 202, rx: 14, ry: 8 } },
  {
    region: 'right_partial_hand', label: 'Partial Hand (transcarpal)', abbr: 'PH',
    subPartOptions: HAND_DIGIT_OPTIONS, multiSubParts: true, decoration: 'hand',
    shape: { type: 'rect', x: 33, y: 210, w: 36, h: 26, rx: 10 },
  },

  /* ─ Right side (low x) — lower limb ─ */
  { region: 'right_hemipelvectomy',        label: 'Hemipelvectomy',        abbr: 'HP', shape: { type: 'ellipse', cx: 85, cy: 176, rx: 13, ry: 7 } },
  { region: 'right_hip_disarticulation',   label: 'Hip Disarticulation',   abbr: 'HD', shape: { type: 'rect',    x: 73, y: 186, w: 35, h: 30, rx: 15 } },
  { region: 'right_above_knee',            label: 'Above Knee (Transfemoral)', abbr: 'AK', shape: { type: 'taper', x1: 90, y1: 217, r1: 18, x2: 90, y2: 285, r2: 12 } },
  {
    region: 'right_knee_disarticulation', label: 'Knee Disarticulation', abbr: 'KD',
    subPartOptions: KNEE_DISARTICULATION_OPTIONS,
    shape: { type: 'ellipse', cx: 90, cy: 289, rx: 17, ry: 11 },
  },
  { region: 'right_below_knee', label: 'Below Knee (Transtibial)', abbr: 'BK', shape: { type: 'taper', x1: 90, y1: 301, r1: 15, x2: 90, y2: 364, r2: 9 } },
  {
    region: 'right_ankle_level', label: "Ankle Disarticulation / Syme's", abbr: 'AD/Sy',
    subPartOptions: ANKLE_LEVEL_OPTIONS,
    shape: { type: 'ellipse', cx: 90, cy: 368, rx: 15, ry: 9 },
  },
  {
    region: 'right_partial_foot', label: 'Partial Foot (e.g. Chopart)', abbr: 'PF',
    subPartOptions: FOOT_DIGIT_OPTIONS, multiSubParts: true, decoration: 'foot',
    shape: { type: 'rect', x: 64, y: 377, w: 48, h: 24, rx: 10 },
  },

  /* ─ Left side (high x) — upper limb ─ */
  { region: 'left_forequarter',                label: 'Forequarter',                   abbr: 'FQ',  shape: { type: 'ellipse', cx: 158, cy: 68,  rx: 11, ry: 7 } },
  { region: 'left_shoulder_disarticulation',   label: 'Shoulder Disarticulation',       abbr: 'SD',  shape: { type: 'ellipse', cx: 167, cy: 89,  rx: 20, ry: 13 } },
  { region: 'left_above_elbow',                label: 'Above Elbow (Transhumeral)',     abbr: 'AE',  shape: { type: 'taper', x1: 169, y1: 90,  r1: 17, x2: 169, y2: 136, r2: 11 } },
  { region: 'left_elbow_disarticulation',      label: 'Elbow Disarticulation',          abbr: 'ED',  shape: { type: 'ellipse', cx: 169, cy: 141, rx: 16, ry: 10 } },
  { region: 'left_below_elbow',                label: 'Below Elbow (Transradial)',      abbr: 'BE',  shape: { type: 'taper', x1: 169, y1: 152, r1: 15, x2: 169, y2: 198, r2: 10 } },
  { region: 'left_hand_wrist_disarticulation', label: 'Hand and Wrist Disarticulation', abbr: 'HWD', shape: { type: 'ellipse', cx: 169, cy: 202, rx: 14, ry: 8 } },
  {
    region: 'left_partial_hand', label: 'Partial Hand (transcarpal)', abbr: 'PH',
    subPartOptions: HAND_DIGIT_OPTIONS, multiSubParts: true, decoration: 'hand',
    shape: { type: 'rect', x: 151, y: 210, w: 36, h: 26, rx: 10 },
  },

  /* ─ Left side (high x) — lower limb ─ */
  { region: 'left_hemipelvectomy',      label: 'Hemipelvectomy',        abbr: 'HP', shape: { type: 'ellipse', cx: 135, cy: 176, rx: 13, ry: 7 } },
  { region: 'left_hip_disarticulation', label: 'Hip Disarticulation',   abbr: 'HD', shape: { type: 'rect',    x: 112, y: 186, w: 35, h: 30, rx: 15 } },
  { region: 'left_above_knee',          label: 'Above Knee (Transfemoral)', abbr: 'AK', shape: { type: 'taper', x1: 130, y1: 217, r1: 18, x2: 130, y2: 285, r2: 12 } },
  {
    region: 'left_knee_disarticulation', label: 'Knee Disarticulation', abbr: 'KD',
    subPartOptions: KNEE_DISARTICULATION_OPTIONS,
    shape: { type: 'ellipse', cx: 130, cy: 289, rx: 17, ry: 11 },
  },
  { region: 'left_below_knee', label: 'Below Knee (Transtibial)', abbr: 'BK', shape: { type: 'taper', x1: 130, y1: 301, r1: 15, x2: 130, y2: 364, r2: 9 } },
  {
    region: 'left_ankle_level', label: "Ankle Disarticulation / Syme's", abbr: 'AD/Sy',
    subPartOptions: ANKLE_LEVEL_OPTIONS,
    shape: { type: 'ellipse', cx: 130, cy: 368, rx: 15, ry: 9 },
  },
  {
    region: 'left_partial_foot', label: 'Partial Foot (e.g. Chopart)', abbr: 'PF',
    subPartOptions: FOOT_DIGIT_OPTIONS, multiSubParts: true, decoration: 'foot',
    shape: { type: 'rect', x: 108, y: 377, w: 48, h: 24, rx: 10 },
  },
];

/* ─── Helpers ─── */
function getCentroid(def: RegionDef): { x: number; y: number } {
  const s = def.shape;
  if (s.type === 'circle')  return { x: s.cx, y: s.cy };
  if (s.type === 'ellipse') return { x: s.cx, y: s.cy };
  if (s.type === 'taper')   return { x: (s.x1 + s.x2) / 2, y: (s.y1 + s.y2) / 2 };
  return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
}

// Tapered "stadium" path — a capsule whose two ends can have different
// radii, so a limb segment reads as wider at the joint and narrower toward
// the next joint instead of a uniform-width rounded rectangle.
function taperPathD(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): string {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const a1 = [x1 + nx * r1, y1 + ny * r1];
  const a2 = [x1 - nx * r1, y1 - ny * r1];
  const b1 = [x2 + nx * r2, y2 + ny * r2];
  const b2 = [x2 - nx * r2, y2 - ny * r2];
  return `M ${a1[0]},${a1[1]} L ${b1[0]},${b1[1]} A ${r2} ${r2} 0 0 0 ${b2[0]},${b2[1]} L ${a2[0]},${a2[1]} A ${r1} ${r1} 0 0 0 ${a1[0]},${a1[1]} Z`;
}

// Decorative finger/toe bumps drawn over a hand or foot region so it reads
// visually as digits — the actual per-digit selection happens in the
// multi-select panel below the diagram (small SVG targets are unreliable
// to tap on a phone), so these bumps share the parent shape's click handler.
function DigitBumps({ kind, cx, cy, w, fill, stroke }: { kind: 'hand' | 'foot'; cx: number; cy: number; w: number; fill: string; stroke: string }) {
  const count = 5;
  const spread = w * 0.92;
  const startX = cx - spread / 2;
  const step = spread / (count - 1);
  // Middle digit longest, tapering toward the outer two — reads as
  // fingers/toes of varying length rather than identical pegs.
  const lengths = kind === 'hand' ? [7, 10, 12, 10, 7.5] : [5, 6, 6.5, 5.5, 4.5];
  const thickness = kind === 'hand' ? 4.2 : 5;

  return (
    <g style={{ pointerEvents: 'none' }}>
      {lengths.map((len, i) => {
        const x = startX + step * i;
        const y2 = cy + len;
        return (
          <path
            key={i}
            d={taperPathD(x, cy, thickness / 2, x, y2, thickness / 2.6)}
            fill={fill}
            stroke={stroke}
            strokeWidth={0.75}
          />
        );
      })}
    </g>
  );
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
    ? 'rgba(208,140,42,0.65)'
    : hovered
    ? 'rgba(37,79,122,0.32)'
    : 'rgba(37,79,122,0.12)';
  const stroke  = selected ? '#d08c2a' : '#254f7a';
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
      {s.type === 'taper'   && <path    d={taperPathD(s.x1, s.y1, s.r1, s.x2, s.y2, s.r2)} {...common} />}
      {def.decoration && s.type === 'rect' && (
        <DigitBumps kind={def.decoration} cx={s.x + s.w / 2} cy={s.y + s.h} w={s.w} fill={fill} stroke={stroke} />
      )}
      <text
        x={center.x}
        y={center.y + 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={5.5}
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

  // Knee/ankle variants are mutually exclusive (one level per region);
  // hand/foot digits are a multi-select (several can be affected at once).
  function toggleSubPart(region: string, sub: string, multi: boolean) {
    onChange(value.map(p => {
      if (p.region !== region) return p;
      if (multi) {
        const has = p.subParts.includes(sub);
        return { ...p, subParts: has ? p.subParts.filter(s => s !== sub) : [...p.subParts, sub] };
      }
      const already = p.subParts[0] === sub;
      return { ...p, subParts: already ? [] : [sub] };
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
          aria-label="Interactive amputation-level diagram"
        >
          {/* Side orientation labels — front-facing figure, so the patient's
              right appears on the image's left (mirror convention) */}
          <text x={2}   y={10} fontSize={7} fill="rgba(0,0,0,0.35)" style={{ userSelect: 'none' }}>← Patient&apos;s Right</text>
          <text x={218} y={10} fontSize={7} fill="rgba(0,0,0,0.35)" textAnchor="end" style={{ userSelect: 'none' }}>Patient&apos;s Left →</text>

          {/* Static body outline for context — head, neck, torso are not
              amputation sites, so they aren't clickable regions. A smooth
              silhouette (shoulders → waist taper → hip flare) reads as an
              actual person instead of a circle stacked on a rectangle. */}
          <g fill="rgba(37,79,122,0.06)" stroke="rgba(37,79,122,0.28)" strokeWidth={1}>
            {/* Head + neck */}
            <ellipse cx={110} cy={30} rx={19} ry={22} />
            <path d="M 101,49 Q 100,55 100,58 L 120,58 Q 120,55 119,49 Z" />
            {/* Torso — shoulders, waist taper, hip flare */}
            <path d="
              M 100,58
              Q 90,60 86,68
              Q 82,78 76,84
              Q 71,90 71,108
              Q 70,128 74,143
              Q 71,158 74,171
              Q 77,182 88,186
              L 132,186
              Q 143,182 146,171
              Q 149,158 146,143
              Q 150,128 149,108
              Q 149,90 144,84
              Q 138,78 134,68
              Q 130,60 120,58
              Z
            " />
          </g>

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
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(208,140,42,0.65)', border: '1.5px solid #d08c2a', display: 'inline-block' }} />
          Selected
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(37,79,122,0.12)', border: '1.5px solid #254f7a', display: 'inline-block' }} />
          Tap to select
        </span>
      </div>

      {/* Sub-level panels — one per selected region with variant options
          (Knee Disarticulation, Ankle Disarticulation/Syme's) or affected
          digits (Partial Hand, Partial Foot — pick as many as apply) */}
      {subPartRegions.length > 0 && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {subPartRegions.map(def => {
            const part = selectedMap.get(def.region)!;
            const multi = !!def.multiSubParts;
            return (
              <div key={def.region} style={{ background: 'rgba(208,140,42,0.06)', border: '1px solid rgba(208,140,42,0.2)', borderRadius: '10px', padding: '10px 14px' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--accent, #d08c2a)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {def.label} — {multi ? 'Select affected digit(s)' : 'Specify'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {def.subPartOptions!.map(sub => {
                    const active = multi ? part.subParts.includes(sub) : part.subParts[0] === sub;
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => toggleSubPart(def.region, sub, multi)}
                        style={{
                          padding: '4px 11px',
                          borderRadius: '20px',
                          border: active ? '1.5px solid #d08c2a' : '1.5px solid rgba(37,79,122,0.3)',
                          background: active ? 'rgba(208,140,42,0.18)' : 'rgba(37,79,122,0.06)',
                          color: active ? '#8a5d00' : '#254f7a',
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
            Selected Amputation Levels
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
                    background: 'rgba(208,140,42,0.12)',
                    border: '1px solid rgba(208,140,42,0.3)',
                    color: 'var(--accent, #d08c2a)',
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
                      color: 'rgba(208,140,42,0.7)',
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
