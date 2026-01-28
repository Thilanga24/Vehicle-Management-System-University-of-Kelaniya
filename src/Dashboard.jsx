import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [availabilityDate, setAvailabilityDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    // Filter states
    const [vehicleStatusFilter, setVehicleStatusFilter] = useState('all');

    useEffect(() => {
        // Session check (simulated)
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
            // navigate('/'); // Uncomment to enforce login
        }
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/');
    };

    const handleTabSwitch = (tabId) => {
        setActiveTab(tabId);
        // Map sidebar highlighting logic if needed, but we can just simplify
    };

    const showNotification = (message, type = 'info') => {
        // Simple alert for now, effectively replacing the DOM-based notification
        alert(`${type.toUpperCase()}: ${message}`);
    };

    const updateAvailability = () => {
        setLoading(true);
        console.log('Checking availability for:', availabilityDate);
        setTimeout(() => {
            setLoading(false);
            showNotification(`Vehicle availability updated for ${availabilityDate}`, 'success');
        }, 800);
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

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
                    <div className="menu-section-title">Main</div>
                    <div className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                        <i className="fas fa-chart-line"></i>
                        <span>Dashboard</span>
                    </div>
                    <div className="menu-item" onClick={() => navigate('/reservation')}>
                        <i className="fas fa-calendar-plus"></i>
                        <span>New Booking</span>
                    </div>
                    <div className={`menu-item ${activeTab === 'reservations-tab' ? 'active' : ''}`} onClick={() => setActiveTab('reservations-tab')}>
                        <i className="fas fa-calendar-check"></i>
                        <span>My Reservations</span>
                    </div>
                </div>

                <div className="menu-section">
                    <div className="menu-section-title">Management</div>
                    <div className="menu-item" onClick={() => navigate('/vehicles')}>
                        <i className="fas fa-car"></i>
                        <span>Vehicles</span>
                    </div>
                    <div className={`menu-item ${activeTab === 'drivers-tab' ? 'active' : ''}`} onClick={() => setActiveTab('drivers-tab')}>
                        <i className="fas fa-user-tie"></i>
                        <span>Drivers</span>
                    </div>
                    <div className="menu-item" onClick={() => navigate('/users')}>
                        <i className="fas fa-users-cog"></i>
                        <span>User Mgmt</span>
                    </div>
                    <div className="menu-item" onClick={() => navigate('/reports')}>
                        <i className="fas fa-chart-bar"></i>
                        <span>Reports</span>
                    </div>
                    <div className="menu-item" onClick={() => navigate('/sar-dashboard')}>
                        <i className="fas fa-user-shield"></i>
                        <span>SAR Portal</span>
                    </div>
                    <div className={`menu-item ${activeTab === 'maintenance-tab' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance-tab')}>
                        <i className="fas fa-tools"></i>
                        <span>Maintenance</span>
                    </div>
                </div>

                <div className="menu-section">
                    <div className="menu-section-title">Analytics</div>
                    <div className={`menu-item ${activeTab === 'reports-tab' ? 'active' : ''}`} onClick={() => setActiveTab('reports-tab')}>
                        <i className="fas fa-chart-bar"></i>
                        <span>Reports</span>
                    </div>
                </div>

                <div className="menu-section">
                    <div className="menu-section-title">System</div>
                    <div className="menu-item">
                        <i className="fas fa-cog"></i>
                        <span>Settings</span>
                    </div>
                    <div className="menu-item" onClick={handleLogout}>
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
                        <h1>Good Morning, {JSON.parse(localStorage.getItem('currentUser') || '{}').name || 'Dr. Silva'} <i className="fas fa-hand-sparkles text-yellow-400 ml-2"></i></h1>
                        <p>Welcome back to your vehicle management dashboard</p>
                    </div>
                    <div className="top-nav-right">
                        <div className="search-box">
                            <i className="fas fa-search"></i>
                            <input type="text" placeholder="Search vehicles, drivers, bookings..." />
                        </div>
                        <div className="notification-icon">
                            <i className="fas fa-bell"></i>
                            <div className="notification-badge">5</div>
                        </div>
                        <div className="user-profile">
                            <div className="user-avatar">
                                {JSON.parse(localStorage.getItem('currentUser') || '{}').name ? JSON.parse(localStorage.getItem('currentUser') || '{}').name.substring(0, 2).toUpperCase() : 'DS'}
                            </div>
                            <div className="user-info">
                                <h4>{JSON.parse(localStorage.getItem('currentUser') || '{}').name || 'Dr. Silva'}</h4>
                                <p>{sessionStorage.getItem('userRole') || 'Senior Lecturer'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="content-area">
                    {/* Section Tabs (Visual Only for Overview context usually, but here they act as sub-nav or main nav switcher) */}
                    <div className="section-tabs">
                        <button className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                            <i className="fas fa-th-large"></i>
                            <span>Overview</span>
                        </button>
                        <button className="tab-button" onClick={() => navigate('/vehicles')}>
                            <i className="fas fa-car"></i>
                            <span>Vehicles</span>
                        </button>
                        <button className={`tab-button ${activeTab === 'drivers-tab' ? 'active' : ''}`} onClick={() => setActiveTab('drivers-tab')}>
                            <i className="fas fa-user-tie"></i>
                            <span>Drivers</span>
                        </button>
                        <button className={`tab-button ${activeTab === 'reservations-tab' ? 'active' : ''}`} onClick={() => setActiveTab('reservations-tab')}>
                            <i className="fas fa-calendar-alt"></i>
                            <span>Reservations</span>
                        </button>
                    </div>

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="tab-content active">
                            {/* Stats Grid */}
                            <div className="stats-grid">
                                <div className="stat-card" style={{ '--gradient-start': '#10b981', '--gradient-end': '#059669', '--icon-bg': 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', '--icon-shadow': 'rgba(16, 185, 129, 0.2)' }}>
                                    <div className="stat-info">
                                        <h3>12</h3>
                                        <p>Available Vehicles</p>
                                        <div className="stat-change positive">
                                            <i className="fas fa-arrow-up"></i>
                                            <span>+2 from yesterday</span>
                                        </div>
                                    </div>
                                    <div className="stat-icon">
                                        <i className="fas fa-check-circle"></i>
                                    </div>
                                </div>
                                <div className="stat-card" style={{ '--gradient-start': '#3b82f6', '--gradient-end': '#2563eb', '--icon-bg': 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', '--icon-shadow': 'rgba(59, 130, 246, 0.2)' }}>
                                    <div className="stat-info">
                                        <h3>5</h3>
                                        <p>Vehicles In Use</p>
                                        <div className="stat-change positive">
                                            <i className="fas fa-arrow-up"></i>
                                            <span>Active trips</span>
                                        </div>
                                    </div>
                                    <div className="stat-icon">
                                        <i className="fas fa-car-side"></i>
                                    </div>
                                </div>
                                <div className="stat-card" style={{ '--gradient-start': '#f59e0b', '--gradient-end': '#d97706', '--icon-bg': 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', '--icon-shadow': 'rgba(245, 158, 11, 0.2)' }}>
                                    <div className="stat-info">
                                        <h3>3</h3>
                                        <p>Pending Approvals</p>
                                        <div className="stat-change">
                                            <i className="fas fa-clock"></i>
                                            <span>Awaiting review</span>
                                        </div>
                                    </div>
                                    <div className="stat-icon">
                                        <i className="fas fa-hourglass-half"></i>
                                    </div>
                                </div>
                                <div className="stat-card" style={{ '--gradient-start': '#ef4444', '--gradient-end': '#dc2626', '--icon-bg': 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', '--icon-shadow': 'rgba(239, 68, 68, 0.2)' }}>
                                    <div className="stat-info">
                                        <h3>2</h3>
                                        <p>Under Maintenance</p>
                                        <div className="stat-change negative">
                                            <i className="fas fa-arrow-down"></i>
                                            <span>-1 from last week</span>
                                        </div>
                                    </div>
                                    <div className="stat-icon">
                                        <i className="fas fa-tools"></i>
                                    </div>
                                </div>
                            </div>

                            {/* Real-Time Vehicle Availability */}
                            <div className="section">
                                <div className="section-header">
                                    <h2>
                                        <i className="fas fa-car"></i>
                                        Real-Time Vehicle Availability
                                    </h2>
                                    <div className="filter-section" style={{ margin: 0 }}>
                                        <div className="filter-item">
                                            <label>Select Date:</label>
                                            <input
                                                type="date"
                                                value={availabilityDate}
                                                onChange={(e) => setAvailabilityDate(e.target.value)}
                                            />
                                        </div>
                                        <button className="btn btn-primary" onClick={updateAvailability}>
                                            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
                                            Refresh
                                        </button>
                                    </div>
                                </div>

                                <div className="vehicle-grid" style={{ opacity: loading ? 0.5 : 1 }}>
                                    {/* Vehicle Cards */}
                                    <div className="vehicle-card">
                                        <span className="vehicle-status status-available">Available</span>
                                        <div className="vehicle-icon">
                                            <i className="fas fa-van-shuttle text-5xl text-emerald-600 drop-shadow-md"></i>
                                        </div>
                                        <div className="vehicle-info">
                                            <h3>Toyota Hiace</h3>
                                            <p className="vehicle-details"><i className="fas fa-id-card"></i> <strong>Reg:</strong> CAB-1234</p>
                                            <p className="vehicle-details"><i className="fas fa-users"></i> <strong>Seats:</strong> 15 passengers</p>
                                            <p className="vehicle-details"><i className="fas fa-user-tie"></i> <strong>Driver:</strong> Mr. Perera</p>
                                        </div>
                                        <div className="vehicle-actions">
                                            <button className="btn btn-secondary btn-small" onClick={() => showNotification("Booking form...")}>
                                                <i className="fas fa-calendar-plus"></i> Book
                                            </button>
                                            <button className="btn btn-outline btn-small">
                                                <i className="fas fa-info-circle"></i> Details
                                            </button>
                                        </div>
                                    </div>
                                    <div className="vehicle-card">
                                        <span className="vehicle-status status-booked">In Use</span>
                                        <div className="vehicle-icon">
                                            <i className="fas fa-car-side text-5xl text-blue-600 drop-shadow-md"></i>
                                        </div>
                                        <div className="vehicle-info">
                                            <h3>Honda Civic</h3>
                                            <p className="vehicle-details"><i className="fas fa-id-card"></i> <strong>Reg:</strong> CAA-5678</p>
                                            <p className="vehicle-details"><i className="fas fa-users"></i> <strong>Seats:</strong> 4 passengers</p>
                                            <p className="vehicle-details"><i className="fas fa-clock"></i> <strong>Return:</strong> 3:00 PM</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Vehicles Tab */}
                    {activeTab === 'vehicles-tab' && (
                        <div className="tab-content active">
                            <div className="section">
                                <div className="section-header">
                                    <h2><i className="fas fa-car"></i> Vehicle Management</h2>
                                    <button className="btn btn-primary"><i className="fas fa-plus"></i> Add Vehicle</button>
                                </div>
                                <div className="filter-section">
                                    <div className="filter-item">
                                        <label>Filter by Status:</label>
                                        <select onChange={(e) => setVehicleStatusFilter(e.target.value)}>
                                            <option value="all">All Vehicles</option>
                                            <option value="available">Available</option>
                                        </select>
                                    </div>
                                </div>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Registration No</th>
                                            <th>Vehicle Type</th>
                                            <th>Seats</th>
                                            <th>Driver</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>CAB-1234</strong></td>
                                            <td>Toyota Hiace</td>
                                            <td>15</td>
                                            <td>Mr. Perera</td>
                                            <td><span className="badge badge-success">Available</span></td>
                                            <td>
                                                <div className="action-btns">
                                                    <button className="action-btn action-btn-view"><i className="fas fa-eye"></i></button>
                                                    <button className="action-btn action-btn-edit"><i className="fas fa-edit"></i></button>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Other tabs can be implemented similarly... */}
                    {/* Placeholder for other tabs to save space for now, as logic is repetitive */}
                    {(activeTab === 'drivers-tab' || activeTab === 'reservations-tab' || activeTab === 'maintenance-tab' || activeTab === 'reports-tab') && (
                        <div className="tab-content active text-center py-20">
                            <div className="empty-state">
                                <i className="fas fa-tools text-gray-300 text-6xl mb-4"></i>
                                <h3 className="text-xl text-gray-600 font-bold">{activeTab.replace('-tab', '').toUpperCase()}</h3>
                                <p className="text-gray-400">This module is under construction in this demo.</p>
                                <button className="btn btn-outline mt-4" onClick={() => setActiveTab('overview')}>Back to Dashboard</button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
