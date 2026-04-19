import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { receptionistService } from '../../services/receptionistService';
import { PageLoader, StatCard, SectionHeader, StatusBadge, EmptyState } from '../../components/ui';

const PERM_META = {
  registerPatient:     { label:'Register Patients',    icon:'👤' },
  bookAppointment:     { label:'Book Appointments',    icon:'📅' },
  cancelAppointment:   { label:'Cancel Appointments',  icon:'❌' },
  viewMedicalHistory:  { label:'View Medical History', icon:'🏥' },
  manageSchedule:      { label:'Manage Schedule',      icon:'🗓️' },
  viewBilling:         { label:'View Billing',         icon:'💰' },
};

export default function ReceptionistDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const perms = user?.receptionist?.permissions ?? {};
  const rec   = user?.receptionist;
  const initials = `${rec?.firstName?.[0]||''}${rec?.lastName?.[0]||''}`.toUpperCase();

  const [appts, setAppts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats]   = useState({ total:0, today:0, pending:0 });

  useEffect(() => {
    receptionistService.getAllAppointments().then(r => {
      const all = r.data;
      setAppts(all);
      const td = new Date().toDateString();
      setStats({ total:all.length, today:all.filter(a=>new Date(a.appointmentDate).toDateString()===td).length, pending:all.filter(a=>a.status==='SCHEDULED').length });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const quickActions = [
    perms.registerPatient && { icon:'👤', label:'Register Patient', sub:'Add a new patient',       path:'/receptionist/register-patient', color:'#3b82f6', bg:'#eff6ff' },
    perms.bookAppointment && { icon:'📅', label:'Book Appointment', sub:'Schedule for patient',    path:'/receptionist/book-appointment', color:'#10b981', bg:'#d1fae5' },
    perms.manageSchedule  && { icon:'🗓️',label:'View Schedule',    sub:"Today's appointments",    path:'/receptionist/schedule',         color:'#8b5cf6', bg:'#ede9fe' },
  ].filter(Boolean);

  if (loading) return <PageLoader />;
  const todayAppts = appts.filter(a => new Date(a.appointmentDate).toDateString() === new Date().toDateString());

  return (
    <div className="space-y-6 anim-up">
      {/* Hero */}
      <div style={{
        background:'linear-gradient(135deg,#0c4a6e 0%,#0369a1 50%,#0891b2 100%)',
        borderRadius:20,padding:'1.75rem 2rem',color:'white',position:'relative',overflow:'hidden',
      }}>
        <div style={{ position:'absolute',top:'-40%',right:'-5%',width:280,height:280,borderRadius:'50%',background:'rgba(255,255,255,0.05)' }} />
        <div style={{ position:'relative',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16 }}>
          <div style={{ display:'flex',alignItems:'center',gap:16 }}>
            <div style={{
              width:60,height:60,borderRadius:18,background:'rgba(255,255,255,0.15)',
              backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',
              color:'white',fontSize:22,fontWeight:800,letterSpacing:'-0.02em',flexShrink:0,
            }}>
              {initials||'🧑‍💼'}
            </div>
            <div>
              <p style={{ fontSize:11,fontWeight:600,color:'#7dd3fc',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:4 }}>Receptionist Dashboard</p>
              <h1 style={{ fontSize:'1.6rem',fontWeight:800,fontFamily:'Plus Jakarta Sans,sans-serif',letterSpacing:'-0.02em',lineHeight:1.1 }}>
                {rec?.firstName} {rec?.lastName}
              </h1>
              <p style={{ color:'#bae6fd',fontSize:13,marginTop:4 }}>Front Desk · ClinicMS</p>
            </div>
          </div>
          {perms.registerPatient && (
            <button onClick={() => navigate('/receptionist/register-patient')} className="btn btn-sm"
              style={{ background:'rgba(255,255,255,.15)',color:'white',border:'1px solid rgba(255,255,255,.25)',borderRadius:10 }}>
              + New Patient
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon="📋" label="Total Appts" value={stats.total}   accent="#3b82f6" bg="#eff6ff" />
        <StatCard icon="📅" label="Today"       value={stats.today}   accent="#10b981" bg="#d1fae5" />
        <StatCard icon="⏳" label="Pending"      value={stats.pending} accent="#f59e0b" bg="#fef3c7" />
      </div>

      {/* Quick actions */}
      {quickActions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map(({ icon, label, sub, path, bg }) => (
            <button key={label} onClick={() => navigate(path)}
              className="card text-left group hover:shadow-lg transition-all hover:-translate-y-1" style={{ cursor:'pointer' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110 flex-shrink-0"
                  style={{ background:bg }}>{icon}</div>
                <div>
                  <p className="font-bold text-sm" style={{ letterSpacing:'-0.01em' }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>{sub}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule */}
        <div className="lg:col-span-2 card">
          <SectionHeader title="Today's Schedule"
            action={perms.manageSchedule && (
              <button onClick={() => navigate('/receptionist/schedule')} className="btn btn-ghost btn-sm" style={{ color:'var(--brand)' }}>
                Full Schedule →
              </button>
            )} />
          {todayAppts.length > 0 ? (
            <div className="space-y-2.5">
              {todayAppts.slice(0,6).map((a, i) => (
                <div key={a.id} className="flex items-center justify-between p-3.5 rounded-2xl transition-all hover:shadow-sm"
                  style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div style={{
                      width:38,height:38,borderRadius:12,
                      background:`linear-gradient(135deg,hsl(${185+i*20},70%,45%),hsl(${200+i*20},65%,40%))`,
                      display:'flex',alignItems:'center',justifyContent:'center',
                      color:'white',fontSize:12,fontWeight:700,flexShrink:0,
                    }}>
                      {a.patient?.firstName?.[0]}{a.patient?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{a.patient?.firstName} {a.patient?.lastName}</p>
                      <p className="text-xs" style={{ color:'var(--text-muted)' }}>Dr. {a.doctor?.firstName} {a.doctor?.lastName} · {a.doctor?.specialization}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">{a.appointmentTime}</span>
                    <StatusBadge status={a.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState icon="🗓️" title="No appointments today" />}
        </div>

        {/* Permissions */}
        <div className="card">
          <SectionHeader title="My Permissions" />
          <div className="space-y-2">
            {Object.entries(PERM_META).map(([key, { label, icon }]) => (
              <div key={key} className="flex items-center gap-2.5 p-2.5 rounded-xl transition-colors"
                style={{ background:perms[key]?'var(--success-light)':'var(--surface-2)' }}>
                <span className="text-sm">{icon}</span>
                <span className="flex-1 text-xs font-semibold" style={{ color:perms[key]?'#065f46':'var(--text-muted)' }}>{label}</span>
                <span style={{ color:perms[key]?'var(--success)':'var(--text-light)', fontWeight:700, fontSize:13 }}>
                  {perms[key] ? '✓' : '✕'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
