'use client';

import { useAuth } from '@/hooks/useAuth';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Package, RotateCcw, Receipt } from 'lucide-react';

interface StdOrder {
  id: number;
  total_amount: number;
  service_fee: number;
  status: string;
  payment_status: string;
  fulfillment_status: string | null;
  created_at: string;
  items: Array<{ product_name: string; quantity: number; price_at_order: number }>;
}

interface CustomOrder {
  id: number;
  category: string | null;
  description: string;
  status: string;
  quoted_price: number | null;
  payment_status: string;
  created_at: string;
  reorder_of_order_id: number | null;
  reorder_of_custom_order_id: number | null;
  fulfillment_status: string | null;
}

// Mirrors the stages Super Admin/Doctor move an order through
// (app/dashboard/super-admin/orders/page.tsx, app/dashboard/doctor/orders/page.tsx),
// translated into what the patient actually needs to know: where the device
// physically is right now.
const FULFILLMENT_LABEL: Record<string, string> = {
  pending:             'Order Received',
  confirmed:           'Confirmed',
  manufacturing:       'Being Made',
  dispatched:          'On Its Way to Your Hospital',
  delivered:           'Delivered to Hospital',
  received_by_doctor:  'With Your Doctor — Come Collect',
  received_by_patient: 'Collected',
};
const FULFILLMENT_STYLE: Record<string, { bg: string; color: string }> = {
  pending:             { bg: '#fef3c7', color: '#b45309' },
  confirmed:           { bg: '#dbeafe', color: '#1d4ed8' },
  manufacturing:       { bg: '#f3e8ff', color: '#6d28d9' },
  dispatched:          { bg: '#fed7aa', color: '#c2410c' },
  delivered:           { bg: '#ccfbf1', color: '#0f766e' },
  received_by_doctor:  { bg: '#ccfbf1', color: '#0f766e' },
  received_by_patient: { bg: '#d1fae5', color: '#065f46' },
};

const CUSTOM_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:   { bg: '#fef3c7', color: '#b45309' },
  quoted:    { bg: '#dbeafe', color: '#1d4ed8' },
  accepted:  { bg: '#d1fae5', color: '#065f46' },
  rejected:  { bg: '#fee2e2', color: '#b91c1c' },
  paid:      { bg: '#ecfdf5', color: '#059669' },
  fulfilled: { bg: '#f3f4f6', color: '#374151' },
  cancelled: { bg: '#fee2e2', color: '#b91c1c' },
};

const CATEGORIES_MAP: Record<string, string> = {
  upper_limb: 'Upper Limb',
  lower_limb: 'Lower Limb',
  facial: 'Facial',
  spinal: 'Spinal',
  other: 'Other',
};

