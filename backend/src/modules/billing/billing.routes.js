const express = require('express');
const router  = express.Router();
const billingController = require('./billing.controller');
const authMiddleware    = require('../../middlewares/auth.middleware');
const roleMiddleware    = require('../../middlewares/role.middleware');

router.use(authMiddleware);

// Named sub-routes BEFORE param routes
router.post('/invoices',
  roleMiddleware(['DOCTOR', 'ADMIN']),
  (req, res) => billingController.createInvoice(req, res)
);
router.get('/invoices/visit/:visitId',
  roleMiddleware(['DOCTOR', 'ADMIN', 'PATIENT', 'RECEPTIONIST']),
  (req, res) => billingController.getInvoiceByVisitId(req, res)
);
router.get('/invoices/:id',
  roleMiddleware(['DOCTOR', 'ADMIN', 'PATIENT', 'RECEPTIONIST']),
  (req, res) => billingController.getInvoiceById(req, res)
);
router.put('/invoices/:id',
  roleMiddleware(['DOCTOR', 'ADMIN']),
  (req, res) => billingController.updateInvoice(req, res)
);

module.exports = router;
