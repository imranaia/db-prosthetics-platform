'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { Boxes, ToggleLeft, ToggleRight, Search } from 'lucide-react';

interface Product {
  id: number; name: string; category: string; type: string; price: number; in_stock: number;
}

const CAT: Record<string, string> = { upper_limb: 'Upper Limb', lower_limb: 'Lower Limb', facial: 'Facial', spinal: 'Spinal' };
const TYP: Record<string, string> = { complete: 'Complete Device', part: 'Part / Component' };

function fmt(kobo: number) { return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 }); }

export default function InventoryPage() {
  const { user, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [toggling, setToggling] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'out'>('all');

  async function load() {
    const r = await fetch('/api/admin/products');
    if (r.ok) setProducts(await r.json());
  }

  useEffect(() => { if (user) load(); }, [user]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  async function toggleStock(p: Product) {
    setToggling(p.id);
    await fetch(`/api/admin/products/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ in_stock: p.in_stock ? 0 : 1 }),
    });
    setToggling(null);
    load();
  }

  const inStock = products.filter(p => p.in_stock).length;
  const outStock = products.filter(p => !p.in_stock).length;

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (!categoryFilter || p.category === categoryFilter) &&
    (stockFilter === 'all' || (stockFilter === 'in' ? !!p.in_stock : !p.in_stock))
  );

  return (
    <div className="dash-content">
      <div className="dash-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#05966918', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Boxes size={20} color="#059669" />
          </div>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.75rem', color: 'var(--text-head)', fontWeight: 600 }}>Inventory</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              <span style={{ color: '#16a34a', fontWeight: 600 }}>{inStock} in stock</span>
              {' · '}
              <span style={{ color: '#b91c1c', fontWeight: 600 }}>{outStock} out of stock</span>
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', margin: '20px 0' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input className="skeu-input" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, width: 240, maxWidth: '100%' }} />
        </div>
        <select className="skeu-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ width: 170 }}>
          <option value="">All categories</option>
          {Object.entries(CAT).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="skeu-select" value={stockFilter} onChange={e => setStockFilter(e.target.value as 'all' | 'in' | 'out')} style={{ width: 150 }}>
          <option value="all">All stock</option>
          <option value="in">In Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="skeu-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {products.length === 0 ? 'No products in catalogue yet.' : 'No products match your filters.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filtered.map(p => (
            <div key={p.id} className="skeu-card" style={{ padding: 18 }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-head)', marginBottom: 6 }}>{p.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                {CAT[p.category] ?? p.category} · {TYP[p.type] ?? p.type}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{fmt(p.price)}</span>
                <span className="status-badge" style={{ background: p.in_stock ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.1)', color: p.in_stock ? '#16a34a' : '#b91c1c' }}>
                  {p.in_stock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              <button
                onClick={() => toggleStock(p)}
                disabled={toggling === p.id}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', border: 'none',
                  background: p.in_stock ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.08)',
                  color: p.in_stock ? '#16a34a' : '#b91c1c',
                  fontSize: '0.82rem', fontWeight: 600,
                  transition: 'all 0.15s', opacity: toggling === p.id ? 0.6 : 1,
                }}
              >
                {p.in_stock
                  ? <><ToggleRight size={18} />Mark Out of Stock</>
                  : <><ToggleLeft size={18} />Mark In Stock</>
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
