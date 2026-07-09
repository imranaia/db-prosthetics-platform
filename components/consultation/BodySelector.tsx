'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export interface BodyPart {
  region: string;
  label: string;
  subParts: string[];
}

interface Props {
  value: BodyPart[];
  onChange: (parts: BodyPart[]) => void;
  // Device Category upstream of this diagram (Upper Limb / Lower Limb /
  // Facial / Spinal / Other) — when it's a limb category, only that side's
  // regions are shown/clickable, and any previously-picked region from the
  // other side is dropped so the record can't end up self-contradictory.
  category?: string;
  // Renders the diagram without click handlers/hover, for reviewers (e.g.
  // super admin viewing a submitted order) who should see what was marked
  // but not be able to change it.
  readOnly?: boolean;
}

/* ─── Region definitions ───
   Clinical amputation levels (per the reference chart), not generic body
   parts — this diagram exists to record WHERE and AT WHAT LEVEL a patient
   is amputated, matching standard P&O assessment terminology.

   Hotspot positions are percentages over a real sculpted 3D body model,
   rendered flat from fixed front/back camera angles (see
   public/images/body-front.png / body-back.png). The percentages were
   computed by projecting each region's exact 3D anchor point through the
   same camera used to render the images, so a hotspot always lands on the
   correct real anatomy — not hand-placed/eyeballed.
*/
type ViewKey = 'front' | 'back' | 'left' | 'right';

interface RegionDef {
  region: string;
  label: string;
  abbr: string;
  limbSide: 'upper' | 'lower' | 'spinal' | 'facial';
  subPartOptions?: string[];
  // Hand/foot digits are a multi-select (several fingers/toes can be
  // affected at once); knee/ankle variants are mutually exclusive.
  multiSubParts?: boolean;
  // Percentage position of this region's hotspot, one per camera angle it
  // appears in. Body/spinal regions define front+back; facial ears only
  // appear in their own profile shot (left/right), not front — the hotspot
  // simply isn't rendered on views where it has no position.
  front?: { x: number; y: number };
  back?: { x: number; y: number };
  left?: { x: number; y: number };
  right?: { x: number; y: number };
  // Hand/wrist regions sit close together on the real image, so they use
  // progressively smaller hotspots than the other (well-separated) joints.
  size?: 'wrist' | 'hand' | 'digit';
}

const KNEE_DISARTICULATION_OPTIONS = ['Standard', 'Rotationplasty (Van Ness Rotation)', 'PFFD (Proximal Femoral Focal Deficiency)'];
const ANKLE_LEVEL_OPTIONS = ['Ankle Disarticulation', "Syme's"];
const HAND_DIGIT_OPTIONS = ['Thumb', 'Index Finger', 'Middle Finger', 'Ring Finger', 'Little Finger'];
const FOOT_DIGIT_OPTIONS = ['Great Toe (Hallux)', '2nd Toe', '3rd Toe', '4th Toe', '5th Toe (Little Toe)'];

