'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { ShoppingCart, ChevronDown, ChevronUp, Package } from 'lucide-react';

interface OrderItem { product_name: string; quantity: number; price_at_order: number; }
interface Order {
  id: number; patient_name: string; status: string;
  total_amount: number; payment_status: string; payment_method: string;
  created_at: string; items: OrderItem[];
}

const STATUS_OPTIONS = ['pending', 'processing', 'fulfilled', 'cancelled'];
const FILTERS = ['all', ...STATUS_OPTIONS];

const S_STYLE: Record<string, { bg: string; color: string }> = {
  pending:    { bg: 'rgba(234,179,8,0.12)',  color: '#a16207' },
  processing: { bg: 'rgba(59,130,246,0.12)', color: '#1d4ed8' },
  fulfilled:  { bg: 'rgba(22,163,74,0.12)',  color: '#16a34a' },
  cancelled:  { bg: 'rgba(220,38,38,0.12)',  color: '#b91c1c' },
};

function fmt(kobo: number) { return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 }); }

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch('/api/admin/orders').then(r => r.json()).then(setOrders);
  }, [user]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  const visible = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/admin/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    fetch('/api/admin/orders').then(r => r.json()).then(setOrders);
  }

  return (
    <div className="dash-content">
      <div className="dash-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#b5751f18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingCart size={20} color="var(--accent)" />
          </div>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.75rem', color: 'var(--text-head)', fontWeight: 600 }}>Orders</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{orders.length} total orders</p>
          </div>
        </div>
      </div>

      <div className="filter-tabs">
        {FILTERS.map(f => (
          <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && <span style={{ marginLeft: 4, opacity: 0.7 }}>({orders.filter(o => o.status === f).length})</span>}
          </button>
        ))}
      </div>

      <div className="skeu-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-scroll">
          <table className="dash-table">
            <thead><tr><th>#</th><th>Patient</th><th>Status</th><th>Total</th><th>Payment</th><th>Date</th><th>Update Status</th><th></th></tr></thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No orders in this category.</td></tr>
              ) : visible.flatMap(o => {
                const ss = S_STYLE[o.status] || { bg: '#f3f4f6', color: '#6b7280' };
                const rows: React.ReactElement[] = [(
                  <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{o.id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-head)' }}>{o.patient_name}</td>
                    <td><span className="status-badge" style={{ background: ss.bg, color: ss.color }}>{o.status}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{fmt(o.total_amount)}</td>
                    <td>
                      <span className="status-badge" style={{ background: o.payment_status === 'paid' ? 'rgba(22,163,74,0.12)' : 'rgba(234,179,8,0.12)', color: o.payment_status === 'paid' ? '#16a34a' : '#a16207' }}>
                        {o.payment_status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(o.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <select
                        value={o.status}
                        onChange={e => updateStatus(o.id, e.target.value)}
                        style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border-card)', background: '#fff', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-body)' }}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </td>
                    <td>{expandedId === o.id ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}</td>
                  </tr>
                )];
                if (expandedId === o.id && o.items?.length > 0) {
                  rows.push(
                    <tr key={`${o.id}-items`}>
                      <td colSpan={8} style={{ padding: 0, background: 'rgba(27,61,94,0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <div style={{ padding: '14px 20px 14px 40px' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '10px' }}>Order Items</div>
                          {o.items.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: i < o.items.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                              <Package size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
                              <span style={{ fontSize: '0.875rem', fontWeight: 500, flex: 1 }}>{item.product_name}</span>
                              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>x{item.quantity}</span>
                              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>{fmt(item.price_at_order * item.quantity)}</span>
                            </div>
                          ))}
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
