'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { Boxes, ToggleLeft, ToggleRight } from 'lucide-react';

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

      <div className="skeu-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-scroll">
          <table className="dash-table">
            <thead><tr><th>Product</th><th>Category</th><th>Type</th><th>Price</th><th>Status</th><th>Toggle</th></tr></thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No products in catalogue yet.</td></tr>
              ) : products.map(p => (
                <tr key={p.id}>
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
                    <button
                      onClick={() => toggleStock(p)}
                      disabled={toggling === p.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', border: 'none',
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
