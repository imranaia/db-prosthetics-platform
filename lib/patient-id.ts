/** Human-friendly patient ID derived from the patient row's own id, e.g. DBP-00001. */
export function formatPatientId(id: number): string {
  return `DBP-${String(id).padStart(5, '0')}`;
}

/** A short numeric PIN for ID-based (no-email) patient login. */
export function isPinValid(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

export function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
