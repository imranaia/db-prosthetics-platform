'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import type { BodyPart } from './BodySelector';

interface Props {
  value: BodyPart[];
  onChange: (parts: BodyPart[]) => void;
  // Device Category (Upper Limb / Lower Limb / Facial / Spinal / Other) —
  // when it's a limb category, only that side's regions are shown/selectable,
  // mirroring the 2D BodySelector's identical restriction.
  category?: string;
  readOnly?: boolean;
}

/* ─── Real body mesh ───
   The visible shell is an actual sculpted human base mesh (public/models/
   body-base.glb — a decimated/re-clustered export of a licensed sculpt, see
   docs/DB_Prosthetics_Body_Model_Reference.jpg for the source reference),
   not procedural geometry. Its bounding box is (roughly, in its own native
   units): X -50.4..50.9, Y 1.75..179.3 (feet to top of head), Z -20.6..14.2.

   Region click targets are placed as small invisible/highlightable marker
   spheres on top of this mesh, positioned by standard body-proportion
   fractions of total height (not by re-using the old 2D SVG diagram's pixel
   coordinates) — the real sculpt stands with arms relaxed at its sides,
   not spread out the way the 2D schematic draws them for click clarity, so
   the two coordinate systems don't line up and each landmark was
   recalibrated directly against this mesh instead.
*/
const MODEL_MIN_Y = 1.75;
const MODEL_MAX_Y = 179.34;
const HEIGHT = MODEL_MAX_Y - MODEL_MIN_Y;

// Fraction of total height, measured up from the floor.
function yAt(fraction: number): number {
  return MODEL_MIN_Y + HEIGHT * fraction;
}

const KNEE_DISARTICULATION_OPTIONS = ['Standard', 'Rotationplasty (Van Ness Rotation)', 'PFFD (Proximal Femoral Focal Deficiency)'];
const ANKLE_LEVEL_OPTIONS = ['Ankle Disarticulation', "Syme's"];
const HAND_DIGIT_OPTIONS = ['Thumb', 'Index Finger', 'Middle Finger', 'Ring Finger', 'Little Finger'];
const FOOT_DIGIT_OPTIONS = ['Great Toe (Hallux)', '2nd Toe', '3rd Toe', '4th Toe', '5th Toe (Little Toe)'];

interface Region3D {
  region: string;
  label: string;
  limbSide: 'upper' | 'lower';
  subPartOptions?: string[];
  multiSubParts?: boolean;
  anchor: [number, number, number];
  markerRadius: number;
}

// sign = -1 for right (screen-left, mirror convention), +1 for left (screen-right)
function arm(sign: number, fraction: number, out: number, forward = 2): [number, number, number] {
  return [sign * out, yAt(fraction), forward];
}
function leg(sign: number, fraction: number, out: number, forward = 1): [number, number, number] {
  return [sign * out, yAt(fraction), forward];
}

