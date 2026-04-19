import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Alert, Spinner, FormField } from '../../components/ui';

const BLOOD = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const blank = {
  firstName:'', lastName:'', phone:'', email:'', password:'',
  dateOfBirth:'', gender:'MALE', address:'', emergencyContact:'',
  bloodGroup:'', allergies:'',
};

export default function DoctorRegisterPatient() {
  const navigate = useNavigate();
  const [saving,     setSaving]     = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [registered, setRegistered] = useState(null);
  const [error,      setError]      = useState('');
  const [form, setForm] = useState({ ...blank });

  const set = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError(''); setSuccess(false);
  };

  const submit = async e => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      // Doctors call the public /auth/register endpoint (no token required for patient creation)
      await api.post('/auth/register', form);
      setRegistered({ firstName: form.firstName, lastName: form.lastName, phone: form.phone });
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
          <p className="ph-sub">Create a patient account for a walk-in or new consultation</p>
        </div>
        <button onClick={() => navigate('/doctor-dashboard')} className="btn btn-secondary">← Back</button>
      </div>

      <div className="card overflow-hidden p-0">
        {/* Success banner */}
        {success && registered && (
          <div className="px-6 py-4" style={{ background:'var(--success-light)', borderBottom:'1px solid #a7f3d0' }}>
            <p className="text-sm font-bold" style={{ color:'#065f46' }}>
              ✓ {registered.firstName} {registered.lastName} registered! (Phone: {registered.phone})
            </p>
            <p className="text-xs mt-1 mb-3" style={{ color:'#047857' }}>
              The patient can now log in. What would you like to do next?
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => navigate('/doctor/patients')}
                className="btn btn-sm"
                style={{ background:'#059669', color:'white', border:'none' }}
              >
                🔍 Find This Patient
              </button>
              <button
                onClick={() => { setSuccess(false); setRegistered(null); }}
                className="btn btn-sm btn-secondary"
              >
                + Register Another
              </button>
              <button
                onClick={() => navigate('/doctor-dashboard')}
                className="btn btn-sm btn-secondary"
              >
                ← Dashboard
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="px-6 py-3.5"><Alert type="error">{error}</Alert></div>
        )}

        {!success && (
          <form onSubmit={submit} className="p-6 space-y-7">
            {/* Personal */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4 pb-2"
                style={{ color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>
                👤 Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="First Name" required>
                  <input name="firstName" value={form.firstName} onChange={set} className="inp" required />
                </FormField>
                <FormField label="Last Name" required>
                  <input name="lastName" value={form.lastName} onChange={set} className="inp" required />
                </FormField>
                <FormField label="Phone" required>
                  <input name="phone" value={form.phone} onChange={set}
                    placeholder="10-digit mobile" className="inp" required />
                </FormField>
                <FormField label="Email">
                  <input name="email" type="email" value={form.email} onChange={set} className="inp" />
                </FormField>
                <FormField label="Date of Birth" required>
                  <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={set}
                    max={new Date().toISOString().split('T')[0]} className="inp" required />
                </FormField>
                <FormField label="Gender" required>
                  <select name="gender" value={form.gender} onChange={set} className="inp" required>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </FormField>
                <FormField label="Login Password" required>
                  <input name="password" type="password" value={form.password} onChange={set}
                    minLength={6} placeholder="Min. 6 characters" className="inp" required />
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
                style={{ color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>
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
                    placeholder="e.g. Penicillin — or 'None'" className="inp" />
                </FormField>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn btn-primary px-6">
                {saving ? <><Spinner size="sm" color="white" />&nbsp;Registering…</> : '+ Register Patient'}
              </button>
              <button type="button" onClick={() => navigate('/doctor-dashboard')} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
