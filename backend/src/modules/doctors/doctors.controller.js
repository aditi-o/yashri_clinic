const doctorService = require('./doctors.service');

class DoctorController {
  /**
   * Get all doctors
   * GET /doctors
   */
  async getAllDoctors(req, res) {
    try {
      const doctors = await doctorService.getAllDoctors();

      return res.status(200).json({
        success: true,
        data: doctors,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get doctor by ID
   * GET /doctors/:id
   */
  async getDoctorById(req, res) {
    try {
      const doctor = await doctorService.getDoctorById(req.params.id);

      return res.status(200).json({
        success: true,
        data: doctor,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get doctor profile
   * GET /doctors/profile
   */
  async getProfile(req, res) {
    try {
      const doctor = await doctorService.getProfile(req.user.id);

      return res.status(200).json({
        success: true,
        data: doctor,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Update doctor profile
   * PUT /doctors/profile
   */
  async updateProfile(req, res) {
    try {
      const doctor = await doctorService.updateProfile(req.user.id, req.body);
      return res.status(200).json({ success: true, message: 'Profile updated successfully', data: doctor });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Set doctor active/inactive status (admin only)
   * PATCH /doctors/:id/status
   */
  async setStatus(req, res) {
    try {
      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
      }
      const doctor = await doctorService.setDoctorStatus(req.params.id, isActive);
      const msg = isActive ? 'Doctor activated successfully' : 'Doctor deactivated — login blocked';
      return res.status(200).json({ success: true, message: msg, data: doctor });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Delete a doctor permanently (admin only)
   * DELETE /doctors/:id
   */
  async deleteDoctor(req, res) {
    try {
      await doctorService.deleteDoctor(req.params.id);
      return res.status(200).json({ success: true, message: 'Doctor deleted successfully' });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Get all doctors including inactive (admin only)
   * GET /doctors/admin/all
   */
  async getAllDoctorsAdmin(req, res) {
    try {
      const doctors = await doctorService.getAllDoctorsAdmin();
      return res.status(200).json({ success: true, data: doctors });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new DoctorController();
