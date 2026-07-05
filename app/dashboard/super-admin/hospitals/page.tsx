'use client';

import { useAuth } from '@/hooks/useAuth';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useEffect, useState, useMemo } from 'react';
import { NIGERIA_STATES } from '@/lib/nigeria-states';
import { getLGAs } from '@/lib/nigeria-lgas';
import { Building2, Plus, Trash2, X, Pencil, KeyRound, Check, ArrowLeft, Search, MapPin } from 'lucide-react';
import { isPasswordValid, PASSWORD_REQUIREMENT_MESSAGE } from '@/lib/password';

interface Hospital {
  id: number; name: string; state: string; lga?: string;
  landmark?: string; address: string; admin_email: string; created_at: string;
}

const emptyForm = { name: '', state: '', lga: '', landmark: '', address: '', admin_email: '', admin_password: '' };

const optionalStyle: React.CSSProperties = { fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '4px' };

export default function HospitalsPage() {
  const { user, loading } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [stateSearch, setStateSearch] = useState('');
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { confirm, alertUser, dialog } = useConfirmDialog();

  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Hospital>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [resettingId, setResettingId] = useState<number | null>(null);

  async function fetchHospitals() {
    const res = await fetch('/api/admin/hospitals');
    if (res.ok) setHospitals(await res.json());
  }

  useEffect(() => { if (user) fetchHospitals(); }, [user]);

  useAutoRefresh(fetchHospitals, 30000, !!user);

  const countByState = useMemo(() => {
    const m: Record<string, number> = {};
    for (const h of hospitals) m[h.state] = (m[h.state] || 0) + 1;
    return m;
  }, [hospitals]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  const filteredStates = NIGERIA_STATES.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()));

  const hospitalsInState = selectedState
    ? hospitals.filter(h => h.state === selectedState && h.name.toLowerCase().includes(hospitalSearch.toLowerCase()))
    : [];

  function openAddForm() {
    setForm({ ...emptyForm, state: selectedState || '' });
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isPasswordValid(form.admin_password)) { setError(PASSWORD_REQUIREMENT_MESSAGE); return; }
    setSubmitting(true); setError('');
    const res = await fetch('/api/admin/hospitals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (res.ok) { setForm(emptyForm); setShowForm(false); fetchHospitals(); }
    else { const d = await res.json(); setError(d.error || 'Failed to create hospital'); }
  }

  async function handleDelete(id: number) {
    const ok = await confirm('Delete this hospital? This cannot be undone.', { title: 'Delete Hospital', confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    await fetch(`/api/admin/hospitals/${id}`, { method: 'DELETE' });
    fetchHospitals();
  }

  function startEdit(h: Hospital) {
    setEditId(h.id);
    setEditForm({ name: h.name, state: h.state, lga: h.lga || '', landmark: h.landmark || '', address: h.address || '', admin_email: h.admin_email || '' });
  }

  async function saveEdit() {
    if (editId == null) return;
    setSavingEdit(true);
    const res = await fetch(`/api/admin/hospitals/${editId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setSavingEdit(false);
    if (res.ok) { setEditId(null); setEditForm({}); fetchHospitals(); }
    else { const d = await res.json(); await alertUser(d.error || 'Failed to save changes.', { title: 'Could Not Save' }); }
  }

  async function handleResetPassword(h: Hospital) {
    const ok = await confirm(`Reset the password for ${h.admin_email}? They'll be emailed a new temporary password and must set a new one on next login.`, { title: 'Reset Password', confirmLabel: 'Reset Password' });
    if (!ok) return;
    setResettingId(h.id);
    const res = await fetch(`/api/admin/hospitals/${h.id}/reset-password`, { method: 'POST' });
    setResettingId(null);
    if (res.ok) await alertUser(`A new temporary password has been emailed to ${h.admin_email}.`, { title: 'Password Reset' });
    else { const d = await res.json(); await alertUser(d.error || 'Failed to reset password.', { title: 'Could Not Reset Password' }); }
  }

  return (
    <div className="dash-content">
      {dialog}

      {!selectedState ? (
        <>
          <div className="dash-page-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={20} color="var(--primary)" />
              </div>
              <div>
                <h1 className="font-display" style={{ fontSize: '1.75rem', color: 'var(--text-head)', fontWeight: 600 }}>Hospitals</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{hospitals.length} registered — select a state to view</p>
              </div>
            </div>
          </div>

          <div style={{ position: 'relative', maxWidth: 320, margin: '20px 0' }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input className="skeu-input" placeholder="Search states…" value={stateSearch} onChange={e => setStateSearch(e.target.value)} style={{ paddingLeft: 34, width: '100%' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {filteredStates.map(s => {
              const count = countByState[s] || 0;
              return (
                <button
                  key={s}
                  onClick={() => setSelectedState(s)}
                  className="skeu-card"
                  style={{ padding: '18px 16px', textAlign: 'left', cursor: 'pointer', border: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, color: 'var(--text-head)', fontSize: '0.92rem' }}>{s}</span>
                  </div>
                  <span style={{
                    alignSelf: 'flex-start', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
                    background: count > 0 ? '#d1fae5' : 'rgba(27,61,94,0.06)', color: count > 0 ? '#065f46' : 'var(--text-muted)',
                  }}>
                    {count} {count === 1 ? 'hospital' : 'hospitals'}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="dash-page-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => { setSelectedState(null); setHospitalSearch(''); setShowForm(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem', flexShrink: 0 }}
              >
                <ArrowLeft size={15} /> All States
              </button>
              <div>
                <h1 className="font-display" style={{ fontSize: '1.5rem', color: 'var(--text-head)', fontWeight: 600 }}>{selectedState}</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{hospitalsInState.length} hospital{hospitalsInState.length === 1 ? '' : 's'}</p>
              </div>
            </div>
            <button className="skeu-btn-primary" onClick={() => (showForm ? setShowForm(false) : openAddForm())} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '7px' }}>
              {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Add Hospital</>}
            </button>
          </div>

          {showForm && (
            <div className="inline-form-card">
              <h2 className="font-display" style={{ fontSize: '1.2rem', color: 'var(--text-head)', marginBottom: '20px', fontWeight: 600 }}>New Hospital in {selectedState}</h2>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-grid-2">
                  <div>
                    <label className="skeu-label">Hospital Name</label>
                    <input className="skeu-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Lagos General Hospital" />
                  </div>
                  <div>
                    <label className="skeu-label">LGA<span style={optionalStyle}>(optional)</span></label>
                    <select className="skeu-select" value={form.lga} onChange={e => setForm({ ...form, lga: e.target.value })}>
                      <option value="">Select LGA</option>
                      {getLGAs(form.state).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="skeu-label">Address<span style={optionalStyle}>(optional)</span></label>
                    <input className="skeu-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full street address" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="skeu-label">Landmark<span style={optionalStyle}>(optional)</span></label>
                    <input className="skeu-input" value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })} placeholder="e.g. Near Central Mosque, opposite Shoprite" />
                  </div>
                  <div>
                    <label className="skeu-label">Admin Email</label>
                    <input className="skeu-input" type="email" value={form.admin_email} onChange={e => setForm({ ...form, admin_email: e.target.value })} required placeholder="admin@hospital.com" />
                  </div>
                  <div>
                    <label className="skeu-label">Admin Password</label>
                    <input className="skeu-input" type="password" value={form.admin_password} onChange={e => setForm({ ...form, admin_password: e.target.value })} required placeholder="8+ chars, mixed case, number & symbol" />
                    <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      The hospital admin will receive a login email and be prompted to change this password on first login.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button className="skeu-btn-primary" type="submit" disabled={submitting} style={{ padding: '10px 24px' }}>
                    {submitting ? 'Creating…' : 'Create Hospital'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{ position: 'relative', maxWidth: 320, margin: '20px 0' }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input className="skeu-input" placeholder="Search hospitals in this state…" value={hospitalSearch} onChange={e => setHospitalSearch(e.target.value)} style={{ paddingLeft: 34, width: '100%' }} />
          </div>

          {hospitalsInState.length === 0 ? (
            <div className="skeu-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No hospitals in {selectedState} yet. Add the first one above.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {hospitalsInState.map(h => (
                <div key={h.id} className="skeu-card" style={{ padding: 18 }}>
                  {editId === h.id ? (
                    <div>
                      <input className="skeu-input" value={editForm.name ?? ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ marginBottom: 8, fontSize: '0.85rem' }} placeholder="Hospital Name" />
                      <input className="skeu-input" type="email" value={editForm.admin_email ?? ''} onChange={e => setEditForm({ ...editForm, admin_email: e.target.value })} style={{ marginBottom: 8, fontSize: '0.85rem' }} placeholder="Admin Email" />
                      <div className="form-grid-2" style={{ gap: 8, marginBottom: 8 }}>
                        <select className="skeu-select" value={editForm.state ?? ''} onChange={e => setEditForm({ ...editForm, state: e.target.value, lga: '' })} style={{ fontSize: '0.82rem' }}>
                          {NIGERIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select className="skeu-select" value={editForm.lga ?? ''} onChange={e => setEditForm({ ...editForm, lga: e.target.value })} disabled={!editForm.state} style={{ fontSize: '0.82rem' }}>
                          <option value="">Select LGA</option>
                          {getLGAs(editForm.state ?? '').map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      <input className="skeu-input" value={editForm.address ?? ''} onChange={e => setEditForm({ ...editForm, address: e.target.value })} style={{ marginBottom: 8, fontSize: '0.85rem' }} placeholder="Address" />
                      <input className="skeu-input" value={editForm.landmark ?? ''} onChange={e => setEditForm({ ...editForm, landmark: e.target.value })} style={{ marginBottom: 10, fontSize: '0.85rem' }} placeholder="Landmark" />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={saveEdit} disabled={savingEdit} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', borderRadius: 7, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}><Check size={13} />{savingEdit ? 'Saving…' : 'Save'}</button>
                        <button onClick={() => { setEditId(null); setEditForm({}); }} style={{ flex: 1, padding: '8px', borderRadius: 7, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Building2 size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-head)' }}>{h.name}</span>
                      </div>
                      {h.lga && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>{h.lga}</div>}
                      {h.address && <div style={{ fontSize: '0.78rem', color: 'var(--text-body)', marginBottom: 6 }}>{h.address}</div>}
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>Admin: {h.admin_email || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                        Added {new Date(h.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={() => startEdit(h)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(27,61,94,0.2)', background: 'rgba(27,61,94,0.07)', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
                          <Pencil size={13} /> Edit
                        </button>
                        <button onClick={() => handleResetPassword(h)} disabled={resettingId === h.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(180,117,31,0.3)', background: 'rgba(180,117,31,0.08)', color: '#b45719', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
                          <KeyRound size={13} /> {resettingId === h.id ? 'Resetting…' : 'Reset Password'}
                        </button>
                        <button onClick={() => handleDelete(h.id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.07)', color: '#b91c1c', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
