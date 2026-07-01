'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Pencil, Plus, Trash2, Check, X, Camera, Save, ExternalLink, Layout } from 'lucide-react';
import DBLogo from '@/components/ui/DBLogo';

/* ─── types ─── */
interface ServiceCard  { title: string; description: string; }
interface PortfolioCard { cat: string; label: string; sub: string; image_url: string; }
interface TeamMember   { id?: number; name: string; position: string; bio: string; photo_url: string; display_order?: number; }
interface SiteContent {
  hero_badge: string; hero_heading: string; hero_subheading: string;
  hero_cta_primary: string; hero_cta_secondary: string; hero_image_url: string;
  services: ServiceCard[]; portfolio: PortfolioCard[];
  cta_heading: string; cta_subtext: string;
}

const DEFAULT: SiteContent = {
  hero_badge: 'Certified Prosthetics & Orthotics · Nigeria',
  hero_heading: 'Restoring Movement. Rebuilding Lives.',
  hero_subheading: 'DB Prosthetics and Orthotics Ltd delivers precision prosthetic and orthotic solutions across Nigeria.',
  hero_cta_primary: 'Book a Consultation',
  hero_cta_secondary: 'For Healthcare Providers',
  hero_image_url: '',
  services: [],
  portfolio: [],
  cta_heading: 'Ready to Begin Your Journey?',
  cta_subtext: 'Book a consultation — at a partnered hospital near you, or request a specialist home visit.',
};

