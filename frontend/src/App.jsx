import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { PageLoader } from './components/ui';

import Login from './pages/Login';
import Register from './pages/Register';

// Patient
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MyAppointments = lazy(() => import('./pages/MyAppointments'));
const BookAppointment = lazy(() => import('./pages/BookAppointment'));
const MedicalHistory = lazy(() => import('./pages/MedicalHistory'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const PatientChat = lazy(() => import('./features/ai/PatientChat'));

// Doctor
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard'));
const CreateVisit = lazy(() => import('./pages/CreateVisit'));
const EditDoctorProfile = lazy(() => import('./pages/EditDoctorProfile'));
const DoctorAIAssistant = lazy(() => import('./pages/doctor/DoctorAIAssistant'));
const DoctorRegisterPatient = lazy(() => import('./pages/doctor/DoctorRegisterPatient'));
const DoctorPatientSearch = lazy(() => import('./pages/doctor/DoctorPatientSearch'));
const MakePrescription = lazy(() => import('./pages/doctor/MakePrescription'));
const PrescriptionPrint = lazy(() => import('./pages/doctor/PrescriptionPrint'));
const ManageReceptionists = lazy(() => import('./pages/receptionist/ManageReceptionists'));

// Receptionist
const ReceptionistDashboard = lazy(() => import('./pages/receptionist/ReceptionistDashboard'));
const RegisterPatient = lazy(() => import('./pages/receptionist/RegisterPatient'));
const BookAppointmentReceptionist = lazy(() => import('./pages/receptionist/BookAppointmentReceptionist'));
const ManageSchedule = lazy(() => import('./pages/receptionist/ManageSchedule'));
const EditReceptionistProfile = lazy(() => import('./pages/receptionist/EditReceptionistProfile'));

// Admin
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminDoctors = lazy(() => import('./pages/admin/AdminDoctors'));
const AdminReceptionists = lazy(() => import('./pages/admin/AdminReceptionists'));
const AdminPatients = lazy(() => import('./pages/admin/AdminPatients'));
const AdminAppointments = lazy(() => import('./pages/admin/AdminAppointments'));
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminAI = lazy(() => import('./pages/admin/AdminAI'));
const EditAdminProfile = lazy(() => import('./pages/admin/EditAdminProfile'));

const P = (roles, el) => <ProtectedRoute roles={roles}>{el}</ProtectedRoute>;

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader label="Loading page…" />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ── Patient ── */}
          <Route path="/dashboard" element={P(['PATIENT'], <Dashboard />)} />
          <Route path="/appointments" element={P(['PATIENT'], <MyAppointments />)} />
          <Route path="/book-appointment" element={P(['PATIENT'], <BookAppointment />)} />
          <Route path="/history" element={P(['PATIENT'], <MedicalHistory />)} />
          <Route path="/profile/edit" element={P(['PATIENT'], <EditProfile />)} />
          <Route path="/ai-chat" element={P(['PATIENT'], <PatientChat />)} />

          {/* ── Doctor ── */}
          <Route path="/doctor-dashboard" element={P(['DOCTOR'], <DoctorDashboard />)} />
          <Route path="/create-visit/:appointmentId?" element={P(['DOCTOR'], <CreateVisit />)} />
          <Route path="/doctor/prescription/:visitId" element={P(['DOCTOR'], <MakePrescription />)} />
          <Route path="/doctor/prescription/print/:visitId" element={P(['DOCTOR'], <PrescriptionPrint />)} />
          <Route path="/doctor/profile/edit" element={P(['DOCTOR'], <EditDoctorProfile />)} />
          <Route path="/doctor/ai-assistant" element={P(['DOCTOR'], <DoctorAIAssistant />)} />
          <Route path="/doctor/register-patient" element={P(['DOCTOR'], <DoctorRegisterPatient />)} />
          <Route path="/doctor/patients" element={P(['DOCTOR'], <DoctorPatientSearch />)} />
          <Route path="/receptionist/manage" element={P(['DOCTOR', 'ADMIN'], <ManageReceptionists />)} />

          {/* ── Receptionist ── */}
          <Route path="/receptionist/dashboard" element={P(['RECEPTIONIST'], <ReceptionistDashboard />)} />
          <Route path="/receptionist/register-patient" element={P(['RECEPTIONIST'], <RegisterPatient />)} />
          <Route path="/receptionist/book-appointment" element={P(['RECEPTIONIST'], <BookAppointmentReceptionist />)} />
          <Route path="/receptionist/schedule" element={P(['RECEPTIONIST'], <ManageSchedule />)} />
          <Route path="/receptionist/profile/edit" element={P(['RECEPTIONIST'], <EditReceptionistProfile />)} />

          {/* ── Admin ── */}
          <Route path="/admin/dashboard" element={P(['ADMIN'], <AdminDashboard />)} />
          <Route path="/admin/doctors" element={P(['ADMIN'], <AdminDoctors />)} />
          <Route path="/admin/receptionists" element={P(['ADMIN'], <AdminReceptionists />)} />
          <Route path="/admin/patients" element={P(['ADMIN'], <AdminPatients />)} />
          <Route path="/admin/appointments" element={P(['ADMIN'], <AdminAppointments />)} />
          <Route path="/admin/payments" element={P(['ADMIN'], <AdminPayments />)} />
          <Route path="/admin/analytics" element={P(['ADMIN'], <AdminAnalytics />)} />
          <Route path="/admin/ai" element={P(['ADMIN'], <AdminAI />)} />
          <Route path="/admin/profile/edit" element={P(['ADMIN'], <EditAdminProfile />)} />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
