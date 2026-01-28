import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Signup from './Signup.jsx'
import Dashboard from './Dashboard.jsx'
import VehicleManagement from './VehicleManagement.jsx'
import UserManagement from './UserManagement.jsx'
import SARDashboard from './SARDashboard.jsx'
import VehicleReservation from './VehicleReservation.jsx'
import ReportsAnalytics from './ReportsAnalytics.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/signup.html" element={<Signup />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/vehicles" element={<VehicleManagement />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/sar-dashboard" element={<SARDashboard />} />
                <Route path="/reservation" element={<VehicleReservation />} />
                <Route path="/reports" element={<ReportsAnalytics />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>,
)
