'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

interface OrderItem {
  product_name: string;
  quantity: number;
  price_at_order: number;
}

interface Order {
  id: number;
  patient_name: string;
  status: string;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  created_at: string;
  items: OrderItem[];
}

const STATUS_OPTIONS = ['pending', 'processing', 'fulfilled', 'cancelled'];
const FILTER_TABS = ['all', ...STATUS_OPTIONS];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:    { bg: 'rgba(234,179,8,0.12)',  color: '#a16207' },
  processing: { bg: 'rgba(59,130,246,0.12)', color: '#1d4ed8' },
  fulfilled:  { bg: 'rgba(22,163,74,0.12)',  color: '#16a34a' },
  cancelled:  { bg: 'rgba(220,38,38,0.12)',  color: '#b91c1c' },
};

function formatNGN(kobo: number) {
  return (kobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
}

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [statusUpdates, setStatusUpdates] = useState<Record<number, string>>({});

  async function fetchOrders() {
    const res = await fetch('/api/admin/orders');
    if (res.ok) setOrders(await res.json());
  }

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }
  if (!user) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    return null;
  }

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  async function handleStatusChange(orderId: number, newStatus: string) {
    setStatusUpdates((prev) => ({ ...prev, [orderId]: newStatus }));
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchOrders();
  }

  return (
    <div style={{ padding: '40px 36px' }}>
      <h1 className="font-display" style={{ fontSize: '1.9rem', color: 'var(--text-head)', fontWeight: 600, marginBottom: '24px' }}>
        Orders
      </h1>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: '7px 16px',
              borderRadius: '20px',
              border: '1px solid',
              fontSize: '0.82rem',
              fontWeight: 600,
              textTransform: 'capitalize',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: filter === tab ? 'var(--primary)' : 'rgba(255,255,255,0.6)',
              color: filter === tab ? '#fff' : 'var(--text-muted)',
              borderColor: filter === tab ? 'var(--primary)' : 'rgba(0,0,0,0.12)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="skeu-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(27,61,94,0.06)', borderBottom: '1px solid var(--border-card)' }}>
              {['Order #', 'Patient', 'Status', 'Total', 'Payment', 'Date', 'Update Status', ''].map((h) => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No orders found.</td></tr>
            )}
            {filtered.map((o, i) => (
              <>
                <tr
                  key={o.id}
                  style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                >
                  <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: '0.82rem', fontFamily: 'monospace' }} onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>#{o.id}</td>
                  <td style={{ padding: '13px 16px', fontWeight: 500, color: 'var(--text-head)', fontSize: '0.88rem' }} onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>{o.patient_name || '—'}</td>
                  <td style={{ padding: '13px 16px' }} onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600, ...(STATUS_COLORS[o.status] ?? { bg: '#eee', color: '#333' }), background: STATUS_COLORS[o.status]?.bg }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', color: 'var(--text-body)', fontSize: '0.88rem' }} onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>{formatNGN(o.total_amount)}</td>
                  <td style={{ padding: '13px 16px' }} onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600, background: o.payment_status === 'paid' ? 'rgba(22,163,74,0.12)' : 'rgba(234,179,8,0.12)', color: o.payment_status === 'paid' ? '#16a34a' : '#a16207' }}>
                      {o.payment_status}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: '0.83rem' }} onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>
                    {new Date(o.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <select
                      className="skeu-select"
                      value={statusUpdates[o.id] ?? o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      style={{ padding: '5px 8px', fontSize: '0.8rem' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '13px 16px', color: 'var(--accent)', fontSize: '0.85rem' }} onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>
                    {expandedId === o.id ? '▲' : '▼'}
                  </td>
                </tr>
                {expandedId === o.id && (
                  <tr key={`${o.id}-expanded`} style={{ background: 'rgba(27,61,94,0.03)', borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <td colSpan={8} style={{ padding: '16px 28px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Items</div>
                      {o.items.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No items.</div>
                      ) : (
                        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                          <thead>
                            <tr>
                              {['Product', 'Qty', 'Unit Price'].map((h) => (
                                <th key={h} style={{ textAlign: 'left', padding: '6px 12px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {o.items.map((item, idx) => (
                              <tr key={idx}>
                                <td style={{ padding: '6px 12px', color: 'var(--text-body)', fontSize: '0.85rem' }}>{item.product_name}</td>
                                <td style={{ padding: '6px 12px', color: 'var(--text-body)', fontSize: '0.85rem' }}>{item.quantity}</td>
                                <td style={{ padding: '6px 12px', color: 'var(--text-body)', fontSize: '0.85rem' }}>{formatNGN(item.price_at_order)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
