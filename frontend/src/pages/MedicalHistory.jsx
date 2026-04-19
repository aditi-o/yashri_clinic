import { useEffect, useState } from 'react';
import { patientService } from '../services/patientService';
import { billingService } from '../services/billingService';
import { PageLoader, StatusBadge, EmptyState, SectionHeader } from '../components/ui';
import api from '../services/api';

async function downloadPrescription(visitId) {
  try {
    const response = await api.get(`/visits/${visitId}/prescription`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(new Blob([response.data], { type: 'text/html' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription-${visitId}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    alert('Prescription not available for this visit.');
  }
}

function VitalChip({ label, value, unit }) {
  if (!value) return null;
  return (
    <div className="text-center p-2.5 rounded-xl" style={{ background: 'var(--surface-3)' }}>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="font-bold text-sm mt-0.5">{value}{unit}</p>
    </div>
  );
}

export default function MedicalHistory() {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(null);

  useEffect(() => {
    patientService.getHistory()
      .then(r => setHistory(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const viewInvoice = async visitId => {
    try {
      const r = await billingService.getInvoiceByVisitId(visitId);
      const i = r.data;
      alert(`Invoice: ${i.invoiceNumber}\nConsultation: ₹${i.consultationFee}\nMedicines: ₹${i.medicineCharges}\nFinal: ₹${i.finalAmount}`);
    } catch { alert('Invoice not found'); }
  };

  if (loading) return <PageLoader label="Loading medical history…" />;

  const visits = history?.visits || [];

  return (
    <div className="space-y-6 anim-up">
      <div>
        <h1 className="ph-title">Medical History</h1>
        <p className="ph-sub">{visits.length} visit{visits.length !== 1 ? 's' : ''} on record</p>
      </div>

      {visits.length === 0 ? (
        <div className="card">
          <EmptyState icon="🏥" title="No medical history yet" sub="Your visit records will appear here after your appointments are completed" />
        </div>
      ) : (
        <div className="space-y-4">
          {visits.map(v => {
            const isOpen = open === v.id;
            return (
              <div key={v.id} className="card overflow-hidden">
                <button className="w-full text-left" onClick={() => setOpen(isOpen ? null : v.id)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl text-white text-sm font-bold flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, var(--brand), var(--purple))' }}>
                        {v.doctor.firstName[0]}{v.doctor.lastName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm">
                          {new Date(v.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Dr. {v.doctor.firstName} {v.doctor.lastName} · {v.doctor.specialization}</p>
                        <p className="text-sm font-semibold mt-0.5">{v.chiefComplaint}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {v.isCompleted && <StatusBadge status="COMPLETED" />}
                      <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-5 pt-5 space-y-4 anim-in" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Diagnosis</p>
                        <p className="text-sm">{v.diagnosis}</p>
                      </div>
                      {v.symptoms && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Symptoms</p>
                          <p className="text-sm">{v.symptoms}</p>
                        </div>
                      )}
                    </div>

                    {v.vitalSigns && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Vital Signs</p>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <VitalChip label="Temperature" value={v.vitalSigns.temperature} unit="°F" />
                          <VitalChip label="Blood Pressure" value={v.vitalSigns.bloodPressure} unit="" />
                          <VitalChip label="Pulse" value={v.vitalSigns.pulse} unit=" bpm" />
                          <VitalChip label="Weight" value={v.vitalSigns.weight} unit=" kg" />
                          <VitalChip label="Height" value={v.vitalSigns.height} unit=" cm" />
                        </div>
                      </div>
                    )}

                    {v.prescriptions?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Prescriptions</p>
                        <div className="space-y-2">
                          {v.prescriptions.map(p => (
                            <div key={p.id} className="flex gap-3 p-3 rounded-xl" style={{ background: 'var(--info-light)' }}>
                              <span className="text-sm">💊</span>
                              <div>
                                <p className="text-sm font-bold">{p.medicine.name} <span className="font-normal" style={{ color: 'var(--text-muted)' }}>({p.medicine.strength})</span></p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.dosage} · {p.frequency} · {p.duration}</p>
                                {p.instructions && <p className="text-xs italic mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.instructions}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {v.notes && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Doctor's Notes</p>
                        <p className="text-sm p-3 rounded-xl" style={{ background: 'var(--surface-3)' }}>{v.notes}</p>
                      </div>
                    )}

                    {v.followUpDate && (
                      <p className="text-sm font-medium" style={{ color: 'var(--warning)' }}>
                        📅 Follow-up: {new Date(v.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}

                    {v.invoice && (
                      <div className="flex gap-3 flex-wrap">
                        <button onClick={() => viewInvoice(v.id)} className="btn btn-secondary btn-sm">
                          🧾 View Invoice
                        </button>
                        <button onClick={() => downloadPrescription(v.id)} className="btn btn-secondary btn-sm">
                          ⬇ Download Prescription
                        </button>
                      </div>
                    )}
                    {!v.invoice && (
                      <button onClick={() => downloadPrescription(v.id)} className="btn btn-secondary btn-sm">
                        ⬇ Download Prescription
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
