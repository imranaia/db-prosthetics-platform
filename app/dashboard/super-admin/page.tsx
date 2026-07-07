'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Building2, Users, Stethoscope, ShoppingCart,
  CalendarDays, Package, TrendingUp, CircleDollarSign,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid,
} from 'recharts';

interface Stats {
  hospitals: number; patients: number; doctors: number;
  pending_orders: number; pending_appointments: number; products: number;
  income: number;
  potential_income: number;
  profit: number;
  profit_coverage: number | null;
  potential_profit: number;
  monthly_revenue: { month: string; revenue: number }[];
  orders_by_status: { status: string; count: number }[];
  patient_growth: { month: string; count: number }[];
}

const INCOME_RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'quarter', label: 'Quarter' },
  { key: 'half_year', label: 'Half Year' },
  { key: 'year', label: 'Year' },
  { key: 'all', label: 'All Time' },
] as const;

const STAT_CARDS = [
  { key: 'hospitals',            label: 'Hospitals',            icon: Building2,       color: '#1b3d5e', href: '/dashboard/super-admin/hospitals' },
  { key: 'patients',             label: 'Patients',             icon: Users,           color: '#2563eb', href: '/dashboard/super-admin/patients' },
  { key: 'doctors',              label: 'Doctors',              icon: Stethoscope,     color: '#7c3aed', href: null },
  { key: 'pending_orders',       label: 'Pending Orders',       icon: ShoppingCart,    color: '#b5751f', href: '/dashboard/super-admin/orders' },
  { key: 'pending_appointments', label: 'Pending Appts',        icon: CalendarDays,    color: '#dc2626', href: '/dashboard/super-admin/appointments' },
  { key: 'products',             label: 'Products',             icon: Package,         color: '#059669', href: '/dashboard/super-admin/inventory' },
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending:    '#f59e0b',
  processing: '#3b82f6',
  fulfilled:  '#10b981',
  cancelled:  '#ef4444',
};

function shortMonth(ym: string) {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleString('en', { month: 'short' });
}

function formatNGN(kobo: number) {
  return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 });
}

const CustomTooltipRevenue = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.82rem' }}>
      <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#1b3d5e' }}>{formatNGN(payload[0].value)}</div>
    </div>
  );
};

