/** Human-friendly patient ID derived from the patient row's own id, e.g. DBP-00001. */
export function formatPatientId(id: number): string {
  return `DBP-${String(id).padStart(5, '0')}`;
}
