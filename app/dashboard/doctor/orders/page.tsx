'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { ShoppingCart, Package, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  category: string;
  type: string;
  price: number;
  description: string;
  image_url?: string;
  in_stock: number;
}

interface Patient {
  id: number;
  full_name: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CustomOrder {
  id: number;
  category: string | null;
  description: string;
  status: string;
  quoted_price: number | null;
  payment_target: string;
  payment_status: string;
  patient_name?: string;
  created_at: string;
}

interface StdOrder {
  id: number;
  patient_name: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_target: string;
  created_at: string;
  items: Array<{ product_name: string; quantity: number; price_at_order: number }>;
}

const CATEGORIES = [
  { value: 'upper_limb', label: 'Upper Limb' },
  { value: 'lower_limb', label: 'Lower Limb' },
  { value: 'facial', label: 'Facial' },
  { value: 'spinal', label: 'Spinal' },
  { value: 'other', label: 'Other' },
];

const CUSTOM_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:   { bg: '#fef3c7', color: '#b45309' },
  quoted:    { bg: '#dbeafe', color: '#1d4ed8' },
  accepted:  { bg: '#d1fae5', color: '#065f46' },
  rejected:  { bg: '#fee2e2', color: '#b91c1c' },
  paid:      { bg: '#ecfdf5', color: '#059669' },
  fulfilled: { bg: '#f3f4f6', color: '#374151' },
  cancelled: { bg: '#fee2e2', color: '#b91c1c' },
};

