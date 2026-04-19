import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { receptionistService } from '../../services/receptionistService';
import { PageLoader, Alert, Modal, FormField, StatusBadge, EmptyState, PermToggle } from '../../components/ui';

const ALL_PERMS = [
  { key: 'registerPatient',    label: 'Register Patients',    icon: '👤' },
  { key: 'bookAppointment',    label: 'Book Appointments',    icon: '📅' },
  { key: 'cancelAppointment',  label: 'Cancel Appointments',  icon: '❌' },
  { key: 'viewMedicalHistory', label: 'View Medical History', icon: '🏥' },
  { key: 'manageSchedule',     label: 'Manage Schedule',      icon: '🗓️' },
  { key: 'viewBilling',        label: 'View Billing',         icon: '💰' },
];
const DEFAULT_PERMS = {
  registerPatient: true, bookAppointment: true, cancelAppointment: false,
  viewMedicalHistory: false, manageSchedule: false, viewBilling: false,
};

/* ── Permission toggle row inside card ─────────────────────────────────── */
function ReceptionistCard({ rec, onEdit, onDelete, onUpdatePerms }) {
  const [showPerms,   setShowPerms]   = useState(false);
  const [perms,       setPerms]       = useState({ ...DEFAULT_PERMS, ...(rec.permissions ?? {}) });
  const [savingPerms, setSavingPerms] = useState(false);
  const initials = `${rec.firstName?.[0] || ''}${rec.lastName?.[0] || ''}`.toUpperCase();

  const savePerms = async () => {
    setSavingPerms(true);
    try { await onUpdatePerms(rec.id, perms); setShowPerms(false); }
    catch (e) { alert(e.response?.data?.message || 'Failed to save permissions.'); }
    finally { setSavingPerms(false); }
  };

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: rec.isActive ? 'linear-gradient(135deg, var(--teal), #0ea5e9)' : 'var(--text-light)' }}>
            {initials}
          </div>
          <div>
            <p className="font-bold" style={{ color: 'var(--text)' }}>{rec.firstName} {rec.lastName}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {rec.user?.phone || rec.phone}{rec.email ? ` · ${rec.email}` : ''}
            </p>
            <StatusBadge status={rec.isActive ? 'ACTIVE' : 'INACTIVE'} />
          </div>
        </div>

        <div className="flex gap-1.5 flex-shrink-0">
          {onEdit && (
            <button onClick={() => onEdit(rec)} title="Edit"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onUpdatePerms && (
            <button onClick={() => setShowPerms(v => !v)} title="Permissions"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'var(--purple-light)', color: 'var(--purple)' }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(rec)} title="Deactivate"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Active permission badges */}
      <div className="flex flex-wrap gap-1.5">
        {ALL_PERMS.filter(p => rec.permissions?.[p.key]).map(p => (
          <span key={p.key} className="badge badge-teal">{p.icon} {p.label}</span>
        ))}
      </div>

      {/* Expandable permission editor — admin only */}
      {showPerms && onUpdatePerms && (
        <div className="pt-3 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Edit Permissions</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {ALL_PERMS.map(({ key, label, icon }) => (
              <PermToggle key={key} keyName={key} label={label} icon={icon}
                checked={!!perms[key]} onChange={(k, v) => setPerms(p => ({ ...p, [k]: v }))} />
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={savePerms} disabled={savingPerms} className="btn btn-primary btn-sm">
              {savingPerms ? 'Saving…' : 'Save Permissions'}
            </button>
            <button onClick={() => setShowPerms(false)} className="btn btn-secondary btn-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Create Modal ───────────────────────────────────────────────────────── */
function CreateModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', password: '', permissions: { ...DEFAULT_PERMS } });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const togglePerm = (k, v) => setForm(f => ({ ...f, permissions: { ...f.permissions, [k]: v } }));

  const submit = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try { await onCreate(form); onClose(); }
    catch (err) { setError(err.response?.data?.message || 'Failed to create receptionist.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Create Receptionist" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="First Name" required><input name="firstName" value={form.firstName} onChange={set} className="inp" required /></FormField>
          <FormField label="Last Name"  required><input name="lastName"  value={form.lastName}  onChange={set} className="inp" required /></FormField>
          <FormField label="Phone"      required><input name="phone" value={form.phone} onChange={set} placeholder="10-digit" className="inp" required /></FormField>
          <FormField label="Email">              <input name="email" type="email" value={form.email} onChange={set} className="inp" /></FormField>
        </div>
        <FormField label="Password" required>
          <input name="password" type="password" value={form.password} onChange={set} minLength={6} className="inp" required />
        </FormField>
        <div>
          <label className="lbl mb-3">Permissions</label>
          <div className="grid grid-cols-1 gap-2">
            {ALL_PERMS.map(({ key, label, icon }) => (
              <PermToggle key={key} keyName={key} label={label} icon={icon}
                checked={!!form.permissions[key]} onChange={togglePerm} />
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn btn-primary flex-1">
            {saving ? 'Creating…' : 'Create Receptionist'}
          </button>
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Edit Modal ─────────────────────────────────────────────────────────── */
function EditModal({ rec, onClose, onSave }) {
  const [form, setForm] = useState({
    firstName: rec.firstName, lastName: rec.lastName,
    email: rec.email || '', phone: rec.user?.phone || rec.phone || '',
    password: '', isActive: rec.isActive,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = e => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [e.target.name]: v }));
  };

  const submit = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try { await onSave(rec.id, form); onClose(); }
    catch (err) { setError(err.response?.data?.message || 'Failed to update.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Edit Receptionist" onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="First Name"><input name="firstName" value={form.firstName} onChange={set} className="inp" /></FormField>
          <FormField label="Last Name"> <input name="lastName"  value={form.lastName}  onChange={set} className="inp" /></FormField>
          <FormField label="Phone">     <input name="phone" value={form.phone} onChange={set} className="inp" /></FormField>
          <FormField label="Email">     <input name="email" type="email" value={form.email} onChange={set} className="inp" /></FormField>
        </div>
        <FormField label="New Password" hint="Leave blank to keep current">
          <input name="password" type="password" value={form.password} onChange={set} placeholder="New password…" className="inp" />
        </FormField>
        <div className="flex items-center gap-3 py-1">
          <div onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
            className="relative rounded-full cursor-pointer transition-colors"
            style={{ background: form.isActive ? 'var(--success)' : 'var(--border-2)', width: 40, height: 22 }}>
            <div className="absolute top-0.5 w-[18px] h-[18px] bg-white rounded-full shadow transition-all"
              style={{ left: form.isActive ? '20px' : '2px' }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Account Active</span>
        </div>
        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving} className="btn btn-primary flex-1">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────── */
export default function ManageReceptionists() {
  const navigate    = useNavigate();
  const { user }    = useAuthStore();
  const isAdmin     = user?.role === 'ADMIN';

  const [list,       setList]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editRec,    setEditRec]    = useState(null);
  const [error,      setError]      = useState('');

  const load = () => {
    setLoading(true);
    receptionistService.list()
      .then(r => setList(Array.isArray(r.data) ? r.data : []))
      .catch(e => setError(e.response?.data?.message || 'Failed to load.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async data => { await receptionistService.create(data); load(); };
  const handleEdit   = async (id, data) => { await receptionistService.update(id, data); load(); };
  const handleDelete = async rec => {
    if (!window.confirm(`Deactivate ${rec.firstName} ${rec.lastName}?`)) return;
    try { await receptionistService.remove(rec.id); load(); }
    catch (e) { alert(e.response?.data?.message || 'Failed.'); }
  };
  const handleUpdatePerms = async (id, permissions) => {
    await receptionistService.updatePermissions(id, permissions); load();
  };

  const active   = list.filter(r => r.isActive);
  const inactive = list.filter(r => !r.isActive);

  const backPath = isAdmin ? '/admin/receptionists' : '/doctor-dashboard';

  return (
    <div className="space-y-6 anim-up">
      {/* Only ADMIN can open create/edit modals */}
      {isAdmin && showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {isAdmin && editRec    && <EditModal   rec={editRec} onClose={() => setEditRec(null)} onSave={handleEdit} />}

      <div className="ph">
        <div>
          <h1 className="ph-title">
            {isAdmin ? 'Receptionist Management' : 'Front Desk Staff'}
          </h1>
          <p className="ph-sub">{active.length} active · {inactive.length} deactivated</p>
        </div>
        <div className="flex gap-2">
          {/* Only ADMIN can create new receptionist accounts */}
          {isAdmin && (
            <button onClick={() => setShowCreate(true)} className="btn btn-primary">+ Add Receptionist</button>
          )}
          <button onClick={() => navigate(backPath)} className="btn btn-secondary">← Back</button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <PageLoader label="Loading staff…" />
      ) : list.length === 0 ? (
        <div className="card">
          <EmptyState icon="🧑‍💼" title="No Receptionists Yet" sub="Create accounts for your front desk staff" />
          {isAdmin && (
            <div className="flex justify-center mt-4">
              <button onClick={() => setShowCreate(true)} className="btn btn-primary">Add First Receptionist</button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                Active ({active.length})
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {active.map(r => (
                  <ReceptionistCard key={r.id} rec={r}
                    onEdit={isAdmin ? setEditRec : null}
                    onDelete={isAdmin ? handleDelete : null}
                    onUpdatePerms={isAdmin ? handleUpdatePerms : null} />
                ))}
              </div>
            </div>
          )}
          {inactive.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                Deactivated ({inactive.length})
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {inactive.map(r => (
                  <ReceptionistCard key={r.id} rec={r}
                    onEdit={setEditRec} onDelete={handleDelete} onUpdatePerms={handleUpdatePerms} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