const REGIONS: Region3D[] = [
  // Right arm (screen-left, sign -1) — arm hangs close to the torso, so
  // the out-from-center distance is small and grows slightly toward the
  // hand as the natural elbow bend carries it out a touch further.
  { region: 'right_forequarter', label: 'Forequarter', limbSide: 'upper', anchor: arm(-1, 0.845, 17), markerRadius: 5 },
  { region: 'right_shoulder_disarticulation', label: 'Shoulder Disarticulation', limbSide: 'upper', anchor: arm(-1, 0.815, 19.5), markerRadius: 6 },
  { region: 'right_above_elbow', label: 'Above Elbow (Transhumeral)', limbSide: 'upper', anchor: arm(-1, 0.72, 21.5), markerRadius: 5 },
  { region: 'right_elbow_disarticulation', label: 'Elbow Disarticulation', limbSide: 'upper', anchor: arm(-1, 0.63, 22.5), markerRadius: 5 },
  { region: 'right_below_elbow', label: 'Below Elbow (Transradial)', limbSide: 'upper', anchor: arm(-1, 0.545, 23.5), markerRadius: 5 },
  { region: 'right_hand_wrist_disarticulation', label: 'Hand and Wrist Disarticulation', limbSide: 'upper', anchor: arm(-1, 0.465, 24.5), markerRadius: 4 },
  { region: 'right_partial_hand', label: 'Partial Hand (transcarpal)', limbSide: 'upper', anchor: arm(-1, 0.43, 25.5), markerRadius: 4 },
  { region: 'right_finger_amputation', label: 'Finger Amputation', limbSide: 'upper', subPartOptions: HAND_DIGIT_OPTIONS, multiSubParts: true, anchor: arm(-1, 0.4, 26.5), markerRadius: 4 },

  { region: 'right_hemipelvectomy', label: 'Hemipelvectomy', limbSide: 'lower', anchor: leg(-1, 0.545, 12.5), markerRadius: 5 },
  { region: 'right_hip_disarticulation', label: 'Hip Disarticulation', limbSide: 'lower', anchor: leg(-1, 0.51, 11.5), markerRadius: 6 },
  { region: 'right_above_knee', label: 'Above Knee (Transfemoral)', limbSide: 'lower', anchor: leg(-1, 0.4, 10.5), markerRadius: 6 },
  { region: 'right_knee_disarticulation', label: 'Knee Disarticulation', limbSide: 'lower', subPartOptions: KNEE_DISARTICULATION_OPTIONS, anchor: leg(-1, 0.285, 9.75), markerRadius: 6 },
  { region: 'right_below_knee', label: 'Below Knee (Transtibial)', limbSide: 'lower', anchor: leg(-1, 0.18, 9), markerRadius: 5 },
  { region: 'right_ankle_level', label: "Ankle Disarticulation / Syme's", limbSide: 'lower', subPartOptions: ANKLE_LEVEL_OPTIONS, anchor: leg(-1, 0.05, 9, 4), markerRadius: 5 },
  { region: 'right_partial_foot', label: 'Partial Foot (e.g. Chopart)', limbSide: 'lower', anchor: leg(-1, 0.025, 9, 7), markerRadius: 5 },
  { region: 'right_toe_amputation', label: 'Toe Amputation', limbSide: 'lower', subPartOptions: FOOT_DIGIT_OPTIONS, multiSubParts: true, anchor: leg(-1, 0.012, 9, 11), markerRadius: 4 },

  // Left arm (screen-right, sign +1)
  { region: 'left_forequarter', label: 'Forequarter', limbSide: 'upper', anchor: arm(1, 0.845, 17), markerRadius: 5 },
  { region: 'left_shoulder_disarticulation', label: 'Shoulder Disarticulation', limbSide: 'upper', anchor: arm(1, 0.815, 19.5), markerRadius: 6 },
  { region: 'left_above_elbow', label: 'Above Elbow (Transhumeral)', limbSide: 'upper', anchor: arm(1, 0.72, 21.5), markerRadius: 5 },
  { region: 'left_elbow_disarticulation', label: 'Elbow Disarticulation', limbSide: 'upper', anchor: arm(1, 0.63, 22.5), markerRadius: 5 },
  { region: 'left_below_elbow', label: 'Below Elbow (Transradial)', limbSide: 'upper', anchor: arm(1, 0.545, 23.5), markerRadius: 5 },
  { region: 'left_hand_wrist_disarticulation', label: 'Hand and Wrist Disarticulation', limbSide: 'upper', anchor: arm(1, 0.465, 24.5), markerRadius: 4 },
  { region: 'left_partial_hand', label: 'Partial Hand (transcarpal)', limbSide: 'upper', anchor: arm(1, 0.43, 25.5), markerRadius: 4 },
  { region: 'left_finger_amputation', label: 'Finger Amputation', limbSide: 'upper', subPartOptions: HAND_DIGIT_OPTIONS, multiSubParts: true, anchor: arm(1, 0.4, 26.5), markerRadius: 4 },

  { region: 'left_hemipelvectomy', label: 'Hemipelvectomy', limbSide: 'lower', anchor: leg(1, 0.545, 12.5), markerRadius: 5 },
  { region: 'left_hip_disarticulation', label: 'Hip Disarticulation', limbSide: 'lower', anchor: leg(1, 0.51, 11.5), markerRadius: 6 },
  { region: 'left_above_knee', label: 'Above Knee (Transfemoral)', limbSide: 'lower', anchor: leg(1, 0.4, 10.5), markerRadius: 6 },
  { region: 'left_knee_disarticulation', label: 'Knee Disarticulation', limbSide: 'lower', subPartOptions: KNEE_DISARTICULATION_OPTIONS, anchor: leg(1, 0.285, 9.75), markerRadius: 6 },
  { region: 'left_below_knee', label: 'Below Knee (Transtibial)', limbSide: 'lower', anchor: leg(1, 0.18, 9), markerRadius: 5 },
  { region: 'left_ankle_level', label: "Ankle Disarticulation / Syme's", limbSide: 'lower', subPartOptions: ANKLE_LEVEL_OPTIONS, anchor: leg(1, 0.05, 9, 4), markerRadius: 5 },
  { region: 'left_partial_foot', label: 'Partial Foot (e.g. Chopart)', limbSide: 'lower', anchor: leg(1, 0.025, 9, 7), markerRadius: 5 },
  { region: 'left_toe_amputation', label: 'Toe Amputation', limbSide: 'lower', subPartOptions: FOOT_DIGIT_OPTIONS, multiSubParts: true, anchor: leg(1, 0.012, 9, 11), markerRadius: 4 },
];

