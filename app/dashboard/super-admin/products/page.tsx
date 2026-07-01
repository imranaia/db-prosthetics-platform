'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { Package, Plus, X, Pencil, Trash2, Check } from 'lucide-react';

interface Product {
  id: number; name: string; category: string; type: string;
  price: number; description: string; in_stock: number; created_at: string;
}

const CAT: Record<string, string> = { upper_limb: 'Upper Limb', lower_limb: 'Lower Limb', facial: 'Facial', spinal: 'Spinal' };
const TYP: Record<string, string> = { complete: 'Complete Device', part: 'Part / Component' };

const emptyForm = { name: '', category: '', type: '', price: '', description: '', in_stock: true };

function fmt(kobo: number) {
  return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 });
}

export default function ProductsPage() {
  const { user, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<Partial<Product & { priceNaira: string }>>({});

  async function load() {
    const r = await fetch('/api/admin/products');
    if (r.ok) setProducts(await r.json());
  }

  useEffect(() => { if (user) load(); }, [user]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true); setError('');
    const r = await fetch('/api/admin/products', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: parseFloat(form.price), in_stock: form.in_stock ? 1 : 0 }),
    });
    setSubmitting(false);
    if (r.ok) { setForm(emptyForm); setShowForm(false); load(); }
    else { const d = await r.json(); setError(d.error || 'Failed'); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    load();
  }

  function startEdit(p: Product) {
    setEditId(p.id);
    setEditRow({ ...p, priceNaira: (p.price / 100).toString() });
  }

  async function saveEdit() {
    if (editId == null) return;
    const r = await fetch(`/api/admin/products/${editId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editRow.name, category: editRow.category, type: editRow.type, price: parseFloat(editRow.priceNaira || '0'), description: editRow.description, in_stock: editRow.in_stock }),
    });
    if (r.ok) { setEditId(null); setEditRow({}); load(); }
  }

  return (
    <div className="dash-content">
      <div className="dash-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#05966918', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={20} color="#059669" />
          </div>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.75rem', color: 'var(--text-head)', fontWeight: 600 }}>Products</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{products.length} products in catalogue</p>
          </div>
        </div>
        <button className="skeu-btn-primary" onClick={() => setShowForm(s => !s)} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '7px' }}>
          {showForm ? <><X size={15} />Cancel</> : <><Plus size={15} />Add Product</>}
        </button>
      </div>

      {showForm && (
        <div className="inline-form-card">
          <h2 className="font-display" style={{ fontSize: '1.2rem', color: 'var(--text-head)', marginBottom: '20px', fontWeight: 600 }}>New Product</h2>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label className="skeu-label">Product Name</label>
              <input className="skeu-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Transtibial Prosthesis" />
            </div>
            <div className="form-grid-2">
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
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-body)', userSelect: 'none' }}>
                  <input type="checkbox" checked={form.in_stock} onChange={e => setForm({ ...form, in_stock: e.target.checked })} style={{ width: 16, height: 16 }} />
                  In Stock
                </label>
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <label className="skeu-label">Description</label>
              <textarea className="skeu-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Brief product description..." style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button className="skeu-btn-primary" type="submit" disabled={submitting} style={{ padding: '10px 24px' }}>{submitting ? 'Creating…' : 'Create Product'}</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="skeu-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-scroll">
          <table className="dash-table">
            <thead><tr><th>Name</th><th>Category</th><th>Type</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No products yet. Add your first above.</td></tr>
              ) : products.map(p => (
                <tr key={p.id}>
                  {editId === p.id ? (
                    <>
                      <td><input className="skeu-input" value={editRow.name ?? ''} onChange={e => setEditRow({ ...editRow, name: e.target.value })} style={{ padding: '6px 10px', fontSize: '0.85rem', minWidth: 140 }} /></td>
                      <td><select className="skeu-select" value={editRow.category ?? ''} onChange={e => setEditRow({ ...editRow, category: e.target.value })} style={{ padding: '6px 10px', fontSize: '0.85rem' }}>{Object.entries(CAT).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></td>
                      <td><select className="skeu-select" value={editRow.type ?? ''} onChange={e => setEditRow({ ...editRow, type: e.target.value })} style={{ padding: '6px 10px', fontSize: '0.85rem' }}>{Object.entries(TYP).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></td>
                      <td><input className="skeu-input" type="number" min="0" step="0.01" value={editRow.priceNaira ?? ''} onChange={e => setEditRow({ ...editRow, priceNaira: e.target.value })} style={{ padding: '6px 10px', fontSize: '0.85rem', width: 100 }} /></td>
                      <td><select className="skeu-select" value={editRow.in_stock ?? 1} onChange={e => setEditRow({ ...editRow, in_stock: parseInt(e.target.value) })} style={{ padding: '6px 10px', fontSize: '0.85rem' }}><option value={1}>In Stock</option><option value={0}>Out of Stock</option></select></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={saveEdit} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}><Check size={13} />Save</button>
                          <button onClick={() => { setEditId(null); setEditRow({}); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)' }}><X size={13} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ fontWeight: 600, color: 'var(--text-head)' }}>{p.name}</td>
                      <td>{CAT[p.category] ?? p.category}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{TYP[p.type] ?? p.type}</td>
                      <td style={{ fontWeight: 500, color: 'var(--primary)' }}>{fmt(p.price)}</td>
                      <td>
                        <span className="status-badge" style={{ background: p.in_stock ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.1)', color: p.in_stock ? '#16a34a' : '#b91c1c' }}>
                          {p.in_stock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => startEdit(p)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(27,61,94,0.2)', background: 'rgba(27,61,94,0.07)', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}><Pencil size={13} />Edit</button>
                          <button onClick={() => handleDelete(p.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.07)', color: '#b91c1c', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}><Trash2 size={13} />Delete</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
