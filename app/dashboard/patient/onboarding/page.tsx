'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { NIGERIA_STATES } from '@/lib/nigeria-states';
import { getLGAs } from '@/lib/nigeria-lgas';
import SkeuSelect from '@/components/ui/SkeuSelect';
import SignaturePad from '@/components/forms/SignaturePad';
import { GENDER_OPTIONS, MARITAL_STATUS_OPTIONS } from '@/lib/profile-options';

const INITIAL = {
  phone: '', dob: '', address: '', state: '', lga: '',
  gender: '', marital_status: '', religion: '', occupation: '',
  next_of_kin_name: '', next_of_kin_relationship: '', next_of_kin_phone: '',
  referral_source: '',
  amputation_yes: 0, amputation_level: '', amputation_side: '', amputation_date: '', amputation_cause: '',
  previous_prosthesis: '', allergies: '', functional_mobility_status: '', caregiver_info: '',
};

export default function PatientOnboardingPage() {
  const { user, loading } = useAuth();
  const [form, setForm] = useState(INITIAL);
  const [signature, setSignature] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'patient') return;
    fetch('/api/patient/profile')
      .then(r => r.json())
      .then(data => {
        const p = data.patient;
        if (!p) { setDataLoading(false); return; }
        if (p.declaration_signed_at) {
          window.location.href = '/dashboard/patient';
          return;
        }
        setForm({
          phone: p.phone || '', dob: p.dob || '', address: p.address || '', state: p.state || '', lga: p.lga || '',
          gender: p.gender || '', marital_status: p.marital_status || '', religion: p.religion || '', occupation: p.occupation || '',
          next_of_kin_name: p.next_of_kin_name || '', next_of_kin_relationship: p.next_of_kin_relationship || '', next_of_kin_phone: p.next_of_kin_phone || '',
          referral_source: p.referral_source || '',
          amputation_yes: p.amputation_yes || 0, amputation_level: p.amputation_level || '', amputation_side: p.amputation_side || '', amputation_date: p.amputation_date || '', amputation_cause: p.amputation_cause || '',
          previous_prosthesis: p.previous_prosthesis || '', allergies: p.allergies || '', functional_mobility_status: p.functional_mobility_status || '', caregiver_info: p.caregiver_info || '',
        });
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  }, [user]);

  if (loading || dataLoading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'patient') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!signature) { setError('Please sign the declaration below to continue.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/patient/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, declaration_signature: signature }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save. Please try again.'); setSubmitting(false); return; }
      window.location.href = '/dashboard/patient';
    } catch {
      setError('Network error. Please try again.');
    }
    setSubmitting(false);
  }

  return (
    <div className="dash-content" style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="dash-page-header" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ClipboardList size={22} color="var(--primary)" />
        </div>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>Complete Your Profile</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>A few details before you get started — this only takes a minute.</p>
        </div>
      </div>

      <div className="skeu-card" style={{ padding: 24 }}>
        <form onSubmit={handleSubmit}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 16 }}>Patient Details</h3>
          <div className="form-grid-2" style={{ marginBottom: 16 }}>
            <div>
              <label className="skeu-label">Phone Number</label>
              <input className="skeu-input" style={{ width: '100%' }} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="skeu-label">Date of Birth</label>
              <input type="date" className="skeu-input" style={{ width: '100%' }} value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
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
              <label className="skeu-label">Sex / Gender</label>
              <SkeuSelect value={form.gender} onChange={v => setForm({ ...form, gender: v })} options={GENDER_OPTIONS} placeholder="Select…" />
            </div>
            <div>
              <label className="skeu-label">Marital Status</label>
              <SkeuSelect value={form.marital_status} onChange={v => setForm({ ...form, marital_status: v })} options={MARITAL_STATUS_OPTIONS} placeholder="Select…" />
            </div>
          </div>
          <div className="form-grid-2" style={{ marginBottom: 16 }}>
            <div>
              <label className="skeu-label">Religion</label>
              <input className="skeu-input" style={{ width: '100%' }} value={form.religion} onChange={e => setForm({ ...form, religion: e.target.value })} />
            </div>
            <div>
              <label className="skeu-label">Occupation</label>
              <input className="skeu-input" style={{ width: '100%' }} value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="skeu-label">How did you hear about us?</label>
            <input className="skeu-input" style={{ width: '100%' }} value={form.referral_source} onChange={e => setForm({ ...form, referral_source: e.target.value })} />
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
              <span style={{ fontSize: '0.88rem', color: 'var(--text-body)' }}>I have an amputation</span>
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
            <textarea className="skeu-input" rows={2} style={{ width: '100%', resize: 'vertical' }} value={form.previous_prosthesis} onChange={e => setForm({ ...form, previous_prosthesis: e.target.value })} placeholder="Type, issues encountered…" />
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
          <SignaturePad value={signature} onChange={setSignature} height={120} label="Your Signature / Thumbprint" />

          {error && (
            <div style={{ marginTop: 16, background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem' }}>{error}</div>
          )}

          <button type="submit" className="skeu-btn-primary" disabled={submitting} style={{ width: '100%', marginTop: 20 }}>
            {submitting ? 'Saving...' : 'Save and Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
