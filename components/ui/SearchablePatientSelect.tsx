'use client';

import SearchableSelect from './SearchableSelect';

interface PatientOption { id: number; full_name: string; }

interface Props {
  value: string;
  onChange: (value: string) => void;
  patients: PatientOption[];
  disabled?: boolean;
}

/** Searchable patient dropdown — for consultation/discharge forms where the
 * patient list can be long enough that scrolling a plain <select> is painful. */
export default function SearchablePatientSelect({ value, onChange, patients, disabled }: Props) {
  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      options={patients.map(p => ({ value: String(p.id), label: p.full_name }))}
      placeholder="Select a patient…"
      searchPlaceholder="Search patients by name…"
      disabled={disabled}
    />
  );
}
