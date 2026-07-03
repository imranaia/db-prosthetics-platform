'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { ShoppingCart, ChevronDown, ChevronUp, Package } from 'lucide-react';

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
  created_at: string;
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
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Custom orders
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [expandedCust, setExpandedCust] = useState<number | null>(null);
  const [quoteId, setQuoteId] = useState<number | null>(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoting, setQuoting] = useState(false);

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

          <div className="skeu-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-scroll">
              <table className="dash-table">
                <thead><tr><th>#</th><th>Patient</th><th>Status</th><th>Total</th><th>Payment</th><th>Fulfillment</th><th>Date</th><th>Update Status</th><th></th></tr></thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No orders in this category.</td></tr>
                  ) : visible.flatMap(o => {
                    const ss = S_STYLE[o.status] || { bg: '#f3f4f6', color: '#6b7280' };
                    const fs = o.fulfillment_status || 'pending';
                    const fStyle = FULFILLMENT_STYLE[fs] || { bg: '#f3f4f6', color: '#6b7280' };
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
                        <td><span className="status-badge" style={{ background: fStyle.bg, color: fStyle.color }}>{fs.replace(/_/g, ' ')}</span></td>
                        <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(o.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td onClick={e => e.stopPropagation()}>
                          <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border-card)', background: '#fff', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-body)' }}>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                          </select>
                        </td>
                        <td>{expandedId === o.id ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}</td>
                      </tr>
                    )];
                    if (expandedId === o.id) {
                      rows.push(
                        <tr key={`${o.id}-items`}>
                          <td colSpan={9} style={{ padding: 0, background: 'rgba(27,61,94,0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
                            <div style={{ padding: '14px 20px 14px 40px' }}>
                              {o.items?.length > 0 && (
                                <>
                                  <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '10px' }}>Order Items</div>
                                  {o.items.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: i < o.items.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                                      <Package size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
                                      <span style={{ fontSize: '0.875rem', fontWeight: 500, flex: 1 }}>{item.product_name}</span>
                                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>x{item.quantity}</span>
                                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>{fmt(item.price_at_order * item.quantity)}</span>
                                    </div>
                                  ))}
                                </>
                              )}
                              <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                                {fs === 'pending' && (
                                  <button onClick={() => updateFulfillment(o.id, 'confirmed')} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #1d4ed8', background: '#dbeafe', color: '#1d4ed8', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>Confirm Order</button>
                                )}
                                {fs === 'confirmed' && (
                                  <button onClick={() => updateFulfillment(o.id, 'manufacturing')} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #6d28d9', background: '#f3e8ff', color: '#6d28d9', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>Mark Manufacturing</button>
                                )}
                                {fs === 'manufacturing' && (
                                  <button onClick={() => updateFulfillment(o.id, 'dispatched')} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #c2410c', background: '#fed7aa', color: '#c2410c', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>Mark Dispatched</button>
                                )}
                              </div>
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
        </>
      ) : (
        /* Custom Orders Tab */
        <div className="skeu-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Who Ordered</th>
                  <th>Patient</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Quoted Price</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {customOrders.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No custom orders yet.</td></tr>
                ) : customOrders.flatMap(o => {
                  const ss = CUSTOM_S_STYLE[o.status] || { bg: '#f3f4f6', color: '#6b7280' };
                  const isExpanded = expandedCust === o.id;
                  const rows: React.ReactElement[] = [(
                    <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedCust(isExpanded ? null : o.id)}>
                      <td style={{ fontWeight: 500, color: 'var(--text-head)' }}>{creatorLabel(o)}</td>
                      <td style={{ color: 'var(--text-body)' }}>{o.patient_name || '—'}</td>
                      <td style={{ color: 'var(--text-body)' }}>{o.category ? (CATEGORIES[o.category] || o.category) : '—'}</td>
                      <td><span className="status-badge" style={{ background: ss.bg, color: ss.color }}>{o.status}</span></td>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{o.quoted_price ? fmt(o.quoted_price) : '—'}</td>
                      <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(o.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td>{isExpanded ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}</td>
                    </tr>
                  )];

                  if (isExpanded) {
                    rows.push(
                      <tr key={`${o.id}-exp`}>
                        <td colSpan={7} style={{ padding: '18px 24px', background: 'rgba(27,61,94,0.02)', borderBottom: '1px solid var(--border-card)' }}>
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Description</div>
                            <div style={{ fontSize: '0.88rem', color: 'var(--text-body)', lineHeight: 1.6 }}>{o.description}</div>
                          </div>
                          {o.admin_notes && (
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Admin Notes</div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-body)' }}>{o.admin_notes}</div>
                            </div>
                          )}
                          {o.status === 'pending' && (
                            quoteId === o.id ? (
                              <div style={{ marginTop: 14, padding: 16, borderRadius: 10, border: '1px solid var(--border-card)', background: 'rgba(27,61,94,0.03)' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 12 }}>Set Quote</div>
                                <div className="form-grid-2" style={{ gap: 12, marginBottom: 12 }}>
                                  <div>
                                    <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Quoted Price (₦) <span style={{ color: '#dc2626' }}>*</span></label>
                                    <input
                                      type="number" min="0" step="0.01"
                                      className="skeu-input" style={{ width: '100%' }}
                                      value={quoteAmount}
                                      onChange={e => setQuoteAmount(e.target.value)}
                                      placeholder="e.g. 250000 for ₦250,000"
                                    />
                                  </div>
                                  <div>
                                    <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Admin Notes</label>
                                    <input
                                      type="text"
                                      className="skeu-input" style={{ width: '100%' }}
                                      value={quoteNotes}
                                      onChange={e => setQuoteNotes(e.target.value)}
                                      placeholder="Optional notes for the requester"
                                    />
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                  <button className="skeu-btn-primary" onClick={() => submitQuote(o.id)} disabled={quoting || !quoteAmount} style={{ flex: 1 }}>
                                    {quoting ? 'Saving...' : 'Set Quote & Notify'}
                                  </button>
                                  <button onClick={() => { setQuoteId(null); setQuoteAmount(''); setQuoteNotes(''); }} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', fontWeight: 600, color: 'var(--text-body)', fontSize: '0.88rem' }}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={e => { e.stopPropagation(); setQuoteId(o.id); setQuoteAmount(''); setQuoteNotes(''); }}
                                style={{ marginTop: 10, padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.08)', color: '#1d4ed8', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                              >
                                Set Quote
                              </button>
                            )
                          )}
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
      )}
    </div>
  );
}
