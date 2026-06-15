const patientService = require('./patients.service');
const { updatePatientSchema } = require('./patients.validator');

class PatientController {
  // GET /patients/search?q=term — DOCTOR / ADMIN / RECEPTIONIST
  async searchPatients(req, res) {
    try {
      const q = (req.query.q || '').trim();
      const patients = await patientService.searchPatients(q);
      return res.status(200).json({ success: true, data: patients });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /patients  — RECEPTIONIST / DOCTOR / ADMIN: list all patients
  async getAllPatients(req, res) {
    try {
      const patients = await patientService.getAllPatients();
      return res.status(200).json({ success: true, data: patients });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /patients/profile  — PATIENT: own profile
  async getProfile(req, res) {
    try {
      const patient = await patientService.getProfile(req.user.id);
      return res.status(200).json({ success: true, data: patient });
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  // PUT /patients/profile  — PATIENT: update own profile
  async updateProfile(req, res) {
    try {
      const validatedData = updatePatientSchema.parse(req.body);
      const patient = await patientService.updateProfile(req.user.id, validatedData);
      return res.status(200).json({ success: true, message: 'Profile updated successfully', data: patient });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
        });
      }
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /patients/:id  — DOCTOR / RECEPTIONIST / ADMIN: fetch patient by ID
  async getPatientById(req, res) {
    try {
      const patient = await patientService.getPatientById(req.params.id);
      return res.status(200).json({ success: true, data: patient });
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  // DELETE /patients/:id  — ADMIN: permanently remove patient and related data
  async deletePatient(req, res) {
    try {
      await patientService.deletePatient(req.params.id);
      return res.status(200).json({ success: true, message: 'Patient deleted successfully' });
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  // GET /patients/history  — PATIENT: own medical history
  async getHistory(req, res) {
    try {
      const history = await patientService.getPatientHistory(req.user.id);
      return res.status(200).json({ success: true, data: history });
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  // GET /patients/followups  — PATIENT: visits that have a future follow-up date
  async getFollowUps(req, res) {
    try {
      const followups = await patientService.getPatientFollowUps(req.user.id);
      return res.status(200).json({ success: true, data: followups });
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }
}

module.exports = new PatientController();
