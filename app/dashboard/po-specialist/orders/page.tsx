'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';

interface OrderItem {
  product_name: string;
  quantity: number;
  price_at_order: number;
}

interface POOrder {
  id: number;
  status: string;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  created_at: string;
  patient_name: string;
  hospital_name: string | null;
  items: OrderItem[];
}

function fmt(kobo: number) {
  return '₦' + (kobo / 100).toLocaleString('en-NG');
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    pending:    { bg: '#fef3c7', color: '#b45309' },
    processing: { bg: '#dbeafe', color: '#1d4ed8' },
    fulfilled:  { bg: '#d1fae5', color: '#065f46' },
    cancelled:  { bg: '#fee2e2', color: '#b91c1c' },
  };
  const c = colors[status] || { bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      {status.replace('_', ' ')}
    </span>
  );
}

function formatDate(dt: string) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

const TABS = ['All', 'Pending', 'Processing', 'Fulfilled'] as const;
type Tab = typeof TABS[number];

export default function POOrdersPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<POOrder[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('All');

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'po_specialist') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  useEffect(() => {
    fetch('/api/po-specialist/orders')
      .then(r => r.json())
      .then(data => {
        setOrders(data.orders || []);
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = orders.filter(o => {
    if (activeTab === 'All') return true;
    return o.status.toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <div className="dash-content">
      <div className="dash-page-header" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ShoppingCart size={22} color="var(--primary)" />
        </div>
        <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>My Orders</h1>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '7px 18px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${activeTab === tab ? 'var(--primary)' : 'var(--border-card)'}`,
              background: activeTab === tab ? 'var(--primary)' : 'transparent',
              color: activeTab === tab ? '#fff' : 'var(--text-body)',
              transition: 'all 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {dataLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="skeu-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <ShoppingCart size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 8 }}>No orders found</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            {activeTab !== 'All' ? `No ${activeTab.toLowerCase()} orders.` : 'Orders assigned to you will appear here.'}
          </div>
        </div>
      ) : (
        <div className="skeu-card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(27,61,94,0.04)', borderBottom: '1px solid var(--border-card)' }}>
                {['Patient', 'Status', 'Total (₦)', 'Payment', 'Date', ''].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <>
                  <tr
                    key={o.id}
                    style={{ borderBottom: '1px solid var(--border-card)', cursor: 'pointer' }}
                    onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}
                  >
                    <td style={{ padding: '12px 14px', fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-head)' }}>{o.patient_name}</td>
                    <td style={{ padding: '12px 14px' }}><StatusBadge status={o.status} /></td>
                    <td style={{ padding: '12px 14px', fontSize: '0.88rem', color: 'var(--text-body)', fontWeight: 500 }}>{fmt(o.total_amount || 0)}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600, background: o.payment_status === 'paid' ? '#d1fae5' : '#fef3c7', color: o.payment_status === 'paid' ? '#065f46' : '#b45309' }}>
                        {o.payment_status || 'unpaid'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{formatDate(o.created_at)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {expandedId === o.id ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                    </td>
                  </tr>
                  {expandedId === o.id && (
                    <tr key={`${o.id}-exp`}>
                      <td colSpan={6} style={{ padding: '16px 20px', background: 'rgba(27,61,94,0.02)', borderBottom: '1px solid var(--border-card)' }}>
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>Hospital</div>
                          <div style={{ fontSize: '0.88rem', color: 'var(--text-body)' }}>{o.hospital_name || '—'}</div>
                        </div>
                        {o.items && o.items.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>Order Items</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: 'rgba(27,61,94,0.04)' }}>
                                  <th style={{ padding: '6px 10px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', border: '1px solid var(--border-card)' }}>Product</th>
                                  <th style={{ padding: '6px 10px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', border: '1px solid var(--border-card)' }}>Qty</th>
                                  <th style={{ padding: '6px 10px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', border: '1px solid var(--border-card)' }}>Price</th>
                                </tr>
                              </thead>
                              <tbody>
                                {o.items.map((item, idx) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-card)' }}>
                                    <td style={{ padding: '6px 10px', fontSize: '0.83rem', color: 'var(--text-body)', border: '1px solid var(--border-card)' }}>{item.product_name || '—'}</td>
                                    <td style={{ padding: '6px 10px', fontSize: '0.83rem', color: 'var(--text-body)', textAlign: 'center', border: '1px solid var(--border-card)' }}>{item.quantity}</td>
                                    <td style={{ padding: '6px 10px', fontSize: '0.83rem', color: 'var(--text-body)', textAlign: 'right', border: '1px solid var(--border-card)' }}>{fmt(item.price_at_order)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
