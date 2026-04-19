const visitService = require('./visits.service');
const { createVisitSchema, updateVisitSchema } = require('./visits.validator');

/**
 * Generates a printable HTML prescription for a visit — styled after the clinic template.
 */
function buildPrescriptionHtml(visit) {
  const pt = visit.patient || {};
  const doc = visit.doctor || {};
  const prescriptions = visit.prescriptions || [];

  const patientName = `${pt.firstName || ''} ${pt.lastName || ''}`.trim();
  const doctorName = `Dr. ${doc.firstName || ''} ${doc.lastName || ''}`.trim();
  const visitDate = visit.visitDate
    ? new Date(visit.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const followUp = visit.followUpDate
    ? new Date(visit.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  // Shorten visit ID for display
  const visitRef = `V-${visit.id.slice(0, 8).toUpperCase()}`;

  const medRows = prescriptions.length > 0
    ? prescriptions.map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>
        <div class="mn">${p.medicine?.name || ''}</div>
        ${p.medicine?.strength ? `<div class="mg">${p.medicine.strength}${p.medicine.dosageForm ? ' · ' + p.medicine.dosageForm : ''}</div>` : ''}
      </td>
      <td>${p.dosage || ''}</td>
      <td>${p.frequency || ''}</td>
      <td>${p.duration || ''}</td>
      <td>${p.instructions || '—'}</td>
    </tr>`).join('')
    : `<tr><td colspan="6" style="text-align:center;color:#9b6b72;padding:14px;">No medicines prescribed for this visit</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Prescription — ${patientName} — ${visitDate}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;}
.pbtn{font-size:12px;padding:7px 20px;border-radius:6px;border:1px solid #7a1a2e;background:#7a1a2e;color:#fff;cursor:pointer;display:block;margin:0 auto 14px;}
.rx{background:#fff;color:#1a1a1a;font-family:Arial,sans-serif;max-width:700px;padding:30px 36px;border:1px solid #ccc;box-shadow:0 2px 12px rgba(0,0,0,.12);margin:0 auto;}
.hd{border-bottom:2.5px solid #7a1a2e;padding-bottom:10px;margin-bottom:12px;}
.clinic-row{display:flex;align-items:center;justify-content:center;margin-bottom:8px;}
.clinic-title{font-size:22px;font-weight:700;color:#7a1a2e;text-align:center;}
.doctors-row{display:grid;grid-template-columns:1fr auto 1fr;gap:0;align-items:start;}
.doc-l{text-align:left;}.doc-r{text-align:right;}.doc-c{display:flex;align-items:center;justify-content:center;padding:0 12px;}
.doc-name{font-size:14px;font-weight:700;color:#7a1a2e;}
.doc-deg{font-size:12px;color:#5a1a28;margin-top:1px;}
.doc-spec{font-size:11px;color:#5a1a28;font-style:italic;margin-top:1px;}
.doc-meta{font-size:11px;color:#6b7280;margin-top:1px;}
.addr-bar{text-align:center;color:#5a1a28;font-size:10px;line-height:1.6;border-top:1px solid #e5c0c8;margin-top:8px;padding-top:6px;}
.rx-meta{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
.rx-sym{font-size:32px;font-weight:700;color:#7a1a2e;line-height:1;}
.rx-date{text-align:right;font-size:11px;color:#6b7280;}
.pt-bar{background:#fdf2f4;border-radius:5px;display:grid;grid-template-columns:1fr 1fr 1fr;border:1px solid #f0d0d6;margin-bottom:10px;padding:8px 12px;gap:8px;}
.pt-f label{display:block;font-size:9px;text-transform:uppercase;letter-spacing:.04em;color:#9ca3af;}
.pt-f span{font-size:12px;font-weight:600;color:#1a1a1a;}
.diag-box{background:#fdf2f4;border:1px solid #f0d0d6;border-radius:5px;padding:8px 12px;margin-bottom:10px;}
.diag-box p{font-size:12px;color:#3d1020;line-height:1.5;}
.sec-lbl{font-size:10px;font-weight:700;color:#7a1a2e;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid #e5c0c8;padding-bottom:3px;margin:10px 0 6px;}
table{width:100%;border-collapse:collapse;}
thead tr{background:#7a1a2e;}
thead th{color:#fff;text-align:left;font-weight:600;font-size:11px;padding:7px 9px;}
tbody tr{border-bottom:1px solid #f0d0d6;}
tbody tr:nth-child(even){background:#fdf8f8;}
tbody td{color:#1a1a1a;vertical-align:top;font-size:12px;padding:8px 9px;}
.mn{font-weight:600;}
.mg{color:#9b6b72;font-size:10px;margin-top:1px;}
.ft{display:flex;justify-content:space-between;align-items:flex-end;border-top:1.5px solid #e5c0c8;margin-top:20px;padding-top:14px;}
.fu-lbl{font-size:9px;text-transform:uppercase;letter-spacing:.04em;color:#9ca3af;}
.fu-date{font-size:13px;font-weight:700;color:#7a1a2e;margin:2px 0;}
.sig-line{border-top:1px solid #7a1a2e;padding-top:3px;text-align:right;width:165px;margin-left:auto;}
.sig-n{font-size:12px;font-weight:600;color:#1a1a1a;}
.sig-r{font-size:10px;color:#6b7280;}
.wm{text-align:center;font-size:9px;color:#d0a0a8;border-top:1px solid #f5e0e4;margin-top:10px;padding-top:6px;}
@media print{body{background:#fff;padding:0;}.pbtn{display:none;}.rx{box-shadow:none;border:none;}}
</style>
</head>
<body>
<button class="pbtn" onclick="window.print()">🖨 Print / Save as PDF</button>
<div class="rx">
  <div class="hd">
    <div class="clinic-row">
      <div class="clinic-title">ClinicMS — Medical Prescription</div>
    </div>
    <div class="doctors-row">
      <div class="doc-l">
        <div class="doc-name">${doctorName}</div>
        ${doc.qualification ? `<div class="doc-deg">${doc.qualification}</div>` : ''}
        <div class="doc-spec">${doc.specialization || ''}</div>
      </div>
      <div class="doc-c" style="color:#e5c0c8;font-size:28px;">✚</div>
      <div class="doc-r">
        <div class="doc-meta">Visit Ref: ${visitRef}</div>
        <div class="doc-meta">Date: ${visitDate}</div>
        ${visit.followUpDate ? `<div class="doc-meta" style="color:#7a1a2e;font-weight:600;">Follow-up: ${followUp}</div>` : ''}
      </div>
    </div>
  </div>

  <div class="rx-meta">
    <div class="rx-sym">℞</div>
    <div class="rx-date">
      <div><strong>Date:</strong> ${visitDate}</div>
      <div><strong>Ref:</strong> ${visitRef}</div>
    </div>
  </div>

  <div class="pt-bar">
    <div class="pt-f"><label>Patient Name</label><span>${patientName}</span></div>
    <div class="pt-f"><label>Gender / Blood Group</label><span>${pt.gender || '—'} / ${pt.bloodGroup || '—'}</span></div>
    <div class="pt-f"><label>Allergies</label><span>${pt.allergies || 'None'}</span></div>
  </div>

  ${visit.diagnosis ? `
  <div class="sec-lbl">Diagnosis</div>
  <div class="diag-box">
    <p><strong>Chief Complaint:</strong> ${visit.chiefComplaint || '—'}</p>
    <p><strong>Diagnosis:</strong> ${visit.diagnosis}</p>
    ${visit.symptoms ? `<p><strong>Symptoms:</strong> ${visit.symptoms}</p>` : ''}
    ${visit.notes ? `<p><strong>Notes:</strong> ${visit.notes}</p>` : ''}
  </div>` : ''}

  <div class="sec-lbl">Medicines Prescribed</div>
  <table>
    <thead>
      <tr>
        <th style="width:26px">#</th>
        <th>Medicine</th>
        <th>Dosage</th>
        <th>Frequency</th>
        <th>Duration</th>
        <th>Instructions</th>
      </tr>
    </thead>
    <tbody>${medRows}</tbody>
  </table>

  <div class="ft">
    <div>
      ${followUp
      ? `<div class="fu-lbl">Follow-up Date</div><div class="fu-date">${followUp}</div>`
      : `<div class="fu-lbl">No follow-up scheduled</div>`}
    </div>
    <div class="sig-line">
      <div class="sig-n">${doctorName}</div>
      <div class="sig-r">${doc.specialization || 'Physician'}</div>
    </div>
  </div>
  <div class="wm">This prescription is valid for 30 days from date of issue · ${visitRef}</div>
</div>
</body>
</html>`;
}

class VisitController {
  // GET /visits?patientId=xxx&doctorId=xxx
  async getVisits(req, res) {
    try {
      const { patientId, doctorId } = req.query;
      const visits = await visitService.getVisits({
        patientId, doctorId,
        userId: req.user.id,
        role: req.user.role,
      });
      return res.status(200).json({ success: true, data: visits });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // POST /visits
  async createVisit(req, res) {
    try {
      const validatedData = createVisitSchema.parse(req.body);
      const visit = await visitService.createVisit(validatedData);
      return res.status(201).json({ success: true, message: 'Visit created successfully', data: visit });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false, message: 'Validation error',
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /visits/:id
  async getVisitById(req, res) {
    try {
      const visit = await visitService.getVisitById(req.params.id);
      return res.status(200).json({ success: true, data: visit });
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  // PUT /visits/:id
  async updateVisit(req, res) {
    try {
      const validatedData = updateVisitSchema.parse(req.body);
      const visit = await visitService.updateVisit(req.params.id, validatedData);
      return res.status(200).json({ success: true, message: 'Visit updated successfully', data: visit });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false, message: 'Validation error',
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      const status = error.message === 'Visit not found' ? 404 : 400;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  // POST /visits/:id/complete
  async completeVisit(req, res) {
    try {
      const visit = await visitService.completeVisit(req.params.id);
      return res.status(200).json({ success: true, message: 'Visit marked as completed', data: visit });
    } catch (error) {
      const status = error.message === 'Visit not found' ? 404 : 400;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  // GET /visits/:id/prescription — returns HTML prescription for download/print
  async getPrescriptionDownload(req, res) {
    try {
      const visit = await visitService.getPrescriptionHtml(req.params.id, req.user.id, req.user.role);
      const html = buildPrescriptionHtml(visit);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="prescription-${req.params.id}.html"`);
      return res.send(html);
    } catch (error) {
      if (error.message === 'Access denied') return res.status(403).json({ success: false, message: error.message });
      return res.status(404).json({ success: false, message: error.message });
    }
  }
}

module.exports = new VisitController();
