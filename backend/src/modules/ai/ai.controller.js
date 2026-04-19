const { patientChat, doctorSummary } = require('./ai.service');

class AiController {
  /**
   * POST /api/ai/patient-chat
   * Patient asks a question about their own medical history.
   * user_id is extracted from JWT — never from request body.
   */
  async patientChat(req, res) {
    try {
      const { message } = req.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'message is required and must be a non-empty string.',
        });
      }

      if (message.trim().length > 500) {
        return res.status(400).json({
          success: false,
          message: 'message must be 500 characters or fewer.',
        });
      }

      // req.user.id is set by authMiddleware from the JWT — fully trusted
      const result = await patientChat(req.user.id, message.trim());

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('[AI] patientChat error:', error.message);

      // Surface meaningful errors to the client (API key missing, timeout, etc.)
      return res.status(500).json({
        success: false,
        message: error.message || 'AI service is temporarily unavailable.',
      });
    }
  }

  /**
   * GET /api/ai/doctor-summary/:patientId
   * Doctor requests a pre-consultation summary for a patient.
   * Route is protected by roleMiddleware(['DOCTOR', 'ADMIN']).
   */
  async doctorSummary(req, res) {
    try {
      const { patientId } = req.params;

      if (!patientId || typeof patientId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'patientId param is required.',
        });
      }

      const result = await doctorSummary(patientId);

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('[AI] doctorSummary error:', error.message);

      const status = error.message === 'Patient not found' ? 404 : 500;
      return res.status(status).json({
        success: false,
        message: error.message || 'AI service is temporarily unavailable.',
      });
    }
  }
}

module.exports = new AiController();
