import { useEffect, useState } from 'react';
import { PageLoader, StatusBadge, EmptyState } from '../../components/ui';
import api from '../../services/api';
const norm=r=>{const d=r.data?.data??r.data;return Array.isArray(d)?d:[];};

export default function AdminAppointments(){
  const [list,setList]=useState([]);const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState('ALL');const [q,setQ]=useState('');
  useEffect(()=>{api.get('/appointments').then(r=>setList(norm(r))).finally(()=>setLoading(false));},[]);
  const filtered=list.filter(a=>{
    const ms=filter==='ALL'||a.status===filter;
    const qn=q.toLowerCase();
    return ms&&(!qn||`${a.patient?.firstName} ${a.patient?.lastName} ${a.doctor?.firstName} ${a.doctor?.lastName}`.toLowerCase().includes(qn));
  });
  if(loading)return<PageLoader/>;
  return(
    <div className="space-y-5 anim-up">
      <div className="ph"><div><h1 className="ph-title">All Appointments</h1><p className="ph-sub">{list.length} total</p></div></div>
      <div className="card flex flex-wrap gap-3 items-center py-4">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search patient or doctor…" className="inp" style={{maxWidth:240}}/>
        <div className="flex gap-1.5 flex-wrap">
          {['ALL','SCHEDULED','COMPLETED','CANCELLED','NO_SHOW'].map(s=>(
            <button key={s} onClick={()=>setFilter(s)} className="btn btn-sm transition-all"
              style={{background:filter===s?'var(--brand)':'var(--surface-2)',color:filter===s?'white':'var(--text-muted)',border:'1px solid var(--border)'}}>
              {s==='NO_SHOW'?'No Show':s==='ALL'?'All':s[0]+s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Reason</th><th>Status</th></tr></thead>
        <tbody>
          {!filtered.length?<tr><td colSpan={6}><EmptyState icon="📋" title="No appointments found"/></td></tr>
            :filtered.map(a=>(
            <tr key={a.id}>
              <td className="font-semibold">{a.patient?.firstName} {a.patient?.lastName}</td>
              <td><p style={{color:'var(--text-muted)'}}>Dr. {a.doctor?.firstName} {a.doctor?.lastName}</p><p className="text-xs" style={{color:'var(--text-light)'}}>{a.doctor?.specialization}</p></td>
              <td style={{color:'var(--text-muted)'}}>{new Date(a.appointmentDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td>
              <td style={{color:'var(--text-muted)'}}>{a.appointmentTime}</td>
              <td className="max-w-[140px] truncate" style={{color:'var(--text-muted)'}}>{a.reason||'—'}</td>
              <td><StatusBadge status={a.status}/></td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
}
