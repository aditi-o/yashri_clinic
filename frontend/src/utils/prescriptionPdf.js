/** Client-side prescription PDF generation (jsPDF + autotable). */

export async function generatePrescriptionPDF(visit, prescriptions) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const pt  = visit.patient || {};
  const doc = visit.doctor  || {};
  const visitDate = visit.visitDate
    ? new Date(visit.visitDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })
    : '';
  const visitRef = `V-${visit.id.slice(0,8).toUpperCase()}`;
  const followUp = visit.followUpDate
    ? new Date(visit.followUpDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })
    : null;

  const pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const W = pdf.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  pdf.setFillColor(122, 26, 46);
  pdf.rect(0, 0, W, 28, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16); pdf.setFont('helvetica','bold');
  pdf.text('ClinicMS — Medical Prescription', W / 2, 11, { align:'center' });
  pdf.setFontSize(9); pdf.setFont('helvetica','normal');
  pdf.text(`Dr. ${doc.firstName || ''} ${doc.lastName || ''}  ·  ${doc.specialization || ''}`, W / 2, 19, { align:'center' });
  y = 34;

  pdf.setTextColor(80, 80, 80);
  pdf.setFontSize(8); pdf.setFont('helvetica','normal');
  pdf.text(`Ref: ${visitRef}`, margin, y);
  pdf.text(`Date: ${visitDate}`, W - margin, y, { align:'right' });
  y += 6;

  pdf.setDrawColor(122, 26, 46);
  pdf.setLineWidth(0.4);
  pdf.line(margin, y, W - margin, y);
  y += 6;

  pdf.setFillColor(253, 242, 244);
  pdf.roundedRect(margin, y, W - margin * 2, 18, 2, 2, 'F');
  pdf.setTextColor(30, 30, 30);
  pdf.setFontSize(8); pdf.setFont('helvetica','bold');
  const patName = `${pt.firstName || ''} ${pt.lastName || ''}`.trim();
  pdf.text('PATIENT', margin + 4, y + 5);
  pdf.text('GENDER / BLOOD GROUP', margin + 70, y + 5);
  pdf.text('ALLERGIES', margin + 140, y + 5);
  pdf.setFont('helvetica','normal'); pdf.setFontSize(10);
  pdf.text(patName || '—', margin + 4, y + 12);
  pdf.text(`${pt.gender || '—'} / ${pt.bloodGroup || '—'}`, margin + 70, y + 12);
  pdf.text(pt.allergies || 'None', margin + 140, y + 12);
  y += 24;

  if (visit.diagnosis) {
    pdf.setFillColor(245, 248, 255);
    const diagLines = pdf.splitTextToSize(`Diagnosis: ${visit.diagnosis}`, W - margin * 2 - 8);
    const complaintLines = pdf.splitTextToSize(`Chief Complaint: ${visit.chiefComplaint || '—'}`, W - margin * 2 - 8);
    const boxH = (diagLines.length + complaintLines.length) * 4.5 + 10;
    pdf.roundedRect(margin, y, W - margin * 2, boxH, 2, 2, 'F');
    pdf.setDrawColor(190, 210, 255);
    pdf.roundedRect(margin, y, W - margin * 2, boxH, 2, 2, 'S');
    pdf.setTextColor(30, 30, 80);
    pdf.setFontSize(8.5); pdf.setFont('helvetica','bold');
    pdf.text(complaintLines, margin + 4, y + 6);
    pdf.setFont('helvetica','normal');
    pdf.text(diagLines, margin + 4, y + 6 + complaintLines.length * 4.5);
    y += boxH + 6;
  }

  pdf.setTextColor(122, 26, 46);
  pdf.setFontSize(22); pdf.setFont('helvetica','bold');
  pdf.text('\u211E', margin, y + 7);
  y += 12;

  const rows = (prescriptions || []).map((p, i) => [
    i + 1,
    `${p.medicine?.name || p.customMedicineName || '—'}${p.medicine?.strength ? `\n(${p.medicine.strength})` : ''}`,
    p.dosage || '—',
    p.frequency || '—',
    p.duration || '—',
    p.instructions || '—',
  ]);

  autoTable(pdf, {
    startY: y,
    head: [['#', 'Medicine', 'Dosage', 'Frequency', 'Duration', 'Instructions']],
    body: rows.length ? rows : [[' ', 'No medicines prescribed', '', '', '', '']],
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [122, 26, 46], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8.5, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [253, 248, 249] },
    columnStyles: {
      0: { cellWidth: 8,  halign:'center' },
      1: { cellWidth: 52 },
      2: { cellWidth: 22 },
      3: { cellWidth: 32 },
      4: { cellWidth: 22 },
      5: { cellWidth: 42 },
    },
    tableLineColor: [240, 208, 214],
    tableLineWidth: 0.2,
  });

  y = pdf.lastAutoTable.finalY + 10;

  pdf.setDrawColor(229, 192, 200);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, W - margin, y);
  y += 6;

  pdf.setFontSize(8); pdf.setFont('helvetica','normal'); pdf.setTextColor(120,120,120);
  if (followUp) {
    pdf.setFont('helvetica','bold'); pdf.setTextColor(122,26,46);
    pdf.text('Follow-up Date', margin, y);
    pdf.setFontSize(10);
    pdf.text(followUp, margin, y + 5);
  }

  const sigX = W - margin - 50;
  pdf.setDrawColor(122,26,46); pdf.setLineWidth(0.4);
  pdf.line(sigX, y + 8, W - margin, y + 8);
  pdf.setFontSize(9); pdf.setFont('helvetica','bold'); pdf.setTextColor(30,30,30);
  pdf.text(`Dr. ${doc.firstName||''} ${doc.lastName||''}`.trim(), sigX, y + 13);
  pdf.setFontSize(7.5); pdf.setFont('helvetica','normal'); pdf.setTextColor(100,100,100);
  pdf.text(doc.specialization || 'Physician', sigX, y + 18);

  pdf.setFontSize(7); pdf.setTextColor(200,160,170);
  pdf.text(`This prescription is valid for 30 days from date of issue  ·  ${visitRef}`,
    W / 2, y + 25, { align:'center' });

  return pdf;
}

/** Fetch visit + prescriptions from API and trigger a PDF download. */
export async function downloadPrescriptionPdf(visitId, api) {
  const [visitRes, rxRes] = await Promise.all([
    api.get(`/visits/${visitId}`),
    api.get(`/prescriptions/visit/${visitId}`),
  ]);
  const visit = visitRes.data?.data ?? visitRes.data;
  const prescriptions = rxRes.data?.data ?? rxRes.data;
  const list = Array.isArray(prescriptions) ? prescriptions : [];
  if (!list.length) throw new Error('No prescriptions found for this visit.');
  const pdf = await generatePrescriptionPDF(visit, list);
  pdf.save(`prescription-${visitId}.pdf`);
}
