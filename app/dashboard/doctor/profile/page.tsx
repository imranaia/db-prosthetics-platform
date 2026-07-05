'use client';

import { useAuth } from '@/hooks/useAuth';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { UserCircle, Pencil, X, AlertCircle } from 'lucide-react';
import { NIGERIA_STATES } from '@/lib/nigeria-states';
import { getLGAs } from '@/lib/nigeria-lgas';
import SkeuSelect from '@/components/ui/SkeuSelect';
import { GENDER_OPTIONS, MARITAL_STATUS_OPTIONS } from '@/lib/profile-options';
import { isPasswordValid, PASSWORD_REQUIREMENT_MESSAGE } from '@/lib/password';

interface DoctorProfile {
  id: number;
  full_name: string | null;
  email: string;
  phone: string | null;
  specialization: string | null;
  state: string | null;
  lga: string | null;
  address: string | null;
  years_experience: number | null;
  qualifications: string | null;
  dob: string | null;
  gender: string | null;
  marital_status: string | null;
  occupation: string | null;
  religion: string | null;
  next_of_kin_name: string | null;
  next_of_kin_relationship: string | null;
  next_of_kin_phone: string | null;
  profile_completed_at: string | null;
}

const REQUIRED_FIELDS = [
  { key: 'full_name', label: 'Full Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'state', label: 'State' },
  { key: 'lga', label: 'LGA' },
  { key: 'address', label: 'Address' },
] as const;

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 8 }}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>{number}</div>
      <h3 className="font-display" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>{title}</h3>
      <div style={{ flex: 1, height: 1, background: 'var(--border-card)' }} />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.6 }}>{value || '—'}</div>
    </div>
  );
}

export default function DoctorProfilePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <DoctorProfilePageInner />
    </Suspense>
  );
}

