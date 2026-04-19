import { useEffect, useState } from 'react';
import { PageLoader, Alert, Modal, FormField, StatusBadge, EmptyState, PermToggle } from '../../components/ui';
import { receptionistService } from '../../services/receptionistService';

const PERMS = [
  { key:'registerPatient',    label:'Register Patients',    icon:'👤' },
  { key:'bookAppointment',    label:'Book Appointments',    icon:'📅' },
  { key:'cancelAppointment',  label:'Cancel Appointments',  icon:'❌' },
  { key:'viewMedicalHistory', label:'View Medical History', icon:'🏥' },
  { key:'manageSchedule',     label:'Manage Schedule',      icon:'🗓️' },
  { key:'viewBilling',        label:'View Billing',         icon:'💰' },
];
const DEF = { registerPatient:true, bookAppointment:true, cancelAppointment:false,
              viewMedicalHistory:false, manageSchedule:false, viewBilling:false };

function ReceptionistForm({ initial, onClose, onDone }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(
    isEdit
      ? { firstName:initial.firstName||'', lastName:initial.lastName||'',
          phone:initial.user?.phone||'', email:initial.email||'',
          password:'', permissions:{ ...DEF, ...(initial.permissions||{}) } }
      : { firstName:'', lastName:'', phone:'', email:'', password:'', permissions:{ ...DEF } }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const toggleP = (k, v) => setForm(f => ({ ...f, permissions: { ...f.permissions, [k]: v } }));

  const submit = async e => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      if (isEdit) {
        await receptionistService.update(initial.id, form);
        await receptionistService.updatePermissions(initial.id, form.permissions);
      } else {
        await receptionistService.create(form);
      }
      onDone(); onClose();
    } catch (ex) { setErr(ex.response?.data?.message || 'Operation failed'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {err && <Alert type="error">{err}</Alert>}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="First Name" required><input name="firstName" value={form.firstName} onChange={set} className="inp" required /></FormField>
        <FormField label="Last Name"  required><input name="lastName"  value={form.lastName}  onChange={set} className="inp" required /></FormField>
        <FormField label="Phone"      required><input name="phone" value={form.phone} onChange={set} placeholder="10-digit" className="inp" required /></FormField>
        <FormField label="Email"><input name="email" type="email" value={form.email} onChange={set} className="inp" /></FormField>
      </div>
      <FormField label={isEdit ? 'New Password (leave blank to keep)' : 'Password'} required={!isEdit}>
        <input name="password" type="password" value={form.password} onChange={set}
          minLength={isEdit ? 0 : 6} placeholder={isEdit ? 'Leave blank to keep current' : 'Min. 6 characters'}
          className="inp" required={!isEdit} />
      </FormField>
      <div>
        <label className="lbl mb-3 block">Permissions</label>
        <div className="grid grid-cols-2 gap-2">
          {PERMS.map(({ key, label, icon }) =>
            <PermToggle key={key} keyName={key} label={label} icon={icon}
              checked={!!form.permissions[key]} onChange={toggleP} />
          )}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="btn btn-primary flex-1">
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Receptionist'}
        </button>
        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
      </div>
    </form>
  );
}

export default function AdminReceptionists() {
  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  const load = () => {
    setLoading(true);
    receptionistService.list()
      .then(r => setList(Array.isArray(r.data) ? r.data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const flash = (msg, isErr = false) => {
    if (isErr) { setError(msg); setTimeout(() => setError(''), 4000); }
    else       { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); }
  };

  const handleDeactivate = async r => {
    if (!window.confirm(`Deactivate ${r.firstName} ${r.lastName}?`)) return;
    try {
      await receptionistService.remove(r.id);
      flash(`${r.firstName} ${r.lastName} deactivated.`);
      load();
    } catch (e) { flash(e.response?.data?.message || 'Failed', true); }
  };

  const handleReactivate = async r => {
    try {
      await receptionistService.update(r.id, { isActive: true });
      flash(`${r.firstName} ${r.lastName} reactivated.`);
      load();
    } catch (e) { flash(e.response?.data?.message || 'Failed', true); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 anim-up">
      {showCreate && (
        <Modal title="Add Receptionist" onClose={() => setShowCreate(false)}>
          <ReceptionistForm onClose={() => setShowCreate(false)}
            onDone={() => { flash('Receptionist created!'); load(); }} />
        </Modal>
      )}
      {editing && (
        <Modal title={`Edit — ${editing.firstName} ${editing.lastName}`} onClose={() => setEditing(null)}>
          <ReceptionistForm initial={editing} onClose={() => setEditing(null)}
            onDone={() => { flash('Receptionist updated!'); load(); }} />
        </Modal>
      )}

      <div className="ph">
        <div>
          <h1 className="ph-title">Receptionists</h1>
          <p className="ph-sub">{list.length} staff · {list.filter(r => r.isActive).length} active</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary">+ Add Receptionist</button>
      </div>

      {success && <Alert type="success">{success}</Alert>}
      {error   && <Alert type="error">{error}</Alert>}

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Name</th><th>Phone</th><th>Email</th><th>Permissions</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {!list.length
              ? <tr><td colSpan={6}><EmptyState icon="🧑‍💼" title="No receptionists yet" /></td></tr>
              : list.map(r => (
              <tr key={r.id} style={{ opacity: r.isActive ? 1 : 0.65 }}>
                <td>
                  <div className="flex items-center gap-2">
                    <div style={{ width:30, height:30, borderRadius:8, flexShrink:0,
                      background: r.isActive ? 'linear-gradient(135deg,#14b8a6,#0891b2)' : '#94a3b8',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color:'white', fontSize:11, fontWeight:700 }}>
                      {r.firstName?.[0]}{r.lastName?.[0]}
                    </div>
                    <span className="font-semibold text-sm">{r.firstName} {r.lastName}</span>
                  </div>
                </td>
                <td style={{ color:'var(--text-muted)' }}>{r.user?.phone || '—'}</td>
                <td style={{ color:'var(--text-muted)' }}>{r.email || '—'}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {PERMS.filter(p => r.permissions?.[p.key]).map(p =>
                      <span key={p.key} className="badge badge-teal" title={p.label}>{p.icon}</span>
                    )}
                    {!PERMS.some(p => r.permissions?.[p.key]) && <span className="text-xs" style={{ color:'var(--text-muted)' }}>None</span>}
                  </div>
                </td>
                <td><StatusBadge status={r.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                <td>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditing(r)}
                      className="btn btn-sm"
                      style={{ background:'var(--brand-light)', color:'var(--brand)', border:'1px solid #bfdbfe' }}>
                      Edit
                    </button>
                    {r.isActive
                      ? <button onClick={() => handleDeactivate(r)}
                          className="btn btn-sm"
                          style={{ background:'var(--warning-light)', color:'#92400e', border:'1px solid #fcd34d' }}>
                          Deactivate
                        </button>
                      : <button onClick={() => handleReactivate(r)}
                          className="btn btn-sm"
                          style={{ background:'var(--success-light)', color:'#065f46', border:'1px solid #6ee7b7' }}>
                          Reactivate
                        </button>
                    }
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
