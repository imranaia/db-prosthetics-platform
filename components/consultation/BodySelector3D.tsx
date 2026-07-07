'use client';

import { useMemo, useState } from 'react';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { DoubleSide, Vector2 } from 'three';
import type { BodyPart } from './BodySelector';

interface Props {
  value: BodyPart[];
  onChange: (parts: BodyPart[]) => void;
}

/* ─── Prototype notice ───
   This is a standalone experiment, kept separate from the production
   BodySelector (components/consultation/BodySelector.tsx). It intentionally
   reuses the exact same `region` key strings so a BodyPart[] produced here
   is byte-for-byte compatible with the 2D version — swapping one for the
   other later (if ever) wouldn't require a data migration.

   Coordinates are converted from the 2D SVG layout (viewBox 0 0 220 430)
   onto a centered 3D scene: x/y are re-centered and scaled down, y is
   flipped (SVG y grows downward, Three.js y grows upward). Limb segments
   are lathe-revolved "long bone" profiles — wide at both joint ends,
   narrow at the midshaft, per the actual silhouette of a femur/tibia/
   humerus in the ISPO technical-card references (docs/) — with a sphere
   at each joint. Still procedural geometry, not an imported/rigged mesh,
   to keep the scene light on low-end phones.
*/
const SCALE = 0.024;
function toScene(xSvg: number, ySvg: number, z = 0): [number, number, number] {
  return [(xSvg - 110) * SCALE, (215 - ySvg) * SCALE, z];
}

const KNEE_DISARTICULATION_OPTIONS = ['Standard', 'Rotationplasty (Van Ness Rotation)', 'PFFD (Proximal Femoral Focal Deficiency)'];
const ANKLE_LEVEL_OPTIONS = ['Ankle Disarticulation', "Syme's"];
const HAND_DIGIT_OPTIONS = ['Thumb', 'Index Finger', 'Middle Finger', 'Ring Finger', 'Little Finger'];
const FOOT_DIGIT_OPTIONS = ['Great Toe (Hallux)', '2nd Toe', '3rd Toe', '4th Toe', '5th Toe (Little Toe)'];

interface Region3D {
  region: string;
  label: string;
  subPartOptions?: string[];
  multiSubParts?: boolean;
  shape:
    | { kind: 'sphere'; center: [number, number, number]; r: number }
    // A long-bone shaft: widest at both joint ends, narrowest at the
    // midshaft — the actual silhouette of a femur/tibia/humerus (per the
    // ISPO technical-card illustrations in docs/), not a straight taper.
    | { kind: 'shaft'; top: [number, number, number]; bottom: [number, number, number]; rTop: number; rMid: number; rBottom: number }
    | { kind: 'box'; center: [number, number, number]; size: [number, number, number] }
    | { kind: 'digits'; center: [number, number, number]; spread: number; digitKind: 'hand' | 'foot' };
}

function shaftHeight(top: [number, number, number], bottom: [number, number, number]): number {
  return Math.hypot(top[0] - bottom[0], top[1] - bottom[1], top[2] - bottom[2]);
}

// Lathe profile for a long-bone shaft, revolved around the vertical axis:
// flares out toward each joint end, pinches in around the midshaft, with a
// few extra points near each end so the flare reads as a curve, not a kink.
function boneProfile(height: number, rBottom: number, rMid: number, rTop: number): Vector2[] {
  const stops: Array<[number, number]> = [
    [0, rBottom],
    [0.16, rBottom * 0.8],
    [0.5, rMid],
    [0.84, rTop * 0.8],
    [1, rTop],
  ];
  return stops.map(([t, r]) => new Vector2(Math.max(r, 0.01), t * height));
}

