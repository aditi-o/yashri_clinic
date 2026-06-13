import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { receptionistService } from '../../services/receptionistService';
import { Alert, Spinner, FormField } from '../../components/ui';

const BLOOD = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const blank = {
  firstName: '', lastName: '', phone: '', email: '', password: '',
  dateOfBirth: '', gender: '', address: '', emergencyContact: '',
  bloodGroup: '', allergies: '',
};

export default function RegisterPatient() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registered, setRegistered] = useState(null); // holds last registered patient info
  const [error, setError] = useState('');
  const [form, setForm] = useState({ ...blank });

  const set = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
    setSuccess(false);
  };

  const submit = async e => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const response = await receptionistService.registerPatient(form);
      const payload = response.data?.data ?? response.data;
      setRegistered({ firstName: form.firstName, lastName: form.lastName });
      if (payload?.temporaryCredentials?.phone || payload?.temporaryCredentials?.password) {
        setRegistered(prev => ({ ...prev, ...payload.temporaryCredentials }));
      }
      setSuccess(true);
      setForm({ ...blank });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register patient.');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto anim-up">
      <div className="ph">
        <div>
          <h1 className="ph-title">Register New Patient</h1>
          <p className="ph-sub">Create a patient account in the system</p>
        </div>
        <button onClick={() => navigate('/receptionist/dashboard')} className="btn btn-secondary">← Back</button>
      </div>

      <div className="card overflow-hidden p-0">
        {/* Success banner with workflow CTA */}
        {success && registered && (
          <div className="px-6 py-4" style={{ background: 'var(--success-light)', borderBottom: '1px solid #a7f3d0' }}>
            <p className="text-sm font-bold" style={{ color: '#065f46' }}>
              ✓ {registered.firstName} {registered.lastName} registered successfully!
            </p>
            {registered.phone && (
              <p className="text-xs mt-1" style={{ color: '#047857' }}>
                Temporary login phone: {registered.phone}
              </p>
            )}
            {registered.password && (
              <p className="text-xs mt-1" style={{ color: '#047857' }}>
                Temporary password: {registered.password}
              </p>
            )}
            <p className="text-xs mt-1 mb-3" style={{ color: '#047857' }}>
              What would you like to do next?
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => navigate('/receptionist/book-appointment')}
                className="btn btn-sm"
                style={{ background: '#059669', color: 'white', border: 'none' }}
              >
                📅 Book Appointment for this Patient
              </button>
              <button
                onClick={() => { setSuccess(false); setRegistered(null); }}
                className="btn btn-sm btn-secondary"
              >
                + Register Another Patient
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="px-6 py-3.5">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {!success && (
          <form onSubmit={submit} className="p-6 space-y-7">
            {/* Personal */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4 pb-2"
                style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                👤 Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="First Name" required>
                  <input name="firstName" value={form.firstName} onChange={set} className="inp" required />
                </FormField>
                <FormField label="Last Name" required>
                  <input name="lastName" value={form.lastName} onChange={set} className="inp" required />
                </FormField>
                <FormField label="Phone">
                  <input name="phone" value={form.phone} onChange={set}
                    placeholder="Optional" className="inp" />
                </FormField>
                <FormField label="Email">
                  <input name="email" type="email" value={form.email} onChange={set} className="inp" />
                </FormField>
                <FormField label="Date of Birth">
                  <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={set}
                    max={new Date().toISOString().split('T')[0]} className="inp" />
                </FormField>
                <FormField label="Gender">
                  <select name="gender" value={form.gender} onChange={set} className="inp">
                    <option value="">Select…</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </FormField>
                <FormField label="Password">
                  <input name="password" type="password" value={form.password} onChange={set}
                    minLength={6} placeholder="Optional" className="inp" />
                </FormField>
              </div>
              <div className="mt-4">
                <FormField label="Address">
                  <textarea name="address" value={form.address} onChange={set}
                    rows={2} className="inp resize-none" />
                </FormField>
              </div>
            </div>

            <div className="divider" />

            {/* Medical */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4 pb-2"
                style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                ❤️ Medical Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Blood Group">
                  <select name="bloodGroup" value={form.bloodGroup} onChange={set} className="inp">
                    <option value="">Select…</option>
                    {BLOOD.map(b => <option key={b}>{b}</option>)}
                  </select>
                </FormField>
                <FormField label="Emergency Contact">
                  <input name="emergencyContact" value={form.emergencyContact} onChange={set} className="inp" />
                </FormField>
                <FormField label="Known Allergies">
                  <input name="allergies" value={form.allergies} onChange={set}
                    placeholder="Optional" className="inp" />
                </FormField>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn btn-primary px-6">
                {saving ? <><Spinner size="sm" />&nbsp;Registering…</> : '+ Register Patient'}
              </button>
              <button type="button" onClick={() => navigate('/receptionist/dashboard')}
                className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Workflow guide */}
      {!success && (
        <div className="mt-4 card" style={{ background: 'var(--surface-2)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>📋 Typical Workflow</p>
          <ol className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: 'var(--brand)' }}>1</span>
              Register the patient here (creates their account)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: 'var(--brand)' }}>2</span>
              Book an appointment for them with a doctor
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: 'var(--brand)' }}>3</span>
              Doctor creates the visit record during the consultation
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