const GOLD = '#d08c2a';
const GOLD_STROKE = '#b5751f';

function Body() {
  const { scene } = useGLTF('/models/body-base.glb');
  return <primitive object={scene} />;
}

function RegionMarker({
  def, selected, hovered, onClick, onOver, onOut,
}: {
  def: Region3D; selected: boolean; hovered: boolean;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
  onOver: (e: ThreeEvent<PointerEvent>) => void;
  onOut: (e: ThreeEvent<PointerEvent>) => void;
}) {
  const visible = selected || hovered;
  const color = selected ? GOLD : '#ffffff';
  return (
    <mesh
      position={def.anchor}
      onClick={onClick}
      onPointerOver={onOver}
      onPointerOut={onOut}
    >
      <sphereGeometry args={[def.markerRadius, 16, 12]} />
      <meshStandardMaterial
        color={color}
        emissive={selected ? GOLD_STROKE : '#000000'}
        emissiveIntensity={selected ? 0.5 : 0}
        transparent
        opacity={visible ? (selected ? 0.55 : 0.28) : 0.001}
        depthWrite={visible}
      />
    </mesh>
  );
}

function Figure({
  regions, selectedMap, hovered, onToggle, setHovered, readOnly,
}: {
  regions: Region3D[];
  selectedMap: Map<string, BodyPart>;
  hovered: string | null;
  onToggle: (def: Region3D) => void;
  setHovered: (r: string | null) => void;
  readOnly?: boolean;
}) {
  return (
    <group>
      <Suspense fallback={null}>
        <Body />
      </Suspense>

      {regions.map(def => (
        <RegionMarker
          key={def.region}
          def={def}
          selected={selectedMap.has(def.region)}
          hovered={hovered === def.region}
          onClick={(e) => { e.stopPropagation(); if (!readOnly) onToggle(def); }}
          onOver={(e) => { e.stopPropagation(); if (!readOnly) setHovered(def.region); }}
          onOut={(e) => { e.stopPropagation(); if (!readOnly) setHovered(null); }}
        />
      ))}
    </group>
  );
}

