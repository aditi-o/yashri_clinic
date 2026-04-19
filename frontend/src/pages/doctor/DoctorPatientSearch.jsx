import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import api from '../../services/api';
import { PageLoader, Spinner, EmptyState, StatusBadge, SectionHeader } from '../../components/ui';

/* ── Small sub-components ─────────────────────────────────────────────── */
function VitalChip({ label, value, unit }) {
  if (!value) return null;
  return (
    <div className="text-center p-2.5 rounded-xl" style={{ background:'var(--surface-3,var(--surface-2))' }}>
      <p className="text-xs" style={{ color:'var(--text-muted)' }}>{label}</p>
      <p className="font-bold text-sm mt-0.5">{value}{unit}</p>
    </div>
  );
}

function PatientCard({ patient, onSelect, selected }) {
  const initials = `${patient.firstName?.[0]||''}${patient.lastName?.[0]||''}`.toUpperCase();
  const age = patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth)) / (365.25*24*3600*1000))
    : null;
  return (
    <button
      onClick={() => onSelect(patient)}
      className="w-full text-left p-4 rounded-2xl transition-all hover:shadow-md"
      style={{
        background: selected ? 'var(--brand-light)' : 'var(--surface-2)',
        border: `1.5px solid ${selected ? 'var(--brand)' : 'var(--border)'}`,
        cursor: 'pointer',
      }}
    >
      <div className="flex items-center gap-3">
        <div style={{
          width:42, height:42, borderRadius:12, flexShrink:0,
          background:'linear-gradient(135deg,var(--brand),#6366f1)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'white', fontSize:14, fontWeight:700,
        }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{patient.firstName} {patient.lastName}</p>
          <p className="text-xs mt-0.5 truncate" style={{ color:'var(--text-muted)' }}>
            📞 {patient.user?.phone || '—'}
            {patient.gender ? ` · ${patient.gender.charAt(0)+patient.gender.slice(1).toLowerCase()}` : ''}
            {age ? ` · ${age} yrs` : ''}
            {patient.bloodGroup ? ` · 🩸 ${patient.bloodGroup}` : ''}
          </p>
        </div>
        <svg className="w-4 h-4 flex-shrink-0" style={{ color:'var(--brand)' }}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
      </div>
    </button>
  );
}

