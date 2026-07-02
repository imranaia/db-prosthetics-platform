'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { UserCircle } from 'lucide-react';

interface PatientProfile {
  id: number;
  full_name: string;
  phone: string;
  dob: string;
  address: string;
  state: string;
  lga: string;
  gender: string;
  marital_status: string;
  religion: string;
  occupation: string;
  next_of_kin_name: string;
  next_of_kin_relationship: string;
  next_of_kin_phone: string;
  referral_source: string;
  amputation_yes: number;
  amputation_level: string;
  amputation_side: string;
  amputation_date: string;
  amputation_cause: string;
  previous_prosthesis: string;
  allergies: string;
  functional_mobility_status: string;
  caregiver_info: string;
}

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 8 }}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>{number}</div>
      <h3 className="font-display" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>{title}</h3>
      <div style={{ flex: 1, height: 1, background: 'var(--border-card)' }} />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{value || '—'}</div>
    </div>
  );
}

export default function PatientProfilePage() {
  const { user, loading } = useAuth();
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Password form
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => {
    if (!user) return;
    fetch('/api/patient/profile')
      .then(r => r.json())
      .then(data => {
        if (data.patient) setPatient(data.patient);
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  }, [user]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'patient') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError('New passwords do not match.');
      return;
    }
    if (pwForm.new_password.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    setPwSubmitting(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: pwForm.current_password, new_password: pwForm.new_password }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error || 'Failed to update password.'); }
      else { setPwSuccess('Password updated successfully.'); setPwForm({ current_password: '', new_password: '', confirm_password: '' }); }
    } catch {
      setPwError('Network error. Please try again.');
    }
    setPwSubmitting(false);
  }

  return (
    <div className="dash-content">
      <div className="dash-page-header" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <UserCircle size={22} color="var(--primary)" />
          </div>
          <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>My Profile</h1>
        </div>
      </div>

      {/* Personal Information */}
      <div className="skeu-card" style={{ padding: 24, marginBottom: 20 }}>
        <SectionHeader number="1" title="Personal Information" />

        {dataLoading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', padding: '20px 0' }}>Loading profile...</div>
        ) : patient ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
              <Field label="Full Name" value={patient.full_name} />
              <Field label="Date of Birth" value={patient.dob} />
              <Field label="Phone" value={patient.phone} />
              <Field label="Gender" value={patient.gender} />
              <Field label="Marital Status" value={patient.marital_status} />
              <Field label="Religion" value={patient.religion} />
              <Field label="State" value={patient.state} />
              <Field label="LGA" value={patient.lga} />
              <Field label="Occupation" value={patient.occupation} />
              <Field label="Address" value={patient.address} />
              <Field label="Next of Kin Name" value={patient.next_of_kin_name} />
              <Field label="Next of Kin Relationship" value={patient.next_of_kin_relationship} />
              <Field label="Next of Kin Phone" value={patient.next_of_kin_phone} />
              <Field label="Referral Source" value={patient.referral_source} />
            </div>

            {patient.amputation_yes === 1 && (
              <>
                <SectionHeader number="1a" title="Amputation Details" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                  <Field label="Level" value={patient.amputation_level} />
                  <Field label="Side" value={patient.amputation_side} />
                  <Field label="Date" value={patient.amputation_date} />
                  <Field label="Cause" value={patient.amputation_cause} />
                  <Field label="Previous Prosthesis" value={patient.previous_prosthesis} />
                </div>
              </>
            )}

            <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: 16, marginTop: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                <Field label="Allergies" value={patient.allergies} />
                <Field label="Functional Mobility" value={patient.functional_mobility_status} />
              </div>
              <Field label="Caregiver Info" value={patient.caregiver_info} />
            </div>
          </>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No profile data found.</div>
        )}
      </div>

      {/* Change Password */}
      <div className="skeu-card" style={{ padding: 24 }}>
        <SectionHeader number="2" title="Change Password" />
        <form onSubmit={handlePasswordSubmit} style={{ maxWidth: 480 }}>
          <div style={{ marginBottom: 14 }}>
            <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Current Password</label>
            <input
              type="password"
              className="skeu-input"
              style={{ width: '100%' }}
              value={pwForm.current_password}
              onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })}
              required
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>New Password</label>
            <input
              type="password"
              className="skeu-input"
              style={{ width: '100%' }}
              value={pwForm.new_password}
              onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })}
              required
              minLength={8}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Confirm New Password</label>
            <input
              type="password"
              className="skeu-input"
              style={{ width: '100%' }}
              value={pwForm.confirm_password}
              onChange={e => setPwForm({ ...pwForm, confirm_password: e.target.value })}
              required
            />
          </div>

          {pwError && (
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 16 }}>
              {pwError}
            </div>
          )}
          {pwSuccess && (
            <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 16 }}>
              {pwSuccess}
            </div>
          )}

          <button type="submit" className="skeu-btn-primary" disabled={pwSubmitting}>
            {pwSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