export default function BodySelector3D({ value, onChange, category, readOnly }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  // Fixed front/back views instead of free rotation — dragging to an
  // arbitrary angle made it hard to click a region precisely, since a
  // marker's on-screen position shifts as the camera orbits. Two locked
  // camera presets behave like the old 2D diagram (a fixed image with
  // precise click targets) while still showing the real sculpted body.
  const [view, setView] = useState<'front' | 'back'>('front');
  const selectedMap = useMemo(() => new Map<string, BodyPart>(value.map(p => [p.region, p])), [value]);

  const restrictedSide: 'upper' | 'lower' | null =
    category === 'upper_limb' ? 'upper' : category === 'lower_limb' ? 'lower' : null;

  // If the Device Category changes to a limb side that contradicts an
  // already-marked region, drop that region — mirrors the 2D BodySelector's
  // identical safeguard.
  useEffect(() => {
    if (!restrictedSide) return;
    const regionSide = new Map(REGIONS.map(r => [r.region, r.limbSide]));
    const filtered = value.filter(p => regionSide.get(p.region) === restrictedSide);
    if (filtered.length !== value.length) onChange(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restrictedSide]);

  const visibleRegions = restrictedSide ? REGIONS.filter(def => def.limbSide === restrictedSide) : REGIONS;

  function toggleRegion(def: Region3D) {
    if (readOnly) return;
    if (selectedMap.has(def.region)) {
      onChange(value.filter(p => p.region !== def.region));
    } else {
      onChange([...value, { region: def.region, label: def.label, subParts: [] }]);
    }
  }

  function toggleSubPart(region: string, sub: string, multi: boolean) {
    if (readOnly) return;
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
    if (readOnly) return;
    onChange(value.filter(p => p.region !== region));
  }

  const subPartRegions = visibleRegions.filter(def => def.subPartOptions && selectedMap.has(def.region));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '100%', maxWidth: 360, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
          {(['front', 'back'] as const).map(v => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              style={{
                padding: '4px 14px', borderRadius: 20, fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer',
                border: view === v ? '1.5px solid #d08c2a' : '1.5px solid rgba(37,79,122,0.25)',
                background: view === v ? 'rgba(208,140,42,0.14)' : 'transparent',
                color: view === v ? '#8a5d00' : 'var(--text-muted, #6b7280)',
              }}
            >
              {v === 'front' ? 'Front' : 'Back'}
            </button>
          ))}
        </div>
        <div style={{ width: '100%', height: 420, borderRadius: 12, overflow: 'hidden', background: 'linear-gradient(180deg, #f5f2ea 0%, #e9e2d2 100%)', border: '1px solid var(--border-card, #e2e8f0)' }}>
          <Canvas key={view} camera={{ position: [0, 91, view === 'front' ? 340 : -340], fov: 38 }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[60, 200, 150]} intensity={0.9} color="#fff6e8" />
            <directionalLight position={[-60, -40, -100]} intensity={0.3} color="#e8eef5" />
            <Figure regions={visibleRegions} selectedMap={selectedMap} hovered={hovered} onToggle={toggleRegion} setHovered={setHovered} readOnly={readOnly} />
            <OrbitControls enablePan={false} enableRotate={false} minDistance={130} maxDistance={420} target={[0, 91, 0]} />
          </Canvas>
        </div>
      </div>

      {!readOnly && (
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #6b7280)', textAlign: 'center' }}>
          Scroll/pinch to zoom. Tap a region to select it — switch Front/Back above for the other side.
        </div>
      )}

      {restrictedSide && !readOnly && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #6b7280)', textAlign: 'center' }}>
          Showing {restrictedSide === 'upper' ? 'upper limb (arm/hand)' : 'lower limb (leg/foot)'} levels only, based on the Device Category above.
        </div>
      )}

      {!readOnly && subPartRegions.length > 0 && (
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
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => removeRegion(part.region)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'rgba(208,140,42,0.7)', fontSize: '0.85rem', lineHeight: 1, display: 'flex', alignItems: 'center' }}
                      aria-label={`Remove ${part.label}`}
                    >
                      ×
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
