import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Alert, Spinner } from '../components/ui';

const FEATURES = [
  { ico: '📅', txt: 'Instant appointment booking' },
  { ico: '🏥', txt: 'Complete medical records' },
  { ico: '👨‍⚕️', txt: 'Doctor & staff management' },
  { ico: '📊', txt: 'Real-time clinic analytics' },
  { ico: '🤖', txt: 'AI-powered health assistant' },
];

const PHONE_REGEX = /^\d{10}$/;

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const set = e => {
    const { name, value } = e.target;
    const nextValue = name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setForm(f => ({ ...f, [name]: nextValue }));
    if (name === 'phone' && phoneError) setPhoneError('');
    clearError();
  };

  const submit = async e => {
    e.preventDefault();
    if (!PHONE_REGEX.test(form.phone)) {
      setPhoneError('Phone number must be exactly 10 digits.');
      return;
    }

    setPhoneError('');
    try {
      const { data } = await login(form);
      const role = data.user.role;
      if (role === 'ADMIN') navigate('/admin/dashboard');
      else if (role === 'DOCTOR') navigate('/doctor-dashboard');
      else if (role === 'RECEPTIONIST') navigate('/receptionist/dashboard');
      else navigate('/dashboard');
    } catch { }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden lg:w-5/12"
        style={{ background: 'linear-gradient(150deg, #0f172a 0%, #1e3a5f 45%, #1d4ed8 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, #60a5fa 0%, transparent 50%), radial-gradient(circle at 80% 80%, #818cf8 0%, transparent 50%)' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-white font-bold text-xl" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>ClinicMS</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Modern healthcare,<br />beautifully managed.
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed">
            One platform for patients, doctors, and your entire clinic staff.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {FEATURES.map(({ ico, txt }) => (
            <div key={txt} className="flex items-center gap-3">
              <span className="text-lg">{ico}</span>
              <span className="text-blue-100 text-sm font-medium">{txt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-9 h-9 rounded-xl text-white flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--brand), var(--purple))' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="font-bold text-lg" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>ClinicMS</span>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'var(--text)' }}>
            Welcome back
          </h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Sign in to your account to continue</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="lbl">Phone Number</label>
              <input
                name="phone"
                value={form.phone}
                onChange={set}
                placeholder="10-digit phone number"
                className="inp"
                inputMode="numeric"
                pattern="\d{10}"
                maxLength={10}
                title="Please enter a valid 10-digit phone number"
                required
              />
            </div>
            <div>
              <label className="lbl">Password</label>
              <div className="relative">
                <input name="password" type={showPwd ? 'text' : 'password'} value={form.password} onChange={set}
                  placeholder="Your password" className="inp pr-10" required />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0" style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    {showPwd
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      : <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    }
                  </svg>
                </button>
              </div>
            </div>

            {phoneError && <Alert type="error">{phoneError}</Alert>}
            {error && <Alert type="error">{error}</Alert>}

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5 mt-1">
              {loading ? <><Spinner size="sm" /><span>Signing in…</span></> : 'Sign In'}
            </button>
          </form>

          <p className="text-sm text-center mt-6" style={{ color: 'var(--text-muted)' }}>
            New patient? <Link to="/register" className="font-semibold" style={{ color: 'var(--brand)' }}>Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
