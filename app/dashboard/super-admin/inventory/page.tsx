'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

interface Product {
  id: number;
  name: string;
  category: string;
  type: string;
  price: number;
  in_stock: number;
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

function formatNGN(kobo: number) {
  return (kobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
}

export default function InventoryPage() {
  const { user, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [toggling, setToggling] = useState<Record<number, boolean>>({});

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

  async function handleToggle(p: Product) {
    setToggling((t) => ({ ...t, [p.id]: true }));
    await fetch(`/api/admin/products/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ in_stock: p.in_stock ? 0 : 1 }),
    });
    setToggling((t) => ({ ...t, [p.id]: false }));
    fetchProducts();
  }

  return (
    <div style={{ padding: '40px 36px' }}>
      <h1 className="font-display" style={{ fontSize: '1.9rem', color: 'var(--text-head)', fontWeight: 600, marginBottom: '8px' }}>
        Inventory
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '28px', fontSize: '0.88rem' }}>
        Manage product stock availability.
      </p>

      <div className="skeu-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(27,61,94,0.06)', borderBottom: '1px solid var(--border-card)' }}>
              {['Product Name', 'Category', 'Type', 'Price', 'Stock Status', 'Toggle'].map((h) => (
                <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No products found.</td></tr>
            )}
            {products.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: i < products.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <td style={{ padding: '14px 18px', fontWeight: 500, color: 'var(--text-head)', fontSize: '0.9rem' }}>{p.name}</td>
                <td style={{ padding: '14px 18px', color: 'var(--text-body)', fontSize: '0.88rem' }}>{CATEGORY_LABELS[p.category] ?? p.category}</td>
                <td style={{ padding: '14px 18px', color: 'var(--text-body)', fontSize: '0.88rem' }}>{TYPE_LABELS[p.type] ?? p.type}</td>
                <td style={{ padding: '14px 18px', color: 'var(--text-body)', fontSize: '0.88rem' }}>{formatNGN(p.price)}</td>
                <td style={{ padding: '14px 18px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 12px',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    background: p.in_stock ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)',
                    color: p.in_stock ? '#16a34a' : '#b91c1c',
                  }}>
                    {p.in_stock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <button
                    onClick={() => handleToggle(p)}
                    disabled={toggling[p.id]}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '8px',
                      border: '1px solid',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      background: p.in_stock ? 'rgba(220,38,38,0.08)' : 'rgba(22,163,74,0.08)',
                      color: p.in_stock ? '#b91c1c' : '#16a34a',
                      borderColor: p.in_stock ? 'rgba(220,38,38,0.25)' : 'rgba(22,163,74,0.25)',
                      opacity: toggling[p.id] ? 0.5 : 1,
                    }}
                  >
                    {toggling[p.id] ? '…' : p.in_stock ? 'Mark Out of Stock' : 'Mark In Stock'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
