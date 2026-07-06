'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { UserPlus, Search, Copy, Check } from 'lucide-react';
import { NIGERIA_STATES } from '@/lib/nigeria-states';
import { getLGAs } from '@/lib/nigeria-lgas';
import SkeuSelect from '@/components/ui/SkeuSelect';
import SignaturePad from '@/components/forms/SignaturePad';
import { GENDER_OPTIONS, MARITAL_STATUS_OPTIONS } from '@/lib/profile-options';

const INITIAL = {
  full_name: '', email: '', phone: '', dob: '', address: '', state: '', lga: '',
  gender: '', marital_status: '', religion: '', occupation: '',
  next_of_kin_name: '', next_of_kin_relationship: '', next_of_kin_phone: '',
  amputation_yes: 0, amputation_level: '', amputation_side: '', amputation_date: '', amputation_cause: '',
  previous_prosthesis: '', allergies: '', functional_mobility_status: '', caregiver_info: '',
};

interface SearchResult {
  id: number;
  full_name: string;
  phone: string | null;
  patient_unique_id: string | null;
  email: string | null;
}

export default function ReceptionistAddPatientPage() {
  const { user, loading } = useAuth();
  const [form, setForm] = useState(INITIAL);
  const [signature, setSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ patient_unique_id: string; pin?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'receptionist') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  async function runSearch(q: string) {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/receptionist/patients?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults(data.patients || []);
    } catch {
      setResults([]);
    }
    setSearching(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.full_name.trim()) { setError('Full name is required.'); return; }
    if (!signature) { setError('Please have the patient sign (or thumbprint) the declaration below.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/receptionist/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, declaration_signature: signature }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to register patient.'); setSubmitting(false); return; }
      setSuccess({ patient_unique_id: data.patient_unique_id, pin: data.pin });
      setForm(INITIAL);
      setSignature(null);
    } catch {
      setError('Network error. Please try again.');
    }
    setSubmitting(false);
  }

  function copyToClipboard() {
    if (!success) return;
    const text = success.pin
      ? `Patient ID: ${success.patient_unique_id}\nPIN: ${success.pin}`
      : `Patient ID: ${success.patient_unique_id}`;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  if (success) {
    return (
      <div className="dash-content" style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="skeu-card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#d1fae520', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Check size={28} color="#065f46" />
          </div>
          <h2 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 8 }}>Patient Registered</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 24 }}>
            {success.pin
              ? "Give the patient this ID and PIN — it's how they'll log in since no email was provided. Write it down or print this screen."
              : 'A welcome email with login details has been sent to the patient.'}
          </p>
          <div style={{ background: 'var(--bg-base)', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Patient ID</div>
            <div className="font-display" style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.04em' }}>{success.patient_unique_id}</div>
            {success.pin && (
              <>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 16, marginBottom: 4 }}>PIN</div>
                <div className="font-display" style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.1em' }}>{success.pin}</div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="skeu-btn-primary" onClick={copyToClipboard}>
              <Copy size={15} style={{ marginRight: 6 }} />{copied ? 'Copied!' : 'Copy'}
            </button>
            <button className="skeu-btn-ghost" style={{ color: 'var(--primary)' }} onClick={() => setSuccess(null)}>Register Another Patient</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-content" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="dash-page-header" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <UserPlus size={22} color="var(--primary)" />
        </div>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>Add Patient</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>Register a walk-in patient and generate their Patient ID.</p>
        </div>
      </div>

      {/* Search existing patients first, to avoid duplicate registration */}
      <div className="skeu-card" style={{ padding: 20, marginBottom: 24 }}>
        <label className="skeu-label" style={{ display: 'block', marginBottom: 8 }}>Check if this patient is already registered</label>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="skeu-input" style={{ paddingLeft: 38 }}
            placeholder="Search by name, phone, or Patient ID…"
            value={query} onChange={e => runSearch(e.target.value)}
          />
        </div>
        {searching && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>Searching…</div>}
        {!searching && query && results.length === 0 && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>No match found — you can register them below.</div>
        )}
        {results.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 8, background: 'var(--bg-base)' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-head)' }}>{r.full_name}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{r.patient_unique_id || '—'} {r.phone ? `· ${r.phone}` : ''} {r.email ? `· ${r.email}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="skeu-card" style={{ padding: 24 }}>
        <form onSubmit={handleSubmit}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 16 }}>Patient Details</h3>
          <div style={{ marginBottom: 16 }}>
            <label className="skeu-label">Full Name <span style={{ color: '#dc2626' }}>*</span></label>
            <input className="skeu-input" style={{ width: '100%' }} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
          </div>
          <div className="form-grid-2" style={{ marginBottom: 16 }}>
            <div>
              <label className="skeu-label">Email (optional)</label>
              <input type="email" className="skeu-input" style={{ width: '100%' }} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Leave blank if the patient has none" />
            </div>
            <div>
              <label className="skeu-label">Phone Number</label>
              <input className="skeu-input" style={{ width: '100%' }} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: -8, marginBottom: 16 }}>
            {form.email.trim()
              ? 'A welcome email with login details will be sent.'
              : "No email — a Patient ID and PIN will be generated for this patient to log in with."}
          </p>
          <div className="form-grid-2" style={{ marginBottom: 16 }}>
            <div>
              <label className="skeu-label">Date of Birth</label>
              <input type="date" className="skeu-input" style={{ width: '100%' }} value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
            </div>
            <div>
              <label className="skeu-label">Sex / Gender</label>
              <SkeuSelect value={form.gender} onChange={v => setForm({ ...form, gender: v })} options={GENDER_OPTIONS} placeholder="Select…" />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="skeu-label">Current Address (with landmark)</label>
            <input className="skeu-input" style={{ width: '100%' }} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="form-grid-2" style={{ marginBottom: 16 }}>
            <div>
              <label className="skeu-label">State</label>
              <SkeuSelect value={form.state} onChange={v => setForm({ ...form, state: v, lga: '' })} options={NIGERIA_STATES.map(s => ({ value: s, label: s }))} placeholder="Select state…" />
            </div>
            <div>
              <label className="skeu-label">LGA</label>
              <SkeuSelect value={form.lga} onChange={v => setForm({ ...form, lga: v })} options={getLGAs(form.state).map(l => ({ value: l, label: l }))} placeholder="Select LGA…" disabled={!form.state} />
            </div>
          </div>
          <div className="form-grid-2" style={{ marginBottom: 16 }}>
            <div>
              <label className="skeu-label">Marital Status</label>
              <SkeuSelect value={form.marital_status} onChange={v => setForm({ ...form, marital_status: v })} options={MARITAL_STATUS_OPTIONS} placeholder="Select…" />
            </div>
            <div>
              <label className="skeu-label">Occupation</label>
              <input className="skeu-input" style={{ width: '100%' }} value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="skeu-label">Religion</label>
            <input className="skeu-input" style={{ width: '100%' }} value={form.religion} onChange={e => setForm({ ...form, religion: e.target.value })} />
          </div>

          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-head)', margin: '24px 0 16px' }}>Next of Kin</h3>
          <div className="form-grid-2" style={{ marginBottom: 16 }}>
            <div>
              <label className="skeu-label">Name</label>
              <input className="skeu-input" style={{ width: '100%' }} value={form.next_of_kin_name} onChange={e => setForm({ ...form, next_of_kin_name: e.target.value })} />
            </div>
            <div>
              <label className="skeu-label">Relationship</label>
              <input className="skeu-input" style={{ width: '100%' }} value={form.next_of_kin_relationship} onChange={e => setForm({ ...form, next_of_kin_relationship: e.target.value })} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="skeu-label">Next of Kin Phone</label>
            <input className="skeu-input" style={{ width: '100%', maxWidth: 320 }} value={form.next_of_kin_phone} onChange={e => setForm({ ...form, next_of_kin_phone: e.target.value })} />
          </div>

          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-head)', margin: '24px 0 16px' }}>Prosthetics &amp; Orthotics Information</h3>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.amputation_yes === 1} onChange={e => setForm({ ...form, amputation_yes: e.target.checked ? 1 : 0 })} />
              <span style={{ fontSize: '0.88rem', color: 'var(--text-body)' }}>Patient has an amputation</span>
            </label>
          </div>
          {form.amputation_yes === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 16 }}>
              <div>
                <label className="skeu-label">Level</label>
                <input className="skeu-input" style={{ width: '100%' }} value={form.amputation_level} onChange={e => setForm({ ...form, amputation_level: e.target.value })} />
              </div>
              <div>
                <label className="skeu-label">Side</label>
                <SkeuSelect value={form.amputation_side} onChange={v => setForm({ ...form, amputation_side: v })} options={['Left', 'Right', 'Bilateral'].map(v => ({ value: v, label: v }))} placeholder="Select…" />
              </div>
              <div>
                <label className="skeu-label">Date</label>
                <input type="date" className="skeu-input" style={{ width: '100%' }} value={form.amputation_date} onChange={e => setForm({ ...form, amputation_date: e.target.value })} />
              </div>
              <div>
                <label className="skeu-label">Cause</label>
                <input className="skeu-input" style={{ width: '100%' }} value={form.amputation_cause} onChange={e => setForm({ ...form, amputation_cause: e.target.value })} />
              </div>
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label className="skeu-label">Previous Prosthesis / Orthosis Use</label>
            <textarea className="skeu-input" rows={2} style={{ width: '100%', resize: 'vertical' }} value={form.previous_prosthesis} onChange={e => setForm({ ...form, previous_prosthesis: e.target.value })} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="skeu-label">Allergies (especially materials)</label>
            <input className="skeu-input" style={{ width: '100%' }} value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} />
          </div>
          <div className="form-grid-2" style={{ marginBottom: 16 }}>
            <div>
              <label className="skeu-label">Functional Mobility Status</label>
              <input className="skeu-input" style={{ width: '100%' }} value={form.functional_mobility_status} onChange={e => setForm({ ...form, functional_mobility_status: e.target.value })} />
            </div>
            <div>
              <label className="skeu-label">Caregiver / Support Info</label>
              <input className="skeu-input" style={{ width: '100%' }} value={form.caregiver_info} onChange={e => setForm({ ...form, caregiver_info: e.target.value })} />
            </div>
          </div>

          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-head)', margin: '24px 0 12px' }}>Declaration &amp; Consent</h3>
          <div style={{ marginBottom: 16, padding: '14px 16px', background: 'rgba(37,79,122,0.05)', borderRadius: 8, border: '1px solid rgba(37,79,122,0.12)', fontSize: '0.85rem', color: 'var(--text-body)', lineHeight: 1.7 }}>
            I hereby declare that the information provided is true and correct. I consent to the use of this data for treatment, records, and necessary sharing with partners as per privacy policies and the Nigeria Data Protection Act.
          </div>
          <SignaturePad value={signature} onChange={setSignature} height={120} label="Patient Signature / Thumbprint" />

          {error && (
            <div style={{ marginTop: 16, background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem' }}>{error}</div>
          )}

          <button type="submit" className="skeu-btn-primary" disabled={submitting} style={{ width: '100%', marginTop: 20 }}>
            {submitting ? 'Registering...' : 'Register Patient'}
          </button>
        </form>
      </div>
    </div>
  );
}
