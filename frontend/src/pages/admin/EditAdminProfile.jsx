import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { Spinner, Alert, FormField } from '../../components/ui';

export default function EditAdminProfile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');
  const [form, setForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });

  const set = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError(''); setSuccess(false);
  };

  const submit = async e => {
    e.preventDefault();
    if (!form.currentPassword) { setError('Current password is required.'); return; }
    if (form.newPassword !== form.confirmPassword) { setError('New passwords do not match.'); return; }
    if (form.newPassword.length < 6) { setError('New password must be at least 6 characters.'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess(true);
      setForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password.');
    } finally { setSaving(false); }
  };

  const phone = user?.phone || '—';
  const role  = 'Administrator';

  return (
    <div className="max-w-2xl mx-auto anim-up">
      <div className="ph">
        <div>
          <h1 className="ph-title">Admin Profile</h1>
          <p className="ph-sub">{role} · {phone}</p>
        </div>
        <button onClick={() => navigate('/admin/dashboard')} className="btn btn-secondary">← Back</button>
      </div>

      {/* Identity card — read-only */}
      <div className="card mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4 pb-2"
          style={{ color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>
          🪪 Account Information <span className="badge badge-gray ml-1">Read-only</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            ['Role',  role],
            ['Phone', phone],
          ].map(([lbl, val]) => (
            <div key={lbl} className="p-3 rounded-xl" style={{ background:'var(--surface-2)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color:'var(--text-muted)' }}>{lbl}</p>
              <p className="text-sm font-medium">{val}</p>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color:'var(--text-light)' }}>
          Admin identity fields are set at system level. Contact your system operator to change them.
        </p>
      </div>

      {/* Change password */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 pt-5 pb-3" style={{ borderBottom:'1px solid var(--border)' }}>
          <h3 className="font-bold text-sm">🔒 Change Password</h3>
          <p className="text-xs mt-1" style={{ color:'var(--text-muted)' }}>
            Use a strong password of at least 6 characters.
          </p>
        </div>

        {success && (
          <div className="px-6 py-3.5 text-sm font-semibold"
            style={{ background:'var(--success-light)', color:'#065f46', borderBottom:'1px solid #a7f3d0' }}>
            ✓ Password updated successfully!
          </div>
        )}
        {error && (
          <div className="px-6 py-3.5"><Alert type="error">{error}</Alert></div>
        )}

        <form onSubmit={submit} className="p-6 space-y-4">
          <FormField label="Current Password" required>
            <input name="currentPassword" type="password" value={form.currentPassword} onChange={set}
              placeholder="Enter your current password" className="inp" required />
          </FormField>
          <FormField label="New Password" required>
            <input name="newPassword" type="password" value={form.newPassword} onChange={set}
              minLength={6} placeholder="Min. 6 characters" className="inp" required />
          </FormField>
          <FormField label="Confirm New Password" required>
            <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={set}
              placeholder="Repeat new password" className="inp" required />
          </FormField>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn btn-primary px-6">
              {saving ? <><Spinner size="sm" color="white" />&nbsp;Saving…</> : '✓ Update Password'}
            </button>
            <button type="button" onClick={() => navigate('/admin/dashboard')} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
