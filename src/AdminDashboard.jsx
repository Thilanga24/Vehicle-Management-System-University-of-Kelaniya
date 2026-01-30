import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './Dashboard.css'; // Using the university theme

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState({ name: 'System Administrator', role: 'admin' });

    // --- Mock Data ---
    const initialVehicles = [
        { id: 1, type: 'Car', model: 'Toyota Axio', number: 'KI-1234', status: 'available', driver: 'Mr. Perera', distance: 15420 },
        { id: 2, type: 'Van', model: 'Toyota Hiace', number: 'KI-5678', status: 'booked', driver: 'Mr. Fernando', distance: 23850 },
        { id: 3, type: 'Bus', model: 'Rosa Bus', number: 'KI-9012', status: 'maintenance', driver: 'Mr. Silva', distance: 45210 }
    ];

    const activities = [
        { action: 'Vehicle KI-1234 returned from Colombo trip', time: '2 hours ago', type: 'return' },
        { action: 'Maintenance completed for KI-9012', time: '4 hours ago', type: 'maintenance' },
        { action: 'New reservation approved for University of Jaffna', time: '6 hours ago', type: 'approval' },
        { action: 'Driver Mr. Kumara reported engine issue for KI-3456', time: '1 day ago', type: 'issue' }
    ];

    const [vehicles, setVehicles] = useState(initialVehicles);

    // --- Effects ---
    useEffect(() => {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        const userRole = sessionStorage.getItem('userRole');

        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        const storedUser = sessionStorage.getItem('userName');
        if (storedUser) {
            setUser(prev => ({ ...prev, name: storedUser }));
        }
    }, [navigate]);

    const logout = () => {
        sessionStorage.clear();
        localStorage.clear();
        navigate('/login');
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    // --- Chart Config ---
    const chartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Reservations',
            data: [12, 19, 15, 25, 22, 18],
            borderColor: '#660000',
            backgroundColor: 'rgba(102, 0, 0, 0.1)',
            tension: 0.4
        }]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#475569' }
            },
            title: { display: false },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#e2e8f0' },
                ticks: { color: '#64748b' }
            },
            x: {
                grid: { color: '#e2e8f0' },
                ticks: { color: '#64748b' }
            }
        }
    };

    // --- Render Helpers ---
    const renderActivityIcon = (type) => {
        switch (type) {
            case 'return': return <i className="fas fa-undo text-green-600"></i>;
            case 'maintenance': return <i className="fas fa-wrench text-yellow-600"></i>;
            case 'approval': return <i className="fas fa-check-circle text-blue-600"></i>;
            case 'issue': return <i className="fas fa-exclamation-triangle text-red-600"></i>;
            default: return <i className="fas fa-info-circle text-gray-500"></i>;
        }
    };

    const renderStatusBadge = (status) => {
        switch (status) {
            case 'available': return <span className="badge badge-success">Available</span>;
            case 'booked': return <span className="badge badge-warning">Booked</span>;
            case 'maintenance': return <span className="badge badge-danger">Maintenance</span>;
            default: return <span className="badge badge-info">{status}</span>;
        }
    };

    return (
        <div className="dashboard-container">
            {/* Mobile Hamburger */}
            <div
                className="lg:hidden fixed top-5 left-5 z-50 p-2 bg-maroon text-white rounded cursor-pointer"
                onClick={toggleSidebar}
            >
                <i className="fas fa-bars text-xl"></i>
            </div>

            {/* Sidebar */}
            <div className={`sidebar ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300`}>
                <div className="logo">
                    <div className="logo-content justify-center">
                        <img src="/assets/banner.png" alt="University of Kelaniya VMS" className="w-full h-auto object-contain" />
                    </div>
                </div>

                <div className="menu-section">
                    <div className="menu-section-title">Administration</div>
                    <div className={`menu-item ${activeSection === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveSection('dashboard')}>
                        <i className="fas fa-tachometer-alt"></i>
                        <span>Dashboard</span>
                    </div>
                    <div className="menu-item" onClick={() => navigate('/vehicles')}>
                        <i className="fas fa-car"></i>
                        <span>Vehicle Management</span>
                    </div>
                    <div className="menu-item" onClick={() => navigate('/drivers')}>
                        <i className="fas fa-users"></i>
                        <span>Driver Management</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'reservations' ? 'active' : ''}`} onClick={() => setActiveSection('reservations')}>
                        <i className="fas fa-calendar-check"></i>
                        <span>Reservations</span>
                    </div>
                </div>

                <div className="menu-section">
                    <div className="menu-section-title">System</div>
                    <div className={`menu-item ${activeSection === 'users' ? 'active' : ''}`} onClick={() => setActiveSection('users')}>
                        <i className="fas fa-user-cog"></i>
                        <span>User Management</span>
                    </div>
                    <div className="menu-item" onClick={() => navigate('/reports')}>
                        <i className="fas fa-chart-bar"></i>
                        <span>Reports</span>
                    </div>
                    <div className="menu-item" onClick={() => navigate('/maintenance')}>
                        <i className="fas fa-tools"></i>
                        <span>Maintenance</span>
                    </div>
                    <div className="menu-item" onClick={logout}>
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {/* Top Navigation */}
                <div className="top-nav">
                    <div className="welcome">
                        <h1>System Administration</h1>
                        <p>Manage the entire vehicle fleet system</p>
                    </div>
                    <div className="top-nav-right">
                        <div className="notification-icon">
                            <i className="fas fa-bell"></i>
                            <div className="notification-badge">3</div>
                        </div>
                        <div className="user-profile">
                            <div className="user-avatar">
                                {user.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="user-info">
                                <h4>{user.name}</h4>
                                <p>Administrator</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="content-area">

                    {/* --- DASHBOARD SECTION --- */}
                    {activeSection === 'dashboard' && (
                        <div className="animation-fade-in">
                            {/* Stats Grid */}
                            <div className="stats-grid">
                                <div className="stat-card" style={{ '--gradient-start': '#3b82f6', '--gradient-end': '#2563eb', '--icon-bg': 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', '--icon-shadow': 'rgba(59, 130, 246, 0.2)' }}>
                                    <div className="stat-info">
                                        <h3>45</h3>
                                        <p>Total Vehicles</p>
                                        <div className="stat-change positive">
                                            <i className="fas fa-arrow-up"></i>
                                            <span>+2 this month</span>
                                        </div>
                                    </div>
                                    <div className="stat-icon">
                                        <i className="fas fa-car text-blue-600"></i>
                                    </div>
                                </div>

                                <div className="stat-card" style={{ '--gradient-start': '#10b981', '--gradient-end': '#059669', '--icon-bg': 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', '--icon-shadow': 'rgba(16, 185, 129, 0.2)' }}>
                                    <div className="stat-info">
                                        <h3>28</h3>
                                        <p>Active Drivers</p>
                                        <div className="stat-change positive">
                                            <i className="fas fa-check"></i>
                                            <span>All verified</span>
                                        </div>
                                    </div>
                                    <div className="stat-icon">
                                        <i className="fas fa-users text-green-600"></i>
                                    </div>
                                </div>

                                <div className="stat-card" style={{ '--gradient-start': '#f59e0b', '--gradient-end': '#d97706', '--icon-bg': 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', '--icon-shadow': 'rgba(245, 158, 11, 0.2)' }}>
                                    <div className="stat-info">
                                        <h3>15</h3>
                                        <p>Today's Trips</p>
                                        <div className="stat-change">
                                            <i className="fas fa-route"></i>
                                            <span>Ongoing</span>
                                        </div>
                                    </div>
                                    <div className="stat-icon">
                                        <i className="fas fa-route text-yellow-600"></i>
                                    </div>
                                </div>

                                <div className="stat-card" style={{ '--gradient-start': '#ef4444', '--gradient-end': '#dc2626', '--icon-bg': 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', '--icon-shadow': 'rgba(239, 68, 68, 0.2)' }}>
                                    <div className="stat-info">
                                        <h3>8</h3>
                                        <p>Pending Requests</p>
                                        <div className="stat-change negative">
                                            <i className="fas fa-clock"></i>
                                            <span>Needs attention</span>
                                        </div>
                                    </div>
                                    <div className="stat-icon">
                                        <i className="fas fa-exclamation-circle text-red-600"></i>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Recent Activity */}
                                <div className="lg:col-span-2 section">
                                    <div className="section-header">
                                        <h2><i className="fas fa-history"></i> Recent Activity</h2>
                                    </div>
                                    <div className="space-y-4">
                                        {activities.map((activity, index) => (
                                            <div key={index} className="flex items-start space-x-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                                <div className="mt-1 text-lg">
                                                    {renderActivityIcon(activity.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-slate-800">{activity.action}</p>
                                                    <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="section h-min">
                                    <div className="section-header">
                                        <h2><i className="fas fa-bolt"></i> Quick Actions</h2>
                                    </div>
                                    <div className="space-y-3">
                                        <button className="btn btn-primary w-full justify-center">
                                            <i className="fas fa-user-plus"></i> Register New Driver
                                        </button>
                                        <button className="btn btn-secondary w-full justify-center">
                                            <i className="fas fa-chart-line"></i> Generate Report
                                        </button>
                                        <button className="btn btn-outline w-full justify-center">
                                            <i className="fas fa-tools"></i> System Maintenance
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Chart Section */}
                            <div className="section mt-6">
                                <div className="section-header">
                                    <h2><i className="fas fa-chart-area"></i> Vehicle Usage Trends</h2>
                                </div>
                                <div className="h-80 w-full">
                                    <Line data={chartData} options={chartOptions} />
                                </div>
                            </div>
                        </div>
                    )}



                    {/* --- MOCK PREVIEW FOR OTHER SECTIONS --- */}
                    {['drivers', 'reservations', 'users', 'reports', 'maintenance', 'notifications', 'settings'].includes(activeSection) && (
                        <div className="section text-center py-20 animation-fade-in">
                            <i className={`fas ${activeSection === 'reports' ? 'fa-chart-bar' : activeSection === 'maintenance' ? 'fa-tools' : activeSection === 'notifications' ? 'fa-bell' : activeSection === 'settings' ? 'fa-cog' : activeSection === 'drivers' ? 'fa-users' : 'fa-info-circle'} text-slate-300 text-6xl mb-6`}></i>
                            <h3 className="text-xl text-slate-800 font-bold mb-2">Under Construction</h3>
                            <p className="text-slate-500">The <strong>{activeSection}</strong> module is currently being developed.</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
