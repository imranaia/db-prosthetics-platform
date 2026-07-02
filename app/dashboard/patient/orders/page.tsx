'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { ShoppingCart, Package } from 'lucide-react';

interface StdOrder {
  id: number;
  total_amount: number;
  status: string;
  payment_status: string;
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
}

const CUSTOM_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:   { bg: '#fef3c7', color: '#b45309' },
  quoted:    { bg: '#dbeafe', color: '#1d4ed8' },
  accepted:  { bg: '#d1fae5', color: '#065f46' },
  rejected:  { bg: '#fee2e2', color: '#b91c1c' },
  paid:      { bg: '#ecfdf5', color: '#059669' },
  fulfilled: { bg: '#f3f4f6', color: '#374151' },
  cancelled: { bg: '#fee2e2', color: '#b91c1c' },
};

const CATEGORIES: Record<string, string> = {
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

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'patient') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

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

      {payErr && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 16 }}>{payErr}</div>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stdOrders.map(o => (
                  <div key={o.id} className="skeu-card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 4 }}>Order #{o.id}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDate(o.created_at)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: '#fef3c7', color: '#b45309' }}>{o.status}</span>
                        <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: o.payment_status === 'paid' ? '#d1fae5' : '#fee2e2', color: o.payment_status === 'paid' ? '#065f46' : '#b91c1c' }}>
                          {o.payment_status === 'paid' ? 'Paid' : 'Payment Due'}
                        </span>
                      </div>
                    </div>

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

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>Total: {fmt(o.total_amount)}</div>
                      {o.payment_status !== 'paid' && (
                        <button
                          className="skeu-btn-accent"
                          onClick={() => handlePay('order', o.id)}
                          disabled={payingId === `order-${o.id}`}
                        >
                          {payingId === `order-${o.id}` ? 'Processing...' : 'Pay Now'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Orders */}
          {customOrders.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 14 }}>Custom Orders</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {customOrders.map(o => {
                  const ss = CUSTOM_STATUS_STYLE[o.status] || { bg: '#f3f4f6', color: '#374151' };
                  const canPay = o.status === 'quoted' && o.payment_status !== 'paid';
                  return (
                    <div key={o.id} className="skeu-card" style={{ padding: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 4 }}>
                            {o.category ? CATEGORIES[o.category] || o.category : 'Custom Order'}
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>Quoted: {fmt(o.quoted_price)}</div>
                          {canPay && (
                            <button
                              className="skeu-btn-accent"
                              onClick={() => handlePay('custom_order', o.id)}
                              disabled={payingId === `custom_order-${o.id}`}
                            >
                              {payingId === `custom_order-${o.id}` ? 'Processing...' : 'Pay Now'}
                            </button>
                          )}
                        </div>
                      )}
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
