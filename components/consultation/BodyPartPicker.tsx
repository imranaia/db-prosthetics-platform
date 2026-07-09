'use client';

import BodySelector, { type BodyPart } from './BodySelector';

interface Props {
  value: BodyPart[];
  onChange: (parts: BodyPart[]) => void;
  category?: string;
  // Exact Device Type card (e.g. 'th', 'tf') from getDeviceSubtypeOptions —
  // narrows the diagram down to just that level's region(s), same idea as
  // MeasurementFields narrowing its own field groups by the same value.
  deviceSubtype?: string;
  readOnly?: boolean;
}

// Thin pass-through to the 2D diagram. Kept as its own module so callers
// don't need to change if the diagram implementation changes again.
export default function BodyPartPicker({ value, onChange, category, deviceSubtype, readOnly }: Props) {
  return <BodySelector value={value} onChange={onChange} category={category} deviceSubtype={deviceSubtype} readOnly={readOnly} />;
}
