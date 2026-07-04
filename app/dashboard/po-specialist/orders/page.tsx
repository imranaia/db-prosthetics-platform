'use client';

import { useAuth } from '@/hooks/useAuth';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useEffect, useState, useRef } from 'react';
import { ShoppingCart, Package, ChevronDown, ChevronUp, Plus, X, Upload } from 'lucide-react';
import BodySelector, { BodyPart } from '@/components/consultation/BodySelector';

interface Product {
  id: number;
  name: string;
  category: string;
  type: string;
  price: number;
  description: string;
  image_url?: string;
  dimensions?: string;
  material?: string;
  in_stock: number;
}

interface Material {
  id: number;
  name: string;
  description: string | null;
  in_stock: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CustomOrder {
  id: number;
  category: string | null;
  description: string;
  body_parts: string | null;
  status: string;
  quoted_price: number | null;
  payment_target: string;
  payment_status: string;
  patient_name?: string;
  material_id: number | null;
  created_at: string;
}

interface StdOrder {
  id: number;
  patient_name: string;
  total_amount: number;
  status: string;
  payment_status: string;
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

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
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

export default function POOrdersPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'standard' | 'custom'>('standard');

  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [stdOrders, setStdOrders] = useState<StdOrder[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Standard order
  const [cart, setCart] = useState<CartItem[]>([]);
  const [stdPayTarget, setStdPayTarget] = useState<'creator' | 'patient'>('creator');
  const [stdSubmitting, setStdSubmitting] = useState(false);
  const [stdMsg, setStdMsg] = useState('');
  const [stdErr, setStdErr] = useState('');

  // Custom order
  const [custCategory, setCustCategory] = useState('');
  const [custDesc, setCustDesc] = useState('');
  const [custBodyParts, setCustBodyParts] = useState<BodyPart[]>([]);
  const [custMaterialId, setCustMaterialId] = useState('');
  const [custPayTarget, setCustPayTarget] = useState<'creator' | 'patient'>('creator');
  const [custPhotosAffected, setCustPhotosAffected] = useState<string[]>([]);
  const [custPhotosUnaffected, setCustPhotosUnaffected] = useState<string[]>([]);
  const [uploadingAffected, setUploadingAffected] = useState(false);
  const [uploadingUnaffected, setUploadingUnaffected] = useState(false);
  const [custSubmitting, setCustSubmitting] = useState(false);
  const [custMsg, setCustMsg] = useState('');
  const [custErr, setCustErr] = useState('');
  const [expandedCust, setExpandedCust] = useState<number | null>(null);
  const photoAffectedRef = useRef<HTMLInputElement>(null);
  const photoUnaffectedRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const [prodRes, custRes, stdRes, matRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders/custom'),
        fetch('/api/orders'),
        fetch('/api/materials'),
      ]);
      const [prodData, custData, stdData, matData] = await Promise.all([
        prodRes.json(), custRes.json(), stdRes.json(), matRes.json(),
      ]);
      setProducts(Array.isArray(prodData) ? prodData : []);
      setCustomOrders(Array.isArray(custData) ? custData : []);
      setStdOrders(Array.isArray(stdData) ? stdData : []);
      setMaterials(Array.isArray(matData) ? matData : []);
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
  if (user.role !== 'po_specialist') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

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

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'affected' | 'unaffected') {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === 'affected') setUploadingAffected(true);
    else setUploadingUnaffected(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.url) {
      if (type === 'affected') setCustPhotosAffected(prev => [...prev, data.url]);
      else setCustPhotosUnaffected(prev => [...prev, data.url]);
    }
    if (type === 'affected') { setUploadingAffected(false); if (photoAffectedRef.current) photoAffectedRef.current.value = ''; }
    else { setUploadingUnaffected(false); if (photoUnaffectedRef.current) photoUnaffectedRef.current.value = ''; }
  }

  async function handleStdOrder() {
    setStdErr(''); setStdMsg('');
    if (cart.length === 0) { setStdErr('Cart is empty.'); return; }
    setStdSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(c => ({ product_id: c.product.id, quantity: c.quantity })),
          payment_target: stdPayTarget,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setStdErr(data.error || 'Failed to place order.'); setStdSubmitting(false); return; }
      if (stdPayTarget === 'creator' && data.order_id) {
        const payRes = await fetch('/api/payment/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: data.order_id }),
        });
        const payData = await payRes.json();
        if (payData.authorization_url) { window.location.href = payData.authorization_url; return; }
      }
      setStdMsg(stdPayTarget === 'patient' ? 'Invoice sent to patient portal.' : 'Order placed.');
      setCart([]); setStdPayTarget('creator'); load();
    } catch { setStdErr('Network error.'); }
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
          body_parts: custBodyParts.length > 0 ? JSON.stringify(custBodyParts) : undefined,
          material_id: custMaterialId ? Number(custMaterialId) : undefined,
          photos_affected: custPhotosAffected.length > 0 ? custPhotosAffected : undefined,
          photos_unaffected: custPhotosUnaffected.length > 0 ? custPhotosUnaffected : undefined,
          payment_target: custPayTarget,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCustErr(data.error || 'Failed.'); setCustSubmitting(false); return; }
      setCustMsg('Custom order submitted. Admin will review and quote a price.');
      setCustCategory(''); setCustDesc(''); setCustBodyParts([]); setCustMaterialId('');
      setCustPhotosAffected([]); setCustPhotosUnaffected([]); setCustPayTarget('creator');
      load();
    } catch { setCustErr('Network error.'); }
    setCustSubmitting(false);
  }

  const selectedMaterial = materials.find(m => m.id === Number(custMaterialId));

  return (
    <div className="dash-content">
      <div className="dash-page-header" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ShoppingCart size={22} color="var(--primary)" />
        </div>
        <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>Parts & Orders</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid var(--border-card)' }}>
        {(['standard', 'custom'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 22px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
            border: 'none', background: 'transparent',
            color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: -2,
          }}>
            {tab === 'standard' ? 'Standard Order' : 'Custom / Bespoke Order'}
          </button>
        ))}
      </div>

      {dataLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>
      ) : activeTab === 'standard' ? (

        /* ── STANDARD ORDER TAB ── */
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 16 }}>Product Catalogue</h2>
          {products.filter(p => p.in_stock).length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No products available.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14, marginBottom: 28 }}>
              {products.map(p => (
                <div key={p.id} className="skeu-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: 100, background: 'rgba(27,61,94,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={32} color="var(--text-muted)" />
                    </div>
                  )}
                  <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-head)' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{p.category.replace('_', ' ')} · {p.type.replace('_', ' ')}</div>
                    {p.material && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Material: <strong>{p.material}</strong></div>}
                    {p.dimensions && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Size: {p.dimensions}</div>}
                    {p.description && <div style={{ fontSize: '0.78rem', color: 'var(--text-body)', lineHeight: 1.5, marginTop: 2 }}>{p.description}</div>}
                    <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{fmt(p.price)}</div>
                      <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, background: p.in_stock ? '#d1fae5' : '#fee2e2', color: p.in_stock ? '#065f46' : '#b91c1c' }}>
                        {p.in_stock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                    <button onClick={() => addToCart(p)} disabled={!p.in_stock} className="skeu-btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6, fontSize: '0.85rem', padding: '8px' }}>
                      <Plus size={14} /> Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div className="skeu-card" style={{ padding: 20, marginBottom: 24 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 14 }}>Cart</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {cart.map(c => (
                  <div key={c.product.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-card)', background: 'rgba(27,61,94,0.02)' }}>
                    <Package size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-head)' }}>{c.product.name}</span>
                    <input type="number" min={1} value={c.quantity} onChange={e => updateQty(c.product.id, parseInt(e.target.value) || 0)} style={{ width: 54, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-card)', fontSize: '0.85rem', textAlign: 'center' }} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--primary)', minWidth: 80, textAlign: 'right' }}>{fmt(c.product.price * c.quantity)}</span>
                    <button onClick={() => updateQty(c.product.id, 0)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}><X size={14} /></button>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '1rem', color: 'var(--primary)', marginBottom: 16 }}>Total: {fmt(cartTotal)}</div>
              <div style={{ marginBottom: 14 }}>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 8 }}>Payment</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['creator', 'patient'] as const).map(opt => (
                    <button key={opt} type="button" onClick={() => setStdPayTarget(opt)} style={{ flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, border: `2px solid ${stdPayTarget === opt ? 'var(--primary)' : 'var(--border-card)'}`, background: stdPayTarget === opt ? 'rgba(27,61,94,0.07)' : 'transparent', color: stdPayTarget === opt ? 'var(--primary)' : 'var(--text-body)' }}>
                      {opt === 'creator' ? 'Pay Now' : 'Send Invoice to Patient'}
                    </button>
                  ))}
                </div>
              </div>
              {stdErr && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 12 }}>{stdErr}</div>}
              {stdMsg && <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 12 }}>{stdMsg}</div>}
              <button className="skeu-btn-primary" onClick={handleStdOrder} disabled={stdSubmitting} style={{ width: '100%' }}>
                {stdSubmitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          )}

          {stdOrders.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 12 }}>Past Orders</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {stdOrders.map(o => (
                  <div key={o.id} className="skeu-card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{o.id}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatDate(o.created_at)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: '#fef3c7', color: '#b45309' }}>{o.status}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600, background: o.payment_status === 'paid' ? '#d1fae5' : '#fef3c7', color: o.payment_status === 'paid' ? '#065f46' : '#b45309' }}>{o.payment_status}</span>
                    </div>
                    {o.items?.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        {o.items.map((item, i) => (
                          <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: '0.82rem', color: 'var(--text-body)', borderBottom: i < o.items.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                            <Package size={12} color="var(--primary)" style={{ marginTop: 2, flexShrink: 0 }} />
                            <span style={{ flex: 1 }}>{item.product_name}</span>
                            <span style={{ color: 'var(--text-muted)' }}>×{item.quantity}</span>
                            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{fmt(item.price_at_order * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ paddingTop: 8, borderTop: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>{fmt(o.total_amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      ) : (

        /* ── CUSTOM ORDER TAB ── */
        <div>
          <div className="skeu-card" style={{ padding: 24, marginBottom: 24 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 20 }}>Submit Custom / Bespoke Order</h2>
            <form onSubmit={handleCustOrder}>

              {/* Category */}
              <div style={{ marginBottom: 18 }}>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Category</label>
                <select className="skeu-select" style={{ width: '100%', maxWidth: 320 }} value={custCategory} onChange={e => setCustCategory(e.target.value)}>
                  <option value="">Select category…</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* Body Part Selector */}
              <div style={{ marginBottom: 20 }}>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 10 }}>Affected Body Part(s)</label>
                <BodySelector value={custBodyParts} onChange={setCustBodyParts} />
              </div>

              {/* Description */}
              <div style={{ marginBottom: 18 }}>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Description / Requirements <span style={{ color: '#dc2626' }}>*</span></label>
                <textarea className="skeu-input" style={{ width: '100%', minHeight: 100, resize: 'vertical' }} value={custDesc} onChange={e => setCustDesc(e.target.value)} placeholder="Describe the patient's needs, measurements, functional requirements…" required />
              </div>

              {/* Material selection */}
              <div style={{ marginBottom: 18 }}>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 8 }}>Preferred Material</label>
                {materials.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '10px 0' }}>No materials in catalogue yet. Admin will advise.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                    <button type="button" onClick={() => setCustMaterialId('')}
                      style={{ padding: '10px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', border: `2px solid ${!custMaterialId ? 'var(--primary)' : 'var(--border-card)'}`, background: !custMaterialId ? 'rgba(27,61,94,0.07)' : 'transparent' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: !custMaterialId ? 'var(--primary)' : 'var(--text-body)' }}>No preference</div>
                    </button>
                    {materials.map(m => (
                      <button key={m.id} type="button" onClick={() => setCustMaterialId(String(m.id))}
                        style={{ padding: '10px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', border: `2px solid ${custMaterialId === String(m.id) ? (m.in_stock ? 'var(--primary)' : '#f87171') : 'var(--border-card)'}`, background: custMaterialId === String(m.id) ? (m.in_stock ? 'rgba(27,61,94,0.07)' : 'rgba(239,68,68,0.05)') : 'transparent' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: custMaterialId === String(m.id) ? (m.in_stock ? 'var(--primary)' : '#b91c1c') : 'var(--text-head)' }}>{m.name}</div>
                        {m.description && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{m.description}</div>}
                        <div style={{ marginTop: 4 }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: m.in_stock ? '#d1fae5' : '#fee2e2', color: m.in_stock ? '#065f46' : '#b91c1c' }}>
                            {m.in_stock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedMaterial && !selectedMaterial.in_stock && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: '#fef3c7', borderRadius: 8, fontSize: '0.82rem', color: '#b45309' }}>
                    ⚠ This material is currently out of stock. Your order will be placed but fulfillment may be delayed.
                  </div>
                )}
              </div>

              {/* Photo upload - two sections */}
              <div style={{ marginBottom: 18 }}>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 10 }}>Reference Photos</label>
                <div className="form-grid-2" style={{ gap: 16 }}>
                  {/* Affected limb photos */}
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: 8 }}>Affected Limb/Part Photos <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      {custPhotosAffected.map((url, i) => (
                        <div key={i} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-card)' }}>
                          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => setCustPhotosAffected(prev => prev.filter((_, j) => j !== i))}
                            style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => photoAffectedRef.current?.click()} disabled={uploadingAffected}
                        style={{ width: 80, height: 80, borderRadius: 8, border: '2px dashed var(--border-card)', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text-muted)' }}>
                        <Upload size={16} />
                        <span style={{ fontSize: '0.65rem' }}>{uploadingAffected ? 'Uploading…' : 'Add Photo'}</span>
                      </button>
                      <input ref={photoAffectedRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePhotoUpload(e, 'affected')} />
                    </div>
                  </div>

                  {/* Unaffected/healthy reference */}
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: 4 }}>Unaffected/Healthy Reference Part Photos <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8 }}>(Leave empty if not applicable)</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      {custPhotosUnaffected.map((url, i) => (
                        <div key={i} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-card)' }}>
                          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => setCustPhotosUnaffected(prev => prev.filter((_, j) => j !== i))}
                            style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => photoUnaffectedRef.current?.click()} disabled={uploadingUnaffected}
                        style={{ width: 80, height: 80, borderRadius: 8, border: '2px dashed var(--border-card)', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text-muted)' }}>
                        <Upload size={16} />
                        <span style={{ fontSize: '0.65rem' }}>{uploadingUnaffected ? 'Uploading…' : 'Add Photo'}</span>
                      </button>
                      <input ref={photoUnaffectedRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePhotoUpload(e, 'unaffected')} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment target */}
              <div style={{ marginBottom: 20 }}>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 8 }}>Who Pays?</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['creator', 'patient'] as const).map(opt => (
                    <button key={opt} type="button" onClick={() => setCustPayTarget(opt)} style={{ flex: 1, padding: '11px', borderRadius: 8, cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, border: `2px solid ${custPayTarget === opt ? 'var(--primary)' : 'var(--border-card)'}`, background: custPayTarget === opt ? 'rgba(27,61,94,0.07)' : 'transparent', color: custPayTarget === opt ? 'var(--primary)' : 'var(--text-body)' }}>
                      {opt === 'creator' ? 'I Pay (P&O Facility)' : 'Patient Pays'}
                    </button>
                  ))}
                </div>
              </div>

              {custErr && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 12 }}>{custErr}</div>}
              {custMsg && <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 12 }}>{custMsg}</div>}

              <button type="submit" className="skeu-btn-accent" disabled={custSubmitting} style={{ width: '100%' }}>
                {custSubmitting ? 'Submitting…' : 'Submit Custom Order'}
              </button>
            </form>
          </div>

          {/* Past custom orders */}
          {customOrders.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 12 }}>My Custom Orders</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {customOrders.map(o => {
                  const ss = STATUS_STYLE[o.status] || { bg: '#f3f4f6', color: '#374151' };
                  const isExp = expandedCust === o.id;
                  const matName = o.material_id ? materials.find(m => m.id === o.material_id)?.name : null;
                  let bodyPartsArr: BodyPart[] = [];
                  try { if (o.body_parts) bodyPartsArr = JSON.parse(o.body_parts); } catch {}
                  return (
                    <div key={o.id} className="skeu-card" style={{ padding: 0, overflow: 'hidden' }}>
                      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setExpandedCust(isExp ? null : o.id)}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-head)' }}>
                              {o.category ? CATEGORIES.find(c => c.value === o.category)?.label || o.category : 'Custom Order'}
                            </span>
                            <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, background: ss.bg, color: ss.color }}>{o.status}</span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {formatDate(o.created_at)}
                            {o.quoted_price ? ` · Quoted: ${fmt(o.quoted_price)}` : ''}
                            {matName ? ` · Material: ${matName}` : ''}
                          </div>
                        </div>
                        {isExp ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                      </div>
                      {isExp && (
                        <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border-card)', paddingTop: 14 }}>
                          {bodyPartsArr.length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 6 }}>Affected Parts</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {bodyPartsArr.map((bp, i) => (
                                  <span key={i} style={{ padding: '2px 10px', borderRadius: 20, background: '#dbeafe', color: '#1d4ed8', fontSize: '0.78rem', fontWeight: 600 }}>
                                    {bp.label}{bp.subParts?.length > 0 ? ` (${bp.subParts.join(', ')})` : ''}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-body)', lineHeight: 1.6 }}>{o.description}</div>
                          {o.quoted_price && <div style={{ marginTop: 10, fontWeight: 700, color: 'var(--primary)' }}>Quoted: {fmt(o.quoted_price)}</div>}
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