export default function SuperAdminOverview() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [incomeRange, setIncomeRange] = useState<string>('month');

  useEffect(() => {
    if (!user) return;
    fetch(`/api/admin/stats?range=${incomeRange}`)
      .then(r => r.json())
      .then(data => { setStats(data); setStatsLoading(false); })
      .catch(() => setStatsLoading(false));
  }, [user, incomeRange]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</div>
    </div>
  );

  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  const revenueData = (stats?.monthly_revenue || []).map(r => ({
    month: shortMonth(r.month), revenue: r.revenue,
  }));

  const statusData = (stats?.orders_by_status || []).map(s => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: s.count,
    color: STATUS_COLORS[s.status] || '#9ca3af',
  }));

  const growthData = (stats?.patient_growth || []).map(g => ({
    month: shortMonth(g.month), count: g.count,
  }));

  return (
    <div className="dash-content">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 className="font-display" style={{ fontSize: '1.9rem', fontWeight: 600, color: 'var(--text-head)', lineHeight: 1.2 }}>
          Good day, Super Admin
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px' }}>
          Platform overview and live analytics
        </p>
      </div>

      {/* Income banners */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{
          flex: '1 1 320px',
          background: 'linear-gradient(135deg, var(--primary) 0%, #254f7a 100%)',
          borderRadius: '14px', padding: '20px 24px',
          display: 'flex', alignItems: 'center', gap: '14px',
          boxShadow: '4px 4px 16px rgba(0,0,0,0.25)',
        }}>
          <CircleDollarSign size={28} color="rgba(255,255,255,0.7)" />
          <div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Income — {INCOME_RANGES.find(r => r.key === incomeRange)?.label}
            </div>
            <div style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 700, fontFamily: 'Inter, sans-serif', lineHeight: 1.1 }}>
              {statsLoading || !stats ? '—' : formatNGN(stats.income)}
            </div>
          </div>
        </div>

        <div style={{
          flex: '1 1 320px',
          background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
          borderRadius: '14px', padding: '20px 24px',
          display: 'flex', alignItems: 'center', gap: '14px',
          boxShadow: '4px 4px 16px rgba(0,0,0,0.2)',
        }}>
          <TrendingUp size={28} color="rgba(255,255,255,0.7)" />
          <div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Profit — {INCOME_RANGES.find(r => r.key === incomeRange)?.label}
            </div>
            <div style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 700, fontFamily: 'Inter, sans-serif', lineHeight: 1.1 }}>
              {statsLoading || !stats ? '—' : formatNGN(stats.profit)}
            </div>
            {!statsLoading && stats && stats.profit_coverage != null && stats.profit_coverage < 1 && (
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.7rem', marginTop: 2 }}>
                Based on {Math.round(stats.profit_coverage * 100)}% of sold items with a cost price on record
              </div>
            )}
          </div>
        </div>

        <div style={{
          flex: '1 1 320px',
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          borderRadius: '14px', padding: '20px 24px',
          display: 'flex', alignItems: 'center', gap: '14px',
          boxShadow: '4px 4px 16px rgba(0,0,0,0.2)',
        }}>
          <Package size={28} color="rgba(255,255,255,0.7)" />
          <div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Potential Income (Current Inventory)
            </div>
            <div style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 700, fontFamily: 'Inter, sans-serif', lineHeight: 1.1 }}>
              {statsLoading || !stats ? '—' : formatNGN(stats.potential_income)}
            </div>
            {!statsLoading && stats && (
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.7rem', marginTop: 2 }}>
                Potential Profit: {formatNGN(stats.potential_profit)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Income range filter */}
      <div className="filter-tabs" style={{ marginBottom: '24px' }}>
        {INCOME_RANGES.map(r => (
          <div
            key={r.key}
            className={`filter-tab${incomeRange === r.key ? ' active' : ''}`}
            onClick={() => setIncomeRange(r.key)}
          >
            {r.label}
          </div>
        ))}
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        {STAT_CARDS.map(({ key, label, icon: Icon, color, href }) => {
          const value = stats?.[key] ?? 0;
          return (
            <div
              key={key}
              className="skeu-card"
              onClick={href ? () => router.push(href) : undefined}
              style={{ padding: '20px', opacity: statsLoading ? 0.5 : 1, transition: 'opacity 0.3s', cursor: href ? 'pointer' : 'default' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: color + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={18} color={color} />
                </div>
                <TrendingUp size={14} color="var(--text-muted)" style={{ opacity: 0.5 }} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color, fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
                {statsLoading ? '—' : value.toLocaleString()}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, marginTop: '6px' }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="chart-grid">
        {/* Revenue bar chart */}
        <div className="skeu-card" style={{ padding: '24px', cursor: 'default' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-head)' }}>Monthly Revenue</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Paid orders — last 6 months</div>
          </div>
          {revenueData.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No revenue data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltipRevenue />} />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders by status donut */}
        <div className="skeu-card" style={{ padding: '24px', cursor: 'default' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-head)' }}>Orders by Status</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Breakdown</div>
          </div>
          {statusData.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No orders yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: '0.75rem', color: '#374151' }}>{v}</span>} />
                <Tooltip formatter={(v) => [v, 'Orders']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Patient growth line chart */}
      <div className="skeu-card" style={{ padding: '24px', marginTop: '20px', cursor: 'default' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-head)' }}>Patient Growth</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>New patients registered — last 6 months</div>
        </div>
        {growthData.length === 0 ? (
          <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No patient data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={growthData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip formatter={(v) => [v, 'Patients']} />
              <Line type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: 'var(--accent)', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