/* ── Main page ─────────────────────────────────────────────────────────── */
export default function DoctorPatientSearch() {
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const [query,      setQuery]      = useState('');
  const [results,    setResults]    = useState([]);
  const [searching,  setSearching]  = useState(false);
  const [selected,   setSelected]   = useState(null);   // selected patient object
  const [history,    setHistory]    = useState(null);   // { visits, appointments }
  const [loadingHx,  setLoadingHx]  = useState(false);
  const [openVisit,  setOpenVisit]  = useState(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Load all patients on mount for quick browse
  useEffect(() => {
    patientService.search('').then(r => {
      setResults(Array.isArray(r.data) ? r.data : []);
      setInitialLoaded(true);
    }).catch(() => setInitialLoaded(true));
  }, []);

  // Debounced search
  useEffect(() => {
    if (!initialLoaded) return;
    const t = setTimeout(() => {
      setSearching(true);
      patientService.search(query).then(r => {
        setResults(Array.isArray(r.data) ? r.data : []);
      }).catch(() => {}).finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query, initialLoaded]);

  // Load patient consultation history when selected
  const selectPatient = async (patient) => {
    setSelected(patient);
    setHistory(null);
    setOpenVisit(null);
    setLoadingHx(true);
    try {
      const [visitsRes, apptsRes] = await Promise.all([
        api.get(`/visits?patientId=${patient.id}`).catch(() => ({ data: [] })),
        api.get(`/appointments/patient/${patient.id}`).catch(() => ({ data: [] })),
      ]);
      const visits = Array.isArray(visitsRes.data?.data) ? visitsRes.data.data
        : Array.isArray(visitsRes.data) ? visitsRes.data : [];
      const appts  = Array.isArray(apptsRes.data?.data) ? apptsRes.data.data
        : Array.isArray(apptsRes.data) ? apptsRes.data : [];
      setHistory({ visits, appts });
    } catch (e) {
      setHistory({ visits: [], appts: [] });
    } finally {
      setLoadingHx(false);
    }
  };

  const age = selected?.dateOfBirth
    ? Math.floor((Date.now() - new Date(selected.dateOfBirth)) / (365.25*24*3600*1000))
    : null;

  return (
    <div className="anim-up">
      <div className="ph">
        <div>
          <h1 className="ph-title">Patient Search</h1>
          <p className="ph-sub">Find a patient and view their complete consultation history</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/doctor/register-patient')} className="btn btn-primary btn-sm">
            + Register New Patient
          </button>
          <button onClick={() => navigate('/doctor-dashboard')} className="btn btn-secondary btn-sm">← Back</button>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        {/* ── Left: search + list ── */}
        <div className="w-80 shrink-0 space-y-3">
          {/* Search box */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color:'var(--text-muted)' }}
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
            </svg>
            <input
              ref={searchRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or phone…"
              className="inp pl-9 pr-9"
              autoFocus
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Spinner size="sm" />
              </div>
            )}
            {query && !searching && (
              <button onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                style={{ color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer' }}>
                ✕
              </button>
            )}
          </div>

          {/* Results */}
          {!initialLoaded ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : results.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-3xl mb-2">🔍</p>
              <p className="font-bold text-sm">No patients found</p>
              <p className="text-xs mt-1 mb-3" style={{ color:'var(--text-muted)' }}>
                {query ? `No match for "${query}"` : 'No patients registered yet'}
              </p>
              <button onClick={() => navigate('/doctor/register-patient')}
                className="btn btn-primary btn-sm">
                + Register Patient
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              <p className="text-xs px-1" style={{ color:'var(--text-muted)' }}>
                {results.length} patient{results.length !== 1 ? 's' : ''}
                {query ? ` matching "${query}"` : ''}
              </p>
              {results.map(p => (
                <PatientCard
                  key={p.id}
                  patient={p}
                  selected={selected?.id === p.id}
                  onSelect={selectPatient}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Right: patient detail & history ── */}
        <div className="flex-1 min-w-0">
          {!selected ? (
            <div className="card text-center py-16">
              <p className="text-5xl mb-4">👆</p>
              <p className="font-bold text-base mb-1">Select a patient</p>
              <p className="text-sm" style={{ color:'var(--text-muted)' }}>
                Click any patient on the left to view their profile and consultation history.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Patient header */}
              <div className="card">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div style={{
                      width:56, height:56, borderRadius:16,
                      background:'linear-gradient(135deg,var(--brand),#6366f1)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color:'white', fontSize:18, fontWeight:800, flexShrink:0,
                    }}>
                      {selected.firstName?.[0]}{selected.lastName?.[0]}
                    </div>
                    <div>
                      <h2 className="font-extrabold text-lg" style={{ letterSpacing:'-0.02em' }}>
                        {selected.firstName} {selected.lastName}
                      </h2>
                      <p className="text-sm mt-0.5" style={{ color:'var(--text-muted)' }}>
                        📞 {selected.user?.phone || '—'}
                        {selected.gender ? ` · ${selected.gender.charAt(0)+selected.gender.slice(1).toLowerCase()}` : ''}
                        {age ? ` · ${age} yrs old` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/create-visit')}
                    className="btn btn-primary btn-sm"
                  >
                    + New Visit
                  </button>
                </div>

                {/* Quick facts */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {[
                    ['🩸', 'Blood Group',   selected.bloodGroup || '—'],
                    ['⚠️', 'Allergies',    selected.allergies  || 'None'],
                    ['📅', 'Date of Birth', selected.dateOfBirth
                      ? new Date(selected.dateOfBirth).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})
                      : '—'],
                    ['✉️', 'Email',        selected.email || '—'],
                  ].map(([ico, lbl, val]) => (
                    <div key={lbl} className="p-3 rounded-xl" style={{ background:'var(--surface-2)' }}>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color:'var(--text-muted)' }}>
                        {ico} {lbl}
                      </p>
                      <p className="text-sm font-medium truncate">{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* History */}
              {loadingHx ? (
                <div className="card flex justify-center py-10"><Spinner size="lg" /></div>
              ) : history ? (
                <>
                  {/* Visits */}
                  <div className="card">
                    <SectionHeader
                      title={`Consultation History (${history.visits.length})`}
                    />
                    {history.visits.length === 0 ? (
                      <EmptyState icon="🏥" title="No visits yet"
                        sub="This patient has no recorded consultations." />
                    ) : (
                      <div className="space-y-3">
                        {history.visits.map(v => {
                          const isOpen = openVisit === v.id;
                          return (
                            <div key={v.id} className="rounded-2xl overflow-hidden"
                              style={{ border:'1px solid var(--border)' }}>
                              <button className="w-full text-left p-4 hover:bg-[var(--surface-2)] transition-colors"
                                onClick={() => setOpenVisit(isOpen ? null : v.id)}>
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <div style={{
                                      width:36, height:36, borderRadius:10,
                                      background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                                      display:'flex', alignItems:'center', justifyContent:'center',
                                      color:'white', fontSize:11, fontWeight:700, flexShrink:0,
                                    }}>
                                      {v.doctor?.firstName?.[0]}{v.doctor?.lastName?.[0]}
                                    </div>
                                    <div>
                                      <p className="font-bold text-sm">
                                        {new Date(v.visitDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                                      </p>
                                      <p className="text-xs" style={{ color:'var(--text-muted)' }}>
                                        Dr. {v.doctor?.firstName} {v.doctor?.lastName} · {v.doctor?.specialization}
                                      </p>
                                      <p className="text-xs font-semibold mt-0.5">{v.chiefComplaint}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {v.isCompleted && <StatusBadge status="COMPLETED" />}
                                    <svg className={`w-4 h-4 transition-transform ${isOpen?'rotate-180':''}`}
                                      style={{ color:'var(--text-muted)' }}
                                      fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                                    </svg>
                                  </div>
                                </div>
                              </button>

                              {isOpen && (
                                <div className="px-4 pb-4 space-y-3 pt-1"
                                  style={{ borderTop:'1px solid var(--border)', background:'var(--surface-2)' }}>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                    {v.diagnosis && (
                                      <div>
                                        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color:'var(--text-muted)' }}>Diagnosis</p>
                                        <p className="text-sm">{v.diagnosis}</p>
                                      </div>
                                    )}
                                    {v.symptoms && (
                                      <div>
                                        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color:'var(--text-muted)' }}>Symptoms</p>
                                        <p className="text-sm">{v.symptoms}</p>
                                      </div>
                                    )}
                                  </div>

                                  {v.vitalSigns && (
                                    <div>
                                      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color:'var(--text-muted)' }}>Vital Signs</p>
                                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                        <VitalChip label="Temp" value={v.vitalSigns.temperature} unit="°F" />
                                        <VitalChip label="BP" value={v.vitalSigns.bloodPressure} unit="" />
                                        <VitalChip label="Pulse" value={v.vitalSigns.pulse} unit=" bpm" />
                                        <VitalChip label="Weight" value={v.vitalSigns.weight} unit=" kg" />
                                        <VitalChip label="Height" value={v.vitalSigns.height} unit=" cm" />
                                      </div>
                                    </div>
                                  )}

                                  {v.prescriptions?.length > 0 && (
                                    <div>
                                      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color:'var(--text-muted)' }}>Prescriptions</p>
                                      <div className="space-y-1.5">
                                        {v.prescriptions.map(p => (
                                          <div key={p.id} className="flex gap-3 p-2.5 rounded-xl"
                                            style={{ background:'var(--info-light,#eff6ff)' }}>
                                            <span>💊</span>
                                            <div>
                                              <p className="text-sm font-bold">
                                                {p.medicine?.name}
                                                {p.medicine?.strength && <span className="font-normal text-xs ml-1" style={{ color:'var(--text-muted)' }}>({p.medicine.strength})</span>}
                                              </p>
                                              <p className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>
                                                {[p.dosage, p.frequency, p.duration].filter(Boolean).join(' · ')}
                                              </p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {v.notes && (
                                    <div>
                                      <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color:'var(--text-muted)' }}>Doctor's Notes</p>
                                      <p className="text-sm p-2.5 rounded-xl" style={{ background:'var(--surface-2)' }}>{v.notes}</p>
                                    </div>
                                  )}

                                  {v.followUpDate && (
                                    <p className="text-sm font-medium" style={{ color:'var(--warning,#f59e0b)' }}>
                                      📅 Follow-up: {new Date(v.followUpDate).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
                                    </p>
                                  )}

                                  <div className="flex gap-2 pt-1">
                                    <button
                                      onClick={() => navigate(`/doctor/prescription/${v.id}`)}
                                      className="btn btn-primary btn-sm">
                                      💊 Make / Edit Prescription
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Upcoming appointments */}
                  {history.appts.filter(a => a.status === 'SCHEDULED').length > 0 && (
                    <div className="card">
                      <SectionHeader title="Upcoming Appointments" />
                      <div className="space-y-2.5">
                        {history.appts.filter(a => a.status === 'SCHEDULED').map(a => (
                          <div key={a.id} className="flex items-center justify-between p-3 rounded-xl"
                            style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                            <div>
                              <p className="font-bold text-sm">
                                {new Date(a.appointmentDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})} at {a.appointmentTime}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>
                                {a.reason || 'No reason specified'}
                              </p>
                            </div>
                            <StatusBadge status={a.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
