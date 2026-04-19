const express = require('express');
const router = express.Router();
const visitController = require('./visits.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

router.use(authMiddleware);

// GET /visits?patientId=xxx  — doctor/admin can list visits filtered by patient
// PATIENT can list their own visits (no query param needed — resolved from token)
router.get('/', roleMiddleware(['DOCTOR', 'ADMIN', 'RECEPTIONIST', 'PATIENT']), (req, res) =>
  visitController.getVisits(req, res)
);

// POST /visits — doctor/admin create visit
router.post('/', roleMiddleware(['DOCTOR', 'ADMIN']), (req, res) =>
  visitController.createVisit(req, res)
);

// ── Named sub-routes BEFORE param routes ──────────────────────────────────

// GET /visits/:id/prescription — must be before /:id to avoid Express matching "prescription" as id
router.get('/:id/prescription', roleMiddleware(['PATIENT', 'DOCTOR', 'ADMIN', 'RECEPTIONIST']), (req, res) =>
  visitController.getPrescriptionDownload(req, res)
);

// POST /visits/:id/complete
router.post('/:id/complete', roleMiddleware(['DOCTOR', 'ADMIN']), (req, res) =>
  visitController.completeVisit(req, res)
);

// GET /visits/:id
router.get('/:id', roleMiddleware(['DOCTOR', 'ADMIN', 'PATIENT', 'RECEPTIONIST']), (req, res) =>
  visitController.getVisitById(req, res)
);

// PUT /visits/:id
router.put('/:id', roleMiddleware(['DOCTOR', 'ADMIN']), (req, res) =>
  visitController.updateVisit(req, res)
);

module.exports = router;