const REGIONS: Region3D[] = [
  { region: 'right_forequarter', label: 'Forequarter', shape: { kind: 'sphere', center: toScene(62, 68, 0.5), r: 0.28 } },
  { region: 'right_shoulder_disarticulation', label: 'Shoulder Disarticulation', shape: { kind: 'sphere', center: toScene(53, 89, 0.5), r: 0.42 } },
  { region: 'right_above_elbow', label: 'Above Elbow (Transhumeral)', shape: { kind: 'shaft', top: toScene(51, 90, 0.5), bottom: toScene(51, 136, 0.5), rTop: 0.42, rMid: 0.17, rBottom: 0.28 } },
  { region: 'right_elbow_disarticulation', label: 'Elbow Disarticulation', shape: { kind: 'sphere', center: toScene(51, 141, 0.5), r: 0.32 } },
  { region: 'right_below_elbow', label: 'Below Elbow (Transradial)', shape: { kind: 'shaft', top: toScene(51, 152, 0.5), bottom: toScene(51, 198, 0.5), rTop: 0.36, rMid: 0.13, rBottom: 0.22 } },
  { region: 'right_hand_wrist_disarticulation', label: 'Hand and Wrist Disarticulation', shape: { kind: 'sphere', center: toScene(51, 202, 0.5), r: 0.24 } },
  { region: 'right_partial_hand', label: 'Partial Hand (transcarpal)', shape: { kind: 'box', center: toScene(51, 223, 0.5), size: [0.86, 0.62, 0.3] } },
  { region: 'right_finger_amputation', label: 'Finger Amputation', subPartOptions: HAND_DIGIT_OPTIONS, multiSubParts: true, shape: { kind: 'digits', center: toScene(51, 240, 0.5), spread: 0.8, digitKind: 'hand' } },

  { region: 'right_hemipelvectomy', label: 'Hemipelvectomy', shape: { kind: 'sphere', center: toScene(85, 176, 0.25), r: 0.3 } },
  { region: 'right_hip_disarticulation', label: 'Hip Disarticulation', shape: { kind: 'sphere', center: toScene(90, 201, 0.25), r: 0.42 } },
  { region: 'right_above_knee', label: 'Above Knee (Transfemoral)', shape: { kind: 'shaft', top: toScene(90, 217, 0.25), bottom: toScene(90, 285, 0.25), rTop: 0.44, rMid: 0.18, rBottom: 0.3 } },
  { region: 'right_knee_disarticulation', label: 'Knee Disarticulation', subPartOptions: KNEE_DISARTICULATION_OPTIONS, shape: { kind: 'sphere', center: toScene(90, 289, 0.25), r: 0.4 } },
  { region: 'right_below_knee', label: 'Below Knee (Transtibial)', shape: { kind: 'shaft', top: toScene(90, 301, 0.25), bottom: toScene(90, 364, 0.25), rTop: 0.36, rMid: 0.13, rBottom: 0.22 } },
  { region: 'right_ankle_level', label: "Ankle Disarticulation / Syme's", subPartOptions: ANKLE_LEVEL_OPTIONS, shape: { kind: 'sphere', center: toScene(90, 368, 0.25), r: 0.3 } },
  { region: 'right_partial_foot', label: 'Partial Foot (e.g. Chopart)', shape: { kind: 'box', center: toScene(88, 391, 0.35), size: [0.8, 0.5, 0.4] } },
  { region: 'right_toe_amputation', label: 'Toe Amputation', subPartOptions: FOOT_DIGIT_OPTIONS, multiSubParts: true, shape: { kind: 'digits', center: toScene(88, 407, 0.35), spread: 1.1, digitKind: 'foot' } },

  { region: 'left_forequarter', label: 'Forequarter', shape: { kind: 'sphere', center: toScene(158, 68, 0.5), r: 0.28 } },
  { region: 'left_shoulder_disarticulation', label: 'Shoulder Disarticulation', shape: { kind: 'sphere', center: toScene(167, 89, 0.5), r: 0.42 } },
  { region: 'left_above_elbow', label: 'Above Elbow (Transhumeral)', shape: { kind: 'shaft', top: toScene(169, 90, 0.5), bottom: toScene(169, 136, 0.5), rTop: 0.42, rMid: 0.17, rBottom: 0.28 } },
  { region: 'left_elbow_disarticulation', label: 'Elbow Disarticulation', shape: { kind: 'sphere', center: toScene(169, 141, 0.5), r: 0.32 } },
  { region: 'left_below_elbow', label: 'Below Elbow (Transradial)', shape: { kind: 'shaft', top: toScene(169, 152, 0.5), bottom: toScene(169, 198, 0.5), rTop: 0.36, rMid: 0.13, rBottom: 0.22 } },
  { region: 'left_hand_wrist_disarticulation', label: 'Hand and Wrist Disarticulation', shape: { kind: 'sphere', center: toScene(169, 202, 0.5), r: 0.24 } },
  { region: 'left_partial_hand', label: 'Partial Hand (transcarpal)', shape: { kind: 'box', center: toScene(169, 223, 0.5), size: [0.86, 0.62, 0.3] } },
  { region: 'left_finger_amputation', label: 'Finger Amputation', subPartOptions: HAND_DIGIT_OPTIONS, multiSubParts: true, shape: { kind: 'digits', center: toScene(169, 240, 0.5), spread: 0.8, digitKind: 'hand' } },

  { region: 'left_hemipelvectomy', label: 'Hemipelvectomy', shape: { kind: 'sphere', center: toScene(135, 176, 0.25), r: 0.3 } },
  { region: 'left_hip_disarticulation', label: 'Hip Disarticulation', shape: { kind: 'sphere', center: toScene(130, 201, 0.25), r: 0.42 } },
  { region: 'left_above_knee', label: 'Above Knee (Transfemoral)', shape: { kind: 'shaft', top: toScene(130, 217, 0.25), bottom: toScene(130, 285, 0.25), rTop: 0.44, rMid: 0.18, rBottom: 0.3 } },
  { region: 'left_knee_disarticulation', label: 'Knee Disarticulation', subPartOptions: KNEE_DISARTICULATION_OPTIONS, shape: { kind: 'sphere', center: toScene(130, 289, 0.25), r: 0.4 } },
  { region: 'left_below_knee', label: 'Below Knee (Transtibial)', shape: { kind: 'shaft', top: toScene(130, 301, 0.25), bottom: toScene(130, 364, 0.25), rTop: 0.36, rMid: 0.13, rBottom: 0.22 } },
  { region: 'left_ankle_level', label: "Ankle Disarticulation / Syme's", subPartOptions: ANKLE_LEVEL_OPTIONS, shape: { kind: 'sphere', center: toScene(130, 368, 0.25), r: 0.3 } },
  { region: 'left_partial_foot', label: 'Partial Foot (e.g. Chopart)', shape: { kind: 'box', center: toScene(132, 391, 0.35), size: [0.8, 0.5, 0.4] } },
  { region: 'left_toe_amputation', label: 'Toe Amputation', subPartOptions: FOOT_DIGIT_OPTIONS, multiSubParts: true, shape: { kind: 'digits', center: toScene(132, 407, 0.35), spread: 1.1, digitKind: 'foot' } },
];

