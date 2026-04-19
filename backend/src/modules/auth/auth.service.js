const authRepository = require('./auth.repository');
const hashPassword = require('../../utils/hashPassword');
const comparePassword = require('../../utils/comparePassword');
const { generateToken } = require('../../utils/generateToken');

class AuthService {
  /**
   * Register a new patient
   * @param {Object} data - Registration data
   * @returns {Promise<Object>} User with token
   */
  async register(data) {
    // Check if user already exists
    const existingUser = await authRepository.findUserByPhone(data.phone);
    if (existingUser) {
      throw new Error('Phone number already registered');
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user with patient profile
    const user = await authRepository.createUserWithPatient({
      ...data,
      password: hashedPassword,
    });

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      phone: user.phone,
      role: user.role,
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} User with token
   */
  async login(credentials) {
    const { phone, password } = credentials;

    // Find user by phone
    const user = await authRepository.findUserByPhone(phone);
    if (!user) {
      throw new Error('Invalid phone or password');
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid phone or password');
    }

    // Block login if doctor account is deactivated
    if (user.role === 'DOCTOR' && user.doctor && user.doctor.isActive === false) {
      throw new Error('Your account has been deactivated. Please contact the administrator.');
    }

    // Block login if receptionist account is deactivated
    if (user.role === 'RECEPTIONIST' && user.receptionist && user.receptionist.isActive === false) {
      throw new Error('Your account has been deactivated. Please contact the administrator.');
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      phone: user.phone,
      role: user.role,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {Object} passwords - Current and new password
   * @returns {Promise<Object>} Success message
   */
  async changePassword(userId, passwords) {
    const { currentPassword, newPassword } = passwords;

    // Find user
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await authRepository.updatePassword(userId, hashedPassword);

    return { message: 'Password changed successfully' };
  }

  /**
   * Register a new doctor
   * @param {Object} data - Registration data
    * @returns {Promise<Object>} Created user data without login token
   */
  async registerDoctor(data) {
    // Check if user already exists
    const existingUser = await authRepository.findUserByPhone(data.phone);
    if (existingUser) {
      throw new Error('Phone number already registered');
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user with doctor profile
    const user = await authRepository.createUserWithDoctor({
      ...data,
      password: hashedPassword,
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
    };
  }
}

module.exports = new AuthService();
