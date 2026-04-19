import { useEffect, useState } from 'react';
import { PageLoader, StatCard, SectionHeader } from '../../components/ui';
import {
  BarChart, Bar, AreaChart, Area, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend,
} from 'recharts';
import api from '../../services/api';

const norm = r => { const d = r.data?.data ?? r.data; return Array.isArray(d) ? d : []; };
const fmtINR = n => `₹${Number(n).toLocaleString('en-IN')}`;

const STATUS_COLORS = { SCHEDULED:'#3b82f6', COMPLETED:'#10b981', CANCELLED:'#ef4444', NO_SHOW:'#94a3b8' };
const MONTH_COLORS  = ['#6366f1','#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#f43f5e','#ec4899','#14b8a6','#84cc16','#f97316','#a855f7'];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', padding:'10px 14px', boxShadow:'0 4px 20px rgba(15,23,42,.1)' }}>
      <p style={{ color:'#64748b', fontSize:11, marginBottom:4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#4f46e5', fontWeight:700, fontSize:13 }}>
          {p.dataKey === 'revenue' ? fmtINR(p.value) : p.value}
          {' '}<span style={{ fontWeight:400, fontSize:11, color:'#64748b' }}>{p.name}</span>
        </p>
      ))}
    </div>
  );
};

export default function AdminAnalytics() {
  const [apptData,    setApptData]    = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      // Appointment stats (existing)
      Promise.all([
        api.get('/doctors').then(norm),
        api.get('/patients').then(norm),
        api.get('/appointments').then(norm),
      ]),
      // Revenue stats from new endpoint
      api.get('/analytics/admin/overview').catch(() => null),
    ]).then(([[docs, pats, appts], revRes]) => {
      const today = new Date().toDateString();
      const days  = Array.from({ length:7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate()-(6-i)); return d; });
      const daily = days.map(d => ({
        label: d.toLocaleDateString('en-IN', { weekday:'short', day:'numeric' }),
        count: appts.filter(a => new Date(a.appointmentDate).toDateString() === d.toDateString()).length,
      }));
      const statusCounts = appts.reduce((acc, a) => { acc[a.status]=(acc[a.status]||0)+1; return acc; }, {});
      const statusData   = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
      const completed    = appts.filter(a => a.status === 'COMPLETED').length;
      const cancelled    = appts.filter(a => a.status === 'CANCELLED').length;
      const rate         = appts.length ? Math.round((completed/appts.length)*100) : 0;

      setApptData({ doctors:docs.length, patients:pats.length, total:appts.length,
        today: appts.filter(a => new Date(a.appointmentDate).toDateString() === today).length,
        completed, cancelled, rate, daily, statusData });

      if (revRes) {
        const inner = revRes.data?.data ?? revRes.data;
        setRevenueData(inner);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const weekData   = (revenueData?.dailyStats  || []).map(d => ({
    ...d,
    label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday:'short', day:'numeric' }),
  }));
  const monthData  = revenueData?.monthlyStats || [];
  const topDocs    = revenueData?.topDoctors   || [];
  const summary    = revenueData?.summary      || {};
  const peakMonth  = monthData.length ? monthData.reduce((a,b) => b.revenue > a.revenue ? b : a, monthData[0]) : null;

  return (
    <div className="space-y-6 anim-up">

      {/* ── Hero ── */}
      <div style={{ background:'linear-gradient(135deg,#1e1b4b 0%,#312e81 45%,#4f46e5 100%)',
        borderRadius:20, padding:'1.75rem 2rem', color:'white', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute',top:'-40%',right:'-5%',width:280,height:280,borderRadius:'50%',background:'rgba(255,255,255,0.05)' }} />
        <div style={{ position:'relative' }}>
          <p style={{ fontSize:11,fontWeight:600,color:'#a5b4fc',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6 }}>Analytics Overview</p>
          <h1 style={{ fontSize:'1.6rem',fontWeight:800,fontFamily:'Plus Jakarta Sans,sans-serif',letterSpacing:'-0.02em' }}>Clinic Performance</h1>
          <p style={{ color:'#c7d2fe',fontSize:13,marginTop:4 }}>System-wide metrics, revenue and appointment trends</p>
        </div>
      </div>

      {/* ── Top Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="👨‍⚕️" label="Doctors"         value={apptData?.doctors}                accent="#3b82f6" bg="#eff6ff" />
        <StatCard icon="👥"  label="Patients"         value={apptData?.patients}               accent="#8b5cf6" bg="#ede9fe" />
        <StatCard icon="💰"  label="Today's Revenue"  value={fmtINR(summary.todayRevenue??0)}  accent="#14b8a6" bg="#ccfbf1" />
        <StatCard icon="📊"  label="Total Revenue"    value={fmtINR(summary.totalRevenue??0)}  accent="#10b981" bg="#d1fae5" />
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:'Completion Rate', value:`${apptData?.rate}%`,    color:'#10b981', bg:'#d1fae5', icon:'✅' },
          { label:'Completed',       value:apptData?.completed,     color:'#3b82f6', bg:'#eff6ff', icon:'🏥' },
          { label:'Cancelled',       value:apptData?.cancelled,     color:'#ef4444', bg:'#fee2e2', icon:'❌' },
        ].map(({ label, value, color, bg, icon }) => (
          <div key={label} className="card" style={{ textAlign:'center', padding:'1.25rem' }}>
            <div style={{ width:44,height:44,borderRadius:14,background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,margin:'0 auto 10px' }}>{icon}</div>
            <p style={{ fontSize:28,fontWeight:800,color,fontFamily:'Plus Jakarta Sans,sans-serif',letterSpacing:'-0.03em',lineHeight:1 }}>{value}</p>
            <p style={{ fontSize:12,color:'var(--text-muted)',marginTop:4,fontWeight:600 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Revenue Charts ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Weekly Revenue + Visits combined */}
        <div className="card">
          <SectionHeader title="Weekly Revenue" action={<span className="badge badge-blue">Last 7 days</span>} />
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={weekData} margin={{ top:8,right:8,left:-12,bottom:0 }}>
              <defs>
                <linearGradient id="aRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity={1} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.65} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize:10,fill:'#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="rev" tick={{ fontSize:10,fill:'#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => v>=1000?`₹${(v/1000).toFixed(0)}k`:`₹${v}`} />
              <YAxis yAxisId="pat" orientation="right" tick={{ fontSize:10,fill:'#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill:'rgba(79,70,229,0.05)',radius:6 }} />
              <Bar yAxisId="rev" dataKey="revenue" fill="url(#aRevGrad)" radius={[7,7,0,0]} barSize={24} name="revenue" />
              <Line yAxisId="pat" type="monotone" dataKey="patients" stroke="#10b981" strokeWidth={2}
                dot={{ fill:'#fff',stroke:'#10b981',strokeWidth:2,r:4 }} name="visits" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Revenue area */}
        <div className="card">
          <SectionHeader
            title="Monthly Revenue"
            action={
              <div className="flex items-center gap-2">
                {peakMonth && peakMonth.revenue > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background:'var(--success-light)',color:'var(--success)' }}>
                    Peak: {peakMonth.month} · {fmtINR(peakMonth.revenue)}
                  </span>
                )}
                <span className="badge badge-purple">{new Date().getFullYear()}</span>
              </div>
            }
          />
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={monthData} margin={{ top:8,right:8,left:-12,bottom:0 }}>
              <defs>
                <linearGradient id="mRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize:10,fill:'#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10,fill:'#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => v>=1000?`₹${(v/1000).toFixed(0)}k`:`₹${v}`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5}
                fill="url(#mRevGrad)"
                dot={{ fill:'#fff',stroke:'#4f46e5',strokeWidth:2,r:4 }} name="revenue"
                activeDot={{ r:6,fill:'#4f46e5' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Top Doctors + Appointment Charts ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Top Doctors by Revenue */}
        {topDocs.length > 0 && (
          <div className="card">
            <SectionHeader title="Top Doctors by Revenue" action={<span className="badge badge-teal">All time</span>} />
            <div className="space-y-3 mt-1">
              {topDocs.map((d, i) => {
                const maxRev = topDocs[0].revenue || 1;
                const pct    = Math.round((d.revenue / maxRev) * 100);
                return (
                  <div key={d.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: MONTH_COLORS[i % MONTH_COLORS.length] }}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{d.name}</p>
                          <p className="text-xs" style={{ color:'var(--text-muted)' }}>{d.specialization} · {d.visits} visits</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold" style={{ color:'var(--brand)' }}>{fmtINR(d.revenue)}</p>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background:'var(--border)' }}>
                      <div className="h-1.5 rounded-full transition-all"
                        style={{ width:`${pct}%`, background: MONTH_COLORS[i % MONTH_COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Daily Appointment bar */}
        <div className="card">
          <SectionHeader title="Daily Appointments" action={<span className="badge badge-blue">Last 7 days</span>} />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={apptData?.daily||[]} barSize={28} margin={{ top:8,right:8,left:-12,bottom:0 }}>
              <defs>
                <linearGradient id="apptGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize:11,fill:'#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11,fill:'#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill:'rgba(59,130,246,0.06)',radius:6 }} />
              <Bar dataKey="count" fill="url(#apptGrad)" radius={[8,8,0,0]} name="appointments" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Appointment Status Pie ── */}
      {apptData?.statusData?.length > 0 && (
        <div className="card" style={{ maxWidth:500 }}>
          <SectionHeader title="Appointment Status Breakdown" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={apptData.statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                dataKey="value" paddingAngle={4} cornerRadius={6}>
                {apptData.statusData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip formatter={(val, name) => [val, name]} />
              <Legend iconType="circle" iconSize={8}
                formatter={v => <span style={{ fontSize:12,color:'var(--text-muted)' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