const REGIONS: RegionDef[] = [
  /* ─ Right side ─ upper limb */
  { region: 'right_forequarter',                label: 'Forequarter',                    abbr: 'FQ',  limbSide: 'upper', front: { x: 41.48, y: 23.87 }, back: { x: 58.42, y: 24.18 } },
  { region: 'right_shoulder_disarticulation',   label: 'Shoulder Disarticulation',       abbr: 'SD',  limbSide: 'upper', front: { x: 40.23, y: 26.16 }, back: { x: 59.66, y: 26.44 } },
  { region: 'right_above_elbow',                label: 'Above Elbow (Transhumeral)',     abbr: 'AE',  limbSide: 'upper', front: { x: 34.50, y: 30.40 }, back: { x: 66.29, y: 30.40 } },
  { region: 'right_elbow_disarticulation',      label: 'Elbow Disarticulation',          abbr: 'ED',  limbSide: 'upper', front: { x: 31.00, y: 35.30 }, back: { x: 69.55, y: 35.30 } },
  { region: 'right_below_elbow',                label: 'Below Elbow (Transradial)',      abbr: 'BE',  limbSide: 'upper', front: { x: 29.00, y: 39.90 }, back: { x: 70.97, y: 39.90 } },
  { region: 'right_hand_wrist_disarticulation', label: 'Hand and Wrist Disarticulation', abbr: 'HWD', limbSide: 'upper', size: 'wrist', front: { x: 26.80, y: 44.00 }, back: { x: 72.40, y: 44.00 } },
  { region: 'right_partial_hand',                label: 'Partial Hand (transcarpal)',     abbr: 'PH',  limbSide: 'upper', size: 'hand', front: { x: 26.00, y: 47.50 }, back: { x: 72.94, y: 47.50 } },
  {
    region: 'right_finger_amputation', label: 'Finger Amputation', abbr: 'FA', limbSide: 'upper',
    subPartOptions: HAND_DIGIT_OPTIONS, multiSubParts: true, size: 'digit',
    front: { x: 24.50, y: 51.50 }, back: { x: 73.73, y: 51.50 },
  },

  /* ─ Right side ─ lower limb */
  { region: 'right_hemipelvectomy',      label: 'Hemipelvectomy',            abbr: 'HP',    limbSide: 'lower', size: 'hand', front: { x: 43.75, y: 44.00 }, back: { x: 56.21, y: 44.00 } },
  { region: 'right_hip_disarticulation', label: 'Hip Disarticulation',       abbr: 'HD',    limbSide: 'lower', size: 'hand', front: { x: 44.48, y: 49.43 }, back: { x: 55.70, y: 49.44 } },
  { region: 'right_above_knee',          label: 'Above Knee (Transfemoral)', abbr: 'AK',    limbSide: 'lower', front: { x: 43.63, y: 57.80 }, back: { x: 56.58, y: 57.76 } },
  {
    region: 'right_knee_disarticulation', label: 'Knee Disarticulation', abbr: 'KD', limbSide: 'lower',
    subPartOptions: KNEE_DISARTICULATION_OPTIONS,
    front: { x: 42.31, y: 66.55 }, back: { x: 58.03, y: 66.45 },
  },
  { region: 'right_below_knee', label: 'Below Knee (Transtibial)', abbr: 'BK', limbSide: 'lower', front: { x: 41.36, y: 74.54 }, back: { x: 58.80, y: 74.39 } },
  {
    region: 'right_ankle_level', label: "Ankle Disarticulation / Syme's", abbr: 'AD/Sy', limbSide: 'lower',
    subPartOptions: ANKLE_LEVEL_OPTIONS, size: 'hand',
    front: { x: 40.86, y: 83.30 }, back: { x: 59.64, y: 83.30 },
  },
  { region: 'right_partial_foot', label: 'Partial Foot (e.g. Chopart)', abbr: 'PF', limbSide: 'lower', size: 'hand', front: { x: 38.24, y: 86.00 }, back: { x: 61.86, y: 86.00 } },
  {
    region: 'right_toe_amputation', label: 'Toe Amputation', abbr: 'TA', limbSide: 'lower',
    subPartOptions: FOOT_DIGIT_OPTIONS, multiSubParts: true, size: 'digit',
    front: { x: 35.69, y: 88.30 }, back: { x: 64.10, y: 88.30 },
  },

  /* ─ Left side ─ upper limb */
  { region: 'left_forequarter',                label: 'Forequarter',                    abbr: 'FQ',  limbSide: 'upper', front: { x: 58.52, y: 23.87 }, back: { x: 41.58, y: 24.18 } },
  { region: 'left_shoulder_disarticulation',   label: 'Shoulder Disarticulation',       abbr: 'SD',  limbSide: 'upper', front: { x: 59.77, y: 26.16 }, back: { x: 40.34, y: 26.44 } },
  { region: 'left_above_elbow',                label: 'Above Elbow (Transhumeral)',     abbr: 'AE',  limbSide: 'upper', front: { x: 65.50, y: 30.40 }, back: { x: 33.71, y: 30.40 } },
  { region: 'left_elbow_disarticulation',      label: 'Elbow Disarticulation',          abbr: 'ED',  limbSide: 'upper', front: { x: 69.00, y: 35.30 }, back: { x: 30.45, y: 35.30 } },
  { region: 'left_below_elbow',                label: 'Below Elbow (Transradial)',      abbr: 'BE',  limbSide: 'upper', front: { x: 71.00, y: 39.90 }, back: { x: 29.03, y: 39.90 } },
  { region: 'left_hand_wrist_disarticulation', label: 'Hand and Wrist Disarticulation', abbr: 'HWD', limbSide: 'upper', size: 'wrist', front: { x: 73.20, y: 44.00 }, back: { x: 27.60, y: 44.00 } },
  { region: 'left_partial_hand',                label: 'Partial Hand (transcarpal)',     abbr: 'PH',  limbSide: 'upper', size: 'hand', front: { x: 74.00, y: 47.50 }, back: { x: 27.06, y: 47.50 } },
  {
    region: 'left_finger_amputation', label: 'Finger Amputation', abbr: 'FA', limbSide: 'upper',
    subPartOptions: HAND_DIGIT_OPTIONS, multiSubParts: true, size: 'digit',
    front: { x: 75.50, y: 51.50 }, back: { x: 26.27, y: 51.50 },
  },

  /* ─ Left side ─ lower limb */
  { region: 'left_hemipelvectomy',      label: 'Hemipelvectomy',            abbr: 'HP', limbSide: 'lower', size: 'hand', front: { x: 56.25, y: 44.00 }, back: { x: 43.79, y: 44.00 } },
  { region: 'left_hip_disarticulation', label: 'Hip Disarticulation',       abbr: 'HD', limbSide: 'lower', size: 'hand', front: { x: 55.52, y: 49.43 }, back: { x: 44.30, y: 49.44 } },
  { region: 'left_above_knee',          label: 'Above Knee (Transfemoral)', abbr: 'AK', limbSide: 'lower', front: { x: 56.37, y: 57.80 }, back: { x: 43.42, y: 57.76 } },
  {
    region: 'left_knee_disarticulation', label: 'Knee Disarticulation', abbr: 'KD', limbSide: 'lower',
    subPartOptions: KNEE_DISARTICULATION_OPTIONS,
    front: { x: 57.69, y: 66.55 }, back: { x: 41.97, y: 66.45 },
  },
  { region: 'left_below_knee', label: 'Below Knee (Transtibial)', abbr: 'BK', limbSide: 'lower', front: { x: 58.64, y: 74.54 }, back: { x: 41.20, y: 74.39 } },
  {
    region: 'left_ankle_level', label: "Ankle Disarticulation / Syme's", abbr: 'AD/Sy', limbSide: 'lower',
    subPartOptions: ANKLE_LEVEL_OPTIONS, size: 'hand',
    front: { x: 59.14, y: 83.30 }, back: { x: 40.36, y: 83.30 },
  },
  { region: 'left_partial_foot', label: 'Partial Foot (e.g. Chopart)', abbr: 'PF', limbSide: 'lower', size: 'hand', front: { x: 61.76, y: 86.00 }, back: { x: 38.14, y: 86.00 } },
  {
    region: 'left_toe_amputation', label: 'Toe Amputation', abbr: 'TA', limbSide: 'lower',
    subPartOptions: FOOT_DIGIT_OPTIONS, multiSubParts: true, size: 'digit',
    front: { x: 64.31, y: 88.30 }, back: { x: 35.90, y: 88.30 },
  },

  /* ─ Spinal — single midline markers (not left/right paired). Positions
     sit on the visible spine groove in the back view and the equivalent
     torso height on the front view. */
  { region: 'cervical_spine', label: 'Cervical Spine (Neck)',      abbr: 'C', limbSide: 'spinal', front: { x: 50, y: 18 }, back: { x: 50, y: 18 } },
  { region: 'thoracic_spine', label: 'Thoracic Spine (Upper Back)', abbr: 'T', limbSide: 'spinal', front: { x: 50, y: 29 }, back: { x: 50, y: 29 } },
  { region: 'lumbar_spine',   label: 'Lumbar Spine (Lower Back)',   abbr: 'L', limbSide: 'spinal', front: { x: 50, y: 39 }, back: { x: 50, y: 39 } },
  { region: 'sacral_spine',   label: 'Sacral Spine (Pelvis)',       abbr: 'S', limbSide: 'spinal', front: { x: 50, y: 46 }, back: { x: 50, y: 46 } },

  /* ─ Facial — eyes/nose sit on the front view; each ear only appears in
     its own profile shot (public/images/face-left.png / face-right.png),
     not on the front view (barely visible there and much less precise). */
  { region: 'right_eye', label: 'Right Eye',  abbr: 'R.Ey', limbSide: 'facial', front: { x: 32, y: 35 } },
  { region: 'left_eye',  label: 'Left Eye',   abbr: 'L.Ey', limbSide: 'facial', front: { x: 68, y: 35 } },
  { region: 'nose',      label: 'Nose',       abbr: 'N',    limbSide: 'facial', front: { x: 50, y: 57 } },
  { region: 'left_ear',  label: 'Left Ear',   abbr: 'L.Er', limbSide: 'facial', left: { x: 65, y: 44 } },
  { region: 'right_ear', label: 'Right Ear',  abbr: 'R.Er', limbSide: 'facial', right: { x: 32, y: 42 } },
];

