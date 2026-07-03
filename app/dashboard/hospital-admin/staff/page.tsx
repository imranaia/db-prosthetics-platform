'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';

interface StaffMember {
  role: 'doctor' | 'po_specialist';
  user_id: number;
  email: string;
  staff_id: number;
  full_name?: string;
  phone?: string;
  specialization?: string;
  state?: string;
  lga?: string;
  address?: string;
  years_experience?: number;
  qualifications?: string;
}

const NIGERIAN_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];

const INITIAL_FORM = {
  role: 'doctor' as 'doctor' | 'po_specialist',
  email: '',
  password: '',
  full_name: '',
  phone: '',
  specialization: '',
  state: '',
  lga: '',
  address: '',
  years_experience: '' as string | number,
  qualifications: '',
};

export default function HospitalAdminStaffPage() {
  const { user, loading } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    fetch('/api/hospital-admin/staff')
      .then(r => r.json())
      .then(data => {
        if (data.staff) setStaff(data.staff);
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'hospital_admin') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  const doctors = staff.filter(s => s.role === 'doctor');
  const poSpecialists = staff.filter(s => s.role === 'po_specialist');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/hospital-admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: form.role,
          email: form.email,
          password: form.password,
          full_name: form.full_name || undefined,
          phone: form.phone || undefined,
          specialization: form.specialization || undefined,
          state: form.state || undefined,
          lga: form.lga || undefined,
          address: form.address || undefined,
          years_experience: form.years_experience !== '' ? Number(form.years_experience) : undefined,
          qualifications: form.qualifications || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Failed to add staff member.'); }
      else {
        setFormSuccess('Staff member added successfully.');
        setForm(INITIAL_FORM);
        setShowForm(false);
        setDataLoading(true);
        load();
      }
    } catch {
      setFormError('Network error. Please try again.');
    }
    setSubmitting(false);
  }

  async function handleDelete(staffMember: StaffMember) {
    if (!confirm(`Remove ${staffMember.email} from staff? This cannot be undone.`)) return;
    setDeleting(staffMember.staff_id);
    try {
      await fetch('/api/hospital-admin/staff', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: staffMember.staff_id, role: staffMember.role }),
      });
      setDataLoading(true);
      load();
    } catch {
      // silently fail
    }
    setDeleting(null);
  }

  function StaffCard({ s }: { s: StaffMember }) {
    const displayName = (s.role === 'doctor' && s.full_name) ? s.full_name : s.email;
    const initial = displayName.charAt(0).toUpperCase();
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 10, border: '1px solid var(--border-card)', background: 'var(--bg-base)', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem', flexShrink: 0 }}>
            {initial}
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-head)' }}>{displayName}</div>
            {s.role === 'doctor' && s.full_name && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.email}</div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
              <span style={{ padding: '1px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, background: s.role === 'doctor' ? '#dbeafe' : '#f3e8ff', color: s.role === 'doctor' ? '#1d4ed8' : '#6d28d9' }}>
                {s.role === 'doctor' ? 'Doctor' : 'P&O Specialist'}
              </span>
              {s.role === 'doctor' && s.specialization && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.specialization}</span>
              )}
              {s.role === 'doctor' && s.state && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.state}</span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => handleDelete(s)}
          disabled={deleting === s.staff_id}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid #fee2e2', background: '#fee2e2', color: '#b91c1c', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
        >
          <Trash2 size={14} />
          {deleting === s.staff_id ? 'Removing...' : 'Remove'}
        </button>
      </div>
    );
  }

  return (
    <div className="dash-content">
      <div className="dash-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <UserPlus size={22} color="var(--primary)" />
          </div>
          <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>Staff Management</h1>
        </div>
        <button
          className="skeu-btn-accent"
          onClick={() => { setShowForm(!showForm); setFormError(''); setFormSuccess(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <UserPlus size={16} />
          {showForm ? 'Cancel' : 'Add Staff Member'}
        </button>
      </div>

      {formSuccess && !showForm && (
        <div style={{ background: '#d1fae5', color: '#065f46', padding: '12px 16px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 20 }}>{formSuccess}</div>
      )}

      {/* Add Staff Form */}
      {showForm && (
        <div className="skeu-card" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 20 }}>Add Staff Member</h2>
          <form onSubmit={handleSubmit}>
            {/* Role toggle */}
            <div style={{ marginBottom: 18 }}>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 10 }}>Role</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {(['doctor', 'po_specialist'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, role: r })}
                    style={{ flex: 1, padding: '14px', borderRadius: 10, border: `2px solid ${form.role === r ? 'var(--primary)' : 'var(--border-card)'}`, background: form.role === r ? 'rgba(27,61,94,0.07)' : 'transparent', cursor: 'pointer', textAlign: 'center' }}
                  >
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: form.role === r ? 'var(--primary)' : 'var(--text-body)' }}>
                      {r === 'doctor' ? 'Doctor' : 'P&O Specialist'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Email Address</label>
              <input
                type="email"
                className="skeu-input"
                style={{ width: '100%' }}
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Temporary Password</label>
              <input
                type="password"
                className="skeu-input"
                style={{ width: '100%' }}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                They will be asked to change this on first login.
              </div>
            </div>

            {form.role === 'doctor' && (
              <>
                <div style={{ marginBottom: 10, paddingTop: 4, borderTop: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, marginTop: 14 }}>Doctor Profile</div>
                  <div className="form-grid-2" style={{ gap: 14 }}>
                    <div>
                      <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Full Name <span style={{ color: '#dc2626' }}>*</span></label>
                      <input
                        type="text"
                        className="skeu-input"
                        style={{ width: '100%' }}
                        value={form.full_name}
                        onChange={e => setForm({ ...form, full_name: e.target.value })}
                        required
                        placeholder="Dr. Amina Bello"
                      />
                    </div>
                    <div>
                      <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Phone</label>
                      <input
                        type="text"
                        className="skeu-input"
                        style={{ width: '100%' }}
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="+234 801 234 5678"
                      />
                    </div>
                    <div>
                      <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Specialization</label>
                      <input
                        type="text"
                        className="skeu-input"
                        style={{ width: '100%' }}
                        value={form.specialization}
                        onChange={e => setForm({ ...form, specialization: e.target.value })}
                        placeholder="Upper Limb Prosthetist"
                      />
                    </div>
                    <div>
                      <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Years of Experience</label>
                      <input
                        type="number"
                        className="skeu-input"
                        style={{ width: '100%' }}
                        value={form.years_experience}
                        onChange={e => setForm({ ...form, years_experience: e.target.value })}
                        min={0}
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>State</label>
                      <select
                        className="skeu-select"
                        style={{ width: '100%' }}
                        value={form.state}
                        onChange={e => setForm({ ...form, state: e.target.value })}
                      >
                        <option value="">Select state…</option>
                        {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>LGA</label>
                      <input
                        type="text"
                        className="skeu-input"
                        style={{ width: '100%' }}
                        value={form.lga}
                        onChange={e => setForm({ ...form, lga: e.target.value })}
                        placeholder="Local Government Area"
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Address</label>
                      <input
                        type="text"
                        className="skeu-input"
                        style={{ width: '100%' }}
                        value={form.address}
                        onChange={e => setForm({ ...form, address: e.target.value })}
                        placeholder="Clinic or home address"
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Qualifications</label>
                      <textarea
                        className="skeu-input"
                        style={{ width: '100%', minHeight: 80, resize: 'vertical' }}
                        value={form.qualifications}
                        onChange={e => setForm({ ...form, qualifications: e.target.value })}
                        placeholder="Certifications, degrees, professional memberships…"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {formError && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', margin: '14px 0' }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button type="submit" className="skeu-btn-primary" disabled={submitting} style={{ flex: 1 }}>
                {submitting ? 'Adding...' : 'Add Staff Member'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setFormError(''); setForm(INITIAL_FORM); }}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', fontWeight: 600, color: 'var(--text-body)' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {dataLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading staff...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Doctors section */}
          <div className="skeu-card" style={{ padding: 24 }}>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>Doctors</h2>
              <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600 }}>{doctors.length}</span>
            </div>
            {doctors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>No doctors added yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {doctors.map(s => <StaffCard key={s.staff_id} s={s} />)}
              </div>
            )}
          </div>

          {/* P&O Specialists section */}
          <div className="skeu-card" style={{ padding: 24 }}>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>P&O Specialists</h2>
              <span style={{ background: '#f3e8ff', color: '#6d28d9', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600 }}>{poSpecialists.length}</span>
            </div>
            {poSpecialists.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>No P&O Specialists added yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {poSpecialists.map(s => <StaffCard key={s.staff_id} s={s} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
