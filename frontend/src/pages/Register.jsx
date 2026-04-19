import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Alert, Spinner, FormField } from '../components/ui';

const BLOOD = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

export default function Register() {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({
    firstName:'', lastName:'', phone:'', email:'', password:'',
    dateOfBirth:'', gender:'MALE', address:'',
    emergencyContact:'', bloodGroup:'', allergies:'',
  });

  const set = e => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); clearError(); };

  const submit = async e => {
    e.preventDefault();
    try { await register(form); navigate('/dashboard'); } catch {}
  };

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-10" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-xl"
            style={{ background: 'linear-gradient(135deg, var(--brand), var(--purple))' }}>🏥</div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'var(--text)' }}>
            Create Patient Account
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login" className="font-semibold" style={{ color: 'var(--brand)' }}>Sign in</Link>
          </p>
        </div>

        <div className="card space-y-6">
          <form onSubmit={submit} className="space-y-6">
            {/* Personal section */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4 pb-2"
                style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="First Name" required><input name="firstName" value={form.firstName} onChange={set} className="inp" required /></FormField>
                <FormField label="Last Name" required><input name="lastName" value={form.lastName} onChange={set} className="inp" required /></FormField>
                <FormField label="Phone" required><input name="phone" value={form.phone} onChange={set} placeholder="10-digit" className="inp" required /></FormField>
                <FormField label="Email"><input name="email" type="email" value={form.email} onChange={set} className="inp" /></FormField>
                <FormField label="Password" required><input name="password" type="password" value={form.password} onChange={set} placeholder="Min 6 characters" className="inp" minLength={6} required /></FormField>
                <FormField label="Date of Birth" required><input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={set} className="inp" required /></FormField>
                <FormField label="Gender" required>
                  <select name="gender" value={form.gender} onChange={set} className="inp" required>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </FormField>
              </div>
              <div className="mt-4">
                <FormField label="Address">
                  <textarea name="address" value={form.address} onChange={set} rows={2} className="inp resize-none" />
                </FormField>
              </div>
            </div>

            {/* Medical section */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4 pb-2"
                style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                Medical Details <span className="normal-case font-normal">(optional)</span>
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
                  <input name="allergies" value={form.allergies} onChange={set} placeholder="e.g. Penicillin, or 'None'" className="inp" />
                </FormField>
              </div>
            </div>

            {error && <Alert type="error">{error}</Alert>}

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5">
              {loading ? <><Spinner size="sm" />Creating account…</> : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
