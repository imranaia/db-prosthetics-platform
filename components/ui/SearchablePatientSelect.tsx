'use client';

import SearchableSelect from './SearchableSelect';

interface PatientOption {
  id: number;
  full_name: string;
  patient_unique_id?: string | null;
  // Present when this list is a practitioner's queue for today, rather than
  // every patient — lets the picker show "1st/2nd/3rd" so order stays clear
  // even if someone's been skipped and is no longer the current patient.
  queue_position?: number;
  is_current?: boolean;
  queue_skipped?: boolean;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  patients: PatientOption[];
  disabled?: boolean;
}

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

function ordinal(n: number): string {
  return ORDINALS[n - 1] || `${n}th`;
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
      options={patients.map(p => {
        const name = p.patient_unique_id ? `${p.full_name} (${p.patient_unique_id})` : p.full_name;
        if (p.queue_position == null) return { value: String(p.id), label: name };
        const tag = p.is_current ? 'now serving' : p.queue_skipped ? 'skipped' : 'waiting';
        return { value: String(p.id), label: `${ordinal(p.queue_position)} — ${name} — ${tag}` };
      })}
      placeholder="Select a patient…"
      searchPlaceholder="Search by name or Patient ID…"
      disabled={disabled}
    />
  );
}
