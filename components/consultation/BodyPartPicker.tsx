'use client';

import BodySelector, { type BodyPart } from './BodySelector';

interface Props {
  value: BodyPart[];
  onChange: (parts: BodyPart[]) => void;
  category?: string;
  readOnly?: boolean;
}

// Thin pass-through to the 2D diagram. Kept as its own module so callers
// don't need to change if the diagram implementation changes again.
export default function BodyPartPicker({ value, onChange, category, readOnly }: Props) {
  return <BodySelector value={value} onChange={onChange} category={category} readOnly={readOnly} />;
}
