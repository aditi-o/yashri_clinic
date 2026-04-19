const express = require('express');
const router  = express.Router();
const patientController = require('./patients.controller');
const authMiddleware    = require('../../middlewares/auth.middleware');
const roleMiddleware    = require('../../middlewares/role.middleware');

router.use(authMiddleware);

// ── Specific named routes FIRST (before any :param routes) ────────────────

// Search patients by name/phone — doctor / admin / receptionist
router.get('/search',
  roleMiddleware(['DOCTOR', 'ADMIN', 'RECEPTIONIST']),
  (req, res) => patientController.searchPatients(req, res)
);

// List all patients — receptionist / doctor / admin only
router.get('/',
  roleMiddleware(['RECEPTIONIST', 'DOCTOR', 'ADMIN']),
  (req, res) => patientController.getAllPatients(req, res)
);

router.get('/followups',
  roleMiddleware(['PATIENT']),
  (req, res) => patientController.getFollowUps(req, res)
);

// Patient self-service profile routes
router.get('/profile',
  roleMiddleware(['PATIENT']),
  (req, res) => patientController.getProfile(req, res)
);
router.put('/profile',
  roleMiddleware(['PATIENT']),
  (req, res) => patientController.updateProfile(req, res)
);
router.get('/history',
  roleMiddleware(['PATIENT']),
  (req, res) => patientController.getHistory(req, res)
);

// ── Param routes LAST (after all named routes) ────────────────────────────
// Get single patient by ID — doctor / receptionist / admin only
router.get('/:id',
  roleMiddleware(['DOCTOR', 'ADMIN', 'RECEPTIONIST']),
  (req, res) => patientController.getPatientById(req, res)
);

module.exports = router;
