const express = require('express');
const router = express.Router();
const appointmentController = require('./appointments.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

router.use(authMiddleware);

router.post('/', roleMiddleware(['PATIENT', 'RECEPTIONIST', 'DOCTOR', 'ADMIN']), (req, res) => appointmentController.createAppointment(req, res));
router.get('/', roleMiddleware(['PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN']), (req, res) => appointmentController.getAppointments(req, res));
// Doctor/Admin can get appointments for a specific patient
router.get('/patient/:patientId', roleMiddleware(['DOCTOR', 'ADMIN', 'RECEPTIONIST']), (req, res) => appointmentController.getPatientAppointments(req, res));
router.get('/:id', roleMiddleware(['PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN']), (req, res) => appointmentController.getAppointmentById(req, res));
router.put('/:id', roleMiddleware(['PATIENT', 'RECEPTIONIST', 'ADMIN', 'DOCTOR']), (req, res) => appointmentController.updateAppointment(req, res));
router.delete('/:id', roleMiddleware(['PATIENT', 'RECEPTIONIST', 'ADMIN', 'DOCTOR']), (req, res) => appointmentController.cancelAppointment(req, res));

module.exports = router;
