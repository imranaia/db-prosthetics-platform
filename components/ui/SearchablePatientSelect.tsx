'use client';

import SearchableSelect from './SearchableSelect';

interface PatientOption { id: number; full_name: string; patient_unique_id?: string | null; }

interface Props {
  value: string;
  onChange: (value: string) => void;
  patients: PatientOption[];
  disabled?: boolean;
}

/** Searchable patient dropdown — for consultation/discharge forms where the
 * patient list can be long enough that scrolling a plain <select> is painful.
 * Shows (and searches by) the Patient ID alongside the name, so staff can
 * confirm they've picked the right person. */
export default function SearchablePatientSelect({ value, onChange, patients, disabled }: Props) {
  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      options={patients.map(p => ({
        value: String(p.id),
        label: p.patient_unique_id ? `${p.full_name} (${p.patient_unique_id})` : p.full_name,
      }))}
      placeholder="Select a patient…"
      searchPlaceholder="Search by name or Patient ID…"
      disabled={disabled}
    />
  );
}
