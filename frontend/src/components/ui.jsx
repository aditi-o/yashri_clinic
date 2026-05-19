// Shared UI primitives
import { createPortal } from 'react-dom';

export function Spinner({ size = 'md', color = 'var(--brand)' }) {
  const sz = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-[3px]', lg: 'w-9 h-9 border-4' }[size];
  return <div className={`${sz} rounded-full animate-spin`} style={{ borderColor: color, borderTopColor: 'transparent' }} />;
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[280px] gap-3">
      <div style={{ position: 'relative', width: 44, height: 44 }}>
        <div className="w-11 h-11 rounded-full animate-spin" style={{ border: '3px solid var(--border-2)', borderTopColor: 'var(--brand)' }} />
        <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', background: 'var(--brand-light)' }} />
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );
}

export function StatCard({ icon, label, value, accent = 'var(--brand)', bg = 'var(--brand-light)' }) {
  return (
    <div className="scard">
      <div className="scard-icon transition-transform hover:scale-110" style={{ background: bg }}>
        {typeof icon === 'string'
          ? <span style={{ fontSize: 'inherit' }} className="text-sm sm:text-base lg:text-lg">{icon}</span>
          : icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide truncate" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="font-extrabold mt-1 leading-none truncate text-base sm:text-xl"
          style={{ color: accent, fontFamily: 'Plus Jakarta Sans,sans-serif', letterSpacing: '-0.03em' }}>
          {value ?? '—'}
        </p>
      </div>
    </div>
  );
}

export function SectionHeader({ title, action }) {
  return (
    <div className="sh-row">
      <h2 className="sh-title">{title}</h2>
      {action}
    </div>
  );
}

export function EmptyState({ icon = '📭', title = 'Nothing here yet', sub = '' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2">
      <div style={{ fontSize: 36, marginBottom: 4 }}>{icon}</div>
      <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{title}</p>
      {sub && <p className="text-xs text-center max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}

export function Alert({ type = 'error', children }) {
  const cfg = {
    error: { bg: 'var(--danger-light)', color: '#991b1b', border: '#fca5a5' },
    success: { bg: 'var(--success-light)', color: '#065f46', border: '#6ee7b7' },
    info: { bg: 'var(--info-light)', color: '#1e40af', border: '#93c5fd' },
    warning: { bg: 'var(--warning-light)', color: '#92400e', border: '#fcd34d' },
  }[type] || { bg: 'var(--danger-light)', color: '#991b1b', border: '#fca5a5' };

  const iconPaths = {
    error: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z',
    success: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z',
  };
  const d = iconPaths[type] || iconPaths.error;

  return (
    <div className="flex items-start gap-2.5 p-3.5 rounded-xl text-sm font-medium"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d={d} clipRule="evenodd" />
      </svg>
      <span className="flex-1">{children}</span>
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    SCHEDULED: ['badge badge-blue', '● Scheduled'],
    COMPLETED: ['badge badge-green', '✓ Completed'],
    CANCELLED: ['badge badge-red', '✕ Cancelled'],
    NO_SHOW: ['badge badge-gray', '○ No Show'],
    ACTIVE: ['badge badge-green', '● Active'],
    INACTIVE: ['badge badge-gray', '○ Inactive'],
    PAID: ['badge badge-green', '✓ Paid'],
    UNPAID: ['badge badge-red', '✕ Unpaid'],
    PARTIAL: ['badge badge-yellow', '◐ Partial'],
  };
  const [cls, lbl] = map[status] || ['badge badge-gray', status];
  return <span className={cls}>{lbl}</span>;
}

export function FormField({ label, required, hint, children }) {
  return (
    <div>
      <label className="lbl">
        {label}{required && <span style={{ color: 'var(--danger)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <p className="text-xs mt-1.5" style={{ color: 'var(--text-light)' }}>{hint}</p>}
    </div>
  );
}

export function Modal({ title, onClose, children, maxWidth = 'max-w-lg' }) {
  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 anim-in"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(8px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`w-full ${maxWidth} bg-white rounded-2xl shadow-2xl overflow-hidden anim-scale max-h-[90vh] flex flex-col`}
        style={{ boxShadow: '0 24px 64px rgba(15,23,42,.2)', border: '1px solid rgba(255,255,255,0.8)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-base font-bold" style={{ fontFamily: 'Plus Jakarta Sans,sans-serif', color: 'var(--text)', letterSpacing: '-0.01em' }}>{title}</h2>
          <button onClick={onClose} className="btn btn-ghost w-8 h-8 p-0 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto p-6 flex-1">{children}</div>
      </div>
    </div>
  );
  return createPortal(content, document.body);
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div onClick={() => onChange(!checked)}
        className="relative rounded-full transition-colors"
        style={{ background: checked ? 'var(--success)' : 'var(--border-2)', width: 40, height: 22, flexShrink: 0 }}>
        <div className="absolute top-0.5 bg-white rounded-full shadow transition-all"
          style={{ width: 18, height: 18, left: checked ? '20px' : '2px' }} />
      </div>
      {label && <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</span>}
    </label>
  );
}

export function PermToggle({ keyName, label, icon, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all select-none"
      style={{
        background: checked ? 'var(--success-light)' : 'var(--surface-2)',
        border: `1.5px solid ${checked ? '#6ee7b7' : 'var(--border)'}`,
      }}>
      <span className="text-base">{icon}</span>
      <span className="flex-1 text-xs font-semibold" style={{ color: checked ? '#065f46' : 'var(--text-muted)' }}>{label}</span>
      <div onClick={() => onChange(keyName, !checked)}
        className="relative rounded-full flex-shrink-0 transition-colors"
        style={{ background: checked ? 'var(--success)' : 'var(--border-2)', width: 36, height: 20 }}>
        <div className="absolute top-0.5 bg-white rounded-full shadow transition-all"
          style={{ width: 16, height: 16, left: checked ? '18px' : '2px' }} />
      </div>
    </label>
  );
}
