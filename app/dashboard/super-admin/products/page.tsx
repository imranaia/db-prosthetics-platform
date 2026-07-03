'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState, useRef } from 'react';
import { Package, Plus, X, Pencil, Trash2, Check, Upload, Layers } from 'lucide-react';

interface Product {
  id: number; name: string; category: string; type: string;
  price: number; description: string; image_url: string | null;
  dimensions: string | null; material: string | null;
  in_stock: number; quantity: number; created_at: string;
}

interface Material {
  id: number; name: string; description: string | null; in_stock: number;
}

const CAT: Record<string, string> = { upper_limb: 'Upper Limb', lower_limb: 'Lower Limb', facial: 'Facial', spinal: 'Spinal' };
const TYP: Record<string, string> = { complete: 'Complete Device', part: 'Part / Component' };

const EMPTY_PRODUCT = { name: '', category: '', type: '', price: '', description: '', in_stock: true, image_url: '', dimensions: '', material: '', quantity: '0' };
const EMPTY_MATERIAL = { name: '', description: '', in_stock: true };

function fmt(kobo: number) {
  return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 });
}

export default function ProductsPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'materials'>('products');

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<Partial<Product & { priceNaira: string; quantity: number }>>({});
  const [uploadingImg, setUploadingImg] = useState(false);
  const [editUploadingImg, setEditUploadingImg] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const editImgInputRef = useRef<HTMLInputElement>(null);

  // Materials state
  const [materials, setMaterials] = useState<Material[]>([]);
  const [matForm, setMatForm] = useState(EMPTY_MATERIAL);
  const [matSubmitting, setMatSubmitting] = useState(false);
  const [matError, setMatError] = useState('');
  const [showMatForm, setShowMatForm] = useState(false);
  const [matEditId, setMatEditId] = useState<number | null>(null);
  const [matEditRow, setMatEditRow] = useState<Partial<Material>>({});

  async function loadProducts() {
    const r = await fetch('/api/admin/products');
    if (r.ok) setProducts(await r.json());
  }
  async function loadMaterials() {
    const r = await fetch('/api/admin/materials');
    if (r.ok) setMaterials(await r.json());
  }

  useEffect(() => {
    if (!user || loading) return;
    loadProducts();
    loadMaterials();
  }, [user, loading]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  // ── Product image upload ──
  async function handleImgUpload(e: React.ChangeEvent<HTMLInputElement>, isEdit = false) {
    const file = e.target.files?.[0];
    if (!file) return;
    isEdit ? setEditUploadingImg(true) : setUploadingImg(true);
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.url) {
      if (isEdit) setEditRow(prev => ({ ...prev, image_url: data.url }));
      else setForm(prev => ({ ...prev, image_url: data.url }));
    }
    isEdit ? setEditUploadingImg(false) : setUploadingImg(false);
    e.target.value = '';
  }

  // ── Products CRUD ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true); setError('');
    const r = await fetch('/api/admin/products', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name, category: form.category, type: form.type,
        price: parseFloat(form.price), description: form.description,
        in_stock: form.in_stock ? 1 : 0,
        image_url: form.image_url || undefined,
        dimensions: form.dimensions || undefined,
        material: form.material || undefined,
        quantity: parseInt(form.quantity) || 0,
      }),
    });
    setSubmitting(false);
    if (r.ok) { setForm(EMPTY_PRODUCT); setShowForm(false); loadProducts(); }
    else { const d = await r.json(); setError(d.error || 'Failed'); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    loadProducts();
  }

  function startEdit(p: Product) {
    setEditId(p.id);
    setEditRow({ ...p, priceNaira: (p.price / 100).toString(), quantity: p.quantity ?? 0 });
  }

  async function saveEdit() {
    if (editId == null) return;
    await fetch(`/api/admin/products/${editId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editRow.name, category: editRow.category, type: editRow.type,
        price: parseFloat(editRow.priceNaira || '0'), description: editRow.description,
        in_stock: editRow.in_stock, image_url: editRow.image_url ?? null,
        dimensions: editRow.dimensions, material: editRow.material,
        quantity: editRow.quantity ?? 0,
      }),
    });
    setEditId(null); setEditRow({}); loadProducts();
  }

  // ── Materials CRUD ──
  async function handleMatSubmit(e: React.FormEvent) {
    e.preventDefault(); setMatSubmitting(true); setMatError('');
    const r = await fetch('/api/admin/materials', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: matForm.name, description: matForm.description || undefined, in_stock: matForm.in_stock ? 1 : 0 }),
    });
    setMatSubmitting(false);
    if (r.ok) { setMatForm(EMPTY_MATERIAL); setShowMatForm(false); loadMaterials(); }
    else { const d = await r.json(); setMatError(d.error || 'Failed'); }
  }

  async function saveMatEdit() {
    if (!matEditId) return;
    await fetch('/api/admin/materials', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: matEditId, name: matEditRow.name, description: matEditRow.description, in_stock: matEditRow.in_stock }),
    });
    setMatEditId(null); setMatEditRow({}); loadMaterials();
  }

  async function deleteMaterial(id: number) {
    if (!confirm('Delete this material?')) return;
    await fetch('/api/admin/materials', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    loadMaterials();
  }

  return (
    <div className="dash-content">
      <div className="dash-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#05966918', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={20} color="#059669" />
          </div>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.75rem', color: 'var(--text-head)', fontWeight: 600 }}>Products & Materials</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{products.length} products · {materials.length} materials</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, margin: '20px 0', borderBottom: '2px solid var(--border-card)' }}>
        {(['products', 'materials'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 22px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
            border: 'none', background: 'transparent',
            color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: -2, display: 'flex', alignItems: 'center', gap: 7,
          }}>
            {tab === 'products' ? <><Package size={15} />Products</> : <><Layers size={15} />Materials</>}
          </button>
        ))}
      </div>

      {/* ── PRODUCTS TAB ── */}
      {activeTab === 'products' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="skeu-btn-primary" onClick={() => setShowForm(s => !s)} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 7 }}>
              {showForm ? <><X size={15} />Cancel</> : <><Plus size={15} />Add Product</>}
            </button>
          </div>

          {showForm && (
            <div className="skeu-card" style={{ padding: 24, marginBottom: 24 }}>
              <h2 className="font-display" style={{ fontSize: '1.1rem', color: 'var(--text-head)', marginBottom: 20, fontWeight: 600 }}>New Product</h2>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem' }}>{error}</div>}
              <form onSubmit={handleSubmit}>
                {/* Image upload */}
                <div style={{ marginBottom: 18 }}>
                  <label className="skeu-label" style={{ display: 'block', marginBottom: 8 }}>Product Image</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {form.image_url ? (
                      <div style={{ position: 'relative', width: 100, height: 100, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-card)', flexShrink: 0 }}>
                        <img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => setForm(p => ({ ...p, image_url: '' }))}
                          style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                          <X size={11} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ width: 100, height: 100, borderRadius: 8, border: '2px dashed var(--border-card)', background: 'rgba(27,61,94,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Package size={28} color="var(--text-muted)" />
                      </div>
                    )}
                    <div>
                      <button type="button" onClick={() => imgInputRef.current?.click()} disabled={uploadingImg}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border-card)', background: 'var(--bg-base)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-body)' }}>
                        <Upload size={14} /> {uploadingImg ? 'Uploading…' : 'Upload Image'}
                      </button>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>JPG, PNG, or WebP. Shows on product cards.</div>
                    </div>
                    <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImgUpload(e, false)} />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="skeu-label">Product Name</label>
                  <input className="skeu-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Transtibial Prosthesis" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label className="skeu-label">Category</label>
                    <select className="skeu-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                      <option value="">Select category</option>
                      {Object.entries(CAT).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="skeu-label">Type</label>
                    <select className="skeu-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required>
                      <option value="">Select type</option>
                      {Object.entries(TYP).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="skeu-label">Price (₦)</label>
                    <input className="skeu-input" type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required placeholder="0.00" />
                  </div>
                  <div>
                    <label className="skeu-label">Dimensions / Size</label>
                    <input className="skeu-input" value={form.dimensions} onChange={e => setForm({ ...form, dimensions: e.target.value })} placeholder="e.g. 28 cm, 200–300 mm" />
                  </div>
                  <div>
                    <label className="skeu-label">Material</label>
                    <input className="skeu-input" value={form.material} onChange={e => setForm({ ...form, material: e.target.value })} placeholder="e.g. Carbon Fibre, Titanium" />
                  </div>
                  <div>
                    <label className="skeu-label">Units Available</label>
                    <input className="skeu-input" type="number" min="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="0" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-body)', userSelect: 'none' }}>
                      <input type="checkbox" checked={form.in_stock} onChange={e => setForm({ ...form, in_stock: e.target.checked })} style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                      In Stock
                    </label>
                  </div>
                </div>
                <div>
                  <label className="skeu-label">Description</label>
                  <textarea className="skeu-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Brief product description…" style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <button className="skeu-btn-primary" type="submit" disabled={submitting} style={{ padding: '10px 24px' }}>{submitting ? 'Creating…' : 'Create Product'}</button>
                  <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Products grid */}
          {products.length === 0 ? (
            <div className="skeu-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>No products yet. Add your first above.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {products.map(p => (
                <div key={p.id} className="skeu-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {editId === p.id ? (
                    <div style={{ padding: 18 }}>
                      {/* Edit: image upload */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          {editRow.image_url ? (
                            <div style={{ position: 'relative', width: 70, height: 70, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-card)', flexShrink: 0 }}>
                              <img src={editRow.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button type="button" onClick={() => setEditRow(p => ({ ...p, image_url: null }))}
                                style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                                <X size={9} />
                              </button>
                            </div>
                          ) : <div style={{ width: 70, height: 70, borderRadius: 6, border: '2px dashed var(--border-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Package size={20} color="var(--text-muted)" /></div>}
                          <button type="button" onClick={() => editImgInputRef.current?.click()} disabled={editUploadingImg}
                            style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid var(--border-card)', background: 'var(--bg-base)', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-body)' }}>
                            <Upload size={12} />{editUploadingImg ? 'Uploading…' : 'Change Image'}
                          </button>
                          <input ref={editImgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImgUpload(e, true)} />
                        </div>
                      </div>
                      <input className="skeu-input" value={editRow.name ?? ''} onChange={e => setEditRow({ ...editRow, name: e.target.value })} style={{ marginBottom: 8, fontSize: '0.85rem' }} placeholder="Name" />
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 8 }}>
                        <select className="skeu-select" value={editRow.category ?? ''} onChange={e => setEditRow({ ...editRow, category: e.target.value })} style={{ fontSize: '0.82rem' }}>
                          {Object.entries(CAT).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                        <select className="skeu-select" value={editRow.type ?? ''} onChange={e => setEditRow({ ...editRow, type: e.target.value })} style={{ fontSize: '0.82rem' }}>
                          {Object.entries(TYP).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                        <input className="skeu-input" type="number" min="0" step="0.01" value={editRow.priceNaira ?? ''} onChange={e => setEditRow({ ...editRow, priceNaira: e.target.value })} style={{ fontSize: '0.82rem' }} placeholder="Price (₦)" />
                        <input className="skeu-input" value={editRow.dimensions ?? ''} onChange={e => setEditRow({ ...editRow, dimensions: e.target.value })} style={{ fontSize: '0.82rem' }} placeholder="Dimensions" />
                        <input className="skeu-input" value={editRow.material ?? ''} onChange={e => setEditRow({ ...editRow, material: e.target.value })} style={{ fontSize: '0.82rem' }} placeholder="Material" />
                        <input className="skeu-input" type="number" min="0" value={editRow.quantity ?? 0} onChange={e => setEditRow({ ...editRow, quantity: parseInt(e.target.value) || 0 })} style={{ fontSize: '0.82rem' }} placeholder="Units Available" />
                        <select className="skeu-select" value={editRow.in_stock ?? 1} onChange={e => setEditRow({ ...editRow, in_stock: parseInt(e.target.value) })} style={{ fontSize: '0.82rem' }}>
                          <option value={1}>In Stock</option><option value={0}>Out of Stock</option>
                        </select>
                      </div>
                      <textarea className="skeu-input" value={editRow.description ?? ''} onChange={e => setEditRow({ ...editRow, description: e.target.value })} style={{ fontSize: '0.82rem', resize: 'vertical', marginBottom: 10 }} rows={2} placeholder="Description" />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={saveEdit} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px', borderRadius: 7, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}><Check size={13} />Save</button>
                        <button onClick={() => { setEditId(null); setEditRow({}); }} style={{ flex: 1, padding: '8px', borderRadius: 7, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} style={{ width: '100%', height: 150, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: 90, background: 'rgba(27,61,94,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={30} color="var(--text-muted)" />
                        </div>
                      )}
                      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-head)', marginBottom: 4 }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'capitalize' }}>
                          {CAT[p.category] ?? p.category} · {TYP[p.type] ?? p.type}
                        </div>
                        {p.material && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Material: <strong style={{ color: 'var(--text-body)' }}>{p.material}</strong></div>}
                        {p.dimensions && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>Size: {p.dimensions}</div>}
                        {p.description && <div style={{ fontSize: '0.78rem', color: 'var(--text-body)', lineHeight: 1.5, marginBottom: 8 }}>{p.description}</div>}
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                          {(p.quantity ?? 0) > 0 ? `${p.quantity} units` : <span style={{ color: '#b45309' }}>Out of Stock (Order Available)</span>}
                        </div>
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border-card)' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{fmt(p.price)}</span>
                          <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, background: p.in_stock ? '#d1fae5' : '#fee2e2', color: p.in_stock ? '#065f46' : '#b91c1c' }}>
                            {p.in_stock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          <button onClick={() => startEdit(p)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px', borderRadius: 7, border: '1px solid rgba(27,61,94,0.2)', background: 'rgba(27,61,94,0.07)', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}><Pencil size={12} />Edit</button>
                          <button onClick={() => handleDelete(p.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px', borderRadius: 7, border: '1px solid rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.07)', color: '#b91c1c', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}><Trash2 size={12} />Delete</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── MATERIALS TAB ── */}
      {activeTab === 'materials' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="skeu-btn-primary" onClick={() => setShowMatForm(s => !s)} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 7 }}>
              {showMatForm ? <><X size={15} />Cancel</> : <><Plus size={15} />Add Material</>}
            </button>
          </div>

          {showMatForm && (
            <div className="skeu-card" style={{ padding: 24, marginBottom: 24 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 16 }}>New Material</h2>
              {matError && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: '0.85rem' }}>{matError}</div>}
              <form onSubmit={handleMatSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Material Name <span style={{ color: '#dc2626' }}>*</span></label>
                    <input className="skeu-input" value={matForm.name} onChange={e => setMatForm({ ...matForm, name: e.target.value })} required placeholder="e.g. Carbon Fibre, Titanium, Silicone" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-body)', userSelect: 'none' }}>
                      <input type="checkbox" checked={matForm.in_stock} onChange={e => setMatForm({ ...matForm, in_stock: e.target.checked })} style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                      Currently in stock / available
                    </label>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Description (optional)</label>
                  <textarea className="skeu-input" value={matForm.description} onChange={e => setMatForm({ ...matForm, description: e.target.value })} rows={2} placeholder="Brief description of the material and its typical use…" style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="skeu-btn-primary" type="submit" disabled={matSubmitting} style={{ padding: '10px 24px' }}>{matSubmitting ? 'Saving…' : 'Add Material'}</button>
                  <button type="button" onClick={() => setShowMatForm(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {materials.length === 0 ? (
            <div className="skeu-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>No materials added yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {materials.map(m => (
                <div key={m.id} className="skeu-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  {matEditId === m.id ? (
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                      <input className="skeu-input" value={matEditRow.name ?? ''} onChange={e => setMatEditRow({ ...matEditRow, name: e.target.value })} placeholder="Name" style={{ fontSize: '0.88rem' }} />
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-body)', userSelect: 'none' }}>
                          <input type="checkbox" checked={!!matEditRow.in_stock} onChange={e => setMatEditRow({ ...matEditRow, in_stock: e.target.checked ? 1 : 0 })} style={{ width: 15, height: 15, accentColor: 'var(--primary)' }} />
                          In Stock
                        </label>
                      </div>
                      <input className="skeu-input" value={matEditRow.description ?? ''} onChange={e => setMatEditRow({ ...matEditRow, description: e.target.value })} placeholder="Description" style={{ fontSize: '0.88rem', gridColumn: '1 / -1' }} />
                      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
                        <button onClick={saveMatEdit} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 7, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}><Check size={13} />Save</button>
                        <button onClick={() => { setMatEditId(null); setMatEditRow({}); }} style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-head)' }}>{m.name}</span>
                          <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, background: m.in_stock ? '#d1fae5' : '#fee2e2', color: m.in_stock ? '#065f46' : '#b91c1c' }}>
                            {m.in_stock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                        {m.description && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 3 }}>{m.description}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button onClick={() => { setMatEditId(m.id); setMatEditRow({ ...m }); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(27,61,94,0.2)', background: 'rgba(27,61,94,0.07)', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}><Pencil size={12} />Edit</button>
                        <button onClick={() => deleteMaterial(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.07)', color: '#b91c1c', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}><Trash2 size={12} />Delete</button>
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