/* ─── editable section wrapper ─── */
function EditSection({
  label, editing, onEdit, onSave, onCancel, saving, children, editForm,
}: {
  label: string; editing: boolean; onEdit: () => void; onSave: () => void;
  onCancel: () => void; saving: boolean; children: React.ReactNode; editForm: React.ReactNode;
}) {
  return (
    <div style={{ position: 'relative', marginBottom: 0 }}>
      {/* Hover wrapper */}
      <div
        className="edit-section-wrap"
        style={{
          position: 'relative',
          outline: editing ? '2px solid var(--accent)' : '2px solid transparent',
          transition: 'outline 0.15s',
          borderRadius: 4,
        }}
      >
        {children}
        {/* Edit button (top-right of section) */}
        {!editing && (
          <button
            onClick={onEdit}
            className="edit-section-btn"
            style={{
              position: 'absolute', top: 12, right: 12,
              background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', fontSize: '0.78rem', fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)', zIndex: 10,
            }}
          >
            <Pencil size={13} /> Edit {label}
          </button>
        )}
      </div>

      {/* Inline edit form (slides in below section) */}
      {editing && (
        <div style={{
          background: '#fff', border: '2px solid var(--accent)',
          borderTop: 'none', borderRadius: '0 0 12px 12px',
          padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-head)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Editing: {label}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={onSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                <Save size={14} />{saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
          {editForm}
        </div>
      )}
    </div>
  );
}

/* ─── image upload helper ─── */
function ImageUploader({ value, onChange, folder, label }: { value: string; onChange: (url: string) => void; folder: string; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    const r = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const d = await r.json();
    setUploading(false);
    if (d.url) onChange(d.url);
  }

  return (
    <div>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {value && (
          <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-card)', flexShrink: 0 }}>
            <Image src={value} alt="" width={80} height={80} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
          </div>
        )}
        <input ref={ref} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '8px', border: '1px dashed var(--accent)', background: 'rgba(181,117,31,0.06)', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}
        >
          <Camera size={15} /> {uploading ? 'Uploading…' : value ? 'Change Image' : 'Upload Image'}
        </button>
        {value && (
          <button type="button" onClick={() => onChange('')} style={{ fontSize: '0.78rem', color: '#b91c1c', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
        )}
      </div>
    </div>
  );
}

/* ─── main page ─── */
export default function LandingEditorPage() {
  const { user, loading } = useAuth();
  const [content, setContent] = useState<SiteContent>(DEFAULT);
  const [draft, setDraft] = useState<SiteContent>(DEFAULT);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Team state (separate from site_content — stored in team_members table)
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [teamDraft, setTeamDraft] = useState<TeamMember[]>([]);
  const [savingTeam, setSavingTeam] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch('/api/admin/site-content').then(r => r.json()).then((d: Record<string, string>) => {
      const parsed: SiteContent = {
        hero_badge:        d.hero_badge        || DEFAULT.hero_badge,
        hero_heading:      d.hero_heading      || DEFAULT.hero_heading,
        hero_subheading:   d.hero_subheading   || DEFAULT.hero_subheading,
        hero_cta_primary:  d.hero_cta_primary  || DEFAULT.hero_cta_primary,
        hero_cta_secondary: d.hero_cta_secondary || DEFAULT.hero_cta_secondary,
        hero_image_url:    d.hero_image_url    || '',
        services:   JSON.parse(d.services  || '[]'),
        portfolio:  JSON.parse(d.portfolio || '[]'),
        cta_heading: d.cta_heading || DEFAULT.cta_heading,
        cta_subtext: d.cta_subtext || DEFAULT.cta_subtext,
      };
      setContent(parsed);
      setDraft(parsed);
    });
    fetch('/api/admin/team').then(r => r.json()).then(d => {
      setTeam(d.members || []);
      setTeamDraft(d.members || []);
    });
  }, [user]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  function startEdit(section: string) {
    setDraft({ ...content }); // reset draft to current saved content
    setEditing(section);
  }
  function cancelEdit() { setEditing(null); }

  async function saveSection(section: string, updates: Partial<SiteContent>) {
    setSaving(true);
    const toSave: Record<string, string> = {};
    for (const [k, v] of Object.entries(updates)) {
      toSave[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }
    await fetch('/api/admin/site-content', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSave),
    });
    setContent(prev => ({ ...prev, ...updates }));
    setSaving(false);
    setEditing(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function saveTeam() {
    setSavingTeam(true);
    // Delete removed members
    const removedIds = team
      .filter(m => m.id && !teamDraft.find(d => d.id === m.id))
      .map(m => m.id!);
    for (const id of removedIds) {
      await fetch('/api/admin/team', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    }
    // Update existing / insert new
    for (let i = 0; i < teamDraft.length; i++) {
      const m = { ...teamDraft[i], display_order: i };
      if (m.id) {
        await fetch('/api/admin/team', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(m) });
      } else {
        const res = await fetch('/api/admin/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(m) });
        const data = await res.json();
        teamDraft[i] = { ...m, id: data.id };
      }
    }
    setTeam([...teamDraft]);
    setSavingTeam(false);
    setEditing(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const d = draft; // shorthand

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>

      {/* Editor top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: 'var(--primary)', color: '#fff',
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Layout size={18} color="var(--accent)" />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Landing Page Editor</span>
          {saved && <span style={{ fontSize: '0.78rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={13} /> Saved</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)' }}>Hover a section to edit</span>
          <a href="/" target="_blank" rel="noopener" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '7px', background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 500 }}>
            <ExternalLink size={13} /> Preview Live
          </a>
        </div>
      </div>

      {/* ── HERO SECTION ── */}
      <EditSection
        label="Hero"
        editing={editing === 'hero'}
        onEdit={() => startEdit('hero')}
        onSave={() => saveSection('hero', { hero_badge: d.hero_badge, hero_heading: d.hero_heading, hero_subheading: d.hero_subheading, hero_cta_primary: d.hero_cta_primary, hero_cta_secondary: d.hero_cta_secondary, hero_image_url: d.hero_image_url })}
        onCancel={cancelEdit}
        saving={saving}
        editForm={
          <div style={{ display: 'grid', gap: '16px' }}>
            <div className="form-grid-2">
              <div>
                <label className="skeu-label">Badge Text</label>
                <input className="skeu-input" value={d.hero_badge} onChange={e => setDraft({ ...d, hero_badge: e.target.value })} />
              </div>
              <div>
                <label className="skeu-label">Primary CTA Button</label>
                <input className="skeu-input" value={d.hero_cta_primary} onChange={e => setDraft({ ...d, hero_cta_primary: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="skeu-label">Main Heading</label>
              <input className="skeu-input" value={d.hero_heading} onChange={e => setDraft({ ...d, hero_heading: e.target.value })} />
            </div>
            <div>
              <label className="skeu-label">Subheading</label>
              <textarea className="skeu-input" value={d.hero_subheading} onChange={e => setDraft({ ...d, hero_subheading: e.target.value })} rows={3} style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label className="skeu-label">Secondary CTA Button</label>
              <input className="skeu-input" value={d.hero_cta_secondary} onChange={e => setDraft({ ...d, hero_cta_secondary: e.target.value })} />
            </div>
            <ImageUploader value={d.hero_image_url} onChange={url => setDraft({ ...d, hero_image_url: url })} folder="db-prosthetics/hero" label="Hero Image (shown in the card on the right)" />
          </div>
        }
      >
        {/* Hero visual (matches landing page exactly) */}
        <section style={{ background: 'linear-gradient(160deg, #0f2438 0%, #1b3d5e 50%, #1e4a72 100%)', padding: '80px 24px 60px', position: 'relative' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '48px', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div className="skeu-badge" style={{ display: 'inline-flex', marginBottom: '20px' }}>{content.hero_badge}</div>
              <h1 className="font-display" style={{ fontSize: 'clamp(2rem,4vw,3.5rem)', fontWeight: 600, color: '#f0ece4', lineHeight: 1.15, marginBottom: '20px' }}>
                {(() => {
                  const dot = content.hero_heading.indexOf('. ');
                  if (dot === -1) return content.hero_heading;
                  return <>{content.hero_heading.slice(0, dot + 1)} <em style={{ color: '#d08c2a', fontStyle: 'italic' }}>{content.hero_heading.slice(dot + 2)}</em></>;
                })()}
              </h1>
              <p style={{ color: 'rgba(240,236,228,0.75)', fontSize: '1rem', lineHeight: 1.75, maxWidth: 480, marginBottom: '28px' }}>
                {content.hero_subheading}
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
                <span className="skeu-btn-accent">{content.hero_cta_primary}</span>
                <span className="skeu-btn-ghost">{content.hero_cta_secondary}</span>
              </div>
              {/* Trust indicators */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '28px' }}>
                {[['Certified','P&O Organisation'],['All 36','States Coverage'],['Hospital &','Home Visits']].map(([top,bot]) => (
                  <div key={top}>
                    <div className="font-display" style={{ color: '#d08c2a', fontSize: '1rem', fontWeight: 600 }}>{top}</div>
                    <div style={{ color: 'rgba(240,236,228,0.5)', fontSize: '0.75rem', letterSpacing: '0.04em' }}>{bot}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flexShrink: 0, width: 280, height: 340, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '12px 16px 40px rgba(0,0,0,0.6)', position: 'relative' }}>
              {content.hero_image_url
                ? <Image src={content.hero_image_url} alt="Hero" fill style={{ objectFit: 'cover' }} />
                : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg, #1e4a72 0%, #0f2438 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
                    <DBLogo size={56} />
                    <p className="font-display" style={{ color: 'rgba(240,236,228,0.4)', fontSize: '0.85rem', textAlign: 'center', lineHeight: 1.6 }}>
                      Prosthetic portfolio photography<br />will be placed here
                    </p>
                  </div>
                )
              }
              {/* Overlay badge */}
              <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14, background: 'rgba(15,36,56,0.85)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ color: '#d08c2a', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>What we offer</div>
                <div style={{ color: '#f0ece4', fontSize: '0.82rem', marginTop: 3 }}>Upper limb · Lower limb · Spinal · Facial</div>
              </div>
            </div>
          </div>
        </section>
      </EditSection>

      {/* ── SERVICES SECTION ── */}
      <EditSection
        label="Services"
        editing={editing === 'services'}
        onEdit={() => startEdit('services')}
        onSave={() => saveSection('services', { services: d.services })}
        onCancel={cancelEdit}
        saving={saving}
        editForm={
          <div>
            {d.services.map((s, i) => (
              <div key={i} style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 10, padding: '16px', marginBottom: '12px', border: '1px solid rgba(0,0,0,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>Service {i + 1}</span>
                  <button onClick={() => setDraft({ ...d, services: d.services.filter((_, j) => j !== i) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem' }}>
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label className="skeu-label">Title</label>
                  <input className="skeu-input" value={s.title} onChange={e => { const sv = [...d.services]; sv[i] = { ...sv[i], title: e.target.value }; setDraft({ ...d, services: sv }); }} />
                </div>
                <div>
                  <label className="skeu-label">Description</label>
                  <textarea className="skeu-input" value={s.description} onChange={e => { const sv = [...d.services]; sv[i] = { ...sv[i], description: e.target.value }; setDraft({ ...d, services: sv }); }} rows={2} style={{ resize: 'vertical' }} />
                </div>
              </div>
            ))}
            <button
              onClick={() => setDraft({ ...d, services: [...d.services, { title: 'New Service', description: 'Describe this service here.' }] })}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 18px', borderRadius: '8px', border: '1px dashed var(--accent)', background: 'rgba(181,117,31,0.06)', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, width: '100%', justifyContent: 'center', marginTop: '4px' }}
            >
              <Plus size={15} /> Add Service Card
            </button>
          </div>
        }
      >
        <section style={{ background: 'var(--bg-base)', padding: '60px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div className="skeu-badge" style={{ display: 'inline-flex', marginBottom: '12px' }}>What We Do</div>
              <h2 className="font-display" style={{ fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 600, color: 'var(--text-head)' }}>Comprehensive P&O Care</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
              {content.services.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '2px dashed var(--border-card)', borderRadius: 12 }}>
                  No services yet. Click "Edit Services" to add them.
                </div>
              ) : content.services.map((s, i) => (
                <div key={i} className="skeu-card" style={{ padding: '32px 28px', cursor: 'default' }}>
                  <div className="skeu-icon-well" style={{ marginBottom: '20px', color: 'var(--primary)' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <h3 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: '10px' }}>{s.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.75 }}>{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </EditSection>

      {/* ── PORTFOLIO SECTION ── */}
      <EditSection
        label="Portfolio"
        editing={editing === 'portfolio'}
        onEdit={() => startEdit('portfolio')}
        onSave={() => saveSection('portfolio', { portfolio: d.portfolio })}
        onCancel={cancelEdit}
        saving={saving}
        editForm={
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              {d.portfolio.map((p, i) => (
                <div key={i} style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 10, padding: '16px', border: '1px solid rgba(0,0,0,0.07)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>Item {i + 1}</span>
                    <button onClick={() => setDraft({ ...d, portfolio: d.portfolio.filter((_, j) => j !== i) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <label className="skeu-label">Category</label>
                    <input className="skeu-input" value={p.cat} onChange={e => { const pv = [...d.portfolio]; pv[i] = { ...pv[i], cat: e.target.value }; setDraft({ ...d, portfolio: pv }); }} placeholder="e.g. Lower Limb" />
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <label className="skeu-label">Title</label>
                    <input className="skeu-input" value={p.label} onChange={e => { const pv = [...d.portfolio]; pv[i] = { ...pv[i], label: e.target.value }; setDraft({ ...d, portfolio: pv }); }} />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label className="skeu-label">Subtitle</label>
                    <input className="skeu-input" value={p.sub} onChange={e => { const pv = [...d.portfolio]; pv[i] = { ...pv[i], sub: e.target.value }; setDraft({ ...d, portfolio: pv }); }} />
                  </div>
                  <ImageUploader
                    value={p.image_url}
                    onChange={url => { const pv = [...d.portfolio]; pv[i] = { ...pv[i], image_url: url }; setDraft({ ...d, portfolio: pv }); }}
                    folder="db-prosthetics/portfolio"
                    label="Photo"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => setDraft({ ...d, portfolio: [...d.portfolio, { cat: 'Category', label: 'New Case', sub: 'Description', image_url: '' }] })}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 18px', borderRadius: '8px', border: '1px dashed var(--accent)', background: 'rgba(181,117,31,0.06)', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, width: '100%', justifyContent: 'center' }}
            >
              <Plus size={15} /> Add Portfolio Item
            </button>
          </div>
        }
      >
        <section style={{ background: 'var(--bg-base)', padding: '60px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ marginBottom: '36px' }}>
              <div className="skeu-badge" style={{ display: 'inline-flex', marginBottom: '10px' }}>Our Work</div>
              <h2 className="font-display" style={{ fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 600, color: 'var(--text-head)' }}>Cases & Results</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
              {content.portfolio.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '2px dashed var(--border-card)', borderRadius: 12 }}>
                  No portfolio items. Click "Edit Portfolio" to add them.
                </div>
              ) : content.portfolio.map((p, i) => (
                <div key={i} className="skeu-card" style={{ padding: 0, overflow: 'hidden', cursor: 'default' }}>
                  <div style={{ height: 180, background: `linear-gradient(135deg, hsl(${210 + i * 15},35%,22%) 0%, hsl(${215 + i * 10},40%,28%) 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    {p.image_url
                      ? <Image src={p.image_url} alt={p.label} fill style={{ objectFit: 'cover' }} />
                      : <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                    }
                  </div>
                  <div style={{ padding: '18px 20px' }}>
                    <span style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '5px' }}>{p.cat}</span>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: '3px' }}>{p.label}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </EditSection>

      {/* ── TEAM SECTION ── */}
      <EditSection
        label="Team"
        editing={editing === 'team'}
        onEdit={() => { setTeamDraft([...team]); setEditing('team'); }}
        onSave={saveTeam}
        onCancel={() => setEditing(null)}
        saving={savingTeam}
        editForm={
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              {teamDraft.map((m, i) => (
                <div key={i} style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 10, padding: '16px', border: '1px solid rgba(0,0,0,0.07)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>Member {i + 1}</span>
                    <button onClick={() => setTeamDraft(teamDraft.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <label className="skeu-label">Full Name</label>
                    <input className="skeu-input" value={m.name} onChange={e => { const t = [...teamDraft]; t[i] = { ...t[i], name: e.target.value }; setTeamDraft(t); }} placeholder="e.g. Dr. Amaka Okafor" />
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <label className="skeu-label">Position / Title</label>
                    <input className="skeu-input" value={m.position} onChange={e => { const t = [...teamDraft]; t[i] = { ...t[i], position: e.target.value }; setTeamDraft(t); }} placeholder="e.g. Lead P&O Specialist" />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label className="skeu-label">Bio (optional)</label>
                    <textarea className="skeu-input" value={m.bio} onChange={e => { const t = [...teamDraft]; t[i] = { ...t[i], bio: e.target.value }; setTeamDraft(t); }} rows={2} style={{ resize: 'vertical' }} />
                  </div>
                  <ImageUploader
                    value={m.photo_url}
                    onChange={url => { const t = [...teamDraft]; t[i] = { ...t[i], photo_url: url }; setTeamDraft(t); }}
                    folder="db-prosthetics/team"
                    label="Photo"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => setTeamDraft([...teamDraft, { name: '', position: '', bio: '', photo_url: '' }])}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 18px', borderRadius: '8px', border: '1px dashed var(--accent)', background: 'rgba(181,117,31,0.06)', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, width: '100%', justifyContent: 'center' }}
            >
              <Plus size={15} /> Add Team Member
            </button>
          </div>
        }
      >
        <section style={{ background: 'var(--bg-base)', padding: '60px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div className="skeu-badge" style={{ display: 'inline-flex', marginBottom: '12px' }}>The People</div>
              <h2 className="font-display" style={{ fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 600, color: 'var(--text-head)' }}>Our Specialists</h2>
            </div>
            {team.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', border: '2px dashed var(--border-card)', borderRadius: 12 }}>
                No team members yet. Click "Edit Team" to add specialists.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
                {team.map((m, i) => (
                  <div key={m.id ?? i} className="skeu-card" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: 88, height: 88, borderRadius: '50%', overflow: 'hidden', marginBottom: 16, border: '3px solid rgba(255,255,255,0.8)', boxShadow: '4px 4px 12px #c9c4bb, -4px -4px 12px #fff', flexShrink: 0, position: 'relative', background: 'linear-gradient(145deg,#254f7a,#1b3d5e)' }}>
                      {m.photo_url
                        ? <Image src={m.photo_url} alt={m.name} fill style={{ objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(240,236,228,0.6)', fontSize: '2rem', fontFamily: 'Cormorant Garamond, serif', fontWeight: 600 }}>{m.name.charAt(0) || '?'}</div>
                      }
                    </div>
                    <h3 className="font-display font-semibold" style={{ fontSize: '1.1rem', color: 'var(--text-head)', marginBottom: 3 }}>{m.name || 'Name'}</h3>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>{m.position || 'Position'}</p>
                    {m.bio && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>{m.bio}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </EditSection>

      {/* ── CTA SECTION ── */}
      <EditSection
        label="CTA Banner"
        editing={editing === 'cta'}
        onEdit={() => startEdit('cta')}
        onSave={() => saveSection('cta', { cta_heading: d.cta_heading, cta_subtext: d.cta_subtext })}
        onCancel={cancelEdit}
        saving={saving}
        editForm={
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label className="skeu-label">Heading</label>
              <input className="skeu-input" value={d.cta_heading} onChange={e => setDraft({ ...d, cta_heading: e.target.value })} />
            </div>
            <div>
              <label className="skeu-label">Subtext</label>
              <textarea className="skeu-input" value={d.cta_subtext} onChange={e => setDraft({ ...d, cta_subtext: e.target.value })} rows={2} style={{ resize: 'vertical' }} />
            </div>
          </div>
        }
      >
        <section className="section-dark" style={{ padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 600, color: '#f0ece4', marginBottom: '14px' }}>
              {content.cta_heading}
            </h2>
            <p style={{ color: 'rgba(240,236,228,0.65)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '32px' }}>
              {content.cta_subtext}
            </p>
            <span className="skeu-btn-accent">Book a Consultation</span>
          </div>
        </section>
      </EditSection>

    </div>
  );
}
