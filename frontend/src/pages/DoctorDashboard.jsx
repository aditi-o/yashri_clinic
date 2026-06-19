import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorService } from '../services/doctorService';
import { analyticsService } from '../services/analyticsService';
import { PageLoader, StatCard, SectionHeader, StatusBadge, EmptyState } from '../components/ui';
import api from '../services/api';
import {
  BarChart, Bar, AreaChart, Area, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const fmtDate = d => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
const fmtINR = n => `₹${Number(n).toLocaleString('en-IN')}`;

const ChartTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '10px 14px', boxShadow: '0 4px 20px rgba(15,23,42,.1)' }}>
      <p style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#1e40af', fontWeight: 700, fontSize: 13 }}>
          {p.name === 'revenue' ? fmtINR(p.value) : `${p.value}${suffix}`}
          {' '}<span style={{ fontWeight: 400, fontSize: 11, color: '#64748b' }}>{p.name}</span>
        </p>
      ))}
    </div>
  );
};

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [appts, setAppts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ today: 0, pending: 0, completed: 0 });
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);

  const handleDownloadPdf = (visitId) => {
    window.open(`/doctor/prescription/print/${visitId}`, '_blank');
  };

  useEffect(() => {
    Promise.all([
      doctorService.getProfile().catch(() => ({ data: null })),
      doctorService.getAppointments().catch(() => ({ data: [] })),
      analyticsService.getDoctorOverview().catch(() => null),
    ]).then(async ([p, a, an]) => {
      if (p?.data) setProfile(p.data);
      const all = Array.isArray(a.data) ? a.data : [];
      setAppts(all);
      const today = new Date().toDateString();
      const todayA = all.filter(x => new Date(x.appointmentDate).toDateString() === today);
      setStats({ today: todayA.length, pending: all.filter(x => x.status === 'SCHEDULED').length, completed: todayA.filter(x => x.status === 'COMPLETED').length });
      if (an?.data) setAnalytics(an.data);

      if (p?.data?.id) {
        try {
          const visitsResp = await api.get(`/visits?doctorId=${encodeURIComponent(p.data.id)}`);
          const visits = Array.isArray(visitsResp.data?.data) ? visitsResp.data.data : [];
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);
          const fu = visits
            .filter((v) => v.followUpDate && new Date(v.followUpDate) >= todayDate)
            .sort((x, y) => new Date(x.followUpDate) - new Date(y.followUpDate))
            .slice(0, 4);
          setFollowUps(fu);
        } catch {
          setFollowUps([]);
        }
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader label="Loading dashboard…" />;

  const todayAppts = appts.filter(a => new Date(a.appointmentDate).toDateString() === new Date().toDateString());
  const weekData = (analytics?.dailyStats || []).map(d => ({ ...d, label: fmtDate(d.date) }));
  const monthData = (analytics?.monthlyStats || []);
  const todayRev = analytics?.summary?.todayRevenue ?? 0;
  const todayPats = analytics?.summary?.todayPatients ?? 0;
  const totalRevYTD = monthData.reduce((s, m) => s + m.revenue, 0);
  const initials = `${profile?.firstName?.[0] || ''}${profile?.lastName?.[0] || ''}`.toUpperCase();

  // Month with highest revenue for callout
  const peakMonth = monthData.length ? monthData.reduce((a, b) => b.revenue > a.revenue ? b : a, monthData[0]) : null;

  return (
    <div className="space-y-6 anim-up">

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg,#0c1445 0%,#1e3a8a 50%,#2563eb 100%)',
        borderRadius: 20, padding: '1.75rem 2rem', color: 'white', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-40%', right: '-5%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: '-60%', left: '20%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', flexShrink: 0 }}>
              {initials || '👨‍⚕️'}
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Doctor Dashboard</p>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Plus Jakarta Sans,sans-serif', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Dr. {profile?.firstName} {profile?.lastName}
              </h1>
              <p style={{ color: '#bfdbfe', fontSize: 13, marginTop: 4 }}>{profile?.specialization} · {profile?.qualification}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/create-visit')} className="btn btn-sm"
              style={{ background: 'white', color: '#1e40af', fontWeight: 700, borderRadius: 10 }}>
              + New Visit
            </button>
            <button onClick={() => navigate('/doctor/ai-assistant')} className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,.18)', color: 'white', border: '1px solid rgba(255,255,255,.3)', borderRadius: 10, fontWeight: 600 }}>
              🧠 AI Assistant
            </button>
            <button onClick={() => navigate('/receptionist/manage')} className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,.12)', color: 'white', border: '1px solid rgba(255,255,255,.2)', borderRadius: 10 }}>
              👥 Staff
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon="📅" label="Today's Appts" value={stats.today} accent="#3b82f6" bg="#eff6ff" />
        <StatCard icon="⏳" label="Pending" value={stats.pending} accent="#f59e0b" bg="#fef3c7" />
        <StatCard icon="✅" label="Completed Today" value={stats.completed} accent="#10b981" bg="#d1fae5" />
        <StatCard icon="💰" label="Today's Revenue" value={fmtINR(todayRev)} accent="#14b8a6" bg="#ccfbf1" />
        <StatCard icon="🏥" label="YTD Revenue" value={fmtINR(totalRevYTD)} accent="#8b5cf6" bg="#ede9fe" />
      </div>

      {/* ── Revenue Charts ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Weekly Revenue + Patients bar+line */}
        <div className="card">
          <SectionHeader title="This Week" action={<span className="badge badge-blue">7 days</span>} />
          {weekData.some(d => d.revenue > 0 || d.patients > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={weekData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="rev" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
                <YAxis yAxisId="pat" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(59,130,246,0.06)', radius: 6 }} />
                <Bar yAxisId="rev" dataKey="revenue" fill="url(#revGrad)" radius={[7, 7, 0, 0]} barSize={24} name="revenue" />
                <Line yAxisId="pat" type="monotone" dataKey="patients" stroke="#10b981" strokeWidth={2}
                  dot={{ fill: '#fff', stroke: '#10b981', strokeWidth: 2, r: 4 }} name="patients" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <EmptyState icon="📊" title="No visit data this week" sub="Revenue appears once you create visits with fees" />}
        </div>

        {/* Monthly Revenue area chart */}
        <div className="card">
          <SectionHeader
            title="Monthly Revenue"
            action={
              <div className="flex items-center gap-2">
                {peakMonth && peakMonth.revenue > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                    Peak: {peakMonth.month} · {fmtINR(peakMonth.revenue)}
                  </span>
                )}
                <span className="badge badge-purple">{new Date().getFullYear()}</span>
              </div>
            }
          />
          {monthData.some(m => m.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="monthRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
                <Tooltip content={<ChartTooltip prefix="₹" />} />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5}
                  fill="url(#monthRevGrad)"
                  dot={{ fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2, r: 4 }} name="revenue"
                  activeDot={{ r: 6, fill: '#8b5cf6' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState icon="📈" title="No revenue data yet" sub="Monthly trends will appear here" />}
        </div>
      </div>

      {/* ── Today's Schedule + Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 card">
          <SectionHeader title="Today's Schedule" />
          {todayAppts.length > 0 ? (
            <div className="space-y-2.5">
              {todayAppts.map((a, i) => (
                <div key={a.id} className="flex items-center justify-between p-3.5 rounded-2xl transition-all hover:shadow-sm"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: 38, height: 38, borderRadius: 12,
                      background: `linear-gradient(135deg,hsl(${210 + i * 25},80%,55%),hsl(${230 + i * 25},75%,50%))`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0
                    }}>
                      {a.patient.firstName[0]}{a.patient.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{a.patient.firstName} {a.patient.lastName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {a.patient.user?.phone || 'No phone'}{a.reason ? ` · ${a.reason}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold">{a.appointmentTime}</p>
                    <StatusBadge status={a.status} />
                    {a.status === 'SCHEDULED' && (
                      <button onClick={() => navigate(`/create-visit/${a.id}`)} className="btn btn-primary btn-sm">
                        Start
                      </button>
                    )}
                    {a.status === 'COMPLETED' && a.visit?.id && (
                      <>
                        <button onClick={() => navigate(`/doctor/prescription/${a.visit.id}`)} className="btn btn-secondary btn-sm">
                          💊 Rx
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(a.visit.id)}
                          className="btn btn-secondary btn-sm"
                          title="Print prescription">
                          🖨 Print
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState icon="🗓️" title="No appointments today" />}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <SectionHeader title="My Profile"
              action={<button onClick={() => navigate('/doctor/profile/edit')} className="btn btn-ghost btn-sm" style={{ color: 'var(--brand)' }}>Edit →</button>} />
            <div className="space-y-3">
              {[
                ['✉️', 'Email', profile?.email],
                ['🎓', 'Qualification', profile?.qualification],
                ['⏱️', 'Experience', profile?.experience ? `${profile.experience} yrs` : null],
                ['💰', 'Consult Fee', profile?.consultationFee ? fmtINR(profile.consultationFee) : null],
              ].filter(([, , v]) => v).map(([ico, lbl, val]) => (
                <div key={lbl} className="flex items-start gap-2.5 p-2.5 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                  <span className="text-sm mt-0.5">{ico}</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{lbl}</p>
                    <p className="text-sm mt-0.5 font-medium">{val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <SectionHeader title="Upcoming Appointments" />
            {appts.filter(a => a.status === 'SCHEDULED').length > 0 || followUps.length > 0 ? (
              <div className="space-y-2.5">
                {followUps.map((v) => (
                  <div key={`fu-${v.id}`} className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                    style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#92400e' }}>
                        Follow-up · {v.patient?.firstName} {v.patient?.lastName}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#a16207' }}>
                        {new Date(v.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <button onClick={() => navigate('/doctor/patients')} className="btn btn-secondary btn-sm">
                      View
                    </button>
                  </div>
                ))}
                {appts.filter(a => a.status === 'SCHEDULED').slice(0, 4).map(a => (
                  <div key={a.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors hover:bg-[var(--surface-2)]">
                    <div>
                      <p className="text-sm font-semibold">{a.patient.firstName} {a.patient.lastName}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {new Date(a.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {a.appointmentTime}
                      </p>
                    </div>
                    <button onClick={() => navigate(`/create-visit/${a.id}`)} className="btn btn-primary btn-sm">
                      Start
                    </button>
                  </div>
                ))}
              </div>
            ) : <EmptyState icon="📅" title="No upcoming" />}
          </div>
        </div>
      </div>
    </div>
  );
}
