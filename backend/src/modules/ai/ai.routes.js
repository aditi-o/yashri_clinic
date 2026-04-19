const express      = require('express');
const router       = express.Router();
const aiController = require('./ai.controller');
const auth         = require('../../middlewares/auth.middleware');
const role         = require('../../middlewares/role.middleware');

// All AI routes require a valid JWT
router.use(auth);

/**
 * POST /api/ai/patient-chat
 * Patient asks about their own medical history.
 * patient_id is NEVER accepted from body — resolved from JWT inside service.
 */
router.post(
  '/patient-chat',
  role(['PATIENT']),
  (req, res) => aiController.patientChat(req, res)
);

/**
 * GET /api/ai/doctor-summary/:patientId
 * Doctor gets a pre-consultation AI summary for a specific patient.
 */
router.get(
  '/doctor-summary/:patientId',
  role(['DOCTOR', 'ADMIN']),
  (req, res) => aiController.doctorSummary(req, res)
);

module.exports = router;
