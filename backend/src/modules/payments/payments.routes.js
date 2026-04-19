const express = require('express');
const router  = express.Router();
const paymentController = require('./payments.controller');
const authMiddleware    = require('../../middlewares/auth.middleware');
const roleMiddleware    = require('../../middlewares/role.middleware');

router.use(authMiddleware);

// Named sub-routes BEFORE param routes
router.post('/',
  roleMiddleware(['DOCTOR', 'ADMIN']),
  (req, res) => paymentController.createPayment(req, res)
);
router.get('/invoice/:invoiceId',
  roleMiddleware(['DOCTOR', 'ADMIN', 'PATIENT', 'RECEPTIONIST']),
  (req, res) => paymentController.getPaymentsByInvoiceId(req, res)
);
router.get('/:id',
  roleMiddleware(['DOCTOR', 'ADMIN', 'PATIENT', 'RECEPTIONIST']),
  (req, res) => paymentController.getPaymentById(req, res)
);

module.exports = router;
