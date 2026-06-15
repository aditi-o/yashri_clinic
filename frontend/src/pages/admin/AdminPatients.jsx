import { useEffect, useState } from 'react';
import { PageLoader, EmptyState, StatusBadge, Modal, SectionHeader } from '../../components/ui';
import api from '../../services/api';

const norm = r => { const d = r.data?.data ?? r.data; return Array.isArray(d) ? d : []; };

function PatientDetailModal({ patient, onClose }) {
  const [visits, setVisits] = useState([]);
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/visits?patientId=${patient.id}`).catch(() => ({ data: [] })),
      api.get(`/appointments/patient/${patient.id}`).catch(() => ({ data: [] })),
    ]).then(([vr, ar]) => {
      setVisits(Array.isArray(vr.data?.data) ? vr.data.data : (Array.isArray(vr.data) ? vr.data : []));
      setAppts(Array.isArray(ar.data?.data) ? ar.data.data : (Array.isArray(ar.data) ? ar.data : []));
    }).finally(() => setLoading(false));
  }, [patient.id]);

  const age = patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <Modal title={`${patient.firstName} ${patient.lastName}`} onClose={onClose} maxWidth="max-w-2xl">
      {/* Info grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {[
          ['📞', 'Phone', patient.user?.phone || '—'],
          ['✉️', 'Email', patient.email || '—'],
          ['🩸', 'Blood Group', patient.bloodGroup || '—'],
          ['👤', 'Gender', patient.gender ? patient.gender[0] + patient.gender.slice(1).toLowerCase() : '—'],
          ['🎂', 'Age', age ? `${age} yrs` : '—'],
          ['⚠️', 'Allergies', patient.allergies || 'None'],
        ].map(([ico, lbl, val]) => (
          <div key={lbl} className="p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>{ico} {lbl}</p>
            <p className="text-sm font-medium truncate">{val}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>Loading records…</div>
      ) : (
        <div className="space-y-4">
          {/* Visits */}
          <div>
            <SectionHeader title={`Consultations (${visits.length})`} />
            {visits.length === 0
              ? <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No visits recorded.</p>
              : <div className="space-y-2 max-h-48 overflow-y-auto">
                {visits.map(v => (
                  <div key={v.id} className="p-3 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <p className="font-bold text-sm">
                      {new Date(v.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' — '}{v.chiefComplaint}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Dr. {v.doctor?.firstName} {v.doctor?.lastName} · {v.doctor?.specialization}
                    </p>
                    {v.diagnosis && <p className="text-xs mt-0.5 italic">{v.diagnosis}</p>}
                  </div>
                ))}
              </div>
            }
          </div>
          {/* Appointments */}
          <div>
            <SectionHeader title={`Appointments (${appts.length})`} />
            {appts.length === 0
              ? <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No appointments.</p>
              : <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {appts.slice(0, 8).map(a => (
                  <div key={a.id} className="flex items-center justify-between p-2.5 rounded-xl"
                    style={{ background: 'var(--surface-2)' }}>
                    <div>
                      <p className="text-sm font-semibold">
                        {new Date(a.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at {a.appointmentTime}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Dr. {a.doctor?.firstName} {a.doctor?.lastName}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            }
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function AdminPatients() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    api.get('/patients').then(r => setList(norm(r))).finally(() => setLoading(false));
  }, []);

  const filtered = list.filter(p =>
    `${p.firstName} ${p.lastName} ${p.user?.phone || ''} ${p.email || ''}`.toLowerCase().includes(q.toLowerCase())
  );

  const handleDelete = async (patient) => {
    if (!window.confirm(`Permanently delete ${patient.firstName} ${patient.lastName}? This will remove related visits, appointments, invoices, and account data.`)) return;
    try {
      await api.delete(`/patients/${patient.id}`);
      setList(prev => prev.filter(item => item.id !== patient.id));
      if (viewing?.id === patient.id) setViewing(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete patient.');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 anim-up">
      {viewing && <PatientDetailModal patient={viewing} onClose={() => setViewing(null)} />}

      <div className="ph">
        <div>
          <h1 className="ph-title">Patients</h1>
          <p className="ph-sub">{list.length} registered</p>
        </div>
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search by name, phone…" className="inp" style={{ maxWidth: 240 }} />
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Name</th><th>Phone</th><th>Blood Group</th><th>Gender</th><th>DOB</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {!filtered.length
              ? <tr><td colSpan={6}><EmptyState icon="👥" title="No patients found" /></td></tr>
              : filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        background: 'linear-gradient(135deg,#8b5cf6,#6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: 11, fontWeight: 700
                      }}>
                        {p.firstName?.[0]}{p.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{p.firstName} {p.lastName}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.user?.phone || '—'}</td>
                  <td>{p.bloodGroup ? <span className="badge badge-red">{p.bloodGroup}</span> : '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.gender ? p.gender[0] + p.gender.slice(1).toLowerCase() : '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => setViewing(p)}
                        className="btn btn-sm"
                        style={{ background: 'var(--brand-light)', color: 'var(--brand)', border: '1px solid #bfdbfe' }}>
                        View
                      </button>
                      <button onClick={() => handleDelete(p)}
                        className="btn btn-sm"
                        style={{ background: 'var(--danger-light)', color: '#991b1b', border: '1px solid #fca5a5' }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