const GOLD = '#d08c2a';
const GOLD_STROKE = '#b5751f';
// Bone/ivory tones — reads as an anatomical reference (per the ISPO-style
// technical cards in consul/) rather than a flat schematic color block.
const BONE = '#ddd0b0';
const BONE_HOVER = '#e8dcb8';

function RegionMesh({
  def, selected, hovered, onClick, onOver, onOut,
}: {
  def: Region3D; selected: boolean; hovered: boolean;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
  onOver: (e: ThreeEvent<PointerEvent>) => void;
  onOut: (e: ThreeEvent<PointerEvent>) => void;
}) {
  const color = selected ? GOLD : hovered ? BONE_HOVER : BONE;
  const emissive = selected ? GOLD_STROKE : '#000000';
  const s = def.shape;
  // Bone is a matte, slightly chalky material — no shine, no metalness.
  const matProps = { color, emissive, emissiveIntensity: selected ? 0.35 : 0, roughness: 0.85, metalness: 0 };

  const common = { onClick, onPointerOver: onOver, onPointerOut: onOut };

  if (s.kind === 'sphere') {
    return (
      <mesh position={s.center} {...common}>
        <sphereGeometry args={[s.r, 24, 18]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
    );
  }
  if (s.kind === 'box') {
    return (
      <mesh position={s.center} {...common}>
        <boxGeometry args={s.size} />
        <meshStandardMaterial {...matProps} />
      </mesh>
    );
  }
  if (s.kind === 'shaft') {
    const height = shaftHeight(s.top, s.bottom);
    const points = boneProfile(height, s.rBottom, s.rMid, s.rTop);
    return (
      <mesh position={s.bottom} {...common}>
        <latheGeometry args={[points, 20]} />
        <meshStandardMaterial {...matProps} side={DoubleSide} />
      </mesh>
    );
  }
  // digits — a small fan of thin cylinders, one clickable group
  const count = 5;
  const lengths = s.digitKind === 'hand' ? [0.22, 0.32, 0.38, 0.32, 0.24] : [0.16, 0.2, 0.22, 0.18, 0.14];
  const thickness = s.digitKind === 'hand' ? 0.09 : 0.11;
  const startX = s.center[0] - s.spread / 2;
  const step = s.spread / (count - 1);
  return (
    <group {...common}>
      {lengths.map((len, i) => (
        <mesh key={i} position={[startX + step * i, s.center[1] - len / 2, s.center[2]]}>
          <cylinderGeometry args={[thickness, thickness * 0.8, len, 12]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      ))}
    </group>
  );
}

function Figure({
  selectedMap, hovered, onToggle, setHovered,
}: {
  selectedMap: Map<string, BodyPart>;
  hovered: string | null;
  onToggle: (def: Region3D) => void;
  setHovered: (r: string | null) => void;
}) {
  return (
    <group>
      {/* Static head + torso for context — not clickable. A muted, cooler
          tone than the bone-colored limbs so it reads as backdrop, not
          another selectable piece. */}
      <mesh position={toScene(110, 30, 0)}>
        <sphereGeometry args={[0.5, 24, 18]} />
        <meshStandardMaterial color="#cbc3b4" roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={toScene(110, 120, 0)} scale={[1, 1.75, 0.6]}>
        <sphereGeometry args={[0.95, 24, 18]} />
        <meshStandardMaterial color="#cbc3b4" roughness={0.9} metalness={0} />
      </mesh>

      {REGIONS.map(def => (
        <RegionMesh
          key={def.region}
          def={def}
          selected={selectedMap.has(def.region)}
          hovered={hovered === def.region}
          onClick={(e) => { e.stopPropagation(); onToggle(def); }}
          onOver={(e) => { e.stopPropagation(); setHovered(def.region); }}
          onOut={(e) => { e.stopPropagation(); setHovered(null); }}
        />
      ))}
    </group>
  );
}

export default function BodySelector3D({ value, onChange }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const selectedMap = useMemo(() => new Map<string, BodyPart>(value.map(p => [p.region, p])), [value]);

  function toggleRegion(def: Region3D) {
    if (selectedMap.has(def.region)) {
      onChange(value.filter(p => p.region !== def.region));
    } else {
      onChange([...value, { region: def.region, label: def.label, subParts: [] }]);
    }
  }

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

  const subPartRegions = REGIONS.filter(def => def.subPartOptions && selectedMap.has(def.region));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '100%', maxWidth: 360, height: 420, borderRadius: 12, overflow: 'hidden', background: 'linear-gradient(180deg, #f5f2ea 0%, #e9e2d2 100%)', border: '1px solid var(--border-card, #e2e8f0)' }}>
        <Canvas camera={{ position: [0, 0.1, 16], fov: 38 }}>
          <ambientLight intensity={0.75} />
          <directionalLight position={[3, 5, 4]} intensity={0.85} color="#fff6e8" />
          <directionalLight position={[-3, -2, -4]} intensity={0.3} color="#e8eef5" />
          <Figure selectedMap={selectedMap} hovered={hovered} onToggle={toggleRegion} setHovered={setHovered} />
          <OrbitControls enablePan={false} minDistance={10} maxDistance={24} target={[0, 0.1, 0]} />
        </Canvas>
      </div>

      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #6b7280)', textAlign: 'center' }}>
        Drag to rotate, scroll/pinch to zoom. Tap a region to select it — this is an experimental prototype, not the production diagram.
      </div>

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
                          padding: '4px 11px', borderRadius: '20px',
                          border: active ? '1.5px solid #d08c2a' : '1.5px solid rgba(37,79,122,0.3)',
                          background: active ? 'rgba(208,140,42,0.18)' : 'rgba(37,79,122,0.06)',
                          color: active ? '#8a5d00' : '#254f7a',
                          fontSize: '0.78rem', fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s',
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

      {value.length > 0 && (
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted, #6b7280)', marginBottom: '8px' }}>
            Selected Amputation Levels
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {value.map(part => {
              const label = part.subParts.length > 0 ? `${part.label} — ${part.subParts.join(', ')}` : part.label;
              return (
                <span key={part.region} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 20,
                  background: 'rgba(208,140,42,0.12)', border: '1px solid rgba(208,140,42,0.3)', color: 'var(--accent, #d08c2a)',
                  fontSize: '0.78rem', fontWeight: 500,
                }}>
                  {label}
                  <button
                    type="button"
                    onClick={() => removeRegion(part.region)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'rgba(208,140,42,0.7)', fontSize: '0.85rem', lineHeight: 1, display: 'flex', alignItems: 'center' }}
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
