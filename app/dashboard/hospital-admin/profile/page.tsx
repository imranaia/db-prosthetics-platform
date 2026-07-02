'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { UserCircle, Pencil, X } from 'lucide-react';
import { NIGERIA_STATES } from '@/lib/nigeria-states';
import { getLGAs } from '@/lib/nigeria-lgas';
import SkeuSelect from '@/components/ui/SkeuSelect';

interface HospitalAdminProfile {
  id: number;
  email: string;
  full_name: string | null;
  phone: string | null;
  dob: string | null;
  gender: string | null;
  address: string | null;
  state: string | null;
  lga: string | null;
  marital_status: string | null;
  occupation: string | null;
  religion: string | null;
  next_of_kin_name: string | null;
  next_of_kin_relationship: string | null;
  next_of_kin_phone: string | null;
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

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.6 }}>{value || '—'}</div>
    </div>
  );
}

export default function HospitalAdminProfilePage() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<HospitalAdminProfile | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Edit form
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<HospitalAdminProfile>>({});
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
      const r = await fetch('/api/hospital-admin/profile');
      const data = await r.json();
      if (data.profile) setProfile(data.profile);
    } finally {
      setDataLoading(false);
    }
  }

  useEffect(() => {
    if (!user || loading) return;
    loadProfile();
  }, [user, loading]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'hospital_admin') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  function startEdit() {
    if (!profile) return;
    setEditForm({
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      dob: profile.dob || '',
      gender: profile.gender || '',
      address: profile.address || '',
      state: profile.state || '',
      lga: profile.lga || '',
      marital_status: profile.marital_status || '',
      occupation: profile.occupation || '',
      religion: profile.religion || '',
      next_of_kin_name: profile.next_of_kin_name || '',
      next_of_kin_relationship: profile.next_of_kin_relationship || '',
      next_of_kin_phone: profile.next_of_kin_phone || '',
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
      const res = await fetch('/api/hospital-admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error || 'Failed to update profile.'); }
      else {
        setEditSuccess('Profile updated successfully.');
        setEditing(false);
        loadProfile();
      }
    } catch { setEditError('Network error. Please try again.'); }
    setEditSubmitting(false);
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (pwForm.new_password !== pwForm.confirm_password) { setPwError('New passwords do not match.'); return; }
    if (pwForm.new_password.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
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

  const ef = editForm;
  const inp = (field: keyof typeof ef) => ({
    className: 'skeu-input' as const,
    value: (ef[field] as string) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEditForm({ ...ef, [field]: e.target.value }),
  });

  return (
    <div className="dash-content">
      <div className="dash-page-header" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <UserCircle size={22} color="var(--primary)" />
          </div>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>My Profile</h1>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 12px', borderRadius: 20, background: '#1b3d5e18', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, marginTop: 4 }}>
              Hospital Admin
            </div>
          </div>
        </div>
      </div>

      {/* Profile card */}
      <div className="skeu-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <SectionHeader number="1" title="Personal Information" />
          {profile && !editing && (
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Full Name</label><input {...inp('full_name')} /></div>
              <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Email</label><input className="skeu-input" value={profile?.email || ''} disabled style={{ opacity: 0.6 }} /></div>
              <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Phone</label><input {...inp('phone')} /></div>
              <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Date of Birth</label><input {...inp('dob')} placeholder="YYYY-MM-DD" /></div>
              <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Gender</label><input {...inp('gender')} placeholder="e.g. Male, Female" /></div>
              <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Marital Status</label><input {...inp('marital_status')} placeholder="e.g. Single, Married" /></div>
              <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Religion</label><input {...inp('religion')} /></div>
              <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Occupation</label><input {...inp('occupation')} /></div>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>State</label>
                <SkeuSelect
                  value={ef.state ?? ''}
                  onChange={v => setEditForm({ ...ef, state: v, lga: '' })}
                  options={NIGERIA_STATES.map(s => ({ value: s, label: s }))}
                  placeholder="Select state"
                />
              </div>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>LGA</label>
                <SkeuSelect
                  value={ef.lga ?? ''}
                  onChange={v => setEditForm({ ...ef, lga: v })}
                  options={getLGAs(ef.state ?? '').map(l => ({ value: l, label: l }))}
                  placeholder="Select LGA"
                  disabled={!ef.state}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Address</label><input {...inp('address')} /></div>
            </div>

            <div style={{ height: 1, background: 'var(--border-card)', margin: '8px 0 18px' }} />
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Next of Kin</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Full Name</label><input {...inp('next_of_kin_name')} /></div>
              <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Relationship</label><input {...inp('next_of_kin_relationship')} /></div>
              <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Phone</label><input {...inp('next_of_kin_phone')} /></div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="skeu-btn-primary" disabled={editSubmitting}>{editSubmitting ? 'Saving...' : 'Save Changes'}</button>
              <button type="button" onClick={() => setEditing(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}><X size={14} />Cancel</button>
            </div>
          </form>
        ) : profile ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
              <Field label="Full Name" value={profile.full_name} />
              <Field label="Email" value={profile.email} />
              <Field label="Phone" value={profile.phone} />
              <Field label="Date of Birth" value={profile.dob} />
              <Field label="Gender" value={profile.gender} />
              <Field label="Marital Status" value={profile.marital_status} />
              <Field label="Religion" value={profile.religion} />
              <Field label="Occupation" value={profile.occupation} />
              <Field label="State" value={profile.state} />
              <Field label="LGA" value={profile.lga} />
              <div style={{ gridColumn: '1 / -1' }}><Field label="Address" value={profile.address} /></div>
            </div>

            <div style={{ height: 1, background: 'var(--border-card)', margin: '16px 0' }} />
            <SectionHeader number="2" title="Next of Kin" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
              <Field label="Full Name" value={profile.next_of_kin_name} />
              <Field label="Relationship" value={profile.next_of_kin_relationship} />
              <Field label="Phone" value={profile.next_of_kin_phone} />
            </div>
          </>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No profile data found.</div>
        )}
      </div>

      {/* Change Password */}
      <div className="skeu-card" style={{ padding: 24 }}>
        <SectionHeader number="3" title="Change Password" />
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