function fmt(kobo: number) {
  return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 });
}

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PatientOrdersPage() {
  const { user, loading } = useAuth();

  const [stdOrders, setStdOrders] = useState<StdOrder[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payErr, setPayErr] = useState('');
  const [confirmingReceipt, setConfirmingReceipt] = useState<number | null>(null);
  const [confirmingCustomReceipt, setConfirmingCustomReceipt] = useState<number | null>(null);

  // Reorder request state
  const [reorderKey, setReorderKey] = useState<string | null>(null);
  const [reorderReason, setReorderReason] = useState('');
  const [reorderSubmitting, setReorderSubmitting] = useState(false);
  const [reorderErr, setReorderErr] = useState('');
  const [reorderMsg, setReorderMsg] = useState('');

  async function load() {
    try {
      const [stdRes, custRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/orders/custom'),
      ]);
      const [stdData, custData] = await Promise.all([stdRes.json(), custRes.json()]);
      setStdOrders(Array.isArray(stdData) ? stdData : []);
      setCustomOrders(Array.isArray(custData) ? custData : []);
    } finally {
      setDataLoading(false);
    }
  }

  useEffect(() => {
    if (!user || loading) return;
    load();
  }, [user, loading]);

  useAutoRefresh(load, 30000, !!user && !loading);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'patient') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  async function confirmReceipt(orderId: number) {
    setConfirmingReceipt(orderId);
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fulfillment_status: 'received_by_patient' }),
      });
      load();
    } finally {
      setConfirmingReceipt(null);
    }
  }

  async function confirmCustomReceipt(orderId: number) {
    setConfirmingCustomReceipt(orderId);
    try {
      await fetch(`/api/orders/custom/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fulfillment_status: 'received_by_patient' }),
      });
      load();
    } finally {
      setConfirmingCustomReceipt(null);
    }
  }

  async function handlePay(type: 'order' | 'custom_order', id: number) {
    setPayErr('');
    setPayingId(`${type}-${id}`);
    try {
      const res = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(type === 'order' ? { order_id: id } : { custom_order_id: id }),
      });
      const data = await res.json();
      if (!res.ok) { setPayErr(data.error || 'Payment initialization failed.'); setPayingId(null); return; }
      if (data.authorization_url) window.location.href = data.authorization_url;
    } catch {
      setPayErr('Network error. Please try again.');
    }
    setPayingId(null);
  }

  function startReorder(key: string) {
    setReorderKey(key);
    setReorderReason('');
    setReorderErr('');
  }

  async function submitReorder(kind: 'order' | 'custom_order', id: number) {
    if (!reorderReason.trim()) { setReorderErr('Please tell us why you need a reorder.'); return; }
    setReorderSubmitting(true);
    setReorderErr('');
    try {
      const res = await fetch('/api/orders/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: `Reorder request for ${kind === 'order' ? 'Order' : 'Custom Order'} #${id} — ${reorderReason.trim()}`,
          reorder_reason: reorderReason.trim(),
          ...(kind === 'order' ? { reorder_of_order_id: id } : { reorder_of_custom_order_id: id }),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setReorderErr(data.error || 'Failed to submit reorder request.'); setReorderSubmitting(false); return; }
      setReorderKey(null);
      setReorderReason('');
      setReorderMsg('Reorder request submitted. Our team will review and get back to you.');
      setTimeout(() => setReorderMsg(''), 6000);
      load();
    } catch {
      setReorderErr('Network error. Please try again.');
    }
    setReorderSubmitting(false);
  }

  function ReorderBlock({ kind, id }: { kind: 'order' | 'custom_order'; id: number }) {
    const key = `${kind}-${id}`;
    if (reorderKey === key) {
      return (
        <div style={{ marginTop: 10, padding: 12, borderRadius: 8, border: '1px solid var(--border-card)', background: 'rgba(27,61,94,0.03)' }}>
          <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Why do you need a reorder?</label>
          <textarea
            className="skeu-input" style={{ width: '100%', minHeight: 60, resize: 'vertical' }}
            value={reorderReason} onChange={e => setReorderReason(e.target.value)}
            placeholder="e.g. it broke, it's too short now, it's worn out…"
          />
          {reorderErr && <div style={{ marginTop: 6, fontSize: '0.8rem', color: '#b91c1c' }}>{reorderErr}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="skeu-btn-accent" onClick={() => submitReorder(kind, id)} disabled={reorderSubmitting} style={{ padding: '7px 16px', fontSize: '0.82rem' }}>
              {reorderSubmitting ? 'Submitting…' : 'Submit Request'}
            </button>
            <button onClick={() => setReorderKey(null)} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', fontWeight: 600, color: 'var(--text-body)', fontSize: '0.82rem' }}>
              Cancel
            </button>
          </div>
        </div>
      );
    }
    return (
      <button
        onClick={() => startReorder(key)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(27,61,94,0.2)', background: 'rgba(27,61,94,0.06)', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
      >
        <RotateCcw size={13} /> Request Reorder
      </button>
    );
  }

  const hasOrders = stdOrders.length > 0 || customOrders.length > 0;

  return (
    <div className="dash-content">
      <div className="dash-page-header" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ShoppingCart size={22} color="var(--primary)" />
        </div>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>My Orders</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>Orders and invoices sent to you</p>
        </div>
      </div>

      <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(27,61,94,0.05)', borderRadius: 10, fontSize: '0.85rem', color: 'var(--text-body)', lineHeight: 1.5 }}>
        New orders are placed by your doctor, P&amp;O specialist, or the clinic — but if something you already have needs replacing (broken, outgrown, worn out), you can request a reorder below.
      </div>

      {payErr && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 16 }}>{payErr}</div>
      )}
      {reorderMsg && (
        <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 16 }}>{reorderMsg}</div>
      )}

      {dataLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>
      ) : !hasOrders ? (
        <div className="skeu-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <ShoppingCart size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 8 }}>No orders yet</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>When your doctor or specialist sends you an invoice, it will appear here.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Standard Orders */}
          {stdOrders.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 14 }}>Product Orders</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {stdOrders.map(o => (
                  <div key={o.id} className="skeu-card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 4 }}>Order #{o.id}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDate(o.created_at)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {o.status === 'cancelled' && (
                          <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: '#fee2e2', color: '#b91c1c' }}>Cancelled</span>
                        )}
                        <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: o.payment_status === 'paid' ? '#d1fae5' : '#fee2e2', color: o.payment_status === 'paid' ? '#065f46' : '#b91c1c' }}>
                          {o.payment_status === 'paid' ? 'Paid' : 'Payment Due'}
                        </span>
                      </div>
                    </div>

                    {o.status !== 'cancelled' && (() => {
                      const fs = o.fulfillment_status || 'pending';
                      const fStyle = FULFILLMENT_STYLE[fs] || { bg: '#f3f4f6', color: '#374151' };
                      return (
                        <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: fStyle.bg, color: fStyle.color, fontSize: '0.82rem', fontWeight: 600 }}>
                          {FULFILLMENT_LABEL[fs] || fs.replace(/_/g, ' ')}
                        </div>
                      );
                    })()}

                    {o.items?.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        {o.items.map((item, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < o.items.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none', fontSize: '0.85rem' }}>
                            <Package size={12} color="var(--primary)" style={{ flexShrink: 0 }} />
                            <span style={{ flex: 1, color: 'var(--text-body)' }}>{item.product_name}</span>
                            <span style={{ color: 'var(--text-muted)' }}>x{item.quantity}</span>
                            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{fmt(item.price_at_order * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        {o.payment_status !== 'paid' ? (
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                            {fmt(o.total_amount)} + {fmt(o.service_fee || 100000)} service fee
                            {' = '}
                            <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>{fmt(o.total_amount + (o.service_fee || 100000))} total</strong>
                          </div>
                        ) : (
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>Total paid: {fmt(o.total_amount + (o.service_fee || 100000))}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {(o.fulfillment_status === 'dispatched' || o.fulfillment_status === 'received_by_doctor') && (
                          <button
                            onClick={() => confirmReceipt(o.id)}
                            disabled={confirmingReceipt === o.id}
                            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #065f46', background: '#d1fae5', color: '#065f46', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                          >
                            {confirmingReceipt === o.id ? 'Confirming...' : "Confirm I've Received This"}
                          </button>
                        )}
                        {o.payment_status !== 'paid' && (
                          <button
                            className="skeu-btn-accent"
                            onClick={() => handlePay('order', o.id)}
                            disabled={payingId === `order-${o.id}`}
                          >
                            {payingId === `order-${o.id}` ? 'Processing...' : `Pay ${fmt(o.total_amount + (o.service_fee || 100000))}`}
                          </button>
                        )}
                        {o.payment_status === 'paid' && (
                          <Link href={`/dashboard/patient/receipt/order/${o.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(27,61,94,0.2)', background: 'rgba(27,61,94,0.06)', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
                            <Receipt size={14} /> View Receipt
                          </Link>
                        )}
                      </div>
                    </div>

                    {o.payment_status === 'paid' && <ReorderBlock kind="order" id={o.id} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Orders */}
          {customOrders.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 14 }}>Custom Orders</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {customOrders.map(o => {
                  const ss = CUSTOM_STATUS_STYLE[o.status] || { bg: '#f3f4f6', color: '#374151' };
                  // Not gated on status === 'quoted' — once a price is set, the
                  // bill must stay payable regardless of any later status change,
                  // the same fix already applied to appointments.
                  const canPay = o.payment_status !== 'paid' && !!o.quoted_price;
                  const isReorder = !!(o.reorder_of_order_id || o.reorder_of_custom_order_id);
                  return (
                    <div key={o.id} className="skeu-card" style={{ padding: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 4 }}>
                            {isReorder ? 'Reorder Request' : (o.category ? CATEGORIES_MAP[o.category] || o.category : 'Custom Order')}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDate(o.created_at)}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: ss.bg, color: ss.color }}>{o.status}</span>
                          {o.payment_status === 'paid' && (
                            <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: '#d1fae5', color: '#065f46' }}>Paid</span>
                          )}
                        </div>
                      </div>

                      <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', lineHeight: 1.6, margin: '0 0 12px' }}>{o.description}</p>

                      {o.quoted_price && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {fmt(o.quoted_price)} + ₦1,000 service fee
                            {' = '}
                            <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>{fmt(o.quoted_price + 100000)} total</strong>
                          </div>
                          {canPay && (
                            <button
                              className="skeu-btn-accent"
                              onClick={() => handlePay('custom_order', o.id)}
                              disabled={payingId === `custom_order-${o.id}`}
                            >
                              {payingId === `custom_order-${o.id}` ? 'Processing...' : `Pay ${fmt(o.quoted_price + 100000)}`}
                            </button>
                          )}
                          {o.payment_status === 'paid' && (
                            <Link href={`/dashboard/patient/receipt/custom_order/${o.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(27,61,94,0.2)', background: 'rgba(27,61,94,0.06)', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
                              <Receipt size={14} /> View Receipt
                            </Link>
                          )}
                        </div>
                      )}

                      {o.payment_status === 'paid' && (() => {
                        const fs = o.fulfillment_status || 'pending';
                        const fStyle = FULFILLMENT_STYLE[fs] || { bg: '#f3f4f6', color: '#374151' };
                        return (
                          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                            <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: fStyle.bg, color: fStyle.color }}>
                              {FULFILLMENT_LABEL[fs] || fs.replace(/_/g, ' ')}
                            </span>
                            {(fs === 'dispatched' || fs === 'received_by_doctor') && (
                              <button
                                onClick={() => confirmCustomReceipt(o.id)}
                                disabled={confirmingCustomReceipt === o.id}
                                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #065f46', background: '#d1fae5', color: '#065f46', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                              >
                                {confirmingCustomReceipt === o.id ? 'Confirming...' : "Confirm I've Received This"}
                              </button>
                            )}
                          </div>
                        );
                      })()}

                      {o.status === 'fulfilled' && <ReorderBlock kind="custom_order" id={o.id} />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
