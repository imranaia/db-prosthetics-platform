// P&O Specialists get the exact same discharge-form workflow as Doctors —
// the underlying page already checks the caller's role and the API scopes
// data by whichever practitioner table (doctors vs po_specialists) applies.
export { default } from '@/app/dashboard/doctor/discharge/page';