/* ─── Hotspot renderer ─── */
function RegionHotspot({
  def,
  view,
  selected,
  hovered,
  readOnly,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  def: RegionDef;
  view: ViewKey;
  selected: boolean;
  hovered: boolean;
  readOnly?: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const pos = def[view]!;
  const diameter = def.size === 'digit' ? 18 : def.size === 'hand' ? 22 : def.size === 'wrist' ? 27 : 32;
  const background = selected
    ? 'rgba(208,140,42,0.85)'
    : hovered
    ? 'rgba(37,79,122,0.6)'
    : 'rgba(37,79,122,0.32)';
  const border = selected ? '2px solid #d08c2a' : '1.5px solid rgba(255,255,255,0.7)';

  return (
    <button
      type="button"
      aria-label={def.label}
      onClick={readOnly ? undefined : onClick}
      onMouseEnter={readOnly ? undefined : onMouseEnter}
      onMouseLeave={readOnly ? undefined : onMouseLeave}
      style={{
        position: 'absolute',
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
        width: diameter,
        height: diameter,
        borderRadius: '50%',
        background,
        border,
        color: '#fff',
        fontSize: def.size === 'digit' ? '0.5rem' : def.size === 'hand' ? '0.53rem' : '0.6rem',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: readOnly ? 'default' : 'pointer',
        transition: 'background 0.15s, border 0.15s, transform 0.1s',
        boxShadow: selected ? '0 0 0 3px rgba(208,140,42,0.25)' : '0 1px 3px rgba(0,0,0,0.3)',
        padding: 0,
      }}
    >
      {def.abbr}
    </button>
  );
}

// Computes a CSS transform that zooms the image+hotspot layer into the
// bounding box of the given regions, so a single limb fills the frame
// instead of sitting small on the full body — no separate cropped image
// assets needed, since the hotspots are already percentage-positioned
// within this same layer and zoom/pan with it.
function zoomTransform(regions: RegionDef[], view: ViewKey): string {
  if (regions.length === 0) return 'none';
  const xs = regions.map(r => r[view]!.x);
  const ys = regions.map(r => r[view]!.y);
  const pad = 12; // percent padding around the bounding box, each side
  const w = Math.max(Math.max(...xs) - Math.min(...xs) + pad * 2, 20);
  const h = Math.max(Math.max(...ys) - Math.min(...ys) + pad * 2, 20);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const scale = Math.max(1, Math.min(100 / w, 100 / h, 3));
  const tx = 50 / scale - cx;
  const ty = 50 / scale - cy;
  return `scale(${scale}) translate(${tx}%, ${ty}%)`;
}

/* ─── Main component ─── */
export default function BodySelector({ value, onChange, category, readOnly }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [view, setView] = useState<ViewKey>('front');
  // Which side to focus the diagram on — only meaningful for upper/lower
  // limb categories. Picking a specific side zooms in so the hotspots are
  // bigger and easier to tap; "Both" shows the full body, unzoomed.
  const [side, setSide] = useState<'both' | 'left' | 'right'>('both');

  const isFacial = category === 'facial';
  const viewOptions: ViewKey[] = isFacial ? ['front', 'left', 'right'] : ['front', 'back'];

  const restrictedSide: 'upper' | 'lower' | 'spinal' | 'facial' | null =
    category === 'upper_limb' ? 'upper' : category === 'lower_limb' ? 'lower' : category === 'spinal' ? 'spinal' : category === 'facial' ? 'facial' : null;

  const sideSelectable = restrictedSide === 'upper' || restrictedSide === 'lower';

  // Reset to "Both" if the category changes away from a limb side — the
  // selector disappears in that case, so its state shouldn't linger.
  useEffect(() => {
    if (!sideSelectable) setSide('both');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sideSelectable]);

  // Facial uses Front/Left/Right instead of Front/Back — reset to Front
  // when switching modes so the view toggle never lands on an option that
  // doesn't exist for the current category.
  useEffect(() => {
    if (!viewOptions.includes(view)) setView('front');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFacial]);

  // If the Device Category changes to a limb side that contradicts an
  // already-marked region, drop that region rather than leave a diagram
  // pick that no longer matches the declared category.
  useEffect(() => {
    if (!restrictedSide) return;
    const regionSide = new Map(REGIONS.map(r => [r.region, r.limbSide]));
    const filtered = value.filter(p => regionSide.get(p.region) === restrictedSide);
    if (filtered.length !== value.length) onChange(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restrictedSide]);

  const categoryRegions = restrictedSide ? REGIONS.filter(def => def.limbSide === restrictedSide) : REGIONS;
  const visibleRegions = side === 'both' ? categoryRegions : categoryRegions.filter(def => def.region.startsWith(`${side}_`));
  const zoomed = side !== 'both';
  // Ears only have a position on their own profile view, not front — only
  // render hotspots that actually exist on the view currently shown.
  const onScreenRegions = visibleRegions.filter(def => def[view]);

  const selectedMap = new Map<string, BodyPart>(value.map(p => [p.region, p]));

  function toggleRegion(def: RegionDef) {
    if (readOnly) return;
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
  const subPartRegions = visibleRegions.filter(
    def => def.subPartOptions && selectedMap.has(def.region)
  );

  // Viewing from behind, the patient's right hand is on the viewer's right
  // (both facing the same way); viewing from the front it's mirrored. Only
  // meaningful for the front/back body views — facial's left/right are
  // profile shots, not a mirrored front, so the labels are hidden there.
  const rightLabelSide = view === 'front' ? 'left' : 'right';

  const transform = zoomed ? zoomTransform(visibleRegions, view) : 'none';
  const imageSrc = isFacial ? `/images/face-${view}.png` : `/images/body-${view}.png`;
  const viewLabel = (v: ViewKey) => (isFacial && v !== 'front' ? `${v} profile` : v);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>

      {/* Left/Right/Both side selector — only for upper/lower limb categories */}
      {sideSelectable && (
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['left', 'right', 'both'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              style={{
                padding: '5px 16px',
                borderRadius: 20,
                border: side === s ? '1.5px solid #d08c2a' : '1.5px solid rgba(37,79,122,0.3)',
                background: side === s ? 'rgba(208,140,42,0.15)' : 'transparent',
                color: side === s ? '#8a5d00' : '#254f7a',
                fontSize: '0.78rem',
                fontWeight: side === s ? 600 : 500,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {s === 'both' ? 'Both / Complete' : s}
            </button>
          ))}
        </div>
      )}

      {/* Front/Back (or Front/Left/Right for facial) toggle */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {viewOptions.map(v => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            style={{
              padding: '5px 16px',
              borderRadius: 20,
              border: view === v ? '1.5px solid #d08c2a' : '1.5px solid rgba(37,79,122,0.3)',
              background: view === v ? 'rgba(208,140,42,0.15)' : 'transparent',
              color: view === v ? '#8a5d00' : '#254f7a',
              fontSize: '0.78rem',
              fontWeight: view === v ? 600 : 500,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {viewLabel(v)}
          </button>
        ))}
      </div>

      {/* Body image with hotspots */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '360px',
          aspectRatio: '6 / 7',
          margin: '0 auto',
          borderRadius: 12,
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #f5f2ea 0%, #e9e2d2 100%)',
        }}
      >
        {/* Zoomable/pannable layer — image and hotspots move together since
            hotspots are positioned as percentages of this same box. */}
        <div
          style={{
            position: 'absolute', inset: 0,
            transformOrigin: '0 0',
            transform,
            transition: 'transform 0.25s ease',
          }}
        >
          <Image
            src={imageSrc}
            alt={isFacial ? `Face diagram (${view} view)` : `Human body diagram (${view} view)`}
            fill
            sizes="320px"
            style={{ objectFit: 'contain' }}
            priority
          />

          {onScreenRegions.map(def => (
            <RegionHotspot
              key={def.region}
              def={def}
              view={view}
              selected={selectedMap.has(def.region)}
              hovered={hovered === def.region}
              readOnly={readOnly}
              onClick={() => toggleRegion(def)}
              onMouseEnter={() => setHovered(def.region)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </div>

        {/* Side orientation labels — fixed to the container corners, not
            part of the zoomed/panned layer. Only meaningful for the
            mirrored front/back body views, not facial's profile shots. */}
        {(view === 'front' || view === 'back') && (
          <>
            <span style={{ position: 'absolute', top: 6, [rightLabelSide]: 8, fontSize: '0.62rem', color: 'rgba(0,0,0,0.45)', fontWeight: 600 }}>
              Patient&apos;s Right
            </span>
            <span style={{ position: 'absolute', top: 6, [rightLabelSide === 'left' ? 'right' : 'left']: 8, fontSize: '0.62rem', color: 'rgba(0,0,0,0.45)', fontWeight: 600 }}>
              Patient&apos;s Left
            </span>
          </>
        )}
      </div>

      {/* Legend */}
      {!readOnly && (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted, #6b7280)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(208,140,42,0.85)', border: '1.5px solid #d08c2a', display: 'inline-block' }} />
            Selected
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(37,79,122,0.32)', border: '1.5px solid rgba(255,255,255,0.7)', display: 'inline-block' }} />
            Tap to select
          </span>
        </div>
      )}
      {restrictedSide && !readOnly && (
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #6b7280)', textAlign: 'center' }}>
          Showing {restrictedSide === 'upper' ? 'upper limb (arm/hand)' : restrictedSide === 'lower' ? 'lower limb (leg/foot)' : restrictedSide === 'spinal' ? 'spinal' : 'facial'} regions only, based on the Device Category above.
        </div>
      )}

      {/* Sub-level panels — one per selected region with variant options
          (Knee Disarticulation, Ankle Disarticulation/Syme's) or affected
          digits (Finger/Toe Amputation — pick as many as apply) */}
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
            {isFacial ? 'Selected Facial Regions' : 'Selected Amputation Levels'}
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
                  {!readOnly && (
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
