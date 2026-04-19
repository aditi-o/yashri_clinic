import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';

// Patient
import Dashboard from './pages/Dashboard';
import MyAppointments from './pages/MyAppointments';
import BookAppointment from './pages/BookAppointment';
import MedicalHistory from './pages/MedicalHistory';
import EditProfile from './pages/EditProfile';
import PatientChat from './features/ai/PatientChat';

// Doctor
import DoctorDashboard from './pages/DoctorDashboard';
import CreateVisit from './pages/CreateVisit';
import EditDoctorProfile from './pages/EditDoctorProfile';
import DoctorAIAssistant from './pages/doctor/DoctorAIAssistant';
import DoctorRegisterPatient from './pages/doctor/DoctorRegisterPatient';
import DoctorPatientSearch from './pages/doctor/DoctorPatientSearch';
import MakePrescription from './pages/doctor/MakePrescription';
import ManageReceptionists from './pages/receptionist/ManageReceptionists';

// Receptionist
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard';
import RegisterPatient from './pages/receptionist/RegisterPatient';
import BookAppointmentReceptionist from './pages/receptionist/BookAppointmentReceptionist';
import ManageSchedule from './pages/receptionist/ManageSchedule';
import EditReceptionistProfile from './pages/receptionist/EditReceptionistProfile';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDoctors from './pages/admin/AdminDoctors';
import AdminReceptionists from './pages/admin/AdminReceptionists';
import AdminPatients from './pages/admin/AdminPatients';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminAI from './pages/admin/AdminAI';
import EditAdminProfile from './pages/admin/EditAdminProfile';

const P = (roles, el) => <ProtectedRoute roles={roles}>{el}</ProtectedRoute>;

export default function App() {
  return (
    <BrowserRouter>
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
        <Route path="/admin/analytics" element={P(['ADMIN'], <AdminAnalytics />)} />
        <Route path="/admin/ai" element={P(['ADMIN'], <AdminAI />)} />
        <Route path="/admin/profile/edit" element={P(['ADMIN'], <EditAdminProfile />)} />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
