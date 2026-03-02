import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Signup from './Signup.jsx'
import Dashboard from './Dashboard.jsx'
import VehicleManagement from './VehicleManagement.jsx'
import DriverManagement from './DriverManagement.jsx'
import MaintenanceManagement from './MaintenanceManagement.jsx'
import UserManagement from './UserManagement.jsx'
import SARDashboard from './SARDashboard.jsx'
import VehicleReservation from './VehicleReservation.jsx'
import ReportsAnalytics from './ReportsAnalytics.jsx'
import RegistrarDashboard from './RegistrarDashboard.jsx'
import HODDashboard from './HODDashboard.jsx'
import DeanDashboard from './DeanDashboard.jsx'
import AdminDashboard from './AdminDashboard.jsx'
import ManagementAssistantDashboard from './ManagementAssistantDashboard.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/login" element={<App />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/vehicles" element={<VehicleManagement />} />
                <Route path="/drivers" element={<DriverManagement />} />
                <Route path="/maintenance" element={<MaintenanceManagement />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/sar-dashboard" element={<SARDashboard />} />
                <Route path="/reservation" element={<VehicleReservation />} />
                <Route path="/reports" element={<ReportsAnalytics />} />
                <Route path="/registrar-dashboard" element={<RegistrarDashboard />} />
                <Route path="/hod-dashboard" element={<HODDashboard />} />
                <Route path="/dean-dashboard" element={<DeanDashboard />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/management-dashboard" element={<ManagementAssistantDashboard />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>,
)
