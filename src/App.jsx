import React from 'react'; // HMR Force Update 2
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterCaregiver from './pages/RegisterCaregiver';
import Search from './pages/Search';
import Services from './pages/Services';
import About from './pages/About';

import Contact from './pages/Contact';
import SaludInfo from './pages/SaludInfo';
import RegistrationSuccess from './pages/RegistrationSuccess';
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword';

// Dashboard Imports
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardOverview from './pages/dashboard/DashboardOverview';
import Messages from './pages/dashboard/Messages';
import CalendarPage from './pages/dashboard/CalendarPage';
import ClientProfile from './pages/dashboard/ClientProfile';
import Settings from './pages/dashboard/Settings';
import MonitoringCenter from './pages/dashboard/MonitoringCenter';
import CaregiverList from './pages/dashboard/CaregiverList';
import SubscriptionPlans from './pages/dashboard/SubscriptionPlans';

import CaregiverLayout from './components/layout/CaregiverLayout';
import CaregiverOverview from './pages/caregiver/CaregiverOverview';
import JobBoard from './pages/caregiver/JobBoard';
import MyShifts from './pages/caregiver/MyShifts';
import CaregiverPayments from './pages/caregiver/CaregiverPayments';
import CaregiverProfile from './pages/caregiver/CaregiverProfile';
import CaregiverAnalytics from './pages/caregiver/CaregiverAnalytics'; // New Import
import CaregiverSettings from './pages/caregiver/CaregiverSettings';

// Admin Imports
import AdminRoute from './components/AdminRoute';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AdminVerification from './pages/admin/AdminVerification';

import { AuthProvider } from './context/AuthContext';
import { MessageProvider } from './context/MessageContext';

function App() {
  return (
    <AuthProvider>
      <MessageProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/home" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/ecosistema-salud" element={<SaludInfo />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register-caregiver" element={<Navigate to="/register" replace />} />
            <Route path="/registration-success" element={<RegistrationSuccess />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/search" element={<Search />} />

            {/* Family Dashboard Routes (Protected) */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="pulso" element={<MonitoringCenter />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="messages" element={<Messages />} />
              <Route path="caregivers" element={<CaregiverList />} />
              <Route path="plans" element={<SubscriptionPlans />} />
              <Route path="profile" element={<ClientProfile />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Caregiver Dashboard Routes (Protected) */}
            <Route path="/caregiver" element={<CaregiverLayout />}>
              <Route index element={<CaregiverOverview />} />
              <Route path="jobs" element={<JobBoard />} />
              <Route path="shifts" element={<MyShifts />} />
              <Route path="messages" element={<Messages />} />
              <Route path="payments" element={<CaregiverPayments />} />
              <Route path="analytics" element={<CaregiverAnalytics />} />
              <Route path="profile" element={<CaregiverProfile />} />
              <Route path="settings" element={<CaregiverSettings />} />
            </Route>

            {/* Admin Routes (Protected) */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="verification" element={<AdminVerification />} />
                <Route path="settings" element={<div className="p-8">Configuración (Próximamente)</div>} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </MessageProvider>
    </AuthProvider>
  );
}

export default App;
