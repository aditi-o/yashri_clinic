const express = require('express');
const router = express.Router();
const medicineController = require('./medicines.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

router.use(authMiddleware);

// Authenticated routes - medicines catalog access
router.get('/', (req, res) => medicineController.getAllMedicines(req, res));
router.get('/search', (req, res) => medicineController.searchMedicines(req, res));
router.get('/:id', (req, res) => medicineController.getMedicineById(req, res));

// Protected routes - admin/doctor only
router.post('/', roleMiddleware(['DOCTOR', 'ADMIN']), (req, res) =>
  medicineController.createMedicine(req, res)
);
router.put('/:id', roleMiddleware(['DOCTOR', 'ADMIN']), (req, res) =>
  medicineController.updateMedicine(req, res)
);
router.delete('/:id', roleMiddleware(['ADMIN']), (req, res) =>
  medicineController.deleteMedicine(req, res)
);

module.exports = router;
