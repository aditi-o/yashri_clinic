const express = require('express');
const router  = express.Router();
const authController  = require('./auth.controller');
const authMiddleware  = require('../../middlewares/auth.middleware');
const roleMiddleware  = require('../../middlewares/role.middleware');

// Public
router.post('/register', (req, res) => authController.register(req, res));
router.post('/login',    (req, res) => authController.login(req, res));

// Admin-only: create doctor accounts (doctors can no longer self-register)
router.post('/register-doctor',
  authMiddleware, roleMiddleware(['ADMIN']),
  (req, res) => authController.registerDoctor(req, res)
);

// Doctor OR Receptionist can register a new patient (same as /register but auth-gated)
router.post('/register-patient',
  authMiddleware, roleMiddleware(['DOCTOR', 'RECEPTIONIST']),
  (req, res) => authController.register(req, res)
);

// Authenticated
router.post('/change-password', authMiddleware, (req, res) =>
  authController.changePassword(req, res)
);

module.exports = router;
