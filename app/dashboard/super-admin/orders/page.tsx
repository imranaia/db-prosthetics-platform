'use client';

import { useAuth } from '@/hooks/useAuth';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useEffect, useState } from 'react';
import { ShoppingCart, Package } from 'lucide-react';

interface OrderItem { product_name: string; quantity: number; price_at_order: number; }
interface Order {
  id: number; patient_name: string; status: string;
  total_amount: number; payment_status: string; payment_method: string;
  fulfillment_status: string | null; fulfillment_notes: string | null;
  created_at: string; items: OrderItem[];
}

interface CustomOrder {
  id: number;
  created_by_role: string;
  patient_name: string | null;
  doctor_name: string | null;
  doctor_email: string | null;
  po_specialist_email: string | null;
  category: string | null;
  description: string;
  status: string;
  quoted_price: number | null;
  payment_target: string;
  payment_status: string;
  admin_notes: string | null;
  fulfillment_status: string | null;
  created_at: string;
  reorder_of_order_id: number | null;
  reorder_of_custom_order_id: number | null;
  reorder_reason: string | null;
}

const STATUS_OPTIONS = ['pending', 'processing', 'fulfilled', 'cancelled'];
const FILTERS = ['all', ...STATUS_OPTIONS];

const FULFILLMENT_STYLE: Record<string, { bg: string; color: string }> = {
  pending:            { bg: '#fef3c7', color: '#b45309' },
  confirmed:          { bg: '#dbeafe', color: '#1d4ed8' },
  manufacturing:      { bg: '#f3e8ff', color: '#6d28d9' },
  dispatched:         { bg: '#fed7aa', color: '#c2410c' },
  delivered:          { bg: '#ccfbf1', color: '#0f766e' },
  received_by_doctor: { bg: '#ccfbf1', color: '#0f766e' },
  received_by_patient:{ bg: '#d1fae5', color: '#065f46' },
};

const S_STYLE: Record<string, { bg: string; color: string }> = {
  pending:    { bg: 'rgba(234,179,8,0.12)',  color: '#a16207' },
  processing: { bg: 'rgba(59,130,246,0.12)', color: '#1d4ed8' },
  fulfilled:  { bg: 'rgba(22,163,74,0.12)',  color: '#16a34a' },
  cancelled:  { bg: 'rgba(220,38,38,0.12)',  color: '#b91c1c' },
};

const CUSTOM_S_STYLE: Record<string, { bg: string; color: string }> = {
  pending:   { bg: 'rgba(234,179,8,0.12)',   color: '#a16207' },
  quoted:    { bg: 'rgba(59,130,246,0.12)',  color: '#1d4ed8' },
  accepted:  { bg: 'rgba(22,163,74,0.12)',   color: '#16a34a' },
  rejected:  { bg: 'rgba(220,38,38,0.12)',   color: '#b91c1c' },
  paid:      { bg: 'rgba(5,150,105,0.12)',   color: '#059669' },
  fulfilled: { bg: 'rgba(107,114,128,0.12)', color: '#4b5563' },
  cancelled: { bg: 'rgba(220,38,38,0.12)',   color: '#b91c1c' },
};

const CATEGORIES: Record<string, string> = {
  upper_limb: 'Upper Limb', lower_limb: 'Lower Limb',
  facial: 'Facial', spinal: 'Spinal', other: 'Other',
};

