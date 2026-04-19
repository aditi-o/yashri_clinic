import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { receptionistService } from '../../services/receptionistService';
import { PageLoader, StatusBadge, EmptyState } from '../../components/ui';

export default function ManageSchedule() {
  const navigate    = useNavigate();
  const { user }    = useAuthStore();
  const perms       = user?.receptionist?.permissions ?? {};

  const [appts,      setAppts]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('ALL');
  const [search,     setSearch]     = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [cancelling, setCancelling] = useState(null);

  const load = () => {
    setLoading(true);
    receptionistService.getAllAppointments()
      .then(r => setAppts(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async id => {
    if (!perms.cancelAppointment) return;
    if (!window.confirm('Cancel this appointment?')) return;
    setCancelling(id);
    try {
      await receptionistService.cancelAppointment(id);
      setAppts(prev => prev.map(a => a.id === id ? { ...a, status: 'CANCELLED' } : a));
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to cancel.');
    } finally { setCancelling(null); }
  };

  const filtered = appts.filter(a => {
    const matchStatus = filter === 'ALL' || a.status === filter;
    const matchDate   = !dateFilter || (a.appointmentDate || '').startsWith(dateFilter);
    const q           = search.toLowerCase();
    const matchSearch = !q ||
      `${a.patient?.firstName} ${a.patient?.lastName}`.toLowerCase().includes(q) ||
      `${a.doctor?.firstName} ${a.doctor?.lastName}`.toLowerCase().includes(q);
    return matchStatus && matchDate && matchSearch;
  });

  return (
    <div className="space-y-5 anim-up">
      <div className="ph">
        <div>
          <h1 className="ph-title">Appointment Schedule</h1>
          <p className="ph-sub">{filtered.length} appointments shown</p>
        </div>
        <div className="flex gap-2">
          {perms.bookAppointment && (
            <button onClick={() => navigate('/receptionist/book-appointment')} className="btn btn-primary">
              + Book New
            </button>
          )}
          <button onClick={() => navigate('/receptionist/dashboard')} className="btn btn-secondary">← Back</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-3 items-center py-4">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search patient or doctor…" className="inp" style={{ maxWidth: 220 }} />
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
          className="inp" style={{ maxWidth: 160 }} />
        <div className="flex gap-1.5 flex-wrap">
          {['ALL','SCHEDULED','COMPLETED','CANCELLED','NO_SHOW'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="btn btn-sm transition-all"
              style={{
                background: filter === s ? 'var(--brand)' : 'var(--surface-2)',
                color:      filter === s ? 'white'        : 'var(--text-muted)',
                border:     '1px solid var(--border)',
              }}>
              {s === 'NO_SHOW' ? 'No Show' : s === 'ALL' ? 'All' : s[0] + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        {(search || dateFilter || filter !== 'ALL') && (
          <button onClick={() => { setSearch(''); setDateFilter(''); setFilter('ALL'); }}
            className="text-xs font-semibold" style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Clear ×
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <PageLoader label="Loading schedule…" />
      ) : filtered.length > 0 ? (
        <div className="tbl-wrap">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                  {perms.cancelAppointment && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
                          {a.patient?.firstName?.[0]}{a.patient?.lastName?.[0]}
                        </div>
                        <span className="font-semibold">{a.patient?.firstName} {a.patient?.lastName}</span>
                      </div>
                    </td>
                    <td>
                      <p style={{ color: 'var(--text-muted)' }}>Dr. {a.doctor?.firstName} {a.doctor?.lastName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-light)' }}>{a.doctor?.specialization}</p>
                    </td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(a.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="font-semibold" style={{ whiteSpace: 'nowrap' }}>{a.appointmentTime}</td>
                    <td className="max-w-[160px] truncate" style={{ color: 'var(--text-muted)' }}>{a.reason || '—'}</td>
                    <td><StatusBadge status={a.status} /></td>
                    {perms.cancelAppointment && (
                      <td>
                        {a.status === 'SCHEDULED' && (
                          <button onClick={() => handleCancel(a.id)} disabled={cancelling === a.id}
                            className="btn btn-danger btn-sm">
                            {cancelling === a.id
                              ? <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin inline-block" />
                              : 'Cancel'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <EmptyState icon="📋" title="No appointments found" sub="Try adjusting your filters" />
        </div>
      )}
    </div>
  );
}
