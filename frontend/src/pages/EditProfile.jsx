import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../services/patientService';
import { Alert, Spinner, FormField } from '../components/ui';

const BLOOD = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

export default function EditProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');
  const [form, setForm]       = useState({ firstName:'', lastName:'', email:'', address:'', emergencyContact:'', bloodGroup:'', allergies:'' });

  useEffect(() => {
    patientService.getProfile().then(r => {
      const p = r.data;
      setProfile(p);
      setForm({ firstName: p.firstName||'', lastName: p.lastName||'', email: p.email||'', address: p.address||'', emergencyContact: p.emergencyContact||'', bloodGroup: p.bloodGroup||'', allergies: p.allergies||'' });
    }).catch(() => setError('Failed to load profile.')).finally(() => setLoading(false));
  }, []);

  const set = e => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setError(''); setSuccess(false); };

  const submit = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try { await patientService.updateProfile(form); setSuccess(true); setTimeout(() => navigate('/dashboard'), 1500); }
    catch (err) { setError(err.response?.data?.message || 'Failed to update.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>;

  return (
    <div className="max-w-2xl mx-auto anim-up">
      <div className="ph">
        <div>
          <h1 className="ph-title">Edit Profile</h1>
          <p className="ph-sub">Update your personal and medical information</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">← Back</button>
      </div>

      <div className="card overflow-hidden p-0">
        {success && <div className="px-6 py-3.5 text-sm font-semibold" style={{ background: 'var(--success-light)', color: '#065f46', borderBottom: '1px solid #a7f3d0' }}>✓ Profile updated! Redirecting…</div>}
        {error   && <div className="px-6 py-3.5 text-sm font-semibold" style={{ background: 'var(--danger-light)',  color: '#991b1b', borderBottom: '1px solid #fecaca'  }}>{error}</div>}

        <form onSubmit={submit} className="p-6 space-y-7">
          {/* Personal */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4 pb-2" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
              👤 Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="First Name"><input name="firstName" value={form.firstName} onChange={set} className="inp" /></FormField>
              <FormField label="Last Name"><input name="lastName"  value={form.lastName}  onChange={set} className="inp" /></FormField>
            </div>
            <div className="mt-4">
              <FormField label="Email Address"><input name="email" type="email" value={form.email} onChange={set} className="inp" /></FormField>
            </div>
            <div className="mt-4">
              <FormField label="Address"><textarea name="address" value={form.address} onChange={set} rows={2} className="inp resize-none" /></FormField>
            </div>
          </div>

          <div className="divider" />

          {/* Medical */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4 pb-2" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
              ❤️ Medical Information
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
            </div>
            <div className="mt-4">
              <FormField label="Known Allergies">
                <input name="allergies" value={form.allergies} onChange={set} placeholder="e.g. Penicillin, Peanuts — or 'None'" className="inp" />
              </FormField>
            </div>
          </div>

          {/* Read-only */}
          {(profile?.dateOfBirth || profile?.gender) && (
            <>
              <div className="divider" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-4 pb-2" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                  🔒 Fixed Information <span className="badge badge-gray ml-1">Read-only</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile?.dateOfBirth && (
                    <FormField label="Date of Birth">
                      <div className="inp cursor-not-allowed" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                        {new Date(profile.dateOfBirth).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                      </div>
                    </FormField>
                  )}
                  {profile?.gender && (
                    <FormField label="Gender">
                      <div className="inp cursor-not-allowed" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                        {profile.gender.charAt(0) + profile.gender.slice(1).toLowerCase()}
                      </div>
                    </FormField>
                  )}
                </div>
                <p className="text-xs mt-3" style={{ color: 'var(--text-light)' }}>These fields cannot be changed. Contact support if needed.</p>
              </div>
            </>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn btn-primary px-6">
              {saving ? <><Spinner size="sm" />Saving…</> : '✓ Save Changes'}
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
