import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLoader, EmptyState } from '../../components/ui';
import DoctorAssistant from '../../features/ai/DoctorAssistant';
import api from '../../services/api';

const norm = r => { const d = r.data?.data ?? r.data; return Array.isArray(d) ? d : []; };

export default function DoctorAIAssistant() {
  const navigate                        = useNavigate();
  const [patients, setPatients]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [q, setQ]                       = useState('');
  const [selectedPatient, setSelected]  = useState(null);

  useEffect(() => {
    api.get('/patients').then(r => setPatients(norm(r))).finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p =>
    `${p.firstName} ${p.lastName} ${p.user?.phone || ''} ${p.email || ''}`
      .toLowerCase().includes(q.toLowerCase())
  );

  if (loading) return <PageLoader label="Loading patients…" />;

  return (
    <div className="space-y-6 anim-up">
      {/* Header */}
      <div className="ph">
        <div>
          <h1 className="ph-title">AI Patient Assistant</h1>
          <p className="ph-sub">Select a patient to generate an AI pre-consultation summary</p>
        </div>
        <button onClick={() => navigate('/doctor-dashboard')} className="btn btn-secondary">
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Patient search list */}
        <div className="lg:col-span-2 card space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            🔍 Search Patient
          </p>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Name, phone, or email…"
            className="inp w-full"
            autoFocus
          />

          {filtered.length === 0 ? (
            <EmptyState icon="👥" title="No patients found" />
          ) : (
            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
              {filtered.map(p => {
                const isSelected = selectedPatient?.id === p.id;
                const age = p.dateOfBirth
                  ? Math.floor((Date.now() - new Date(p.dateOfBirth)) / (365.25 * 24 * 3600 * 1000))
                  : null;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelected(isSelected ? null : p)}
                    className="w-full text-left px-3 py-2.5 rounded-xl transition-all"
                    style={{
                      background: isSelected ? 'var(--azure-light)' : 'var(--surface-2)',
                      border: `1.5px solid ${isSelected ? 'var(--azure)' : 'transparent'}`,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{
                          background: isSelected
                            ? 'linear-gradient(135deg,#1a6cf5,#5b4af5)'
                            : 'linear-gradient(135deg,#94a3b8,#64748b)',
                        }}
                      >
                        {p.firstName?.[0]}{p.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {p.firstName} {p.lastName}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          {p.user?.phone}{age ? ` · ${age} yrs` : ''}{p.bloodGroup ? ` · ${p.bloodGroup}` : ''}
                        </p>
                      </div>
                      {isSelected && (
                        <span className="ml-auto text-xs font-semibold shrink-0" style={{ color: 'var(--azure)' }}>
                          Selected
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Summary panel */}
        <div className="lg:col-span-3">
          {selectedPatient ? (
            <DoctorAssistant patientId={selectedPatient.id} />
          ) : (
            <div
              className="rounded-2xl flex flex-col items-center justify-center text-center py-20"
              style={{ border: '2px dashed var(--border)', background: 'var(--surface)' }}
            >
              <div className="text-5xl mb-4">🧠</div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                Select a patient to generate summary
              </p>
              <p className="text-xs mt-2 max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                The AI will analyze their visits, prescriptions, and vitals to create a pre-consultation briefing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
