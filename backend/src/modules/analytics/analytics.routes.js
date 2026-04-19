const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

router.use(authMiddleware);

router.get('/doctor/overview', roleMiddleware(['DOCTOR']), (req, res) =>
  analyticsController.getDoctorOverview(req, res)
);

router.get('/admin/overview', roleMiddleware(['ADMIN']), (req, res) =>
  analyticsController.getAdminOverview(req, res)
);

module.exports = router;