function fmt(kobo: number) { return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 }); }

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'standard' | 'custom'>('standard');

  // Standard orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');

  // Custom orders
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [quoteId, setQuoteId] = useState<number | null>(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoting, setQuoting] = useState(false);
  const { confirm, dialog } = useConfirmDialog();

  async function loadOrders() {
    const data = await fetch('/api/admin/orders').then(r => r.json());
    setOrders(Array.isArray(data) ? data : []);
  }

  async function loadCustomOrders() {
    const data = await fetch('/api/orders/custom').then(r => r.json());
    setCustomOrders(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    if (!user || loading) return;
    loadOrders();
    loadCustomOrders();
  }, [user, loading]);

  useAutoRefresh(() => { loadOrders(); loadCustomOrders(); }, 30000, !!user && !loading);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  const visible = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/admin/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    loadOrders();
  }

  async function updateFulfillment(id: number, fulfillment_status: string) {
    await fetch(`/api/admin/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fulfillment_status }) });
    loadOrders();
  }

  async function cancelOrder(id: number) {
    const ok = await confirm('Cancel this order? This cannot be undone.', { title: 'Cancel Order', confirmLabel: 'Cancel Order', danger: true });
    if (!ok) return;
    await updateStatus(id, 'cancelled');
  }

  async function updateCustomFulfillment(id: number, fulfillment_status: string) {
    await fetch('/api/orders/custom', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, fulfillment_status }),
    });
    loadCustomOrders();
  }

  async function submitQuote(id: number) {
    if (!quoteAmount) return;
    setQuoting(true);
    const kobo = Math.round(parseFloat(quoteAmount) * 100);
    await fetch('/api/orders/custom', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, quoted_price: kobo, status: 'quoted', admin_notes: quoteNotes || undefined }),
    });
    setQuoteId(null); setQuoteAmount(''); setQuoteNotes(''); setQuoting(false);
    loadCustomOrders();
  }

  function creatorLabel(o: CustomOrder) {
    if (o.created_by_role === 'doctor') return o.doctor_name || o.doctor_email || 'Doctor';
    if (o.created_by_role === 'po_specialist') return o.po_specialist_email || 'P&O Specialist';
    return 'Patient';
  }

  return (
    <div className="dash-content">
      {dialog}
      <div className="dash-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#b5751f18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingCart size={20} color="var(--accent)" />
          </div>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.75rem', color: 'var(--text-head)', fontWeight: 600 }}>Orders</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{orders.length} product orders · {customOrders.length} custom orders</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid var(--border-card)' }}>
        {(['standard', 'custom'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 24px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: 'transparent', color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: -2 }}>
            {tab === 'standard' ? 'Product Orders' : 'Custom Orders'}
            <span style={{ marginLeft: 6, opacity: 0.7, fontSize: '0.78rem' }}>({tab === 'standard' ? orders.length : customOrders.length})</span>
          </button>
        ))}
      </div>

      {activeTab === 'standard' ? (
        <>
          <div className="filter-tabs">
            {FILTERS.map(f => (
              <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== 'all' && <span style={{ marginLeft: 4, opacity: 0.7 }}>({orders.filter(o => o.status === f).length})</span>}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="skeu-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>No orders in this category.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {visible.map(o => {
                const ss = S_STYLE[o.status] || { bg: '#f3f4f6', color: '#6b7280' };
                const fs = o.fulfillment_status || 'pending';
                const fStyle = FULFILLMENT_STYLE[fs] || { bg: '#f3f4f6', color: '#6b7280' };
                return (
                  <div key={o.id} className="skeu-card" style={{ padding: 16, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{o.id}</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-head)' }}>{o.patient_name}</div>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(o.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      <span className="status-badge" style={{ background: ss.bg, color: ss.color }}>{o.status}</span>
                      <span className="status-badge" style={{ background: o.payment_status === 'paid' ? 'rgba(22,163,74,0.12)' : 'rgba(234,179,8,0.12)', color: o.payment_status === 'paid' ? '#16a34a' : '#a16207' }}>
                        {o.payment_status}
                      </span>
                      <span className="status-badge" style={{ background: fStyle.bg, color: fStyle.color }}>{fs.replace(/_/g, ' ')}</span>
                    </div>

                    {o.items?.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        {o.items.map((item, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: i < o.items.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                            <Package size={12} color="var(--primary)" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: '0.82rem', fontWeight: 500, flex: 1 }}>{item.product_name}</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>x{item.quantity}</span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>{fmt(item.price_at_order * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total</span>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{fmt(o.total_amount)}</span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {fs === 'pending' && (
                        <button onClick={() => updateFulfillment(o.id, 'confirmed')} style={{ flex: 1, padding: '7px 10px', borderRadius: 7, border: '1px solid #1d4ed8', background: '#dbeafe', color: '#1d4ed8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Confirm Order</button>
                      )}
                      {fs === 'confirmed' && (
                        <button onClick={() => updateFulfillment(o.id, 'manufacturing')} style={{ flex: 1, padding: '7px 10px', borderRadius: 7, border: '1px solid #6d28d9', background: '#f3e8ff', color: '#6d28d9', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Mark Manufacturing</button>
                      )}
                      {fs === 'manufacturing' && (
                        <button onClick={() => updateFulfillment(o.id, 'dispatched')} style={{ flex: 1, padding: '7px 10px', borderRadius: 7, border: '1px solid #c2410c', background: '#fed7aa', color: '#c2410c', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Mark Dispatched</button>
                      )}
                      {o.status !== 'cancelled' && o.status !== 'fulfilled' && (
                        <button onClick={() => cancelOrder(o.id)} style={{ flex: 1, padding: '7px 10px', borderRadius: 7, border: '1px solid #b91c1c', background: '#fee2e2', color: '#b91c1c', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Cancel Order</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Custom Orders Tab */
        customOrders.length === 0 ? (
          <div className="skeu-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>No custom orders yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {customOrders.map(o => {
              const ss = CUSTOM_S_STYLE[o.status] || { bg: '#f3f4f6', color: '#6b7280' };
              return (
                <div key={o.id} className="skeu-card" style={{ padding: 16, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-head)' }}>{o.patient_name || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ordered by {creatorLabel(o)}</div>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(o.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    <span className="status-badge" style={{ background: ss.bg, color: ss.color }}>{o.status}</span>
                    {(() => {
                      const fs = o.fulfillment_status || 'pending';
                      const fStyle = FULFILLMENT_STYLE[fs] || { bg: '#f3f4f6', color: '#6b7280' };
                      return <span className="status-badge" style={{ background: fStyle.bg, color: fStyle.color }}>{fs.replace(/_/g, ' ')}</span>;
                    })()}
                    {(o.reorder_of_order_id || o.reorder_of_custom_order_id) && (
                      <span className="status-badge" style={{ background: 'rgba(124,58,237,0.12)', color: '#7c3aed' }}>
                        Reorder of {o.reorder_of_order_id ? `Order #${o.reorder_of_order_id}` : `Custom Order #${o.reorder_of_custom_order_id}`}
                      </span>
                    )}
                    {o.category && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{CATEGORIES[o.category] || o.category}</span>}
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-body)', lineHeight: 1.5, marginBottom: 10 }}>{o.description}</div>

                  {o.admin_notes && (
                    <div style={{ marginBottom: 10, padding: '8px 10px', background: 'rgba(27,61,94,0.04)', borderRadius: 8 }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>Admin Notes</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-body)' }}>{o.admin_notes}</div>
                    </div>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: o.status === 'pending' ? 10 : 0 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quoted Price</span>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{o.quoted_price ? fmt(o.quoted_price) : '—'}</span>
                  </div>

                  {o.status === 'pending' && (
                    quoteId === o.id ? (
                      <div style={{ marginTop: 10, padding: 14, borderRadius: 10, border: '1px solid var(--border-card)', background: 'rgba(27,61,94,0.03)' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 10 }}>Set Quote</div>
                        <div style={{ marginBottom: 10 }}>
                          <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Quoted Price (₦) <span style={{ color: '#dc2626' }}>*</span></label>
                          <input
                            type="number" min="0" step="0.01"
                            className="skeu-input" style={{ width: '100%' }}
                            value={quoteAmount}
                            onChange={e => setQuoteAmount(e.target.value)}
                            placeholder="e.g. 250000 for ₦250,000"
                          />
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Plus a flat ₦1,000 service fee on top — not deducted from it.
                          </div>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Admin Notes</label>
                          <input
                            type="text"
                            className="skeu-input" style={{ width: '100%' }}
                            value={quoteNotes}
                            onChange={e => setQuoteNotes(e.target.value)}
                            placeholder="Optional notes for the requester"
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="skeu-btn-primary" onClick={() => submitQuote(o.id)} disabled={quoting || !quoteAmount} style={{ flex: 1, padding: '8px' }}>
                            {quoting ? 'Saving...' : 'Set Quote & Notify'}
                          </button>
                          <button onClick={() => { setQuoteId(null); setQuoteAmount(''); setQuoteNotes(''); }} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', fontWeight: 600, color: 'var(--text-body)', fontSize: '0.85rem' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setQuoteId(o.id); setQuoteAmount(''); setQuoteNotes(''); }}
                        style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.08)', color: '#1d4ed8', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                      >
                        Set Quote
                      </button>
                    )
                  )}

                  {(() => {
                    const fs = o.fulfillment_status || 'pending';
                    if (fs === 'pending') return (
                      <button onClick={() => updateCustomFulfillment(o.id, 'confirmed')} style={{ marginTop: 8, padding: '7px 10px', borderRadius: 7, border: '1px solid #1d4ed8', background: '#dbeafe', color: '#1d4ed8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Confirm Order</button>
                    );
                    if (fs === 'confirmed') return (
                      <button onClick={() => updateCustomFulfillment(o.id, 'manufacturing')} style={{ marginTop: 8, padding: '7px 10px', borderRadius: 7, border: '1px solid #6d28d9', background: '#f3e8ff', color: '#6d28d9', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Mark Manufacturing</button>
                    );
                    if (fs === 'manufacturing') return (
                      <button onClick={() => updateCustomFulfillment(o.id, 'dispatched')} style={{ marginTop: 8, padding: '7px 10px', borderRadius: 7, border: '1px solid #c2410c', background: '#fed7aa', color: '#c2410c', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Mark Dispatched</button>
                    );
                    return null;
                  })()}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