function DoctorProfilePageInner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requiredMode = searchParams.get('required') === '1';
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Edit form
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<DoctorProfile>>({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Password form
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  async function loadProfile() {
    try {
      const r = await fetch('/api/doctor/profile');
      const data = await r.json();
      if (data.doctor) setDoctor(data.doctor);
    } finally {
      setDataLoading(false);
    }
  }

  useEffect(() => {
    if (!user || loading) return;
    loadProfile();
  }, [user, loading]);

  // Arrived here via the profile-completion gate — jump straight into edit
  // mode. Gated on profile_completed_at (server truth), not just the URL
  // flag, so this can't re-fire and yank the user back into edit mode right
  // after a successful save (the ?required=1 param clears asynchronously).
  useEffect(() => {
    if (requiredMode && doctor && !doctor.profile_completed_at && !editing) startEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requiredMode, doctor]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'doctor' && !(user.role === 'super_admin' && user.hasDoctorProfile)) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  function startEdit() {
    if (!doctor) return;
    setEditForm({
      full_name: doctor.full_name || '',
      phone: doctor.phone || '',
      specialization: doctor.specialization || '',
      state: doctor.state || '',
      lga: doctor.lga || '',
      address: doctor.address || '',
      years_experience: doctor.years_experience ?? undefined,
      qualifications: doctor.qualifications || '',
      dob: doctor.dob || '',
      gender: doctor.gender || '',
      marital_status: doctor.marital_status || '',
      occupation: doctor.occupation || '',
      religion: doctor.religion || '',
      next_of_kin_name: doctor.next_of_kin_name || '',
      next_of_kin_relationship: doctor.next_of_kin_relationship || '',
      next_of_kin_phone: doctor.next_of_kin_phone || '',
    });
    setEditing(true);
    setEditError('');
    setEditSuccess('');
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEditSubmitting(true);
    setEditError('');
    try {
      const res = await fetch('/api/doctor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error || 'Failed to update profile.'); }
      else {
        const missing = REQUIRED_FIELDS.filter(f => !editForm[f.key]);
        if (missing.length > 0) {
          setEditError(`Saved — but please also fill in: ${missing.map(f => f.label).join(', ')} to complete your profile.`);
        } else {
          setEditSuccess(requiredMode ? 'Profile complete — you can now use the rest of the dashboard.' : 'Profile updated successfully.');
          setEditing(false);
          if (requiredMode) router.replace('/dashboard/doctor/profile');
        }
        loadProfile();
      }
    } catch { setEditError('Network error. Please try again.'); }
    setEditSubmitting(false);
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (pwForm.new_password !== pwForm.confirm_password) { setPwError('New passwords do not match.'); return; }
    if (!isPasswordValid(pwForm.new_password)) { setPwError(PASSWORD_REQUIREMENT_MESSAGE); return; }
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
    } catch { setPwError('Network error. Please try again.'); }
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

      {requiredMode && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: '0.88rem' }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Please complete your profile below before continuing — this only needs to be done once.</span>
        </div>
      )}

      {/* Professional Info */}
      <div className="skeu-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <SectionHeader number="1" title="Professional Information" />
          {doctor && !editing && (
            <button onClick={startEdit} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(27,61,94,0.25)', background: 'rgba(27,61,94,0.06)', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, marginTop: -8 }}>
              <Pencil size={13} /> Edit Profile
            </button>
          )}
        </div>

        {editSuccess && !editing && (
          <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 16 }}>{editSuccess}</div>
        )}

        {dataLoading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', padding: '20px 0' }}>Loading profile...</div>
        ) : editing ? (
          <form onSubmit={handleEditSubmit}>
            {editError && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 16 }}>{editError}</div>}
            <div className="form-grid-2" style={{ gap: 14, marginBottom: 14 }}>
              <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Full Name</label><input className="skeu-input" value={editForm.full_name ?? ''} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} /></div>
              <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Phone</label><input className="skeu-input" value={editForm.phone ?? ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
              <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Specialization</label><input className="skeu-input" value={editForm.specialization ?? ''} onChange={e => setEditForm({ ...editForm, specialization: e.target.value })} /></div>
              <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Years Experience</label><input type="number" min="0" className="skeu-input" value={editForm.years_experience ?? ''} onChange={e => setEditForm({ ...editForm, years_experience: parseInt(e.target.value) || 0 })} /></div>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>State</label>
                <SkeuSelect
                  value={editForm.state ?? ''}
                  onChange={v => setEditForm({ ...editForm, state: v, lga: '' })}
                  options={NIGERIA_STATES.map(s => ({ value: s, label: s }))}
                  placeholder="Select state"
                />
              </div>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>LGA</label>
                <SkeuSelect
                  value={editForm.lga ?? ''}
                  onChange={v => setEditForm({ ...editForm, lga: v })}
                  options={getLGAs(editForm.state ?? '').map(l => ({ value: l, label: l }))}
                  placeholder="Select LGA"
                  disabled={!editForm.state}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Address</label><input className="skeu-input" value={editForm.address ?? ''} onChange={e => setEditForm({ ...editForm, address: e.target.value })} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Qualifications</label><textarea className="skeu-input" rows={3} value={editForm.qualifications ?? ''} onChange={e => setEditForm({ ...editForm, qualifications: e.target.value })} style={{ resize: 'vertical' }} /></div>
            </div>

            <div style={{ height: 1, background: 'var(--border-card)', margin: '8px 0 18px' }} />
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Personal Information</div>
            <div className="form-grid-2" style={{ gap: 14, marginBottom: 18 }}>
              <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Date of Birth</label><input type="date" className="skeu-input" value={editForm.dob ?? ''} onChange={e => setEditForm({ ...editForm, dob: e.target.value })} /></div>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Gender</label>
                <SkeuSelect value={editForm.gender ?? ''} onChange={v => setEditForm({ ...editForm, gender: v })} options={GENDER_OPTIONS} placeholder="Select…" />
              </div>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Marital Status</label>
                <SkeuSelect value={editForm.marital_status ?? ''} onChange={v => setEditForm({ ...editForm, marital_status: v })} options={MARITAL_STATUS_OPTIONS} placeholder="Select…" />
              </div>
              <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Religion</label><input className="skeu-input" value={editForm.religion ?? ''} onChange={e => setEditForm({ ...editForm, religion: e.target.value })} /></div>
              <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Occupation</label><input className="skeu-input" value={editForm.occupation ?? ''} onChange={e => setEditForm({ ...editForm, occupation: e.target.value })} /></div>
            </div>

            <div style={{ height: 1, background: 'var(--border-card)', margin: '8px 0 18px' }} />
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Next of Kin</div>
            <div className="form-grid-2" style={{ gap: 14, marginBottom: 18 }}>
              <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Full Name</label><input className="skeu-input" value={editForm.next_of_kin_name ?? ''} onChange={e => setEditForm({ ...editForm, next_of_kin_name: e.target.value })} /></div>
              <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Relationship</label><input className="skeu-input" value={editForm.next_of_kin_relationship ?? ''} onChange={e => setEditForm({ ...editForm, next_of_kin_relationship: e.target.value })} /></div>
              <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Phone</label><input className="skeu-input" value={editForm.next_of_kin_phone ?? ''} onChange={e => setEditForm({ ...editForm, next_of_kin_phone: e.target.value })} /></div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="skeu-btn-primary" disabled={editSubmitting}>{editSubmitting ? 'Saving...' : 'Save Changes'}</button>
              <button type="button" onClick={() => setEditing(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}><X size={14} />Cancel</button>
            </div>
          </form>
        ) : doctor ? (
          <>
            <div className="form-grid-2" style={{ gap: '0 32px' }}>
              <Field label="Full Name" value={doctor.full_name || ''} />
              <Field label="Email" value={doctor.email} />
              <Field label="Phone" value={doctor.phone || ''} />
              <Field label="Specialization" value={doctor.specialization || ''} />
              <Field label="Years Experience" value={doctor.years_experience != null ? String(doctor.years_experience) : ''} />
              <Field label="State" value={doctor.state || ''} />
              <Field label="LGA" value={doctor.lga || ''} />
              <Field label="Address" value={doctor.address || ''} />
              <div style={{ gridColumn: '1 / -1' }}><Field label="Qualifications" value={doctor.qualifications || ''} /></div>
            </div>

            <div style={{ height: 1, background: 'var(--border-card)', margin: '16px 0' }} />
            <SectionHeader number="2" title="Personal Information" />
            <div className="form-grid-2" style={{ gap: '0 32px' }}>
              <Field label="Date of Birth" value={doctor.dob} />
              <Field label="Gender" value={doctor.gender} />
              <Field label="Marital Status" value={doctor.marital_status} />
              <Field label="Religion" value={doctor.religion} />
              <Field label="Occupation" value={doctor.occupation} />
            </div>

            <div style={{ height: 1, background: 'var(--border-card)', margin: '16px 0' }} />
            <SectionHeader number="3" title="Next of Kin" />
            <div className="form-grid-2" style={{ gap: '0 32px' }}>
              <Field label="Full Name" value={doctor.next_of_kin_name} />
              <Field label="Relationship" value={doctor.next_of_kin_relationship} />
              <Field label="Phone" value={doctor.next_of_kin_phone} />
            </div>
          </>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No profile data found.</div>
        )}
      </div>

      {/* Change Password */}
      <div className="skeu-card" style={{ padding: 24 }}>
        <SectionHeader number="4" title="Change Password" />
        <form onSubmit={handlePasswordSubmit} style={{ maxWidth: 480 }}>
          <div style={{ marginBottom: 14 }}>
            <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Current Password</label>
            <input type="password" className="skeu-input" style={{ width: '100%' }} value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} required />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>New Password</label>
            <input type="password" className="skeu-input" style={{ width: '100%' }} value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} required minLength={8} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Confirm New Password</label>
            <input type="password" className="skeu-input" style={{ width: '100%' }} value={pwForm.confirm_password} onChange={e => setPwForm({ ...pwForm, confirm_password: e.target.value })} required />
          </div>
          {pwError && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 16 }}>{pwError}</div>}
          {pwSuccess && <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 16 }}>{pwSuccess}</div>}
          <button type="submit" className="skeu-btn-primary" disabled={pwSubmitting}>
            {pwSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
