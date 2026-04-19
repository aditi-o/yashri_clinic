import { createContext, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const SidebarCtx = createContext({ collapsed: false });
export const useSidebar  = () => useContext(SidebarCtx);

const Ico = ({ d }) => (
  <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const ACCENT = {
  ADMIN:        '#8b5cf6',
  DOCTOR:       '#3b82f6',
  RECEPTIONIST: '#14b8a6',
  PATIENT:      '#2563eb',
};

// ── Nav definitions ──────────────────────────────────────────────────────
const NAV_ADMIN = [
  { to:'/admin/dashboard',    label:'Dashboard',    d:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to:'/admin/doctors',      label:'Doctors',      d:'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z' },
  { to:'/admin/receptionists',label:'Receptionists',d:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0' },
  { to:'/admin/patients',     label:'Patients',     d:'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197' },
  { to:'/admin/appointments', label:'Appointments', d:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { to:'/admin/analytics',    label:'Analytics',    d:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { to:'/admin/ai',           label:'AI Lookup',    d:'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { to:'/admin/profile/edit', label:'My Profile',   d:'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
];

const NAV_DOCTOR = [
  { to:'/doctor-dashboard',       label:'Dashboard',        d:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to:'/create-visit',           label:'New Visit',        d:'M12 4v16m8-8H4' },
  { to:'/doctor/patients',        label:'Patient Search',   d:'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { to:'/doctor/register-patient',label:'Register Patient', d:'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
  { to:'/doctor/ai-assistant',    label:'AI Assistant',     d:'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { to:'/receptionist/manage',    label:'Staff Mgmt',       d:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { to:'/doctor/profile/edit',    label:'My Profile',       d:'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
];

const NAV_PATIENT = [
  { to:'/dashboard',        label:'Dashboard',        d:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to:'/appointments',     label:'My Appointments',  d:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { to:'/history',          label:'Medical History',  d:'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { to:'/profile/edit',     label:'My Profile',       d:'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { to:'/ai-chat',          label:'AI Assistant',     d:'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
];

const NAV_RECEPTIONIST = (perms = {}) => [
  { to:'/receptionist/dashboard',        label:'Dashboard',        d:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  perms.registerPatient && { to:'/receptionist/register-patient', label:'Register Patient', d:'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
  perms.bookAppointment && { to:'/receptionist/book-appointment', label:'Book Appointment', d:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  perms.manageSchedule  && { to:'/receptionist/schedule',         label:'Schedule',         d:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { to:'/receptionist/profile/edit',     label:'My Profile',       d:'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
].filter(Boolean);

// ── Tooltip for collapsed mode ───────────────────────────────────────────
function Tip({ label }) {
  return (
    <span className="absolute left-full ml-3 px-3 py-1.5 rounded-xl text-xs font-semibold
      pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 whitespace-nowrap z-50"
      style={{ background:'#1e293b', color:'#e2e8f0', boxShadow:'0 4px 16px rgba(0,0,0,.4)',
        letterSpacing:'.01em', top:'50%', transform:'translateY(-50%)' }}>
      {label}
    </span>
  );
}

export default function Sidebar({ collapsed, setCollapsed }) {
  const loc      = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const role   = user?.role || 'PATIENT';
  const perms  = user?.receptionist?.permissions ?? {};
  const accent = ACCENT[role] || ACCENT.PATIENT;

  const items = role === 'ADMIN'        ? NAV_ADMIN
    : role === 'DOCTOR'                 ? NAV_DOCTOR
    : role === 'RECEPTIONIST'           ? NAV_RECEPTIONIST(perms)
    : NAV_PATIENT;

  const firstName = user?.patient?.firstName || user?.doctor?.firstName || user?.receptionist?.firstName || 'User';
  const lastName  = user?.patient?.lastName  || user?.doctor?.lastName  || user?.receptionist?.lastName  || '';
  const initials  = (firstName[0] || '') + (lastName[0] || '');
  const roleLabel = { ADMIN:'Administrator', DOCTOR:'Doctor', RECEPTIONIST:'Receptionist', PATIENT:'Patient' }[role] || role;

  // Determine profile route per role
  const profileRoute = {
    ADMIN:        '/admin/profile/edit',
    DOCTOR:       '/doctor/profile/edit',
    RECEPTIONIST: '/receptionist/profile/edit',
    PATIENT:      '/profile/edit',
  }[role] || '/profile/edit';

  return (
    <aside style={{
      width: collapsed ? 'var(--sidebar-w-sm)' : 'var(--sidebar-w)',
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      position: 'sticky', top: 0, height: '100vh',
      overflowX: 'hidden', overflowY: 'auto',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      zIndex: 40,
      transition: 'width .25s cubic-bezier(.4,0,.2,1)',
    }}>

      {/* Logo */}
      <div style={{ borderBottom:'1px solid rgba(255,255,255,.06)', minHeight:64 }}
        className="flex items-center justify-between px-3 py-4">
        <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
            style={{ background:`linear-gradient(135deg,${accent},${accent}bb)`, boxShadow:`0 2px 8px ${accent}55` }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          {!collapsed && (
            <span className="font-extrabold text-sm text-white tracking-tight whitespace-nowrap"
              style={{ fontFamily:'Plus Jakarta Sans,sans-serif', letterSpacing:'-0.02em' }}>
              Clinic<span style={{ color:accent+'cc' }}>MS</span>
            </span>
          )}
        </div>
        <button onClick={() => setCollapsed(!collapsed)}
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          style={{ color:'#64748b' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {collapsed
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              : <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>}
          </svg>
        </button>
      </div>

      {/* User chip — clickable → profile */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={() => navigate(profileRoute)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors hover:bg-white/10"
            style={{ background:'rgba(255,255,255,.05)', textAlign:'left' }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background:`linear-gradient(135deg,${accent},${accent}99)`, letterSpacing:'-.02em' }}>
              {initials.toUpperCase() || '?'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold truncate text-white" style={{ letterSpacing:'-0.01em' }}>
                {role === 'DOCTOR' ? 'Dr. ' : ''}{firstName} {lastName}
              </p>
              <p className="text-xs truncate" style={{ color:'#475569' }}>{roleLabel}</p>
            </div>
            {/* edit pencil hint */}
            <svg className="w-3 h-3 flex-shrink-0" style={{ color:'#475569' }}
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {items.map(({ to, label, d }) => {
          const active = loc.pathname === to || (to.length > 1 && !to.endsWith('-dashboard') && loc.pathname.startsWith(to + '/'));
          return (
            <div key={to} className="relative group">
              <Link to={to} className={`sbi ${active ? 'active' : ''}`}
                style={{ justifyContent:collapsed?'center':'flex-start', padding:collapsed?'0.625rem':'0.625rem 0.75rem' }}>
                <Ico d={d} />
                {!collapsed && <span className="truncate">{label}</span>}
                {active && !collapsed && (
                  <div style={{ position:'absolute', right:8, width:4, height:4, borderRadius:'50%', background:accent }} />
                )}
              </Link>
              {collapsed && <Tip label={label} />}
            </div>
          );
        })}
      </nav>

      {/* Collapsed avatar → profile */}
      {collapsed && (
        <div className="px-2 pb-1 relative group">
          <button onClick={() => navigate(profileRoute)}
            className="sbi w-full hover:bg-white/10"
            style={{ justifyContent:'center', padding:'0.625rem' }}>
            <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-xs font-bold"
              style={{ background:`linear-gradient(135deg,${accent},${accent}99)` }}>
              {initials.toUpperCase()?.[0] || '?'}
            </div>
          </button>
          <Tip label="My Profile" />
        </div>
      )}

      {/* Logout */}
      <div className="px-2 py-3" style={{ borderTop:'1px solid rgba(255,255,255,.06)' }}>
        <div className="relative group">
          <button onClick={() => { logout(); navigate('/login'); }}
            className="sbi w-full hover:bg-red-500/10 hover:!text-red-400"
            style={{ justifyContent:collapsed?'center':'flex-start', padding:collapsed?'0.625rem':'0.625rem 0.75rem' }}>
            <Ico d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            {!collapsed && <span className="truncate">Logout</span>}
          </button>
          {collapsed && <Tip label="Logout" />}
        </div>
      </div>
    </aside>
  );
}
