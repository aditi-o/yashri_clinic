const express = require('express');
const router = express.Router();
const prescriptionController = require('./prescriptions.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

// All routes require authentication
router.use(authMiddleware);

// Doctor routes (doctors create and manage prescriptions)
router.post('/', roleMiddleware(['DOCTOR', 'ADMIN']), (req, res) =>
  prescriptionController.createPrescriptions(req, res)
);
router.get('/visit/:visitId', roleMiddleware(['DOCTOR', 'ADMIN', 'PATIENT']), (req, res) =>
  prescriptionController.getPrescriptionsByVisitId(req, res)
);
router.get('/:id', roleMiddleware(['DOCTOR', 'ADMIN', 'PATIENT']), (req, res) =>
  prescriptionController.getPrescriptionById(req, res)
);
router.put('/:id', roleMiddleware(['DOCTOR', 'ADMIN']), (req, res) =>
  prescriptionController.updatePrescription(req, res)
);
router.delete('/:id', roleMiddleware(['DOCTOR', 'ADMIN']), (req, res) =>
  prescriptionController.deletePrescription(req, res)
);

module.exports = router;
