import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppointmentStore } from '../store/appointmentStore';
import { patientService } from '../services/patientService';
import { PageLoader, StatusBadge, EmptyState, SectionHeader } from '../components/ui';
import api from '../services/api';

async function downloadPrescription(visitId) {
  try {
    const response = await api.get(`/visits/${visitId}/prescription`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(new Blob([response.data], { type: 'text/html' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription-${visitId}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    alert('Prescription not available for this visit.');
  }
}

export default function MyAppointments() {
  const navigate = useNavigate();
  const { appointments, fetchAppointments, cancelAppointment, loading } = useAppointmentStore();
  const [followUps, setFollowUps] = useState([]);
  const [fuLoading, setFuLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
    patientService.getFollowUps()
      .then(r => setFollowUps(Array.isArray(r.data) ? r.data : []))
      .catch(() => setFollowUps([]))
      .finally(() => setFuLoading(false));
  }, []);

  const handleCancel = async id => {
    if (!window.confirm('Cancel this appointment?')) return;
    try { await cancelAppointment(id); } catch { alert('Failed to cancel'); }
  };

  if (loading || fuLoading) return <PageLoader label="Loading appointments…" />;

  const upcoming = appointments.filter(a => a.status === 'SCHEDULED');
  const past = appointments.filter(a => a.status !== 'SCHEDULED');

  return (
    <div className="space-y-6 anim-up">
      <div className="ph">
        <div>
          <h1 className="ph-title">My Appointments</h1>
          <p className="ph-sub">{appointments.length} total · {upcoming.length} upcoming</p>
        </div>
        <button onClick={() => navigate('/book-appointment')} className="btn btn-primary">+ Book Appointment</button>
      </div>

      {/* ── Follow-up Reminders ── */}
      {followUps.length > 0 && (
        <div>
          <SectionHeader title="Follow-up Reminders" />
          <div className="space-y-3">
            {followUps.map(v => (
              <div key={v.id} className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
                      📅
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: '#92400e' }}>Follow-up Scheduled by Doctor</p>
                      <p className="text-sm font-semibold mt-0.5">
                        Dr. {v.doctor.firstName} {v.doctor.lastName}
                        <span className="font-normal ml-1" style={{ color: 'var(--text-muted)' }}>· {v.doctor.specialization}</span>
                      </p>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                        📅 {new Date(v.followUpDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {v.diagnosis && (
                        <p className="text-xs mt-1 italic" style={{ color: 'var(--text-muted)' }}>Reason: {v.diagnosis}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg font-semibold flex-shrink-0"
                    style={{ background: '#fef3c7', color: '#92400e' }}>
                    Follow-up
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="card">
          <EmptyState icon="📅" title="No appointments yet" sub="Book your first appointment to get started." />
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <SectionHeader title="Upcoming" />
              <div className="space-y-3">
                {upcoming.map(a => (
                  <div key={a.id} className="card hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl text-white text-sm font-bold flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, var(--brand), var(--purple))' }}>
                          {a.doctor.firstName[0]}{a.doctor.lastName[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-sm">Dr. {a.doctor.firstName} {a.doctor.lastName}</h3>
                            <StatusBadge status={a.status} />
                          </div>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{a.doctor.specialization}</p>
                          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                            📅 {new Date(a.appointmentDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · ⏰ {a.appointmentTime}
                          </p>
                          {a.reason && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>💬 {a.reason}</p>}
                        </div>
                      </div>
                      <button onClick={() => handleCancel(a.id)} className="btn btn-danger btn-sm flex-shrink-0">Cancel</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <SectionHeader title="Past" />
              <div className="space-y-3">
                {past.map(a => (
                  <div key={a.id} className="card" style={{ opacity: 0.85 }}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl text-sm font-bold flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}>
                        {a.doctor.firstName[0]}{a.doctor.lastName[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-sm">Dr. {a.doctor.firstName} {a.doctor.lastName}</h3>
                          <StatusBadge status={a.status} />
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{a.doctor.specialization}</p>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                          {new Date(a.appointmentDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {a.appointmentTime}
                        </p>
                        {a.visit && (
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <p className="text-xs font-semibold" style={{ color: 'var(--success)' }}>
                              ✓ Visit completed
                            </p>
                            {a.visit.followUpDate && (
                              <p className="text-xs font-semibold" style={{ color: '#92400e' }}>
                                📅 Follow-up: {new Date(a.visit.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            )}
                            <button
                              onClick={() => downloadPrescription(a.visit.id)}
                              className="text-xs font-semibold underline"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand)' }}
                            >
                              ⬇ Download Prescription
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
