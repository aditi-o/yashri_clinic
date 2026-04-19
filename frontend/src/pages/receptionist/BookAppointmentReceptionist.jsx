import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { receptionistService } from '../../services/receptionistService';
import { PageLoader, Alert, Spinner, FormField } from '../../components/ui';

const SLOTS = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30',
];

export default function BookAppointmentReceptionist() {
  const navigate = useNavigate();
  const [doctors,  setDoctors]  = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);
  const [selDoc,   setSelDoc]   = useState(null);
  const [form, setForm] = useState({
    patientId: '', doctorId: '', appointmentDate: '', appointmentTime: '', reason: '',
  });

  useEffect(() => {
    Promise.all([
      receptionistService.getDoctors().catch(() => ({ data: [] })),
      receptionistService.getPatients().catch(() => ({ data: [] })),
    ]).then(([dr, pt]) => {
      const docList = Array.isArray(dr.data) ? dr.data : [];
      const patList = Array.isArray(pt.data) ? pt.data : [];
      setDoctors(docList);
      setPatients(patList);
      if (docList.length === 0) setError('No doctors found. Please ensure doctors are registered.');
    }).catch(() => setError('Failed to load data. Please refresh the page.'))
      .finally(() => setLoading(false));
  }, []);

  const set = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setError(''); setSuccess(false);
    if (name === 'doctorId') setSelDoc(doctors.find(d => d.id === value) || null);
  };

  const submit = async e => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await receptionistService.bookAppointment({
        patientId:       form.patientId,
        doctorId:        form.doctorId,
        appointmentDate: form.appointmentDate,
        appointmentTime: form.appointmentTime,
        reason:          form.reason,
      });
      setSuccess(true);
      setForm({ patientId:'', doctorId:'', appointmentDate:'', appointmentTime:'', reason:'' });
      setSelDoc(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment.');
    } finally { setSaving(false); }
  };

  if (loading) return <PageLoader label="Loading data…" />;

  return (
    <div className="max-w-2xl mx-auto anim-up">
      <div className="ph">
        <div>
          <h1 className="ph-title">Book Appointment</h1>
          <p className="ph-sub">Schedule a patient appointment with a doctor</p>
        </div>
        <button onClick={() => navigate('/receptionist/dashboard')} className="btn btn-secondary">← Back</button>
      </div>

      <div className="card overflow-hidden p-0">
        {success && (
          <div className="px-6 py-3.5 text-sm font-semibold"
            style={{ background: 'var(--success-light)', color: '#065f46', borderBottom: '1px solid #a7f3d0' }}>
            ✓ Appointment booked successfully!
          </div>
        )}
        {error && (
          <div className="px-6 py-3.5 text-sm font-semibold"
            style={{ background: 'var(--danger-light)', color: '#991b1b', borderBottom: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        <form onSubmit={submit} className="p-6 space-y-5">
          {/* Patient */}
          <FormField label="Select Patient" required>
            <select name="patientId" value={form.patientId} onChange={set} className="inp" required>
              <option value="">Choose a patient…</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} — {p.user?.phone || p.phone}
                </option>
              ))}
            </select>
            {patients.length === 0 && (
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                No patients found.{' '}
                <button type="button" onClick={() => navigate('/receptionist/register-patient')}
                  className="font-semibold underline" style={{ color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Register one first →
                </button>
              </p>
            )}
          </FormField>

          {/* Doctor */}
          <FormField label="Select Doctor" required>
            <select name="doctorId" value={form.doctorId} onChange={set} className="inp" required>
              <option value="">Choose a doctor…</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  Dr. {d.firstName} {d.lastName} — {d.specialization} (₹{d.consultationFee})
                </option>
              ))}
            </select>
          </FormField>

          {/* Doctor preview */}
          {selDoc && (
            <div className="flex items-center gap-4 p-4 rounded-xl anim-in"
              style={{ background: 'var(--brand-light)', border: '1.5px solid #bfdbfe' }}>
              <div className="w-11 h-11 rounded-xl text-white text-sm font-bold flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--brand)' }}>
                {selDoc.firstName[0]}{selDoc.lastName[0]}
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--brand-hover)' }}>
                  Dr. {selDoc.firstName} {selDoc.lastName}
                </p>
                <p className="text-sm" style={{ color: 'var(--brand)' }}>
                  {selDoc.specialization} · {selDoc.experience} yrs exp · ₹{selDoc.consultationFee} fee
                </p>
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Appointment Date" required>
              <input name="appointmentDate" type="date" value={form.appointmentDate} onChange={set}
                min={new Date().toISOString().split('T')[0]} className="inp" required />
            </FormField>
            <FormField label="Time Slot" required>
              <select name="appointmentTime" value={form.appointmentTime} onChange={set} className="inp" required>
                <option value="">Select time…</option>
                {SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
          </div>

          {/* Reason */}
          <FormField label="Reason for Visit">
            <textarea name="reason" value={form.reason} onChange={set} rows={3}
              placeholder="Brief description (optional)" className="inp resize-none" />
          </FormField>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn btn-primary flex-1 py-2.5">
              {saving ? <><Spinner size="sm" />Booking…</> : 'Confirm Appointment'}
            </button>
            <button type="button" onClick={() => navigate('/receptionist/dashboard')} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
