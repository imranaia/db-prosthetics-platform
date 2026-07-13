// P&O Specialists get the exact same patient-history view as Doctors — the
// underlying page already checks the caller's role and the API scopes
// access by whichever practitioner table (doctors vs po_specialists) applies.
export { default } from '@/app/dashboard/doctor/patients/[id]/page';
