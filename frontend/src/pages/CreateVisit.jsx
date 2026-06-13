import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { PageLoader, Alert, Spinner, FormField, Modal } from '../components/ui';
import DoctorAssistant from '../features/ai/DoctorAssistant';

const SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

// ── Inline Schedule Appointment Modal ────────────────────────────────────────
function ScheduleAppointmentModal({ onClose, onScheduled }) {
  const [patients, setPatients] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [form, setForm] = useState({
    patientId: '', doctorId: '', appointmentDate: '', appointmentTime: '', reason: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selfDoc, setSelfDoc] = useState(null);

  useEffect(() => {
    // Load doctor profile AND patients in parallel
    Promise.all([
      api.get('/doctors/profile').then(r => r.data?.data ?? r.data),
      api.get('/patients').then(r => r.data?.data ?? (Array.isArray(r.data) ? r.data : [])),
    ])
      .then(([doc, patientList]) => {
        if (doc && doc.id) {
          setSelfDoc(doc);
          setForm(f => ({ ...f, doctorId: doc.id }));
        } else {
          setError('Could not load doctor profile. Please close and try again.');
        }
        setPatients(Array.isArray(patientList) ? patientList : []);
      })
      .catch(() => setError('Failed to load required data. Please close and try again.'))
      .finally(() => setLoadingData(false));
  }, []);

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handlePatientChange = (e) => {
    const value = e.target.value;
    if (value === '__register_patient__') {
      setForm(f => ({ ...f, patientId: '' }));
      onClose();
      navigate('/doctor/register-patient');
      return;
    }
    setForm(f => ({ ...f, patientId: value }));
  };

  const submit = async e => {
    e.preventDefault();
    if (!form.doctorId) return setError('Doctor profile not loaded. Please close and reopen.');
    if (!form.patientId) return setError('Please select a patient.');
    if (!form.appointmentDate || !form.appointmentTime)
      return setError('Please fill all required fields.');
    setSaving(true); setError('');
    try {
      const res = await api.post('/appointments', {
        patientId: form.patientId,
        doctorId: form.doctorId,
        appointmentDate: form.appointmentDate,
        appointmentTime: form.appointmentTime,
        reason: form.reason,
      });
      const appt = res.data?.data ?? res.data;
      onScheduled(appt);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule appointment.');
    } finally { setSaving(false); }
  };

  const today = new Date().toISOString().split('T')[0];

  if (loadingData) return (
    <Modal title="📅 Schedule Appointment" onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-center justify-center py-10 gap-3" style={{ color: 'var(--text-muted)' }}>
        <Spinner size="sm" /> <span>Loading data…</span>
      </div>
    </Modal>
  );

  return (
    <Modal title="📅 Schedule Appointment" onClose={onClose} maxWidth="max-w-lg">
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Patient" required>
          <select name="patientId" value={form.patientId} onChange={handlePatientChange} className="inp" required>
            <option value="">Choose a patient…</option>
            <option value="__register_patient__">+ Register a new patient…</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
                {p.user?.phone ? ` — ${p.user.phone}` : ''}
              </option>
            ))}
          </select>
          {patients.length === 0 && (
            <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                No patients found. Register a patient first.
              </p>
              <button
                type="button"
                onClick={() => { onClose(); navigate('/doctor/register-patient'); }}
                className="btn btn-sm btn-secondary"
              >
                + Register Patient
              </button>
            </div>
          )}
        </FormField>

        <FormField label="Doctor">
          <input
            className="inp"
            value={selfDoc ? `Dr. ${selfDoc.firstName} ${selfDoc.lastName} (${selfDoc.specialization})` : 'Doctor profile unavailable'}
            disabled
            style={{ opacity: 0.7 }}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Date" required>
            <input name="appointmentDate" type="date" value={form.appointmentDate}
              onChange={set} min={today} className="inp" required />
          </FormField>
          <FormField label="Time" required>
            <select name="appointmentTime" value={form.appointmentTime} onChange={set} className="inp" required>
              <option value="">Select time…</option>
              {SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
        </div>

        <FormField label="Reason">
          <input name="reason" value={form.reason} onChange={set}
            placeholder="Reason for visit (optional)" className="inp" />
        </FormField>

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving} className="btn btn-primary flex-1">
            {saving ? <><Spinner size="sm" /> Scheduling…</> : '✓ Schedule Appointment'}
          </button>
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main CreateVisit Page ────────────────────────────────────────────────────
export default function CreateVisit() {
  const navigate = useNavigate();
  const { appointmentId: paramApptId } = useParams();

  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(!paramApptId);
  const [selectedApptId, setSelectedApptId] = useState(paramApptId || '');
  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(!!paramApptId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);

  const [form, setForm] = useState({
    appointmentId: paramApptId || '',
    chiefComplaint: '',
    symptoms: '',
    vitalSigns: { temperature: '', bloodPressure: '', pulse: '', weight: '', height: '' },
    diagnosis: '',
    notes: '',
    followUpDate: '',
    visitFee: '',
  });

  // Load scheduled appointments list
  useEffect(() => {
    if (!paramApptId) {
      api.get('/appointments')
        .then(r => {
          const all = Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : []);
          setAppointments(all.filter(a => a.status === 'SCHEDULED'));
        })
        .catch(() => setError('Failed to load appointments.'))
        .finally(() => setLoadingAppts(false));
    }
  }, [paramApptId]);

  // Load appointment detail once an ID is selected
  useEffect(() => {
    const id = paramApptId || selectedApptId;
    if (!id) return;
    setLoading(true);
    api.get(`/appointments/${id}`)
      .then(r => {
        const data = r.data?.data ?? r.data;
        setAppt(data);
        setForm(f => ({ ...f, appointmentId: id }));
      })
      .catch(() => setError('Failed to load appointment details.'))
      .finally(() => setLoading(false));
  }, [paramApptId, selectedApptId]);

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const setV = e => setForm(f => ({ ...f, vitalSigns: { ...f.vitalSigns, [e.target.name]: e.target.value } }));

  const submit = async e => {
    e.preventDefault();
    if (!form.appointmentId) { setError('Please select an appointment first.'); return; }
    setSaving(true); setError('');
    try {
      const vs = form.vitalSigns;
      const res = await api.post('/visits', {
        ...form,
        vitalSigns: {
          temperature: vs.temperature ? Number(vs.temperature) : undefined,
          bloodPressure: vs.bloodPressure || undefined,
          pulse: vs.pulse ? Number(vs.pulse) : undefined,
          weight: vs.weight ? Number(vs.weight) : undefined,
          height: vs.height ? Number(vs.height) : undefined,
        },
        followUpDate: form.followUpDate || undefined,
        visitFee: form.visitFee ? Number(form.visitFee) : 0,
      });
      const createdVisit = res.data?.data ?? res.data;
      navigate(`/doctor/prescription/${createdVisit.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create visit.');
    } finally { setSaving(false); }
  };

  // After a new appointment is scheduled, add it to the list and auto-select it
  const handleScheduled = (newAppt) => {
    setAppointments(prev => [newAppt, ...prev]);
    setSelectedApptId(newAppt.id);
  };

  if (loadingAppts) return <PageLoader label="Loading appointments…" />;
  if (loading && (paramApptId || selectedApptId)) return <PageLoader label="Loading appointment…" />;

  const patientId = appt?.patient?.id || appt?.patientId || null;
  const showAppointmentPicker = !paramApptId && !appt;

  return (
    <div className="flex gap-6 items-start anim-up">
      {showSchedule && (
        <ScheduleAppointmentModal
          onClose={() => setShowSchedule(false)}
          onScheduled={handleScheduled}
        />
      )}

      {/* ── Visit form ── */}
      <div className="flex-1 min-w-0">
        <div className="ph">
          <div>
            <h1 className="ph-title">Create Visit Record</h1>
            {appt ? (
              <p className="ph-sub">
                {appt.patient.firstName} {appt.patient.lastName} ·{' '}
                {new Date(appt.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {appt.appointmentTime}
              </p>
            ) : (
              <p className="ph-sub">Select an appointment or schedule a new one</p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSchedule(true)} className="btn btn-primary btn-sm">
              + Schedule Appointment
            </button>
            <button onClick={() => navigate('/doctor-dashboard')} className="btn btn-secondary btn-sm">
              ← Back
            </button>
          </div>
        </div>

        {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

        {/* ── Appointment Picker (Step 1) ── */}
        {showAppointmentPicker && (
          <div className="card space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest pb-2"
              style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
              📅 Select Appointment
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              A visit must be linked to a scheduled appointment. Pick one below or schedule a new one.
            </p>

            {appointments.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">🗓️</div>
                <p className="font-bold text-sm mb-1">No scheduled appointments</p>
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                  Schedule a new appointment to begin a visit.
                </p>
                <button onClick={() => setShowSchedule(true)} className="btn btn-primary btn-sm">
                  + Schedule Appointment
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {appointments.map((a, i) => (
                  <button key={a.id} type="button" onClick={() => setSelectedApptId(a.id)}
                    className="w-full text-left p-4 rounded-2xl transition-all hover:shadow-md"
                    style={{ background: 'var(--surface-2)', border: '1.5px solid var(--border)', cursor: 'pointer' }}>
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: `linear-gradient(135deg,hsl(${210 + i * 30},80%,55%),hsl(${230 + i * 30},75%,50%))`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: 13, fontWeight: 700,
                      }}>
                        {a.patient?.firstName?.[0]}{a.patient?.lastName?.[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{a.patient?.firstName} {a.patient?.lastName}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {new Date(a.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {a.appointmentTime}
                          {a.reason ? ` · ${a.reason}` : ''}
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
                        Start Visit →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Visit Form (Step 2) ── */}
        {appt && (
          <div className="card space-y-5">
            {/* Appointment banner */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl"
              style={{ background: 'var(--brand-light)', border: '1.5px solid #bfdbfe' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: 'var(--brand)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 13, fontWeight: 700, flexShrink: 0,
              }}>
                {appt.patient?.firstName?.[0]}{appt.patient?.lastName?.[0]}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ color: 'var(--brand-hover)' }}>
                  {appt.patient?.firstName} {appt.patient?.lastName}
                </p>
                <p className="text-xs" style={{ color: 'var(--brand)' }}>
                  {new Date(appt.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {appt.appointmentTime}
                  {appt.reason ? ` · ${appt.reason}` : ''}
                </p>
              </div>
              {!paramApptId && (
                <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--brand)' }}
                  onClick={() => { setAppt(null); setSelectedApptId(''); setForm(f => ({ ...f, appointmentId: '' })); setError(''); }}>
                  Change
                </button>
              )}
            </div>

            <form onSubmit={submit} className="space-y-5">
              <FormField label="Chief Complaint" required>
                <input name="chiefComplaint" value={form.chiefComplaint} onChange={set}
                  placeholder="Main reason for visit" className="inp" required />
              </FormField>

              <FormField label="Symptoms">
                <textarea name="symptoms" value={form.symptoms} onChange={set}
                  rows={3} placeholder="Describe symptoms" className="inp resize-none" />
              </FormField>

              {/* Vitals */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3 pb-2"
                  style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                  Vital Signs
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    ['Temperature (°F)', 'temperature', 'number', '0.1', '98.6'],
                    ['Blood Pressure', 'bloodPressure', 'text', '', '120/80'],
                    ['Pulse (bpm)', 'pulse', 'number', '', '72'],
                    ['Weight (kg)', 'weight', 'number', '0.1', '70'],
                    ['Height (cm)', 'height', 'number', '', '170'],
                  ].map(([lbl, name, type, step, ph]) => (
                    <FormField key={name} label={lbl}>
                      <input name={name} type={type} step={step || undefined}
                        value={form.vitalSigns[name]} onChange={setV}
                        placeholder={ph} className="inp" />
                    </FormField>
                  ))}
                </div>
              </div>

              <FormField label="Diagnosis" required>
                <textarea name="diagnosis" value={form.diagnosis} onChange={set}
                  rows={3} placeholder="Medical diagnosis" className="inp resize-none" required />
              </FormField>

              <FormField label="Doctor's Notes">
                <textarea name="notes" value={form.notes} onChange={set}
                  rows={3} placeholder="Additional notes and recommendations" className="inp resize-none" />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Follow-up Date">
                  <input name="followUpDate" type="date" value={form.followUpDate} onChange={set}
                    min={new Date().toISOString().split('T')[0]} className="inp" />
                </FormField>

                {/* ── Visit Fee — drives revenue analytics ── */}
                <FormField label="Visit Fee (₹)" required
                  hint="This fee is recorded for revenue reporting">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-sm"
                      style={{ color: 'var(--text-muted)' }}>₹</span>
                    <input
                      name="visitFee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.visitFee}
                      onChange={set}
                      placeholder="0.00"
                      className="inp pl-7"
                      required
                    />
                  </div>
                </FormField>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn btn-primary flex-1 py-2.5">
                  {saving ? <><Spinner size="sm" />Saving…</> : '✓ Create Visit Record'}
                </button>
                <button type="button" onClick={() => navigate('/doctor-dashboard')} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ── AI Assistant sidebar ── */}
      <div className="w-80 shrink-0 hidden lg:block sticky top-6">
        {patientId ? <DoctorAssistant patientId={patientId} /> : (
          <div className="card text-center py-10">
            <div className="text-4xl mb-3">🧠</div>
            <p className="font-bold text-sm mb-1">AI Patient Summary</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Select an appointment to see AI insights.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
