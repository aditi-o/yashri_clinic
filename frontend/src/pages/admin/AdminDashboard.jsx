import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { analyticsService } from '../../services/analyticsService';
import { PageLoader, StatCard, SectionHeader, StatusBadge, EmptyState } from '../../components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const norm = r => { const d = r.data?.data ?? r.data; return Array.isArray(d) ? d : []; };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '10px 14px', boxShadow: '0 4px 20px rgba(15,23,42,.1)' }}>
      <p style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#4f46e5', fontWeight: 700, fontSize: 13 }}>{payload[0].value} appts</p>
    </div>
  );
};

const BAR_COLORS = ['#6366f1', '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];
const fmtINR = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;


export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/doctors').then(norm), api.get('/patients').then(norm),
      api.get('/receptionists').then(norm), api.get('/appointments').then(norm),
      analyticsService.getAdminOverview().catch(() => null),
    ]).then(([docs, pats, recs, appts, analytics]) => {
      const today = new Date().toDateString();
      const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
      const daily = days.map(d => ({
        label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        count: appts.filter(a => new Date(a.appointmentDate).toDateString() === d.toDateString()).length,
      }));
      const summary = analytics?.summary ?? {};
      setData({
        doctors: docs.length, patients: pats.length, recs: recs.length, total: appts.length,
        todayCount: appts.filter(a => new Date(a.appointmentDate).toDateString() === today).length,
        recent: appts.slice(0, 6), daily,
        todayRevenue: summary.todayRevenue ?? 0,
        totalRevenue: summary.totalRevenue ?? 0,
        todayPatients: summary.todayPatients ?? 0,
        topDoctors: analytics?.topDoctors ?? [],
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader label="Loading admin dashboard…" />;

  return (
    <div className="space-y-6 anim-up">
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg,#2e1065 0%,#4c1d95 45%,#7c3aed 100%)',
        borderRadius: 20, padding: '1.25rem 1.5rem', color: 'white', position: 'relative', overflow: 'hidden',
      }} className="sm:p-7">
        <div style={{ position: 'absolute', top: '-40%', right: '-5%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative' }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }} className="sm:text-xs sm:mb-2">Administrator Panel</p>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'Plus Jakarta Sans,sans-serif', letterSpacing: '-0.02em' }} className="sm:text-2xl">System Overview</h1>
          <p style={{ color: '#ddd6fe', fontSize: 12, marginTop: 3 }} className="sm:text-sm">Full access to all clinic operations and data</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon="👨‍⚕️" label="Doctors" value={data?.doctors} accent="#3b82f6" bg="#eff6ff" />
        <StatCard icon="👥" label="Patients" value={data?.patients} accent="#8b5cf6" bg="#ede9fe" />
        <StatCard icon="📅" label="Total Appts" value={data?.total} accent="#10b981" bg="#d1fae5" />
        <StatCard icon="🗓️" label="Today's Appts" value={data?.todayCount} accent="#f59e0b" bg="#fef3c7" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon="💰" label="Today's Revenue" value={fmtINR(data?.todayRevenue)} accent="#14b8a6" bg="#ccfbf1" />
        <StatCard icon="🏥" label="Total Revenue" value={fmtINR(data?.totalRevenue)} accent="#7c3aed" bg="#ede9fe" />
        <StatCard icon="🧑‍💼" label="Receptionists" value={data?.recs} accent="#f59e0b" bg="#fef3c7" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          { icon: '👨‍⚕️', label: 'Manage Doctors', path: '/admin/doctors', color: '#3b82f6', bg: '#eff6ff' },
          { icon: '💳', label: 'Payments', path: '/admin/payments', color: '#14b8a6', bg: '#ccfbf1' },
          { icon: '👥', label: 'All Patients', path: '/admin/patients', color: '#8b5cf6', bg: '#ede9fe' },
          { icon: '📊', label: 'Analytics', path: '/admin/analytics', color: '#10b981', bg: '#d1fae5' },
          { icon: '🧑‍💼', label: 'Manage Staff', path: '/admin/receptionists', color: '#14b8a6', bg: '#ccfbf1' },
          { icon: '🧠', label: 'AI Patient Lookup', path: '/admin/ai', color: '#f59e0b', bg: '#fef3c7' },
        ].map(({ icon, label, path, color, bg }) => (
          <button key={label} onClick={() => navigate(path)}
            className="card text-left group transition-all hover:-translate-y-1 hover:shadow-lg"
            style={{ cursor: 'pointer' }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center text-sm sm:text-base lg:text-lg transition-transform group-hover:scale-110 flex-shrink-0"
                style={{ background: bg }}>{icon}</div>
              <p className="font-bold text-xs sm:text-sm" style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}>{label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Chart + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="lg:col-span-2 card">
          <SectionHeader title="This Week" action={<span className="badge badge-purple">7 days</span>} />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data?.daily || []} barSize={20} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                {BAR_COLORS.map((c, i) => (
                  <linearGradient key={i} id={`bg${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c} stopOpacity={1} />
                    <stop offset="100%" stopColor={c} stopOpacity={0.55} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)', radius: 6 }} />
              <Bar dataKey="count" radius={[7, 7, 0, 0]}>
                {(data?.daily || []).map((_, i) => <Cell key={i} fill={`url(#bg${i})`} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div>
            <SectionHeader title="Recent Appointments"
              action={<button onClick={() => navigate('/admin/appointments')} className="btn btn-ghost btn-sm" style={{ color: 'var(--brand)' }}>View all →</button>} />
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
                <tbody>
                  {!(data?.recent?.length)
                    ? <tr><td colSpan={5}><EmptyState icon="📅" title="No appointments yet" /></td></tr>
                    : data.recent.map(a => (
                      <tr key={a.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                              {a.patient?.firstName?.[0]}{a.patient?.lastName?.[0]}
                            </div>
                            <span className="font-semibold text-sm">{a.patient?.firstName} {a.patient?.lastName}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>Dr. {a.doctor?.firstName} {a.doctor?.lastName}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{new Date(a.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{a.appointmentTime}</td>
                        <td><StatusBadge status={a.status} /></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Doctors by Revenue */}
          {data?.topDoctors?.length > 0 && (
            <div className="card">
              <SectionHeader title="Top Doctors by Revenue" action={<span className="badge badge-purple">All time</span>} />
              <div className="space-y-2.5 mt-2">
                {data.topDoctors.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between gap-3 p-2.5 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                    <div className="flex items-center gap-2.5">
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg,hsl(${210 + i * 25},75%,55%),hsl(${230 + i * 25},70%,50%))`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{d.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.specialization} · {d.visits} visits</p>
                      </div>
                    </div>
                    <p className="font-bold text-sm" style={{ color: 'var(--brand)' }}>{fmtINR(d.revenue)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
