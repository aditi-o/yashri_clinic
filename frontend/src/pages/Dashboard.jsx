import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../services/patientService';
import { appointmentService } from '../services/appointmentService';
import { PageLoader, StatCard, SectionHeader, StatusBadge, EmptyState } from '../components/ui';

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [appts, setAppts] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      patientService.getProfile(),
      appointmentService.getAppointments(),
      patientService.getFollowUps().catch(() => ({ data: [] })),
    ])
      .then(([p, a, f]) => {
        setProfile(p.data);
        const list = Array.isArray(a.data) ? a.data : [];
        const todayStr = new Date().toISOString().split('T')[0];
        setAppts(list.filter(x => x.status === 'SCHEDULED' && x.appointmentDate.slice(0, 10) >= todayStr).slice(0, 4));
        setFollowUps(Array.isArray(f.data) ? f.data.slice(0, 4) : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader label="Loading your dashboard…" />;

  const initials = `${profile?.firstName?.[0] || ''}${profile?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="space-y-6 anim-up">
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg,#1e3a5f 0%,#2563eb 60%,#7c3aed 100%)',
        borderRadius: 20, padding: '1.75rem 2rem', color: 'white', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-40%', right: '-5%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: '-50%', left: '15%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 18, background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', flexShrink: 0,
            }}>
              {initials || '?'}
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Welcome back</p>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Plus Jakarta Sans,sans-serif', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {profile?.firstName} {profile?.lastName}
              </h1>
              <p style={{ color: '#bfdbfe', fontSize: 13, marginTop: 4 }}>Patient · ClinicMS</p>
            </div>
          </div>
          <button onClick={() => navigate('/profile/edit')} className="btn btn-sm"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10 }}>
            ✏️ Edit Profile
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="🩸" label="Blood Group" value={profile?.bloodGroup || '—'} accent="#ef4444" bg="#fee2e2" />
        <StatCard icon="📞" label="Emergency" value={profile?.emergencyContact ? '✓ Set' : 'Not set'} accent="#10b981" bg="#d1fae5" />
        <StatCard icon="⚠️" label="Allergies" value={profile?.allergies || '—'} accent="#f59e0b" bg="#fef3c7" />
        <StatCard icon="📅" label="Upcoming" value={appts.length + followUps.length} accent="#3b82f6" bg="#eff6ff" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: '➕', label: 'Book Appointment', sub: 'Schedule with doctor', path: '/book-appointment', color: '#0ea5e9', bg: '#e0f2fe' },
          { icon: '📋', label: 'My Appointments', sub: 'View upcoming & past', path: '/appointments', color: '#10b981', bg: '#d1fae5' },
          { icon: '🏥', label: 'Medical History', sub: 'Diagnoses & prescriptions', path: '/history', color: '#8b5cf6', bg: '#ede9fe' },
          { icon: '🤖', label: 'AI Health Assistant', sub: 'Ask about your records', path: '/ai-chat', color: '#10b981', bg: '#d1fae5' },
        ].map(({ icon, label, sub, path, color, bg }) => (
          <button key={label} onClick={() => navigate(path)}
            className="card text-left group transition-all hover:-translate-y-1 hover:shadow-lg"
            style={{ cursor: 'pointer' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110 flex-shrink-0"
                style={{ background: bg }}>{icon}</div>
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Upcoming appointments */}
        <div className="lg:col-span-3 card">
          <SectionHeader title="Upcoming Appointments"
            action={<button onClick={() => navigate('/appointments')} className="btn btn-ghost btn-sm" style={{ color: 'var(--brand)' }}>View all →</button>} />
          {appts.length > 0 || followUps.length > 0 ? (
            <div className="space-y-3">
              {followUps.map((v) => (
                <div key={`fu-${v.id}`} className="flex items-center justify-between p-3.5 rounded-2xl"
                  style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#92400e' }}>
                      Follow-up with Dr. {v.doctor?.firstName} {v.doctor?.lastName}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#a16207' }}>
                      {new Date(v.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg font-semibold"
                    style={{ background: '#fef3c7', color: '#92400e' }}>
                    Follow-up
                  </span>
                </div>
              ))}
              {appts.map((a, i) => (
                <div key={a.id} className="flex items-center justify-between p-3.5 rounded-2xl transition-all hover:shadow-sm"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: `linear-gradient(135deg,hsl(${210 + i * 30},75%,55%),hsl(${230 + i * 30},70%,48%))`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>
                      {a.doctor.firstName[0]}{a.doctor.lastName[0]}
                    </div>
                    <div>
                      <p className="font-bold text-sm">Dr. {a.doctor.firstName} {a.doctor.lastName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.doctor.specialization}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-light)' }}>
                        {new Date(a.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {a.appointmentTime}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="📅" title="No upcoming appointments" sub="Contact the clinic reception to book an appointment" />
          )}
        </div>

        {/* Profile sidebar */}
        <div className="lg:col-span-2 card">
          <SectionHeader title="Profile Summary"
            action={<button onClick={() => navigate('/profile/edit')} className="btn btn-ghost btn-sm" style={{ color: 'var(--brand)' }}>Edit →</button>} />
          <div className="space-y-2.5">
            {[
              ['✉️', 'Email', profile?.email],
              ['🩸', 'Blood Group', profile?.bloodGroup],
              ['📞', 'Emergency', profile?.emergencyContact],
              ['⚠️', 'Allergies', profile?.allergies || 'None'],
              ['📍', 'Address', profile?.address],
            ].filter(([, , v]) => v).map(([ico, lbl, val]) => (
              <div key={lbl} className="flex items-start gap-3 p-2.5 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                <span className="text-sm mt-0.5">{ico}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{lbl}</p>
                  <p className="text-sm mt-0.5 truncate font-medium">{val}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
