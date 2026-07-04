'use client';

import { useAuth } from '@/hooks/useAuth';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useEffect, useState } from 'react';
import { NIGERIA_STATES } from '@/lib/nigeria-states';
import { getLGAs } from '@/lib/nigeria-lgas';
import { Users, Search, ChevronDown, ChevronUp, User, Plus, X, Pencil, KeyRound, Check } from 'lucide-react';

interface Patient {
  id: number;
  user_id: number | null;
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
  previous_prosthesis: number;
  allergies: string;
  functional_mobility_status: string;
  caregiver_info: string;
  created_at: string;
  portal_email: string | null;
}

const emptyAddForm = {
  full_name: '', email: '', phone: '', dob: '', state: '', lga: '', address: '',
};

const optionalStyle: React.CSSProperties = { fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '4px' };

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '0.88rem', color: 'var(--text-body)' }}>{value || '—'}</div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px', marginBottom: '4px', marginTop: '8px' }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)' }}>{title}</span>
    </div>
  );
}

export default function PatientsPage() {
  const { user, loading } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { confirm, alertUser, dialog } = useConfirmDialog();

  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Patient> & { email?: string }>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [resettingId, setResettingId] = useState<number | null>(null);

  async function fetchPatients() {
    const res = await fetch('/api/admin/patients');
    if (res.ok) setPatients(await res.json());
  }

  useAutoRefresh(fetchPatients, 30000, !!user);

  useEffect(() => {
    if (!user) return;
    fetchPatients();
  }, [user]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setAddError(''); setSuccessMsg('');
    const res = await fetch('/api/admin/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    });
    setSubmitting(false);
    if (res.ok) {
      setAddForm(emptyAddForm);
      setShowAddForm(false);
      setSuccessMsg('Patient added successfully. A welcome email has been sent.');
      fetchPatients();
      setTimeout(() => setSuccessMsg(''), 5000);
    } else {
      const d = await res.json();
      setAddError(d.error || 'Failed to add patient');
    }
  }

  function startEdit(p: Patient) {
    setEditId(p.id);
    setEditForm({ full_name: p.full_name, email: p.portal_email || '', phone: p.phone || '', dob: p.dob || '', state: p.state || '', lga: p.lga || '', address: p.address || '' });
  }

  async function saveEdit() {
    if (editId == null) return;
    setSavingEdit(true);
    const res = await fetch(`/api/admin/patients/${editId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setSavingEdit(false);
    if (res.ok) { setEditId(null); setEditForm({}); fetchPatients(); }
    else { const d = await res.json(); await alertUser(d.error || 'Failed to save changes.', { title: 'Could Not Save' }); }
  }

  async function handleResetPassword(p: Patient) {
    if (!p.portal_email) return;
    const ok = await confirm(`Reset the password for ${p.portal_email}? They'll be emailed a new temporary password and must set a new one on next login.`, { title: 'Reset Password', confirmLabel: 'Reset Password' });
    if (!ok) return;
    setResettingId(p.id);
    const res = await fetch(`/api/admin/patients/${p.id}/reset-password`, { method: 'POST' });
    setResettingId(null);
    if (res.ok) await alertUser(`A new temporary password has been emailed to ${p.portal_email}.`, { title: 'Password Reset' });
    else { const d = await res.json(); await alertUser(d.error || 'Failed to reset password.', { title: 'Could Not Reset Password' }); }
  }

  const filtered = patients.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone || '').includes(search) ||
    (p.state || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dash-content">
      {dialog}
      <div className="dash-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#2563eb18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} color="#2563eb" />
          </div>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.75rem', color: 'var(--text-head)', fontWeight: 600 }}>Patients</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{patients.length} registered patients</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input className="skeu-input" placeholder="Search name, phone, state…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, width: 220, maxWidth: '100%' }} />
          </div>
          <button className="skeu-btn-primary" onClick={() => setShowAddForm(s => !s)} style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '7px' }}>
            {showAddForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Add Patient</>}
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '12px 16px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '4px' }}>
          {successMsg}
        </div>
      )}

      {showAddForm && (
        <div className="inline-form-card">
          <h2 className="font-display" style={{ fontSize: '1.1rem', color: 'var(--text-head)', marginBottom: '18px', fontWeight: 600 }}>New Patient</h2>
          {addError && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.85rem' }}>{addError}</div>}
          <form onSubmit={handleAddSubmit}>
            <div className="form-grid-2">
              <div>
                <label className="skeu-label">Full Name</label>
                <input className="skeu-input" value={addForm.full_name} onChange={e => setAddForm({ ...addForm, full_name: e.target.value })} required placeholder="First and last name" />
              </div>
              <div>
                <label className="skeu-label">Email (for portal login)</label>
                <input className="skeu-input" type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} required placeholder="patient@example.com" />
              </div>
              <div>
                <label className="skeu-label">Phone<span style={optionalStyle}>(optional)</span></label>
                <input className="skeu-input" value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} placeholder="e.g. 08012345678" />
              </div>
              <div>
                <label className="skeu-label">Date of Birth<span style={optionalStyle}>(optional)</span></label>
                <input className="skeu-input" type="date" value={addForm.dob} onChange={e => setAddForm({ ...addForm, dob: e.target.value })} />
              </div>
              <div>
                <label className="skeu-label">State<span style={optionalStyle}>(optional)</span></label>
                <select className="skeu-select" value={addForm.state} onChange={e => setAddForm({ ...addForm, state: e.target.value, lga: '' })}>
                  <option value="">Select state</option>
                  {NIGERIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="skeu-label">LGA<span style={optionalStyle}>(optional)</span></label>
                <select className="skeu-select" value={addForm.lga} onChange={e => setAddForm({ ...addForm, lga: e.target.value })} disabled={!addForm.state}>
                  <option value="">Select LGA</option>
                  {getLGAs(addForm.state).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="skeu-label">Address<span style={optionalStyle}>(optional)</span></label>
                <input className="skeu-input" value={addForm.address} onChange={e => setAddForm({ ...addForm, address: e.target.value })} placeholder="Street address" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
              <button className="skeu-btn-primary" type="submit" disabled={submitting} style={{ padding: '10px 24px' }}>
                {submitting ? 'Creating…' : 'Create Patient'}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="skeu-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-scroll">
          <table className="dash-table">
            <thead><tr><th>Full Name</th><th>Phone</th><th>State</th><th>Date of Birth</th><th>Registered</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {search ? 'No patients match your search.' : 'No patients yet.'}
                </td></tr>
              ) : filtered.flatMap(p => {
                const rows: React.ReactElement[] = [(
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                    <td style={{ fontWeight: 600, color: 'var(--text-head)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={13} color="#fff" />
                        </div>
                        {p.full_name}
                      </div>
                    </td>
                    <td>{p.phone || '—'}</td>
                    <td>{p.state || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.dob ? new Date(p.dob).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(p.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>{expandedId === p.id ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}</td>
                  </tr>
                )];
                if (expandedId === p.id) {
                  rows.push(
                    <tr key={`${p.id}-exp`}>
                      <td colSpan={6} style={{ padding: 0, background: 'rgba(27,61,94,0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <div style={{ padding: '20px 24px 24px 52px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px 24px' }}>

                            <SectionHeader title="Bio-data" />
                            <Field label="Gender" value={p.gender} />
                            <Field label="Marital Status" value={p.marital_status} />
                            <Field label="Religion" value={p.religion} />
                            <Field label="Occupation" value={p.occupation} />
                            <Field label="State" value={p.state} />
                            <Field label="LGA" value={p.lga} />
                            <div style={{ gridColumn: '1 / -1' }}>
                              <Field label="Address" value={p.address} />
                            </div>

                            <SectionHeader title="Next of Kin" />
                            <Field label="Name" value={p.next_of_kin_name} />
                            <Field label="Relationship" value={p.next_of_kin_relationship} />
                            <Field label="Phone" value={p.next_of_kin_phone} />

                            <SectionHeader title="Referral & Clinical History" />
                            <Field label="Referral Source" value={p.referral_source} />
                            <Field label="Amputation" value={p.amputation_yes ? 'Yes' : p.amputation_yes === 0 ? 'No' : undefined} />
                            {p.amputation_yes ? (
                              <>
                                <Field label="Level" value={p.amputation_level} />
                                <Field label="Side" value={p.amputation_side} />
                                <Field label="Date" value={p.amputation_date} />
                                <Field label="Cause" value={p.amputation_cause} />
                              </>
                            ) : null}
                            <Field label="Previous Prosthesis" value={p.previous_prosthesis ? 'Yes' : p.previous_prosthesis === 0 ? 'No' : undefined} />
                            <Field label="Allergies" value={p.allergies} />
                            <Field label="Functional Mobility" value={p.functional_mobility_status} />
                            <Field label="Caregiver Info" value={p.caregiver_info} />

                            <SectionHeader title="Portal Account" />
                            <Field label="Email" value={p.portal_email || 'No portal account'} />
                            <Field label="Account Status" value={p.user_id ? 'Active' : 'No account'} />

                          </div>

                          <div onClick={e => e.stopPropagation()} style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                            {editId === p.id ? (
                              <>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
                                  <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Full Name</label><input className="skeu-input" value={editForm.full_name ?? ''} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} /></div>
                                  <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Email</label><input className="skeu-input" type="email" value={editForm.email ?? ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
                                  <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Phone</label><input className="skeu-input" value={editForm.phone ?? ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                                  <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Date of Birth</label><input type="date" className="skeu-input" value={editForm.dob ?? ''} onChange={e => setEditForm({ ...editForm, dob: e.target.value })} /></div>
                                  <div>
                                    <label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>State</label>
                                    <select className="skeu-select" value={editForm.state ?? ''} onChange={e => setEditForm({ ...editForm, state: e.target.value, lga: '' })}>
                                      <option value="">Select state</option>
                                      {NIGERIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>LGA</label>
                                    <select className="skeu-select" value={editForm.lga ?? ''} onChange={e => setEditForm({ ...editForm, lga: e.target.value })} disabled={!editForm.state}>
                                      <option value="">Select LGA</option>
                                      {getLGAs(editForm.state ?? '').map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                  </div>
                                  <div style={{ gridColumn: '1 / -1' }}><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Address</label><input className="skeu-input" value={editForm.address ?? ''} onChange={e => setEditForm({ ...editForm, address: e.target.value })} /></div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button onClick={saveEdit} disabled={savingEdit} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', borderRadius: 7, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}><Check size={13} />{savingEdit ? 'Saving…' : 'Save'}</button>
                                  <button onClick={() => { setEditId(null); setEditForm({}); }} style={{ padding: '7px 16px', borderRadius: 7, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Cancel</button>
                                </div>
                              </>
                            ) : (
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button onClick={() => startEdit(p)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '7px', border: '1px solid rgba(27,61,94,0.2)', background: 'rgba(27,61,94,0.07)', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500 }}>
                                  <Pencil size={13} /> Edit Patient
                                </button>
                                {p.portal_email && (
                                  <button onClick={() => handleResetPassword(p)} disabled={resettingId === p.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '7px', border: '1px solid rgba(180,117,31,0.3)', background: 'rgba(180,117,31,0.08)', color: '#b45719', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500 }}>
                                    <KeyRound size={13} /> {resettingId === p.id ? 'Resetting…' : 'Reset Password'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }
                return rows;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
