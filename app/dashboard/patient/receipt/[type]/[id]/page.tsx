'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Printer, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ReceiptItem { product_name: string; quantity: number; price_at_order: number; }

interface Receipt {
  type: 'order' | 'custom_order';
  id: number;
  patientName: string;
  createdAt: string;
  items?: ReceiptItem[];
  category?: string | null;
  description?: string;
  productTotal: number;
  serviceFee: number;
  grandTotal: number;
}

function fmt(kobo: number) {
  return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 });
}

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
}

const CATEGORIES_MAP: Record<string, string> = {
  upper_limb: 'Upper Limb', lower_limb: 'Lower Limb', facial: 'Facial', spinal: 'Spinal', other: 'Other',
};

export default function PatientReceiptPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || loading) return;
    fetch(`/api/patient/receipt/${params.type}/${params.id}`)
      .then(r => r.json().then(data => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) { setError(data.error || 'Receipt not found.'); }
        else setReceipt(data);
      })
      .catch(() => setError('Failed to load receipt.'))
      .finally(() => setDataLoading(false));
  }, [user, loading, params.type, params.id]);

  if (loading || dataLoading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'patient') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  if (error || !receipt) {
    return (
      <div className="dash-content">
        <div className="skeu-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>{error || 'Receipt not found.'}</div>
      </div>
    );
  }

  return (
    <div className="dash-content" style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', color: 'var(--text-body)', fontSize: '0.85rem' }}>
          <ArrowLeft size={14} /> Back
        </button>
        <button onClick={() => window.print()} className="skeu-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px' }}>
          <Printer size={15} /> Print / Save as PDF
        </button>
      </div>

      <div className="skeu-card" style={{ padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '2px solid var(--border-card)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', marginBottom: 10 }}>DB</div>
          <div className="font-display" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-head)' }}>DB Prosthetics &amp; Orthotics Ltd</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Payment Receipt</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 24, color: '#16a34a', fontWeight: 700, fontSize: '0.95rem' }}>
          <CheckCircle2 size={18} /> PAID
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, fontSize: '0.88rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Receipt For</div>
            <div style={{ fontWeight: 600, color: 'var(--text-head)' }}>{receipt.patientName}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Date</div>
            <div style={{ fontWeight: 600, color: 'var(--text-head)' }}>{formatDate(receipt.createdAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Reference</div>
            <div style={{ fontWeight: 600, color: 'var(--text-head)', fontFamily: 'monospace' }}>{receipt.type === 'order' ? 'ORD' : 'CUS'}-{receipt.id}</div>
          </div>
          {receipt.category && (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Category</div>
              <div style={{ fontWeight: 600, color: 'var(--text-head)' }}>{CATEGORIES_MAP[receipt.category] || receipt.category}</div>
            </div>
          )}
        </div>

        {receipt.items && receipt.items.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-card)' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Item</th>
                <th style={{ textAlign: 'center', padding: '8px 0', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <td style={{ padding: '8px 0', fontSize: '0.88rem', color: 'var(--text-body)' }}>{item.product_name}</td>
                  <td style={{ padding: '8px 0', fontSize: '0.88rem', color: 'var(--text-body)', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '8px 0', fontSize: '0.88rem', color: 'var(--text-body)', textAlign: 'right' }}>{fmt(item.price_at_order * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {receipt.description && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Description</div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-body)', lineHeight: 1.6 }}>{receipt.description}</div>
          </div>
        )}

        <div style={{ borderTop: '2px solid var(--border-card)', paddingTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-body)', marginBottom: 6 }}>
            <span>{receipt.items ? 'Product Total' : 'Quoted Price'}</span>
            <span>{fmt(receipt.productTotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-body)', marginBottom: 12 }}>
            <span>Service Fee</span>
            <span>{fmt(receipt.serviceFee)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)' }}>
            <span>Total Paid</span>
            <span>{fmt(receipt.grandTotal)}</span>
          </div>
        </div>

        <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid var(--border-card)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Thank you for choosing DB Prosthetics &amp; Orthotics Ltd, Nigeria.
        </div>
      </div>
    </div>
  );
}
