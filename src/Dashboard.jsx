import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import SettingsTab from './SettingsTab';

const Dashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [settingsSubTab, setSettingsSubTab] = useState('security');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [availabilityDate, setAvailabilityDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [reservations, setReservations] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
    const [showEmergencySuccess, setShowEmergencySuccess] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelRequestId, setCancelRequestId] = useState(null);

    const showNotification = (message, type = 'info') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'info' }), 4000);
    };

    const [currentUser, setCurrentUser] = useState(() => {
        return JSON.parse(localStorage.getItem('currentUser') || '{"name": "Staff Member", "role": "staff", "department": "", "profilePic": ""}');
    });

    const [showProfileModal, setShowProfileModal] = useState(false);
    const [editProfileForm, setEditProfileForm] = useState({
        name: currentUser.name || '',
        department: currentUser.department || currentUser.faculty || '',
        profilePic: currentUser.profilePic || ''
    });

    const handleProfileUpdate = (e) => {
        e.preventDefault();
        const updatedUser = { ...currentUser, ...editProfileForm };
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setShowProfileModal(false);
        showNotification('Profile updated successfully!', 'success');
    };

    const handleProfilePicChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditProfileForm({ ...editProfileForm, profilePic: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const fetchReservations = async () => {
        try {
            const token = sessionStorage.getItem('authToken');
            const response = await fetch('http://localhost:5000/api/reservations', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setReservations(data);
            }
        } catch (error) {
            console.error('Error fetching reservations:', error);
        }
    };

    const fetchNotifications = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
            if (!user.id) return;
            const response = await fetch(`http://localhost:5000/api/notifications/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markNotificationAsRead = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
                method: 'PUT'
            });
            if (response.ok) {
                setNotifications(notifications.map(n => n.notification_id === id ? { ...n, is_read: 1 } : n));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllNotificationsAsRead = async () => {
        try {
            const unread = notifications.filter(n => !n.is_read);
            for (const n of unread) {
                await fetch(`http://localhost:5000/api/notifications/${n.notification_id}/read`, {
                    method: 'PUT'
                });
            }
            setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
            showNotification('All notifications marked as read.', 'success');
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const role = user.role;

        // Redirect to specific dashboards based on role
        if (role === 'registrar') navigate('/registrar-dashboard');
        else if (role === 'sar') navigate('/sar-dashboard');
        else if (role === 'hod') navigate('/hod-dashboard');
        else if (role === 'dean') navigate('/dean-dashboard');
        else if (role === 'admin') navigate('/admin-dashboard');
        else if (role === 'management_assistant') navigate('/management-dashboard');

        // If it's a generic staff member, continue to regular dashboard
        fetchReservations();
        fetchNotifications();
        
        // Polling for updates
        const interval = setInterval(() => {
            fetchReservations();
            fetchNotifications();
        }, 30000);
        return () => clearInterval(interval);
    }, [navigate]);

    // Filter states
    const [vehicleStatusFilter, setVehicleStatusFilter] = useState('all');

    // Emergency Form State
    const [emergencyForm, setEmergencyForm] = useState({
        nature: 'Medical Emergency',
        isImmediate: true,
        startPlace: '',
        destinations: [''],
        description: '',
        passengers: '',
        purpose: '',
        attachment: null
    });

    const handleEmergencySubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const requesterId = currentUser.id;

        if (!requesterId) {
            alert('You must be logged in to submit a request.');
            setLoading(false);
            return;
        }

        const payload = new FormData();
        payload.append('requesterId', requesterId);
        payload.append('reservationType', 'emergency');
        payload.append('natureOfEmergency', emergencyForm.nature);

        // Combine description and purpose if both exist
        let combinedDescription = emergencyForm.description;
        if (emergencyForm.purpose) {
            combinedDescription += `\nAdditional Purpose/Remarks: ${emergencyForm.purpose}`;
        }
        payload.append('purpose', combinedDescription);

        payload.append('start_place', emergencyForm.startPlace);

        emergencyForm.destinations.filter(d => String(d).trim() !== '').forEach(d => {
            payload.append('destinations[]', d);
        });

        payload.append('date', new Date().toISOString().split('T')[0]); // Today
        payload.append('time', new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })); // Now
        payload.append('passengers', emergencyForm.passengers || 1); // Default is 1 if unspecified

        if (emergencyForm.attachment) {
            payload.append('attachment', emergencyForm.attachment);
        }

        try {
            const response = await fetch('http://localhost:5000/api/reservations', {
                method: 'POST',
                body: payload
            });

            if (response.ok) {
                setShowEmergencySuccess(true);
                showNotification('CRITICAL: Emergency request submitted successfully. Administration has been notified.', 'success');
                setEmergencyForm({ nature: 'Medical Emergency', isImmediate: true, startPlace: '', destinations: [''], description: '', passengers: '', purpose: '', attachment: null });
                fetchReservations(); // REFRESH THE LIST
                // Don't auto-switch tab immediately, let them see the success message
                setTimeout(() => {
                    setShowEmergencySuccess(false);
                    setActiveTab('reservations-tab');
                }, 5000);
            } else {
                showNotification('Failed to submit emergency request. Please contact 011-2903903 immediately.', 'error');
            }
        } catch (error) {
            console.error('Emergency Submit Error:', error);
            alert('Connection Error. Please call security immediately.');
        } finally {
            setLoading(false);
        }
    };

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

    const handleCancelRequest = (id) => {
        setCancelRequestId(id);
        setShowCancelModal(true);
    };

    const confirmCancelRequest = async () => {
        if (!cancelRequestId) return;

        try {
            const token = sessionStorage.getItem('authToken');
            const response = await fetch(`http://localhost:5000/api/reservations/${cancelRequestId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'cancelled' })
            });

            if (response.ok) {
                showNotification('Reservation request cancelled successfully.', 'success');
                fetchReservations(); // Refresh the list
            } else {
                const data = await response.json();
                showNotification(data.message || 'Failed to cancel the request.', 'error');
            }
        } catch (error) {
            console.error('Cancel Request Error:', error);
            showNotification('An error occurred. Please try again.', 'error');
        } finally {
            setShowCancelModal(false);
            setCancelRequestId(null);
        }
    };

    const handleTabSwitch = (tabId) => {
    setActiveTab(tabId);
    // Map sidebar highlighting logic if needed, but we can just simplify
};

const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

const updateAvailability = () => {
    setLoading(true);
    console.log('Checking availability for:', availabilityDate);
    setTimeout(() => {
        setLoading(false);
        showNotification(`Vehicle availability updated for ${availabilityDate}`, 'success');
    }, 800);
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
            <div className="logo p-6 border-b border-white/10 shrink-0">
                <div className="flex justify-center">
                    <img src="/assets/banner.png" alt="University of Kelaniya VMS" className="w-44 h-auto object-contain" />
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
                <div className="menu-section-title">Bookings & Requests</div>
                <div className={`menu-item ${activeTab === 'emergency-tab' ? 'active' : ''}`} onClick={() => setActiveTab('emergency-tab')}>
                    <i className="fas fa-exclamation-triangle text-red-500"></i>
                    <span>Emergency Request</span>
                </div>
                <div className={`menu-item ${activeTab === 'reservations-tab' ? 'active' : ''}`} onClick={() => setActiveTab('reservations-tab')}>
                    <i className="fas fa-calendar-check"></i>
                    <span>My Reservations</span>
                </div>
                <div className={`menu-item ${activeTab === 'pending-tab' ? 'active' : ''}`} onClick={() => setActiveTab('pending-tab')}>
                    <i className="fas fa-clock"></i>
                    <span>Pending Approvals</span>
                </div>
                <div className={`menu-item ${activeTab === 'past-bookings-tab' ? 'active' : ''}`} onClick={() => setActiveTab('past-bookings-tab')}>
                    <i className="fas fa-history"></i>
                    <span>Past Bookings</span>
                </div>
                <div className={`menu-item ${activeTab === 'availability-tab' ? 'active' : ''}`} onClick={() => setActiveTab('availability-tab')}>
                    <i className="fas fa-car-side"></i>
                    <span>Vehicle Availability</span>
                </div>
            </div>

            <div className="menu-section">
                <div className="menu-section-title">System</div>
                <div className={`menu-item ${activeTab === 'settings-tab' ? 'active' : ''}`} onClick={() => setActiveTab('settings-tab')}>
                    <i className="fas fa-cog"></i>
                    <span>Settings</span>
                </div>
                <div className="menu-item" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                </div>
            </div>
        </div>

        {/* Notification Toast */}
        {notification.show && (
            <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 p-4 rounded-xl shadow-2xl border-l-4 transition-all duration-300 animate-fade-in ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' :
                notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
                    'bg-blue-50 border-blue-500 text-blue-800'
                }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${notification.type === 'success' ? 'bg-emerald-500 text-white' :
                    notification.type === 'error' ? 'bg-red-500 text-white' :
                        'bg-blue-500 text-white'
                    }`}>
                    <i className={`fas ${notification.type === 'success' ? 'fa-check' :
                        notification.type === 'error' ? 'fa-exclamation-triangle' :
                            'fa-info'
                        }`}></i>
                </div>
                <div className="flex-1 pr-4">
                    <p className="font-bold text-sm uppercase">System Update</p>
                    <p className="text-sm font-medium">{notification.message}</p>
                </div>
                <button onClick={() => setNotification({ ...notification, show: false })} className="text-gray-400 hover:text-gray-600 transition">
                    <i className="fas fa-times"></i>
                </button>
            </div>
        )}

        {/* Profile Modal */}
        {showProfileModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in relative block">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Edit Profile</h2>
                            <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div className="flex flex-col items-center mb-6">
                                <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden mb-3 relative group border-4 border-white shadow-lg">
                                    {editProfileForm.profilePic ? (
                                        <img src={editProfileForm.profilePic} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-400">
                                            {editProfileForm.name ? editProfileForm.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                    )}
                                    <label className="absolute inset-0 bg-black bg-opacity-50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                        <i className="fas fa-camera text-xl"></i>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleProfilePicChange} />
                                    </label>
                                </div>
                                <div className="flex flex-col items-center">
                                    <p className="text-sm text-slate-500 mb-1">Click image to upload new profile picture</p>
                                    {editProfileForm.profilePic && (
                                        <button
                                            type="button"
                                            onClick={() => setEditProfileForm({ ...editProfileForm, profilePic: '' })}
                                            className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors flex items-center gap-1"
                                        >
                                            <i className="fas fa-trash-alt"></i> Remove Photo
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    value={editProfileForm.name}
                                    onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Department / Faculty</label>
                                <input
                                    type="text"
                                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    value={editProfileForm.department}
                                    onChange={(e) => setEditProfileForm({ ...editProfileForm, department: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowProfileModal(false)} className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-md">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )}

        {/* Main Content */}
        <div className="main-content">
            {/* Top Navigation */}
            <div className="top-nav">
                <div className="welcome">
                    <h1>Good Morning, {currentUser.name}!</h1>
                    <p>{currentUser.department || currentUser.faculty || 'University of Kelaniya'} | {currentUser.role.toUpperCase()}</p>
                </div>
                <div className="top-nav-right">
                    <div className="notification-icon cursor-pointer hover:opacity-80 transition-opacity" onClick={() => { setSettingsSubTab('notifications'); setActiveTab('settings-tab'); }}>
                        <i className="fas fa-bell"></i>
                        {notifications.filter(n => !n.is_read).length > 0 && (
                            <div className="notification-badge">{notifications.filter(n => !n.is_read).length}</div>
                        )}
                    </div>
                    <div className="user-profile cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors" onClick={() => {
                        setEditProfileForm({
                            name: currentUser.name || '',
                            department: currentUser.department || currentUser.faculty || '',
                            profilePic: currentUser.profilePic || ''
                        });
                        setShowProfileModal(true);
                    }}>
                        <div className="user-avatar overflow-hidden shrink-0">
                            {currentUser.profilePic ? (
                                <img src={currentUser.profilePic} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'
                            )}
                        </div>
                        <div className="user-info">
                            <h4>{currentUser.name}</h4>
                            <p>{currentUser.role === 'staff' ? 'Academic/Staff' : currentUser.role.toUpperCase()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="content-area">
                {/* Section Tabs (Visual Only for Overview context usually, but here they act as sub-nav or main nav switcher) */}


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
                                        <p className="vehicle-details"><i className="fas fa-users"></i> <strong>Seats:</strong> 4 passengers</p>
                                        <p className="vehicle-details"><i className="fas fa-clock"></i> <strong>Return:</strong> 3:00 PM</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Emergency Request Tab */}
                {activeTab === 'emergency-tab' && (
                    <div className="tab-content active">
                        <div className="section border-l-4 border-l-red-600">
                            <div className="section-header">
                                <h2 className="text-red-700"><i className="fas fa-exclamation-triangle text-red-600"></i> Emergency Vehicle Request</h2>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg mb-6 text-red-800 text-sm border border-red-200">
                                <i className="fas fa-info-circle mr-2"></i>
                                <strong>High Priority:</strong> This request will be immediately flagged to the Registrar, SAR, and Dean given the urgency. Please use this only for genuine emergencies.
                            </div>
                            {!showEmergencySuccess ? (
                                <form className="space-y-4" onSubmit={handleEmergencySubmit}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Nature of Emergency</label>
                                            <select
                                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                value={emergencyForm.nature}
                                                onChange={(e) => setEmergencyForm({ ...emergencyForm, nature: e.target.value })}
                                            >
                                                <option>Medical Emergency</option>
                                                <option>Security Incident</option>
                                                <option>Critical Infrastructure Failure</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Required Immediately?</label>
                                            <div className="flex items-center space-x-4 mt-2">
                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="immediate"
                                                        className="mr-2"
                                                        checked={emergencyForm.isImmediate}
                                                        onChange={() => setEmergencyForm({ ...emergencyForm, isImmediate: true })}
                                                    /> Yes
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="immediate"
                                                        className="mr-2"
                                                        checked={!emergencyForm.isImmediate}
                                                        onChange={() => setEmergencyForm({ ...emergencyForm, isImmediate: false })}
                                                    /> No (Specify Time)
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Start Place / Pickup Location</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
                                            placeholder="Where is the vehicle needed?"
                                            value={emergencyForm.startPlace}
                                            onChange={(e) => setEmergencyForm({ ...emergencyForm, startPlace: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Drop Locations (Destinations)</label>
                                        {emergencyForm.destinations.map((dest, index) => (
                                            <div key={index} className="flex items-center mb-2 gap-2">
                                                <div className="flex-1">
                                                    <input type="text" value={dest} onChange={(e) => setEmergencyForm({ ...emergencyForm, destinations: emergencyForm.destinations.map((d, i) => i === index ? e.target.value : d) })} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder={`Drop Location ${index + 1}`} />
                                                </div>
                                                {index > 0 && (
                                                    <button type="button" onClick={() => setEmergencyForm({ ...emergencyForm, destinations: emergencyForm.destinations.filter((_, i) => i !== index) })} className="p-2 text-red-500 hover:text-red-700 bg-red-50 rounded-lg">
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                )}
                                                {index === emergencyForm.destinations.length - 1 && (
                                                    <button type="button" onClick={() => setEmergencyForm({ ...emergencyForm, destinations: [...emergencyForm.destinations, ''] })} className="p-2 text-red-600 hover:text-red-800 bg-red-50 rounded-lg whitespace-nowrap">
                                                        <i className="fas fa-plus mr-1"></i> Add
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                        <textarea
                                            rows="3"
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                            placeholder="Please describe the emergency situation..."
                                            value={emergencyForm.description}
                                            onChange={(e) => setEmergencyForm({ ...emergencyForm, description: e.target.value })}
                                        ></textarea>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Passengers (Optional)</label>
                                            <input
                                                type="number"
                                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                placeholder="Number of passengers"
                                                value={emergencyForm.passengers}
                                                onChange={(e) => setEmergencyForm({ ...emergencyForm, passengers: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Purpose / Context (Optional)</label>
                                            <input
                                                type="text"
                                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                placeholder="Any extra purpose context"
                                                value={emergencyForm.purpose}
                                                onChange={(e) => setEmergencyForm({ ...emergencyForm, purpose: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Attachment (Optional)</label>
                                        <div className="flex items-center space-x-4">
                                            <label className="flex items-center justify-center px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg cursor-pointer hover:bg-red-100 transition">
                                                <i className="fas fa-paperclip mr-2 text-red-500"></i>
                                                <span className="text-sm font-medium">Choose File</span>
                                                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => setEmergencyForm({ ...emergencyForm, attachment: e.target.files[0] })} />
                                            </label>
                                            <span className="text-sm text-gray-500">
                                                {emergencyForm.attachment ? emergencyForm.attachment.name : 'No file chosen...'}
                                            </span>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={loading} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow-lg transition disabled:opacity-50">
                                        <i className={`fas fa-paper-plane mr-2 ${loading ? 'animate-pulse' : ''}`}></i> {loading ? 'Sending...' : 'Submit Emergency Request'}
                                    </button>
                                </form>
                            ) : (
                                <div className="mt-6 flex flex-col items-center justify-center p-8 bg-emerald-50 rounded-xl shadow-inner border border-emerald-100 text-center animate-fade-in">
                                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-4 text-white text-2xl animate-bounce">
                                        <i className="fas fa-check"></i>
                                    </div>
                                    <h3 className="text-xl font-bold text-emerald-800 mb-2">Request Transmitted!</h3>
                                    <p className="text-emerald-700 text-sm mb-4">
                                        Your emergency request has been prioritized and dispatched to the Registrar's office.
                                        Help is being coordinated.
                                    </p>
                                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                                        <i className="fas fa-spinner fa-spin"></i>
                                        Redirecting to My Reservations...
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* My Reservations Tab */}
                {activeTab === 'reservations-tab' && (
                    <div className="tab-content active">
                        <div className="section">
                            <div className="section-header">
                                <h2><i className="fas fa-calendar-check"></i> My Upcoming Reservations</h2>
                                <button className="btn btn-primary" onClick={() => navigate('/reservation')}><i className="fas fa-plus"></i> New Booking</button>
                            </div>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Ref No</th>
                                        <th>Date</th>
                                        <th>Time</th>
                                        <th>Destination</th>
                                        <th>Status</th>
                                        <th>Vehicle</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reservations.filter(r => String(r.requester_id) === String(currentUser.id) && r.status !== 'completed').map(r => (
                                        <tr key={r.reservation_id}>
                                            <td><strong>REQ-{r.reservation_id}</strong></td>
                                            <td>{new Date(r.start_datetime).toLocaleDateString()}</td>
                                            <td>{new Date(r.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td>{r.destination}</td>
                                            <td>
                                                <span className={`badge ${r.status === 'approved' ? 'badge-success' : r.status === 'rejected' ? 'badge-danger' : r.status === 'pending' ? 'badge-warning' : 'badge-info'}`}>
                                                    {r.status === 'rejected' ?
                                                        `Rejected by ${r.hod_approval_status === 'rejected' ? 'HOD' : r.dean_approval_status === 'rejected' ? 'Dean' : r.sar_approval_status === 'rejected' ? 'SAR' : r.registrar_approval_status === 'rejected' ? 'Registrar' : 'Admin'}`
                                                        : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                                                </span>
                                            </td>
                                            <td>{r.model ? `${r.model} (${r.registration_number})` : 'To Be Assigned'}</td>
                                        </tr>
                                    ))}
                                    {reservations.filter(r => String(r.requester_id) === String(currentUser.id) && r.status !== 'completed').length === 0 && (
                                        <tr><td colSpan="6" className="text-center p-4 text-gray-500">No upcoming reservations found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pending Approvals Tab */}
                {activeTab === 'pending-tab' && (
                    <div className="tab-content active">
                        <div className="section">
                            <div className="section-header">
                                <h2><i className="fas fa-clock"></i> Pending Approvals</h2>
                            </div>
                            <p className="text-gray-500 mb-4 text-sm">The following requests are awaiting approval from the Head of Department or Dean.</p>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Ref No</th>
                                        <th>Requested Date</th>
                                        <th>Purpose</th>
                                        <th>Status</th>
                                        <th>Submitted On</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reservations.filter(r => String(r.requester_id) === String(currentUser.id) && (r.status === 'pending' || r.status.startsWith('pending_'))).map(r => (
                                        <tr key={r.reservation_id}>
                                            <td><strong>REQ-{r.reservation_id}</strong></td>
                                            <td>{new Date(r.start_datetime).toLocaleDateString()}</td>
                                            <td>{r.description || 'General Transport'}</td>
                                            <td>
                                                <span className="badge badge-warning">
                                                    {r.status === 'pending' ? 'Pending HOD' : r.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                                </span>
                                            </td>
                                            <td>{new Date(r.created_at || Date.now()).toLocaleDateString()}</td>
                                            <td>
                                                <div className="action-btns">
                                                    <button className="action-btn action-btn-view" title="View Details"><i className="fas fa-eye"></i></button>
                                                    <button onClick={() => handleCancelRequest(r.reservation_id)} className="action-btn action-btn-delete" title="Cancel Request"><i className="fas fa-times"></i></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {reservations.filter(r => String(r.requester_id) === String(currentUser.id) && (r.status === 'pending' || r.status.startsWith('pending_'))).length === 0 && (
                                        <tr><td colSpan="6" className="text-center p-4 text-gray-500">No pending approvals found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Past Bookings Tab */}
                {activeTab === 'past-bookings-tab' && (
                    <div className="tab-content active">
                        <div className="section">
                            <div className="section-header">
                                <h2><i className="fas fa-history"></i> Booking History</h2>
                            </div>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Destination</th>
                                        <th>Vehicle</th>
                                        <th>Driver</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reservations.filter(r => String(r.requester_id) === String(currentUser.id) && (r.status === 'completed' || r.status === 'rejected')).map(r => (
                                        <tr key={r.reservation_id}>
                                            <td>{new Date(r.start_datetime).toLocaleDateString()}</td>
                                            <td>{r.destination}</td>
                                            <td>{r.model || (r.status === 'rejected' ? 'N/A' : 'Unassigned')}</td>
                                            <td>{/* Driver info not available in this fetch yet, use placeholder or extended fetch later */ "Assigned Driver"}</td>
                                            <td>
                                                <span className={`badge ${r.status === 'rejected' ? 'badge-danger' : r.status === 'completed' ? 'badge-success' : 'badge-info'}`}>
                                                    {r.status === 'rejected' ?
                                                        `Rejected by ${r.hod_approval_status === 'rejected' ? 'HOD' : r.dean_approval_status === 'rejected' ? 'Dean' : r.sar_approval_status === 'rejected' ? 'SAR' : r.registrar_approval_status === 'rejected' ? 'Registrar' : 'Admin'}`
                                                        : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {reservations.filter(r => String(r.requester_id) === String(currentUser.id) && (r.status === 'completed' || r.status === 'rejected')).length === 0 && (
                                        <tr><td colSpan="5" className="text-center p-4 text-gray-500">No past booking history found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Vehicle Availability Tab */}
                {activeTab === 'availability-tab' && (
                    <div className="tab-content active">
                        <div className="section">
                            <div className="section-header">
                                <h2>
                                    <i className="fas fa-car-side"></i>
                                    Check Vehicle Availability
                                </h2>
                                <div className="filter-section" style={{ margin: 0 }}>
                                    <div className="filter-item">
                                        <label>Check Date:</label>
                                        <input
                                            type="date"
                                            value={availabilityDate}
                                            onChange={(e) => setAvailabilityDate(e.target.value)}
                                        />
                                    </div>
                                    <button className="btn btn-primary" onClick={updateAvailability}>
                                        <i className={`fas fa-search ${loading ? 'fa-spin' : ''}`}></i>
                                        Check
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
                                        <h3>Toyota Hiace (15 Seats)</h3>
                                        <p className="vehicle-details"><i className="fas fa-check-circle text-green-600"></i> Free all day</p>
                                    </div>
                                    <div className="vehicle-actions">
                                        <button className="btn btn-secondary btn-small" onClick={() => navigate('/reservation', {
                                            state: {
                                                selectedVehicle: { id: 101, model: 'Toyota Hiace', number: '', seats: 15, driver: 'Mr. Perera', type: 'Van', status: 'available' },
                                                date: availabilityDate
                                            }
                                        })}>
                                            <i className="fas fa-calendar-plus"></i> Book Now
                                        </button>
                                    </div>
                                </div>
                                <div className="vehicle-card">
                                    <span className="vehicle-status status-booked">Fully Booked</span>
                                    <div className="vehicle-icon">
                                        <i className="fas fa-car-side text-5xl text-blue-600 drop-shadow-md"></i>
                                    </div>
                                    <div className="vehicle-info">
                                        <h3>Honda Civic (4 Seats)</h3>
                                        <p className="vehicle-details"><i className="fas fa-clock text-red-500"></i> Booked until 5:00 PM</p>
                                    </div>
                                    <div className="vehicle-actions">
                                        <button className="btn btn-outline btn-small disabled:opacity-50 cursor-not-allowed">
                                            <i className="fas fa-calendar-times"></i> Unavailable
                                        </button>
                                    </div>
                                </div>
                                <div className="vehicle-card">
                                    <span className="vehicle-status status-available">Available</span>
                                    <div className="vehicle-icon">
                                        <i className="fas fa-bus text-5xl text-emerald-600 drop-shadow-md"></i>
                                    </div>
                                    <div className="vehicle-info">
                                        <h3>Toyota Coaster (29 Seats)</h3>
                                        <p className="vehicle-details"><i className="fas fa-check-circle text-green-600"></i> Free after 10:00 AM</p>
                                    </div>
                                    <div className="vehicle-actions">
                                        <button className="btn btn-secondary btn-small" onClick={() => navigate('/reservation', {
                                            state: {
                                                selectedVehicle: { id: 102, model: 'Toyota Coaster', number: '', seats: 29, driver: 'TBA', type: 'Bus', status: 'available' },
                                                date: availabilityDate
                                            }
                                        })}>
                                            <i className="fas fa-calendar-plus"></i> Book Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings-tab' && (
                    <SettingsTab 
                        currentUser={currentUser} 
                        setShowProfileModal={setShowProfileModal} 
                        showNotification={showNotification} 
                        defaultSubTab={settingsSubTab}
                        notifications={notifications}
                        markNotificationAsRead={markNotificationAsRead}
                        markAllNotificationsAsRead={markAllNotificationsAsRead}
                    />
                )}

            </div>
            {/* Cancel Confirmation Modal - Modern UI */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animation-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all border border-slate-200">
                        <div className="p-8 text-center text-left">
                            <div className="w-20 h-20 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-6">
                                <i className="fas fa-exclamation-circle text-red-500 text-4xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Cancel Request?</h3>
                            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                                Are you sure you want to cancel this reservation request? This action cannot be undone.
                            </p>
                            
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={confirmCancelRequest}
                                    className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Yes, Cancel Request
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCancelModal(false);
                                        setCancelRequestId(null);
                                    }}
                                    className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    Go Back
                                </button>
                            </div>
                        </div>
                        <div className="bg-slate-50 py-3 px-8 text-[10px] text-slate-400 text-center border-t border-slate-100 uppercase tracking-widest font-bold">
                            University of Kelaniya • VMS System
                        </div>
                    </div>
                </div>
            )}

        </div>
    </div >
);
};

export default Dashboard;
