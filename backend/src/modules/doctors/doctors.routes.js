const express = require('express');
const router  = express.Router();
const doctorController = require('./doctors.controller');
const authMiddleware   = require('../../middlewares/auth.middleware');
const roleMiddleware   = require('../../middlewares/role.middleware');

// Doctor self-service profile (MUST be before /:id)
router.get('/profile', authMiddleware, roleMiddleware(['DOCTOR']), (req, res) => doctorController.getProfile(req, res));
router.put('/profile', authMiddleware, roleMiddleware(['DOCTOR']), (req, res) => doctorController.updateProfile(req, res));

// Admin-only: all doctors including inactive
router.get('/admin/all', authMiddleware, roleMiddleware(['ADMIN']), (req, res) => doctorController.getAllDoctorsAdmin(req, res));

// Listing available to all authenticated roles
router.get('/',    authMiddleware, (req, res) => doctorController.getAllDoctors(req, res));
router.get('/:id', authMiddleware, (req, res) => doctorController.getDoctorById(req, res));

// Admin-only: toggle status and delete
router.patch('/:id/status', authMiddleware, roleMiddleware(['ADMIN']), (req, res) => doctorController.setStatus(req, res));
router.delete('/:id',       authMiddleware, roleMiddleware(['ADMIN']), (req, res) => doctorController.deleteDoctor(req, res));

module.exports = router;
