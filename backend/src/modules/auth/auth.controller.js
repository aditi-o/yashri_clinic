const authService = require('./auth.service');
const { registerSchema, loginSchema, changePasswordSchema } = require('./auth.validator');
const { registerDoctorSchema } = require('./doctor.validator');

class AuthController {
  /**
   * Register a new patient
   * POST /auth/register
   */
  async register(req, res) {
    try {
      // Validate request body
      const validatedData = registerSchema.parse(req.body);

      // Call service
      const result = await authService.register(validatedData);

      return res.status(201).json({
        success: true,
        message: 'Patient registered successfully',
        data: result,
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Register a new doctor
   * POST /auth/register-doctor
   */
  async registerDoctor(req, res) {
    try {
      // Validate request body
      const validatedData = registerDoctorSchema.parse(req.body);

      // Call service
      const result = await authService.registerDoctor(validatedData);

      return res.status(201).json({
        success: true,
        message: 'Doctor registered successfully',
        data: result,
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Login user
   * POST /auth/login
   */
  async login(req, res) {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body);

      // Call service
      const result = await authService.login(validatedData);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Change password
   * POST /auth/change-password
   * Requires authentication
   */
  async changePassword(req, res) {
    try {
      // Validate request body
      const validatedData = changePasswordSchema.parse(req.body);

      // Call service with user ID from JWT
      const result = await authService.changePassword(req.user.id, validatedData);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new AuthController();
