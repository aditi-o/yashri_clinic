require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const patientRoutes = require('./modules/patients/patients.routes');
const doctorRoutes = require('./modules/doctors/doctors.routes');
const appointmentRoutes = require('./modules/appointments/appointments.routes');
const visitRoutes = require('./modules/visits/visits.routes');
const prescriptionRoutes = require('./modules/prescriptions/prescriptions.routes');
const medicineRoutes = require('./modules/medicines/medicines.routes');
const billingRoutes = require('./modules/billing/billing.routes');
const paymentRoutes = require('./modules/payments/payments.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const receptionistRoutes = require('./modules/receptionist/receptionist.routes');
const aiRoutes = require('./modules/ai/ai.routes');

const app = express();

// Security middleware: Helmet adds security headers
app.use(helmet());

// Rate limiting: prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Auth endpoint gets stricter rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true, // don't count successful attempts
});

// CORS middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Clinic Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      patients: '/api/patients',
      doctors: '/api/doctors',
      appointments: '/api/appointments',
      visits: '/api/visits',
      prescriptions: '/api/prescriptions',
      medicines: '/api/medicines',
      billing: '/api/billing',
      payments: '/api/payments',
      analytics: '/api/analytics',
      receptionists: '/api/receptionists',
      ai: '/api/ai',
    },
  });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/receptionists', receptionistRoutes);
app.use('/api/ai', aiRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});

module.exports = app;
