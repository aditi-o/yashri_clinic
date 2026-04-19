import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Spinner, Alert, FormField } from '../components/ui';

const SPECS = [
  'General Physician','Cardiologist','Dermatologist','Pediatrician',
  'Orthopedic','Neurologist','Psychiatrist','Gynecologist','ENT Specialist','Ophthalmologist',
];

export default function EditDoctorProfile() {
  const navigate      = useNavigate();
  const { user, login } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');
  const [form, setForm]       = useState({
    firstName: '', lastName: '', email: '',
    specialization: '', qualification: '', experience: '', consultationFee: '',
  });

  // Load profile from API (always fresh, not from cached user store)
  useEffect(() => {
    api.get('/doctors/profile')
      .then(r => {
        const d = r.data?.data ?? r.data;
        setForm({
          firstName:       d.firstName       ?? '',
          lastName:        d.lastName        ?? '',
          email:           d.email           ?? '',
          specialization:  d.specialization  ?? '',
          qualification:   d.qualification   ?? '',
          experience:      d.experience      ?? '',
          consultationFee: d.consultationFee ?? '',
        });
      })
      .catch(() => setError('Failed to load profile. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const set = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
    setSuccess(false);
  };

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put('/doctors/profile', {
        firstName:       form.firstName,
        lastName:        form.lastName,
        email:           form.email,
        specialization:  form.specialization,
        qualification:   form.qualification,
        experience:      Number(form.experience),
        consultationFee: Number(form.consultationFee),
      });
      setSuccess(true);
      setTimeout(() => navigate('/doctor-dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto anim-up">
      <div className="ph">
        <div>
          <h1 className="ph-title">Edit Doctor Profile</h1>
          <p className="ph-sub">Dr. {form.firstName} {form.lastName} · {form.specialization}</p>
        </div>
        <button onClick={() => navigate('/doctor-dashboard')} className="btn btn-secondary">← Back</button>
      </div>

      <div className="card overflow-hidden p-0">
        {success && (
          <div className="px-6 py-3.5 text-sm font-semibold"
            style={{ background: 'var(--success-light)', color: '#065f46', borderBottom: '1px solid #a7f3d0' }}>
            ✓ Profile updated! Redirecting…
          </div>
        )}
        {error && (
          <div className="px-6 py-3.5">
            <Alert type="error">{error}</Alert>
          </div>
        )}

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
            </div>
            <div className="mt-4">
              <FormField label="Email Address">
                <input name="email" type="email" value={form.email} onChange={set} className="inp" />
              </FormField>
            </div>
          </div>

          <div className="divider" />

          {/* Professional */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4 pb-2"
              style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
              🎓 Professional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Specialization" required>
                <select name="specialization" value={form.specialization} onChange={set} className="inp" required>
                  <option value="">Select…</option>
                  {SPECS.map(s => <option key={s}>{s}</option>)}
                </select>
              </FormField>
              <FormField label="Qualification" required>
                <input name="qualification" value={form.qualification} onChange={set}
                  placeholder="e.g. MBBS, MD" className="inp" required />
              </FormField>
              <FormField label="Years of Experience" required>
                <input name="experience" type="number" value={form.experience} onChange={set}
                  min="0" className="inp" required />
              </FormField>
              <FormField label="Consultation Fee (₹)" required>
                <input name="consultationFee" type="number" value={form.consultationFee} onChange={set}
                  min="0" step="50" className="inp" required />
              </FormField>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn btn-primary px-6">
              {saving ? <><Spinner size="sm" color="white" />&nbsp;Saving…</> : '✓ Save Changes'}
            </button>
            <button type="button" onClick={() => navigate('/doctor-dashboard')} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
