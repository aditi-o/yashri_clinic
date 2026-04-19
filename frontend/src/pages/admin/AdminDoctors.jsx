import { useEffect, useState } from 'react';
import { PageLoader, Alert, Modal, FormField, StatusBadge, EmptyState } from '../../components/ui';
import api from '../../services/api';

const norm = r => { const d = r.data?.data ?? r.data; return Array.isArray(d) ? d : []; };
const SPECS = ['General Physician','Cardiologist','Dermatologist','Pediatrician','Orthopedic','Neurologist','Psychiatrist','Gynecologist','ENT Specialist','Ophthalmologist'];

function CreateForm({ onClose, onDone }) {
  const [form, setForm] = useState({ firstName:'', lastName:'', phone:'', email:'', password:'', specialization:'', qualification:'', experience:0, consultationFee:0 });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.type==='number' ? Number(e.target.value) : e.target.value }));
  const submit = async e => {
    e.preventDefault(); setSaving(true); setErr('');
    try { await api.post('/auth/register-doctor', form); onDone(); onClose(); }
    catch (ex) { setErr(ex.response?.data?.message || 'Failed to create doctor'); }
    finally { setSaving(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      {err && <Alert type="error">{err}</Alert>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="First Name" required><input name="firstName" value={form.firstName} onChange={set} className="inp" required /></FormField>
        <FormField label="Last Name"  required><input name="lastName"  value={form.lastName}  onChange={set} className="inp" required /></FormField>
        <FormField label="Phone"      required><input name="phone"     value={form.phone}     onChange={set} placeholder="10-digit" className="inp" required /></FormField>
        <FormField label="Email"      required><input name="email" type="email" value={form.email} onChange={set} className="inp" required /></FormField>
      </div>
      <FormField label="Password" required><input name="password" type="password" value={form.password} onChange={set} minLength={6} className="inp" required /></FormField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Specialization" required>
          <select name="specialization" value={form.specialization} onChange={set} className="inp" required>
            <option value="">Select…</option>{SPECS.map(s => <option key={s}>{s}</option>)}
          </select>
        </FormField>
        <FormField label="Qualification" required><input name="qualification" value={form.qualification} onChange={set} placeholder="MBBS, MD" className="inp" required /></FormField>
        <FormField label="Experience (yrs)" required><input name="experience" type="number" value={form.experience} onChange={set} min={0} className="inp" required /></FormField>
        <FormField label="Fee (₹)" required><input name="consultationFee" type="number" value={form.consultationFee} onChange={set} min={0} className="inp" required /></FormField>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="btn btn-primary flex-1">{saving ? 'Creating…' : 'Create Doctor'}</button>
        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
      </div>
    </form>
  );
}

function ConfirmModal({ title, message, confirmLabel, confirmStyle = 'danger', onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    try { await onConfirm(); } finally { setLoading(false); }
  };
  return (
    <Modal title={title} onClose={onClose} maxWidth="max-w-sm">
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{message}</p>
      <div className="flex gap-3">
        <button onClick={handle} disabled={loading}
          className={`btn flex-1 ${confirmStyle === 'danger' ? 'btn-primary' : 'btn-secondary'}`}
          style={confirmStyle === 'danger' ? { background: 'var(--danger)' } : {}}>
          {loading ? 'Processing…' : confirmLabel}
        </button>
        <button onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
      </div>
    </Modal>
  );
}

export default function AdminDoctors() {
  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [confirm, setConfirm] = useState(null); // { type, doctor }
  const [success, setSuccess] = useState('');
  const [err, setErr]         = useState('');

  const load = () => {
    setLoading(true);
    api.get('/doctors/admin/all').then(r => setList(norm(r))).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const flash = (msg, isErr = false) => {
    if (isErr) { setErr(msg); setTimeout(() => setErr(''), 4000); }
    else        { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); }
  };

  const handleToggleStatus = async (doctor) => {
    const newStatus = !doctor.isActive;
    try {
      await api.patch(`/doctors/${doctor.id}/status`, { isActive: newStatus });
      flash(newStatus ? `Dr. ${doctor.firstName} ${doctor.lastName} activated.` : `Dr. ${doctor.firstName} ${doctor.lastName} deactivated — login blocked.`);
      load();
    } catch (ex) {
      flash(ex.response?.data?.message || 'Failed to update status', true);
    }
    setConfirm(null);
  };

  const handleDelete = async (doctor) => {
    try {
      await api.delete(`/doctors/${doctor.id}`);
      flash(`Dr. ${doctor.firstName} ${doctor.lastName} has been permanently deleted.`);
      load();
    } catch (ex) {
      flash(ex.response?.data?.message || 'Failed to delete doctor', true);
    }
    setConfirm(null);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 anim-up">

      {/* Confirm modals */}
      {confirm?.type === 'deactivate' && (
        <ConfirmModal
          title="Deactivate Doctor"
          message={`Are you sure you want to deactivate Dr. ${confirm.doctor.firstName} ${confirm.doctor.lastName}? They will no longer be able to log in.`}
          confirmLabel="Deactivate"
          confirmStyle="danger"
          onConfirm={() => handleToggleStatus(confirm.doctor)}
          onClose={() => setConfirm(null)}
        />
      )}
      {confirm?.type === 'activate' && (
        <ConfirmModal
          title="Activate Doctor"
          message={`Re-activate Dr. ${confirm.doctor.firstName} ${confirm.doctor.lastName}? They will be able to log in again.`}
          confirmLabel="Activate"
          confirmStyle="secondary"
          onConfirm={() => handleToggleStatus(confirm.doctor)}
          onClose={() => setConfirm(null)}
        />
      )}
      {confirm?.type === 'delete' && (
        <ConfirmModal
          title="Delete Doctor"
          message={`Permanently delete Dr. ${confirm.doctor.firstName} ${confirm.doctor.lastName}? This cannot be undone and will remove all associated data.`}
          confirmLabel="Delete Permanently"
          confirmStyle="danger"
          onConfirm={() => handleDelete(confirm.doctor)}
          onClose={() => setConfirm(null)}
        />
      )}

      {showCreate && (
        <Modal title="Add New Doctor" onClose={() => setShowCreate(false)}>
          <CreateForm onClose={() => setShowCreate(false)} onDone={() => { flash('Doctor created successfully!'); load(); }} />
        </Modal>
      )}

      {/* Header */}
      <div className="ph">
        <div>
          <h1 className="ph-title">Doctors</h1>
          <p className="ph-sub">{list.length} registered · {list.filter(d => d.isActive).length} active</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary">+ Add Doctor</button>
      </div>

      {success && <Alert type="success">{success}</Alert>}
      {err     && <Alert type="error">{err}</Alert>}

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Specialization</th>
              <th>Qualification</th>
              <th>Experience</th>
              <th>Fee</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!list.length
              ? <tr><td colSpan={7}><EmptyState icon="👨‍⚕️" title="No doctors yet" /></td></tr>
              : list.map(d => (
              <tr key={d.id} style={{ opacity: d.isActive ? 1 : 0.6 }}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: d.isActive
                        ? 'linear-gradient(135deg,#3b82f6,#6366f1)'
                        : 'linear-gradient(135deg,#94a3b8,#64748b)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: 11, fontWeight: 700,
                    }}>
                      {d.firstName[0]}{d.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Dr. {d.firstName} {d.lastName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.email}</p>
                    </div>
                  </div>
                </td>
                <td>{d.specialization}</td>
                <td>{d.qualification}</td>
                <td>{d.experience} yrs</td>
                <td>₹{Number(d.consultationFee).toLocaleString('en-IN')}</td>
                <td><StatusBadge status={d.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                <td>
                  <div className="flex items-center gap-2">
                    {/* Toggle active/inactive */}
                    {d.isActive ? (
                      <button
                        onClick={() => setConfirm({ type: 'deactivate', doctor: d })}
                        className="btn btn-sm"
                        style={{ background: 'var(--warning-light)', color: '#92400e', border: '1px solid #fcd34d' }}
                        title="Deactivate — blocks login">
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirm({ type: 'activate', doctor: d })}
                        className="btn btn-sm"
                        style={{ background: 'var(--success-light)', color: '#065f46', border: '1px solid #6ee7b7' }}
                        title="Re-activate login">
                        Activate
                      </button>
                    )}
                    {/* Delete */}
                    <button
                      onClick={() => setConfirm({ type: 'delete', doctor: d })}
                      className="btn btn-sm"
                      style={{ background: 'var(--danger-light)', color: '#991b1b', border: '1px solid #fca5a5' }}
                      title="Permanently delete">
                      Delete
                    </button>
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
