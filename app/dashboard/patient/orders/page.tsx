'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState, useRef } from 'react';
import { ShoppingCart, Package, Upload, X } from 'lucide-react';
import BodySelector, { BodyPart } from '@/components/consultation/BodySelector';
import ConsentCaptureInline, { ConsentValue, EMPTY_CONSENT } from '@/components/forms/ConsentCaptureInline';

interface StdOrder {
  id: number;
  total_amount: number;
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
}

interface Material {
  id: number;
  name: string;
  description: string | null;
  in_stock: number;
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

const CATEGORIES = [
  { value: 'upper_limb', label: 'Upper Limb' },
  { value: 'lower_limb', label: 'Lower Limb' },
  { value: 'facial', label: 'Facial' },
  { value: 'spinal', label: 'Spinal' },
  { value: 'other', label: 'Other' },
];

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

  // Tab
  const [activeTab, setActiveTab] = useState<'orders' | 'custom'>('orders');

  // Existing orders data
  const [stdOrders, setStdOrders] = useState<StdOrder[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payErr, setPayErr] = useState('');
  const [confirmingReceipt, setConfirmingReceipt] = useState<number | null>(null);

  // Custom order form state
  const [materials, setMaterials] = useState<Material[]>([]);
  const [custCategory, setCustCategory] = useState('');
  const [custDesc, setCustDesc] = useState('');
  const [custMaterialId, setCustMaterialId] = useState('');
  const [custBodyParts, setCustBodyParts] = useState<BodyPart[]>([]);
  const [custPhotosAffected, setCustPhotosAffected] = useState<string[]>([]);
  const [custPhotosUnaffected, setCustPhotosUnaffected] = useState<string[]>([]);
  const [uploadingAffected, setUploadingAffected] = useState(false);
  const [uploadingUnaffected, setUploadingUnaffected] = useState(false);
  const [custConsent, setCustConsent] = useState<ConsentValue>({ ...EMPTY_CONSENT });
  const [custSubmitting, setCustSubmitting] = useState(false);
  const [custErr, setCustErr] = useState('');
  const [custMsg, setCustMsg] = useState('');

  const photoAffectedRef = useRef<HTMLInputElement>(null);
  const photoUnaffectedRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const [stdRes, custRes, matRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/orders/custom'),
        fetch('/api/materials'),
      ]);
      const [stdData, custData, matData] = await Promise.all([stdRes.json(), custRes.json(), matRes.json()]);
      setStdOrders(Array.isArray(stdData) ? stdData : []);
      setCustomOrders(Array.isArray(custData) ? custData : []);
      setMaterials(Array.isArray(matData) ? matData : []);
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

  const selectedMaterial = materials.find(m => m.id === Number(custMaterialId));

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

  async function handleCustOrder(e: React.FormEvent) {
    e.preventDefault();
    setCustErr(''); setCustMsg('');
    if (!custDesc.trim()) { setCustErr('Description is required.'); return; }
    if (!custConsent.patient_guardian_signature) { setCustErr('Your signature is required to submit a fabrication request.'); return; }
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
          consent: custConsent,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCustErr(data.error || 'Failed to submit.'); setCustSubmitting(false); return; }
      setCustMsg('Custom order submitted. Our team will review and quote a price.');
      setCustCategory(''); setCustDesc(''); setCustMaterialId('');
      setCustBodyParts([]); setCustPhotosAffected([]); setCustPhotosUnaffected([]);
      setCustConsent({ ...EMPTY_CONSENT });
      load();
    } catch {
      setCustErr('Network error. Please try again.');
    }
    setCustSubmitting(false);
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid var(--border-card)' }}>
        {(['orders', 'custom'] as const).map(tab => (
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
            {tab === 'orders' ? 'My Orders' : 'Custom Order'}
          </button>
        ))}
      </div>

      {payErr && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 16 }}>{payErr}</div>
      )}

      {dataLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>
      ) : activeTab === 'orders' ? (
        /* ── MY ORDERS TAB ── */
        !hasOrders ? (
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

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>Total: {fmt(o.total_amount)}</div>
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
                              {payingId === `order-${o.id}` ? 'Processing...' : 'Pay Now'}
                            </button>
                          )}
                        </div>
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
                              {o.category ? CATEGORIES_MAP[o.category] || o.category : 'Custom Order'}
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
        )
      ) : (
        /* ── CUSTOM ORDER TAB ── */
        <div>
          <div className="skeu-card" style={{ padding: 24, marginBottom: 24 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 20 }}>Submit a Custom Order</h2>
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
                <textarea className="skeu-input" style={{ width: '100%', minHeight: 100, resize: 'vertical' }} value={custDesc} onChange={e => setCustDesc(e.target.value)} placeholder="Describe your needs, measurements, functional requirements…" required />
              </div>

              {/* Material selection */}
              <div style={{ marginBottom: 18 }}>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 8 }}>Preferred Material</label>
                {materials.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '10px 0' }}>No materials available. Our team will advise.</div>
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
                    This material is currently out of stock. Your order will be placed but fulfillment may be delayed.
                  </div>
                )}
              </div>

              {/* Photo upload - two sections */}
              <div style={{ marginBottom: 20 }}>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 10 }}>Reference Photos</label>
                <div className="form-grid-2" style={{ gap: 16 }}>
                  {/* Affected limb photos */}
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: 8 }}>Affected Limb/Part <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></div>
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
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: 4 }}>Unaffected Reference Limb <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8 }}>Leave empty if not applicable (e.g., bilateral amputation)</div>
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

              <ConsentCaptureInline value={custConsent} onChange={setCustConsent} />

              {custErr && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 12 }}>{custErr}</div>}
              {custMsg && <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 12 }}>{custMsg}</div>}

              <button type="submit" className="skeu-btn-accent" disabled={custSubmitting} style={{ width: '100%' }}>
                {custSubmitting ? 'Submitting...' : 'Submit Custom Order'}
              </button>
            </form>
          </div>

          {/* Past custom orders */}
          {customOrders.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 12 }}>My Custom Orders</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {customOrders.map(o => {
                  const ss = CUSTOM_STATUS_STYLE[o.status] || { bg: '#f3f4f6', color: '#374151' };
                  const canPay = o.status === 'quoted' && o.payment_status !== 'paid';
                  return (
                    <div key={o.id} className="skeu-card" style={{ padding: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 4 }}>
                            {o.category ? CATEGORIES_MAP[o.category] || o.category : 'Custom Order'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDate(o.created_at)}</div>
                        </div>
                        <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: ss.bg, color: ss.color }}>{o.status}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', lineHeight: 1.6, margin: '0 0 10px' }}>{o.description}</p>
                      {o.quoted_price && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>Quoted: {fmt(o.quoted_price)}</div>
                          {canPay && (
                            <button className="skeu-btn-accent" onClick={() => handlePay('custom_order', o.id)} disabled={payingId === `custom_order-${o.id}`}>
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
