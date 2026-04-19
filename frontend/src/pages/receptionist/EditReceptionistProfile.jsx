import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { receptionistService } from '../../services/receptionistService';
import { useAuthStore } from '../../store/authStore';
import { Spinner, Alert, FormField } from '../../components/ui';

export default function EditReceptionistProfile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    currentPassword: '', newPassword: '', confirmPassword: '',
  });

  useEffect(() => {
    receptionistService.getProfile()
      .then(r => {
        const d = r.data;
        setForm(f => ({
          ...f,
          firstName: d.firstName ?? '',
          lastName:  d.lastName  ?? '',
          email:     d.email     ?? '',
          phone:     d.user?.phone ?? '',
        }));
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const set = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError(''); setSuccess(false);
  };

  const submit = async e => {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setSaving(true); setError('');
    try {
      const payload = {
        firstName: form.firstName,
        lastName:  form.lastName,
        email:     form.email,
        phone:     form.phone,
      };
      if (form.newPassword) payload.password = form.newPassword;
      await receptionistService.updateProfile(payload);
      setSuccess(true);
      setForm(f => ({ ...f, currentPassword:'', newPassword:'', confirmPassword:'' }));
      setTimeout(() => navigate('/receptionist/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  );

  return (
    <div className="max-w-2xl mx-auto anim-up">
      <div className="ph">
        <div>
          <h1 className="ph-title">My Profile</h1>
          <p className="ph-sub">{form.firstName} {form.lastName} · Receptionist</p>
        </div>
        <button onClick={() => navigate('/receptionist/dashboard')} className="btn btn-secondary">← Back</button>
      </div>

      <div className="card overflow-hidden p-0">
        {success && (
          <div className="px-6 py-3.5 text-sm font-semibold"
            style={{ background:'var(--success-light)', color:'#065f46', borderBottom:'1px solid #a7f3d0' }}>
            ✓ Profile updated! Redirecting…
          </div>
        )}
        {error && (
          <div className="px-6 py-3.5"><Alert type="error">{error}</Alert></div>
        )}

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
              <FormField label="Email Address">
                <input name="email" type="email" value={form.email} onChange={set} className="inp" />
              </FormField>
              <FormField label="Phone Number">
                <input name="phone" value={form.phone} onChange={set} placeholder="10-digit" className="inp" />
              </FormField>
            </div>
          </div>

          <div className="divider" />

          {/* Permissions read-only */}
          {user?.receptionist?.permissions && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4 pb-2"
                style={{ color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>
                🔑 My Permissions <span className="badge badge-gray ml-1">Read-only</span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries({
                  registerPatient:'Register Patients', bookAppointment:'Book Appointments',
                  cancelAppointment:'Cancel Appointments', viewMedicalHistory:'View Medical History',
                  manageSchedule:'Manage Schedule', viewBilling:'View Billing',
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2.5 p-2.5 rounded-xl"
                    style={{ background: user.receptionist.permissions[key] ? 'var(--success-light)' : 'var(--surface-2)' }}>
                    <span style={{ color: user.receptionist.permissions[key] ? 'var(--success)' : 'var(--text-light)', fontWeight:700 }}>
                      {user.receptionist.permissions[key] ? '✓' : '✕'}
                    </span>
                    <span className="text-xs font-semibold"
                      style={{ color: user.receptionist.permissions[key] ? '#065f46' : 'var(--text-muted)' }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color:'var(--text-light)' }}>
                Permissions are managed by your doctor or admin.
              </p>
            </div>
          )}

          <div className="divider" />

          {/* Change password */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4 pb-2"
              style={{ color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>
              🔒 Change Password <span className="badge badge-gray ml-1">Optional</span>
            </h3>
            <div className="space-y-4">
              <FormField label="New Password">
                <input name="newPassword" type="password" value={form.newPassword} onChange={set}
                  minLength={6} placeholder="Leave blank to keep current" className="inp" />
              </FormField>
              <FormField label="Confirm New Password">
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={set}
                  placeholder="Repeat new password" className="inp" />
              </FormField>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn btn-primary px-6">
              {saving ? <><Spinner size="sm" color="white" />&nbsp;Saving…</> : '✓ Save Changes'}
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
