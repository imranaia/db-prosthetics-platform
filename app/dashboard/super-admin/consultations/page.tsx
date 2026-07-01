'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useRef, useState } from 'react';
import { Stethoscope, Plus, X, ChevronDown, ChevronUp, User, Search, Upload, Trash2 } from 'lucide-react';
import BodySelector, { BodyPart } from '@/components/consultation/BodySelector';

interface PhotoEntry {
  type: 'injury' | 'existing';
  url: string;
}

interface Consultation {
  id: number;
  patient_name: string;
  doctor_email: string | null;
  conducted_by_role: string;
  notes: string | null;
  created_at: string;
  body_parts: string | null;  // JSON stored as text
  photos: string | null;      // JSON stored as text
}
interface Patient { id: number; full_name: string; }

export default function ConsultationsPage() {
  const { user, loading } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_id: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Body selector + photo upload state
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState<'injury' | 'existing' | null>(null);
  const [uploadError, setUploadError] = useState('');

  const injuryInputRef  = useRef<HTMLInputElement>(null);
  const existingInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const [c, p] = await Promise.all([
      fetch('/api/admin/consultations').then(r => r.json()),
      fetch('/api/admin/patients').then(r => r.json()),
    ]);
    setConsultations(c); setPatients(p);
  }

  useEffect(() => { if (user) load(); }, [user]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'injury' | 'existing') {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(type);
    setUploadError('');

    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'db-prosthetics/consultations');

    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || data.error) {
        setUploadError(data.error || 'Upload failed');
      } else {
        setPhotos(prev => [...prev, { type, url: data.url }]);
      }
    } catch {
      setUploadError('Upload failed — network error');
    } finally {
      setUploadingPhoto(null);
      // Reset file input so the same file can be selected again
      e.target.value = '';
    }
  }

  function removePhoto(url: string) {
    setPhotos(prev => prev.filter(p => p.url !== url));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true); setError('');
    const r = await fetch('/api/admin/consultations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: parseInt(form.patient_id),
        notes: form.notes,
        body_parts: bodyParts,
        photos,
      }),
    });
    setSubmitting(false);
    if (r.ok) {
      setForm({ patient_id: '', notes: '' });
      setBodyParts([]);
      setPhotos([]);
      setShowForm(false);
      load();
    } else {
      const d = await r.json();
      setError(d.error || 'Failed to save consultation');
    }
  }

  const filtered = consultations.filter(c =>
    c.patient_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.notes || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dash-content">
      <div className="dash-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#7c3aed18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stethoscope size={20} color="#7c3aed" />
          </div>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.75rem', color: 'var(--text-head)', fontWeight: 600 }}>Consultations</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Full doctor-patient communication history</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input className="skeu-input" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32, width: 200, maxWidth: '100%' }} />
          </div>
          <button className="skeu-btn-primary" onClick={() => setShowForm(s => !s)} style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '7px' }}>
            {showForm ? <><X size={15} />Cancel</> : <><Plus size={15} />New Consultation</>}
          </button>
        </div>
      </div>

      {/* New Consultation Form */}
      {showForm && (
        <div className="inline-form-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#7c3aed18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={17} color="#7c3aed" />
            </div>
            <div>
              <h2 className="font-display" style={{ fontSize: '1.15rem', color: 'var(--text-head)', fontWeight: 600 }}>New Consultation</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Conducted by Super Admin</p>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Patient select */}
            <div style={{ marginBottom: '16px' }}>
              <label className="skeu-label">Patient</label>
              <select className="skeu-select" value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })} required>
                <option value="">Select a patient…</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>

            {/* Section A — Body Selector */}
            <div style={{ marginBottom: '20px' }}>
              <label className="skeu-label">Affected Body Area(s)</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Click on the body diagram to mark the affected region(s). For hands and feet, you can also select specific fingers or toes.
              </p>
              <BodySelector value={bodyParts} onChange={setBodyParts} />
            </div>

            {/* Section B — Photo Upload */}
            <div style={{ marginBottom: '20px' }}>
              <label className="skeu-label">Clinical Photos</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Attach photos of the injury/amputation site or an existing limb for reference.
              </p>

              {uploadError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '8px 12px', borderRadius: '7px', marginBottom: '10px', fontSize: '0.82rem' }}>
                  {uploadError}
                </div>
              )}

              {/* Hidden file inputs */}
              <input
                ref={injuryInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handlePhotoUpload(e, 'injury')}
              />
              <input
                ref={existingInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handlePhotoUpload(e, 'existing')}
              />

              {/* Upload buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => injuryInputRef.current?.click()}
                  disabled={uploadingPhoto === 'injury'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '8px',
                    border: '1.5px dashed rgba(208,140,42,0.4)',
                    background: 'rgba(208,140,42,0.05)',
                    color: 'var(--accent, #d08c2a)',
                    fontSize: '0.82rem', fontWeight: 500,
                    cursor: uploadingPhoto === 'injury' ? 'wait' : 'pointer',
                    opacity: uploadingPhoto === 'injury' ? 0.6 : 1,
                  }}
                >
                  <Upload size={13} />
                  {uploadingPhoto === 'injury' ? 'Uploading…' : 'Injury / Amputation Site Photo'}
                </button>
                <button
                  type="button"
                  onClick={() => existingInputRef.current?.click()}
                  disabled={uploadingPhoto === 'existing'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '8px',
                    border: '1.5px dashed rgba(37,79,122,0.3)',
                    background: 'rgba(37,79,122,0.04)',
                    color: 'var(--primary, #254f7a)',
                    fontSize: '0.82rem', fontWeight: 500,
                    cursor: uploadingPhoto === 'existing' ? 'wait' : 'pointer',
                    opacity: uploadingPhoto === 'existing' ? 0.6 : 1,
                  }}
                >
                  <Upload size={13} />
                  {uploadingPhoto === 'existing' ? 'Uploading…' : 'Existing Limb / Reference Photo (optional)'}
                </button>
              </div>

              {/* Photo thumbnails */}
              {photos.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {photos.map((ph, i) => (
                    <div
                      key={i}
                      style={{ position: 'relative', width: 80, height: 80, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-card, #e5e7eb)' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ph.url}
                        alt={ph.type === 'injury' ? 'Injury photo' : 'Reference photo'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        background: 'rgba(0,0,0,0.5)', color: '#fff',
                        fontSize: '0.6rem', textAlign: 'center', padding: '2px 0',
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>
                        {ph.type}
                      </div>
                      <button
                        type="button"
                        onClick={() => removePhoto(ph.url)}
                        style={{
                          position: 'absolute', top: 3, right: 3,
                          background: 'rgba(0,0,0,0.55)', border: 'none',
                          borderRadius: '50%', width: 18, height: 18,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: '#fff',
                        }}
                        aria-label="Remove photo"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section C — Notes */}
            <div style={{ marginBottom: '20px' }}>
              <label className="skeu-label">Consultation Notes</label>
              <textarea
                className="skeu-input"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={5}
                required
                placeholder="Describe findings, recommendations, and next steps…"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="skeu-btn-primary" type="submit" disabled={submitting} style={{ padding: '10px 24px' }}>
                {submitting ? 'Saving…' : 'Save Consultation'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="skeu-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-scroll">
          <table className="dash-table">
            <thead><tr><th>Patient</th><th>Conducted By</th><th>Notes Preview</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No consultations yet.</td></tr>
              ) : filtered.flatMap(c => {
                // Parse JSON fields safely
                const parsedBodyParts: BodyPart[] = (() => {
                  if (!c.body_parts) return [];
                  try { return JSON.parse(c.body_parts); } catch { return []; }
                })();
                const parsedPhotos: PhotoEntry[] = (() => {
                  if (!c.photos) return [];
                  try { return JSON.parse(c.photos); } catch { return []; }
                })();

                const rows: React.ReactElement[] = [(
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                    <td style={{ fontWeight: 600, color: 'var(--text-head)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={12} color="#fff" />
                        </div>
                        {c.patient_name}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', fontWeight: 500, color: c.conducted_by_role === 'super_admin' ? '#7c3aed' : 'var(--primary)' }}>
                        {c.conducted_by_role === 'super_admin' ? 'Super Admin' : (c.doctor_email || 'Doctor')}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', maxWidth: 240 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                        {c.notes ? c.notes.slice(0, 80) + (c.notes.length > 80 ? '…' : '') : '—'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(c.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>{expandedId === c.id ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}</td>
                  </tr>
                )];

                if (expandedId === c.id) {
                  rows.push(
                    <tr key={`${c.id}-exp`}>
                      <td colSpan={5} style={{ padding: 0, background: 'rgba(124,58,237,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <div style={{ padding: '16px 24px 16px 52px' }}>

                          {/* Body parts */}
                          {parsedBodyParts.length > 0 && (
                            <div style={{ marginBottom: '14px' }}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>Affected Areas</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {parsedBodyParts.map((bp: BodyPart) => (
                                  <span
                                    key={bp.region}
                                    style={{
                                      display: 'inline-flex',
                                      padding: '4px 10px',
                                      borderRadius: 20,
                                      background: 'rgba(208,140,42,0.12)',
                                      border: '1px solid rgba(208,140,42,0.3)',
                                      color: 'var(--accent, #d08c2a)',
                                      fontSize: '0.78rem',
                                      fontWeight: 500,
                                    }}
                                  >
                                    {bp.subParts && bp.subParts.length > 0
                                      ? `${bp.label} (${bp.subParts.join(', ')})`
                                      : bp.label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Photos */}
                          {parsedPhotos.length > 0 && (
                            <div style={{ marginBottom: '14px' }}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>Photos</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {parsedPhotos.map((ph: PhotoEntry, i: number) => (
                                  <div key={i} style={{ position: 'relative', width: 72, height: 72, borderRadius: '7px', overflow: 'hidden', border: '1px solid var(--border-card, #e5e7eb)' }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={ph.url} alt={ph.type} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.55rem', textAlign: 'center', padding: '2px 0', textTransform: 'uppercase' }}>
                                      {ph.type}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Full notes */}
                          {c.notes && (
                            <>
                              <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>Full Notes</div>
                              <div style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{c.notes}</div>
                            </>
                          )}
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
