import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { PageLoader, Alert, Spinner, FormField } from '../../components/ui';

const FREQ_OPTIONS = [
  'Once daily','Twice daily','Thrice daily','Four times daily',
  'Every 6 hours','Every 8 hours','Every 12 hours',
  'At bedtime','Empty stomach','With meals','As needed (SOS)',
];
const DUR_OPTIONS = [
  '1 day','2 days','3 days','5 days','7 days','10 days',
  '14 days','1 month','2 months','3 months','Continue',
];
const DOSAGE_FORM_OPTIONS = ['Tablet','Capsule','Syrup','Drops','Cream','Ointment','Injection','Inhaler','Patch','Powder'];

let _keyCounter = 0;
const EMPTY_ROW = () => ({
  _key: String(++_keyCounter),
  // DB medicine fields
  medicineId: '',
  medicineName: '',
  strength: '',
  dosageForm: '',
  // Custom (free-text) override — used when doctor types a name not in DB
  isCustom: false,
  customName: '',
  // Prescription fields
  dosage: '1 tablet',
  frequency: 'Twice daily',
  duration: '5 days',
  instructions: '',
});

// ── Medicine search input ──────────────────────────────────────────────────
function MedSearchInput({ rowKey, value, isCustom, onSelect, onCustom, meds }) {
  const [query, setQuery]   = useState(value || '');
  const [open,  setOpen]    = useState(false);
  const [pos,   setPos]     = useState({ top:0, left:0, width:0 });
  const inputRef = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  const openDrop = () => {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: r.width });
    }
    setOpen(true);
  };

  const filtered = query.trim().length === 0
    ? meds.slice(0, 20)
    : meds.filter(m =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        (m.genericName || '').toLowerCase().includes(query.toLowerCase())
      ).slice(0, 20);

  const pick = (med) => { setOpen(false); onSelect(med); };

  const useCustom = () => {
    setOpen(false);
    onCustom(query.trim());
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        className="inp"
        placeholder="Search or type medicine name…"
        value={query}
        onFocus={openDrop}
        onChange={e => { setQuery(e.target.value); openDrop(); }}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        autoComplete="off"
      />
      {isCustom && (
        <p className="text-xs mt-1 font-semibold" style={{ color: '#7c3aed' }}>
          ✎ Custom medicine — not in database
        </p>
      )}
      {open && (
        <div style={{
          position:'fixed', top:pos.top, left:pos.left, width:pos.width,
          background:'#fff', border:'1px solid #e2e8f0', borderRadius:10,
          boxShadow:'0 8px 30px rgba(0,0,0,.15)', maxHeight:240, overflowY:'auto', zIndex:9999,
        }}>
          {filtered.map(m => (
            <button key={m.id} type="button" onMouseDown={() => pick(m)}
              style={{ display:'block', width:'100%', textAlign:'left', padding:'8px 14px',
                fontSize:13, background:'none', border:'none', cursor:'pointer',
                borderBottom:'1px solid #f3f4f6' }}
              onMouseEnter={e => e.currentTarget.style.background='#eff6ff'}
              onMouseLeave={e => e.currentTarget.style.background='none'}>
              <strong>{m.name}</strong>
              <span style={{ marginLeft:8, fontSize:11, color:'#9ca3af' }}>
                {[m.strength, m.dosageForm, m.genericName].filter(Boolean).join(' · ')}
              </span>
            </button>
          ))}
          {/* Always show "use custom" option when there's a typed query */}
          {query.trim().length > 0 && (
            <button type="button" onMouseDown={useCustom}
              style={{ display:'block', width:'100%', textAlign:'left', padding:'9px 14px',
                fontSize:13, background:'#f5f3ff', border:'none', cursor:'pointer',
                color:'#7c3aed', fontWeight:600 }}>
              ✎ Use "{query.trim()}" as custom medicine
            </button>
          )}
          {filtered.length === 0 && query.trim().length === 0 && (
            <div style={{ padding:'10px 14px', fontSize:13, color:'#9ca3af' }}>
              Start typing to search…
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Add Custom Medicine to DB modal ─────────────────────────────────────────
function AddMedicineModal({ initialName, onClose, onAdded }) {
  const [form, setForm] = useState({
    name: initialName || '', genericName: '', dosageForm: 'Tablet',
    strength: '', price: '', manufacturer: '', category: '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!form.name || !form.dosageForm || !form.strength) {
      setError('Name, dosage form and strength are required.'); return;
    }
    setSaving(true); setError('');
    try {
      const res = await api.post('/medicines', {
        name:         form.name.trim(),
        genericName:  form.genericName || undefined,
        dosageForm:   form.dosageForm,
        strength:     form.strength.trim(),
        price:        form.price ? Number(form.price) : 0,
        manufacturer: form.manufacturer || undefined,
        category:     form.category     || undefined,
        stockQuantity: 0,
      });
      const med = res.data?.data ?? res.data;
      onAdded(med);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add medicine.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
      zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:16,
    }}>
      <div style={{
        background:'#fff', borderRadius:16, padding:24, width:'100%', maxWidth:480,
        boxShadow:'0 20px 60px rgba(0,0,0,.3)', maxHeight:'90vh', overflowY:'auto',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h2 style={{ fontWeight:700, fontSize:16 }}>➕ Add Medicine to Database</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#9ca3af' }}>✕</button>
        </div>
        {error && <Alert type="error">{error}</Alert>}
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:12, marginTop:8 }}>
          <FormField label="Medicine Name" required>
            <input name="name" value={form.name} onChange={set} className="inp" required placeholder="e.g. Paracetamol" />
          </FormField>
          <FormField label="Generic Name">
            <input name="genericName" value={form.genericName} onChange={set} className="inp" placeholder="e.g. Acetaminophen" />
          </FormField>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <FormField label="Dosage Form" required>
              <select name="dosageForm" value={form.dosageForm} onChange={set} className="inp">
                {DOSAGE_FORM_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </FormField>
            <FormField label="Strength" required>
              <input name="strength" value={form.strength} onChange={set} className="inp" required placeholder="e.g. 500mg" />
            </FormField>
            <FormField label="Price (₹)">
              <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={set} className="inp" placeholder="0.00" />
            </FormField>
            <FormField label="Category">
              <input name="category" value={form.category} onChange={set} className="inp" placeholder="e.g. Antibiotic" />
            </FormField>
          </div>
          <FormField label="Manufacturer">
            <input name="manufacturer" value={form.manufacturer} onChange={set} className="inp" placeholder="e.g. Sun Pharma" />
          </FormField>
          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex:1 }}>
              {saving ? <><Spinner size="sm" /> Saving…</> : '✓ Add Medicine'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function MakePrescription() {
  const navigate    = useNavigate();
  const { visitId } = useParams();

  const [visit,       setVisit]       = useState(null);
  const [meds,        setMeds]        = useState([]);
  const [rows,        setRows]        = useState([EMPTY_ROW()]);
  const [existing,    setExisting]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [showAddMed,  setShowAddMed]  = useState(false);
  const [addMedName,  setAddMedName]  = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/visits/${visitId}`).then(r => r.data?.data ?? r.data),
      api.get('/medicines').then(r => {
        const d = r.data?.data ?? r.data;
        return Array.isArray(d) ? d.filter(x => x.isActive !== false) : [];
      }),
      api.get(`/prescriptions/visit/${visitId}`).then(r => {
        const d = r.data?.data ?? r.data;
        return Array.isArray(d) ? d : [];
      }),
    ])
      .then(([v, m, p]) => { setVisit(v); setMeds(m); setExisting(p); })
      .catch(() => setError('Failed to load visit data.'))
      .finally(() => setLoading(false));
  }, [visitId]);

  const updateRow = useCallback((key, fields) =>
    setRows(rs => rs.map(r => r._key === key ? { ...r, ...fields } : r)), []);

  const addRow    = () => setRows(rs => [...rs, EMPTY_ROW()]);
  const removeRow = key => setRows(rs => rs.filter(r => r._key !== key));

  // User picked a medicine from the DB dropdown
  const handleSelectMed = useCallback((key, med) => {
    updateRow(key, {
      medicineId:   med.id,
      medicineName: med.name,
      strength:     med.strength   || '',
      dosageForm:   med.dosageForm || '',
      isCustom:     false,
      customName:   '',
      dosage: (med.dosageForm || '').toLowerCase().includes('syrup') ? '10 ml'
            : (med.dosageForm || '').toLowerCase().includes('drop')  ? '2 drops'
            : '1 tablet',
    });
  }, [updateRow]);

  // User typed a name and selected "Use as custom"
  const handleCustomMed = useCallback((key, name) => {
    updateRow(key, {
      medicineId:   '',
      medicineName: name,
      isCustom:     true,
      customName:   name,
    });
  }, [updateRow]);

  // After adding to DB, auto-fill the row
  const handleMedicineAdded = useCallback((med) => {
    setMeds(m => [...m, med]);
    // Find any row that had this custom name and upgrade it
    setRows(rs => rs.map(r =>
      r.isCustom && r.customName.toLowerCase() === med.name.toLowerCase()
        ? { ...r, medicineId: med.id, medicineName: med.name, strength: med.strength || '', isCustom: false, customName: '' }
        : r
    ));
    setSuccess(`"${med.name}" added to the medicine database.`);
  }, []);

  const deleteExisting = async (id) => {
    if (!window.confirm('Remove this medicine from the prescription?')) return;
    try {
      await api.delete(`/prescriptions/${id}`);
      setExisting(e => e.filter(x => x.id !== id));
      setSuccess('Medicine removed.'); setError('');
    } catch { setError('Failed to remove medicine.'); }
  };

  const save = async () => {
    const valid = rows.filter(r => r.medicineId || r.isCustom);
    if (!valid.length) { setError('Select or enter at least one medicine before saving.'); return; }

    // Custom medicines need to be created in DB first
    const toCreate = valid.filter(r => r.isCustom && !r.medicineId);
    if (toCreate.length) {
      setError(`Please add custom medicines to the database first by clicking "Save to DB" on each custom row.`);
      return;
    }

    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await api.post('/prescriptions', {
        visitId,
        medicines: valid.map(r => ({
          medicineId:   r.medicineId,
          dosage:       r.dosage     || '1 tablet',
          frequency:    r.frequency  || 'Twice daily',
          duration:     r.duration   || '5 days',
          instructions: r.instructions || undefined,
        })),
      });
      const created = res.data?.data;
      setExisting(e => [...e, ...(Array.isArray(created) ? created : [])]);
      setRows([EMPTY_ROW()]);
      setSuccess(`${valid.length} medicine(s) saved to prescription.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save prescription.');
    } finally { setSaving(false); }
  };

  const handlePrint = () => {
    if (existing.length === 0) { alert('Save at least one medicine before printing.'); return; }
    window.open(`/doctor/prescription/print/${visitId}`, '_blank');
  };

  if (loading) return <PageLoader label="Loading visit…" />;

  const pt  = visit?.patient || {};
  const doc = visit?.doctor  || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6 anim-up">

      {showAddMed && (
        <AddMedicineModal
          initialName={addMedName}
          onClose={() => setShowAddMed(false)}
          onAdded={handleMedicineAdded}
        />
      )}

      {/* Header */}
      <div className="ph">
        <div>
          <h1 className="ph-title">💊 Make Prescription</h1>
          <p className="ph-sub">
            {pt.firstName} {pt.lastName}
            {visit?.visitDate ? ` · ${new Date(visit.visitDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}` : ''}
            {doc.firstName ? ` · Dr. ${doc.firstName} ${doc.lastName}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {existing.length > 0 && (
            <button onClick={handlePrint} className="btn btn-primary">
              🖨 Print
            </button>
          )}
          <button onClick={() => navigate(-1)} className="btn btn-secondary">← Back</button>
        </div>
      </div>

      {/* Visit summary */}
      <div className="card" style={{ background:'var(--brand-light)', border:'1.5px solid #bfdbfe' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {[
            ['Chief Complaint', visit?.chiefComplaint],
            ['Diagnosis',       visit?.diagnosis],
            ['Follow-up', visit?.followUpDate
              ? new Date(visit.followUpDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})
              : 'Not scheduled'],
          ].map(([label, val]) => (
            <div key={label}>
              <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color:'var(--text-muted)' }}>{label}</p>
              <p className="font-semibold">{val || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {error   && <Alert type="error">{error}</Alert>}
      {success && (
        <div className="px-4 py-3 rounded-xl text-sm font-semibold"
          style={{ background:'#d1fae5', color:'#065f46' }}>✓ {success}</div>
      )}

      {/* Existing prescriptions */}
      {existing.length > 0 && (
        <div className="card">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4 pb-2"
            style={{ color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>
            Prescribed Medicines ({existing.length})
          </h3>
          <div className="space-y-2">
            {existing.map((p, i) => (
              <div key={p.id} className="flex items-start justify-between gap-3 p-3 rounded-xl"
                style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                <div className="flex gap-3 items-start flex-1 min-w-0">
                  <span className="text-xs font-bold w-5 flex-shrink-0 mt-0.5" style={{ color:'var(--brand)' }}>{i+1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">
                      {p.medicine?.name}
                      {p.medicine?.strength && (
                        <span className="font-normal ml-1 text-xs" style={{ color:'var(--text-muted)' }}>
                          ({p.medicine.strength})
                        </span>
                      )}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>
                      {[p.dosage, p.frequency, p.duration, p.instructions].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => deleteExisting(p.id)}
                  style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#ef4444', flexShrink:0 }}>
                  ✕ Remove
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={handlePrint} className="btn btn-primary btn-sm">
              🖨 Print
            </button>
          </div>
        </div>
      )}

      {/* Add medicines */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 pb-2"
          style={{ borderBottom:'1px solid var(--border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text-muted)' }}>
            Add Medicines
          </h3>
          <button
            type="button"
            onClick={() => { setAddMedName(''); setShowAddMed(true); }}
            className="btn btn-secondary btn-sm"
            style={{ fontSize:11 }}>
            + Add New Medicine to Database
          </button>
        </div>

        <div className="space-y-4">
          {rows.map((row, idx) => (
            <div key={row._key} className="p-4 rounded-2xl space-y-3"
              style={{ background:'var(--surface-2)', border:'1.5px solid var(--border)' }}>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color:'var(--brand)' }}>Medicine #{idx+1}</span>
                <div className="flex gap-2 items-center">
                  {row.isCustom && !row.medicineId && (
                    <button
                      type="button"
                      onClick={() => { setAddMedName(row.customName); setShowAddMed(true); }}
                      style={{ fontSize:11, padding:'2px 10px', borderRadius:6,
                        background:'#f5f3ff', border:'1px solid #7c3aed',
                        color:'#7c3aed', cursor:'pointer', fontWeight:600 }}>
                      Save to DB
                    </button>
                  )}
                  {rows.length > 1 && (
                    <button type="button" onClick={() => removeRow(row._key)}
                      style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'var(--text-muted)' }}>
                      ✕ Remove
                    </button>
                  )}
                </div>
              </div>

              <FormField label="Medicine" required>
                <MedSearchInput
                  rowKey={row._key}
                  value={row.medicineName}
                  isCustom={row.isCustom}
                  meds={meds}
                  onSelect={med => handleSelectMed(row._key, med)}
                  onCustom={name => handleCustomMed(row._key, name)}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Dosage" required>
                  <input type="text" className="inp"
                    placeholder="e.g. 1 tablet, 10 ml"
                    value={row.dosage}
                    onChange={e => updateRow(row._key, { dosage:e.target.value })} />
                </FormField>
                <FormField label="Frequency" required>
                  <select className="inp" value={row.frequency}
                    onChange={e => updateRow(row._key, { frequency:e.target.value })}>
                    {FREQ_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </FormField>
                <FormField label="Duration" required>
                  <select className="inp" value={row.duration}
                    onChange={e => updateRow(row._key, { duration:e.target.value })}>
                    {DUR_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </FormField>
                <FormField label="Instructions">
                  <input type="text" className="inp"
                    placeholder="e.g. After meals, Empty stomach"
                    value={row.instructions}
                    onChange={e => updateRow(row._key, { instructions:e.target.value })} />
                </FormField>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-4">
          <button type="button" onClick={addRow} className="btn btn-secondary btn-sm">
            + Add Another Medicine
          </button>
        </div>
      </div>

      {/* Save / Download */}
      <div className="flex gap-3 pb-8">
        <button type="button" onClick={save} disabled={saving} className="btn btn-primary flex-1 py-2.5">
          {saving ? <><Spinner size="sm" /> Saving…</> : '💾 Save Prescription'}
        </button>
        {existing.length > 0 && (
          <button type="button" onClick={handlePrint} className="btn btn-secondary py-2.5">
            🖨 Print
          </button>
        )}
      </div>
    </div>
  );
}