function fmt(kobo: number) {
  return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 });
}

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DoctorOrdersPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'standard' | 'custom'>('standard');

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [stdOrders, setStdOrders] = useState<StdOrder[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Standard order state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [stdPatientId, setStdPatientId] = useState('');
  const [stdPayTarget, setStdPayTarget] = useState<'creator' | 'patient'>('creator');
  const [stdSubmitting, setStdSubmitting] = useState(false);
  const [stdMsg, setStdMsg] = useState('');
  const [stdErr, setStdErr] = useState('');
  const [expandedStd, setExpandedStd] = useState<number | null>(null);

  // Custom order state
  const [custCategory, setCustCategory] = useState('');
  const [custDesc, setCustDesc] = useState('');
  const [custPatientId, setCustPatientId] = useState('');
  const [custPayTarget, setCustPayTarget] = useState<'creator' | 'patient'>('creator');
  const [custSubmitting, setCustSubmitting] = useState(false);
  const [custMsg, setCustMsg] = useState('');
  const [custErr, setCustErr] = useState('');
  const [expandedCust, setExpandedCust] = useState<number | null>(null);

  async function load() {
    try {
      const [prodRes, consRes, custRes, stdRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/doctor/consultations'),
        fetch('/api/orders/custom'),
        fetch('/api/orders'),
      ]);
      const [prodData, consData, custData, stdData] = await Promise.all([
        prodRes.json(),
        consRes.json(),
        custRes.json(),
        stdRes.json(),
      ]);
      setProducts(Array.isArray(prodData) ? prodData : []);
      setPatients(Array.isArray(consData.patients) ? consData.patients : []);
      setCustomOrders(Array.isArray(custData) ? custData : []);
      setStdOrders(Array.isArray(stdData) ? stdData : []);
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
  if (user.role !== 'doctor') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  function addToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) return prev.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQty(productId: number, qty: number) {
    if (qty < 1) { setCart(prev => prev.filter(c => c.product.id !== productId)); return; }
    setCart(prev => prev.map(c => c.product.id === productId ? { ...c, quantity: qty } : c));
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);

  async function handleStdOrder() {
    setStdErr(''); setStdMsg('');
    if (cart.length === 0) { setStdErr('Cart is empty.'); return; }
    if (!stdPatientId) { setStdErr('Please select a patient.'); return; }
    setStdSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: Number(stdPatientId),
          items: cart.map(c => ({ product_id: c.product.id, quantity: c.quantity })),
          payment_target: stdPayTarget,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setStdErr(data.error || 'Failed to place order.'); setStdSubmitting(false); return; }
      if (stdPayTarget === 'creator') {
        // Initialize Paystack payment
        const payRes = await fetch('/api/payment/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: data.order_id }),
        });
        const payData = await payRes.json();
        if (payData.authorization_url) {
          window.location.href = payData.authorization_url;
          return;
        }
      }
      setStdMsg(stdPayTarget === 'patient' ? 'Invoice sent to patient portal.' : 'Order placed successfully.');
      setCart([]); setStdPatientId(''); setStdPayTarget('creator');
      load();
    } catch {
      setStdErr('Network error. Please try again.');
    }
    setStdSubmitting(false);
  }

  async function handleCustOrder(e: React.FormEvent) {
    e.preventDefault();
    setCustErr(''); setCustMsg('');
    if (!custDesc.trim()) { setCustErr('Description is required.'); return; }
    setCustSubmitting(true);
    try {
      const res = await fetch('/api/orders/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: custCategory || undefined,
          description: custDesc,
          patient_id: custPatientId ? Number(custPatientId) : undefined,
          payment_target: custPayTarget,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCustErr(data.error || 'Failed to submit.'); setCustSubmitting(false); return; }
      setCustMsg('Custom order submitted. Admin will review and quote a price.');
      setCustCategory(''); setCustDesc(''); setCustPatientId(''); setCustPayTarget('creator');
      load();
    } catch {
      setCustErr('Network error. Please try again.');
    }
    setCustSubmitting(false);
  }

  return (
    <div className="dash-content">
      {/* Header */}
      <div className="dash-page-header" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ShoppingCart size={22} color="var(--primary)" />
        </div>
        <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>Parts & Orders</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid var(--border-card)' }}>
        {(['standard', 'custom'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 22px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
              border: 'none', background: 'transparent',
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            {tab === 'standard' ? 'Standard Order' : 'Custom Order'}
          </button>
        ))}
      </div>

      {dataLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>
      ) : activeTab === 'standard' ? (
        <div>
          {/* Products grid */}
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 16 }}>Product Catalog</h2>
          {products.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No products available.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 28 }}>
              {products.map(p => (
                <div key={p.id} className="skeu-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {p.image_url && <img src={p.image_url} alt={p.name} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />}
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-head)' }}>{p.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.category.replace('_', ' ')}</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary)' }}>{fmt(p.price)}</div>
                  <span style={{ alignSelf: 'flex-start', padding: '1px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, background: p.in_stock ? '#d1fae5' : '#fee2e2', color: p.in_stock ? '#065f46' : '#b91c1c' }}>
                    {p.in_stock ? 'In Stock' : 'Out of Stock'}
                  </span>
                  <button
                    onClick={() => addToCart(p)}
                    disabled={!p.in_stock}
                    className="skeu-btn-primary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}
                  >
                    <Plus size={14} /> Add to Cart
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Cart + Order */}
          {cart.length > 0 && (
            <div className="skeu-card" style={{ padding: 20, marginBottom: 24 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 14 }}>Cart</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {cart.map(c => (
                  <div key={c.product.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-card)', background: 'rgba(27,61,94,0.02)' }}>
                    <Package size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-head)' }}>{c.product.name}</span>
                    <input
                      type="number" min={1} value={c.quantity}
                      onChange={e => updateQty(c.product.id, parseInt(e.target.value) || 0)}
                      style={{ width: 54, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-card)', fontSize: '0.85rem', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--primary)', minWidth: 80, textAlign: 'right' }}>{fmt(c.product.price * c.quantity)}</span>
                    <button onClick={() => updateQty(c.product.id, 0)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '1rem', color: 'var(--primary)', marginBottom: 16 }}>
                Total: {fmt(cartTotal)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Patient <span style={{ color: '#dc2626' }}>*</span></label>
                  <select className="skeu-select" style={{ width: '100%' }} value={stdPatientId} onChange={e => setStdPatientId(e.target.value)}>
                    <option value="">Select patient…</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="skeu-label" style={{ display: 'block', marginBottom: 8 }}>Payment</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {(['creator', 'patient'] as const).map(opt => (
                      <button
                        key={opt} type="button"
                        onClick={() => setStdPayTarget(opt)}
                        style={{ flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, border: `2px solid ${stdPayTarget === opt ? 'var(--primary)' : 'var(--border-card)'}`, background: stdPayTarget === opt ? 'rgba(27,61,94,0.07)' : 'transparent', color: stdPayTarget === opt ? 'var(--primary)' : 'var(--text-body)' }}
                      >
                        {opt === 'creator' ? 'Pay Now' : 'Send to Patient'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {stdErr && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 12 }}>{stdErr}</div>}
              {stdMsg && <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 12 }}>{stdMsg}</div>}

              <button className="skeu-btn-primary" onClick={handleStdOrder} disabled={stdSubmitting} style={{ width: '100%' }}>
                {stdSubmitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          )}

          {/* Past standard orders */}
          {stdOrders.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 12 }}>Past Orders</h3>
              <div className="skeu-card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(27,61,94,0.04)', borderBottom: '1px solid var(--border-card)' }}>
                      {['#', 'Patient', 'Total', 'Status', 'Payment', 'Date', ''].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stdOrders.map(o => (
                      <>
                        <tr key={o.id} style={{ borderBottom: '1px solid var(--border-card)', cursor: 'pointer' }} onClick={() => setExpandedStd(expandedStd === o.id ? null : o.id)}>
                          <td style={{ padding: '10px 12px', fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{o.id}</td>
                          <td style={{ padding: '10px 12px', fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-head)' }}>{o.patient_name}</td>
                          <td style={{ padding: '10px 12px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--primary)' }}>{fmt(o.total_amount)}</td>
                          <td style={{ padding: '10px 12px' }}><span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: '#fef3c7', color: '#b45309' }}>{o.status}</span></td>
                          <td style={{ padding: '10px 12px' }}><span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600, background: o.payment_status === 'paid' ? '#d1fae5' : '#fef3c7', color: o.payment_status === 'paid' ? '#065f46' : '#b45309' }}>{o.payment_status}</span></td>
                          <td style={{ padding: '10px 12px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{formatDate(o.created_at)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>{expandedStd === o.id ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}</td>
                        </tr>
                        {expandedStd === o.id && o.items?.length > 0 && (
                          <tr key={`${o.id}-exp`}>
                            <td colSpan={7} style={{ padding: '12px 20px 12px 32px', background: 'rgba(27,61,94,0.02)', borderBottom: '1px solid var(--border-card)' }}>
                              {o.items.map((item, i) => (
                                <div key={i} style={{ display: 'flex', gap: 10, padding: '4px 0', fontSize: '0.85rem', color: 'var(--text-body)' }}>
                                  <Package size={12} color="var(--primary)" style={{ marginTop: 2, flexShrink: 0 }} />
                                  <span style={{ flex: 1 }}>{item.product_name}</span>
                                  <span>x{item.quantity}</span>
                                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{fmt(item.price_at_order * item.quantity)}</span>
                                </div>
                              ))}
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Custom order form */}
          <div className="skeu-card" style={{ padding: 22, marginBottom: 24 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 18 }}>Submit Custom / Bespoke Order</h2>
            <form onSubmit={handleCustOrder}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Category</label>
                  <select className="skeu-select" style={{ width: '100%' }} value={custCategory} onChange={e => setCustCategory(e.target.value)}>
                    <option value="">Select category…</option>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Assign to Patient</label>
                  <select className="skeu-select" style={{ width: '100%' }} value={custPatientId} onChange={e => setCustPatientId(e.target.value)}>
                    <option value="">Optional — select patient</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Description <span style={{ color: '#dc2626' }}>*</span></label>
                <textarea
                  className="skeu-input"
                  style={{ width: '100%', minHeight: 100, resize: 'vertical' }}
                  value={custDesc}
                  onChange={e => setCustDesc(e.target.value)}
                  placeholder="Describe the custom prosthetic requirements, measurements, and any special needs…"
                  required
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 8 }}>Who Pays?</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['creator', 'patient'] as const).map(opt => (
                    <button
                      key={opt} type="button"
                      onClick={() => setCustPayTarget(opt)}
                      style={{ flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, border: `2px solid ${custPayTarget === opt ? 'var(--primary)' : 'var(--border-card)'}`, background: custPayTarget === opt ? 'rgba(27,61,94,0.07)' : 'transparent', color: custPayTarget === opt ? 'var(--primary)' : 'var(--text-body)' }}
                    >
                      {opt === 'creator' ? 'I Pay' : 'Patient Pays'}
                    </button>
                  ))}
                </div>
              </div>
              {custErr && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 12 }}>{custErr}</div>}
              {custMsg && <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 12 }}>{custMsg}</div>}
              <button type="submit" className="skeu-btn-accent" disabled={custSubmitting} style={{ width: '100%' }}>
                {custSubmitting ? 'Submitting...' : 'Submit Custom Order'}
              </button>
            </form>
          </div>

          {/* Custom orders list */}
          {customOrders.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 12 }}>My Custom Orders</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {customOrders.map(o => {
                  const ss = CUSTOM_STATUS_STYLE[o.status] || { bg: '#f3f4f6', color: '#374151' };
                  const isExpanded = expandedCust === o.id;
                  return (
                    <div key={o.id} className="skeu-card" style={{ padding: 0, overflow: 'hidden' }}>
                      <div
                        style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                        onClick={() => setExpandedCust(isExpanded ? null : o.id)}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-head)' }}>
                              {o.category ? CATEGORIES.find(c => c.value === o.category)?.label || o.category : 'Custom Order'}
                              {o.patient_name && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> — {o.patient_name}</span>}
                            </span>
                            <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, background: ss.bg, color: ss.color }}>{o.status}</span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDate(o.created_at)}{o.quoted_price ? ` · Quoted: ${fmt(o.quoted_price)}` : ''}</div>
                        </div>
                        {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                      </div>
                      {isExpanded && (
                        <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--border-card)', paddingTop: 14 }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-body)', lineHeight: 1.6 }}>{o.description}</div>
                          {o.quoted_price && (
                            <div style={{ marginTop: 10, fontSize: '0.88rem', fontWeight: 600, color: 'var(--primary)' }}>Quoted Price: {fmt(o.quoted_price)}</div>
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
