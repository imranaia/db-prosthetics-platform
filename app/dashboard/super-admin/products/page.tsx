'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

interface Product {
  id: number;
  name: string;
  category: string;
  type: string;
  price: number;
  description: string;
  in_stock: number;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  upper_limb: 'Upper Limb',
  lower_limb: 'Lower Limb',
  facial: 'Facial',
  spinal: 'Spinal',
};

const TYPE_LABELS: Record<string, string> = {
  complete: 'Complete Device',
  part: 'Part / Component',
};

const emptyForm = { name: '', category: '', type: '', price: '', description: '', in_stock: true };

function formatNGN(kobo: number) {
  return (kobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
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

  async function fetchProducts() {
    const res = await fetch('/api/admin/products');
    if (res.ok) setProducts(await res.json());
  }

  useEffect(() => {
    if (user) fetchProducts();
  }, [user]);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }
  if (!user) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: parseFloat(form.price), in_stock: form.in_stock ? 1 : 0 }),
    });
    setSubmitting(false);
    if (res.ok) {
      setForm(emptyForm);
      setShowForm(false);
      fetchProducts();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to create product');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    fetchProducts();
  }

  function startEdit(p: Product) {
    setEditId(p.id);
    setEditRow({ ...p, priceNaira: (p.price / 100).toString() });
  }

  async function saveEdit() {
    if (editId == null) return;
    const res = await fetch(`/api/admin/products/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editRow.name,
        category: editRow.category,
        type: editRow.type,
        price: parseFloat(editRow.priceNaira || '0'),
        description: editRow.description,
        in_stock: editRow.in_stock,
      }),
    });
    if (res.ok) {
      setEditId(null);
      setEditRow({});
      fetchProducts();
    }
  }

  return (
    <div style={{ padding: '40px 36px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <h1 className="font-display" style={{ fontSize: '1.9rem', color: 'var(--text-head)', fontWeight: 600 }}>
          Products
        </h1>
        <button className="skeu-btn-primary" onClick={() => setShowForm((s) => !s)} style={{ padding: '10px 22px' }}>
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {showForm && (
        <div className="skeu-card" style={{ padding: '28px', marginBottom: '28px' }}>
          <h2 className="font-display" style={{ fontSize: '1.2rem', color: 'var(--text-head)', marginBottom: '20px' }}>
            New Product
          </h2>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="skeu-label">Product Name</label>
              <input className="skeu-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={{ width: '100%' }} />
            </div>
            <div>
              <label className="skeu-label">Category</label>
              <select className="skeu-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required style={{ width: '100%' }}>
                <option value="">Select category</option>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="skeu-label">Type</label>
              <select className="skeu-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required style={{ width: '100%' }}>
                <option value="">Select type</option>
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="skeu-label">Price (₦)</label>
              <input className="skeu-input" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-body)' }}>
                <input type="checkbox" checked={form.in_stock} onChange={(e) => setForm({ ...form, in_stock: e.target.checked })} />
                In Stock
              </label>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="skeu-label">Description</label>
              <textarea className="skeu-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ width: '100%', resize: 'vertical' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px' }}>
              <button className="skeu-btn-primary" type="submit" disabled={submitting} style={{ padding: '10px 24px' }}>
                {submitting ? 'Creating…' : 'Create Product'}
              </button>
              <button className="skeu-btn-ghost" type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: 'rgba(0,0,0,0.06)', color: 'var(--text-body)', border: '1px solid rgba(0,0,0,0.12)' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="skeu-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(27,61,94,0.06)', borderBottom: '1px solid var(--border-card)' }}>
              {['Name', 'Category', 'Type', 'Price', 'Stock', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No products yet.</td></tr>
            )}
            {products.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: i < products.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                {editId === p.id ? (
                  <>
                    <td style={{ padding: '10px 12px' }}>
                      <input className="skeu-input" value={editRow.name ?? ''} onChange={(e) => setEditRow({ ...editRow, name: e.target.value })} style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem' }} />
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <select className="skeu-select" value={editRow.category ?? ''} onChange={(e) => setEditRow({ ...editRow, category: e.target.value })} style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem' }}>
                        {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <select className="skeu-select" value={editRow.type ?? ''} onChange={(e) => setEditRow({ ...editRow, type: e.target.value })} style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem' }}>
                        {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <input className="skeu-input" type="number" min="0" step="0.01" value={editRow.priceNaira ?? ''} onChange={(e) => setEditRow({ ...editRow, priceNaira: e.target.value })} style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem' }} />
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <select className="skeu-select" value={editRow.in_stock ?? 1} onChange={(e) => setEditRow({ ...editRow, in_stock: parseInt(e.target.value) })} style={{ padding: '6px 10px', fontSize: '0.85rem' }}>
                        <option value={1}>In Stock</option>
                        <option value={0}>Out of Stock</option>
                      </select>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <button className="skeu-btn-primary" onClick={saveEdit} style={{ padding: '5px 12px', fontSize: '0.8rem', marginRight: '6px' }}>Save</button>
                      <button className="skeu-btn-ghost" onClick={() => { setEditId(null); setEditRow({}); }} style={{ padding: '5px 12px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.06)', color: 'var(--text-body)', border: '1px solid rgba(0,0,0,0.12)' }}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '14px 18px', fontWeight: 500, color: 'var(--text-head)', fontSize: '0.9rem' }}>{p.name}</td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-body)', fontSize: '0.88rem' }}>{CATEGORY_LABELS[p.category] ?? p.category}</td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-body)', fontSize: '0.88rem' }}>{TYPE_LABELS[p.type] ?? p.type}</td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-body)', fontSize: '0.88rem' }}>{formatNGN(p.price)}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600, background: p.in_stock ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: p.in_stock ? '#16a34a' : '#b91c1c' }}>
                        {p.in_stock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', display: 'flex', gap: '8px' }}>
                      <button className="skeu-btn-ghost" onClick={() => startEdit(p)} style={{ padding: '5px 14px', fontSize: '0.8rem', background: 'rgba(27,61,94,0.08)', color: 'var(--primary)', border: '1px solid rgba(27,61,94,0.2)', borderRadius: '6px' }}>Edit</button>
                      <button className="skeu-btn-ghost" onClick={() => handleDelete(p.id)} style={{ padding: '5px 14px', fontSize: '0.8rem', background: 'rgba(220,38,38,0.08)', color: '#b91c1c', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '6px' }}>Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
