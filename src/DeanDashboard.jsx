import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DeanDashboard.css';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import SettingsTab from './SettingsTab';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const DeanDashboard = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('dashboard');
    const [settingsSubTab, setSettingsSubTab] = useState('security');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('currentUser') || '{"name": "Dean", "faculty": "Science"}'));

    const [showProfileModal, setShowProfileModal] = useState(false);
    const [editProfileForm, setEditProfileForm] = useState({
        name: user?.name || '',
        department: user?.department || user?.faculty || '',
        profilePic: user?.profilePic || ''
    });

    const handleProfileUpdate = (e) => {
        e.preventDefault();
        const updatedUser = { ...user, ...editProfileForm };
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setShowProfileModal(false);
        if (typeof showNotification === 'function') {
            showNotification('Profile updated successfully!', 'success');
        }
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

    const [currentTime, setCurrentTime] = useState('');

    // --- State for Data ---
    const [reservations, setReservations] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });

    // Faculty specific data
    const [departments, setDepartments] = useState([
        { id: 1, name: 'Computer Science', head: 'Prof. K. Perera', staffCount: 45, usageRate: 78 },
        { id: 2, name: 'Physics', head: 'Dr. S. Silva', staffCount: 32, usageRate: 54 },
        { id: 3, name: 'Chemistry', head: 'Prof. M. Fernando', staffCount: 38, usageRate: 62 },
        { id: 4, name: 'Mathematics', head: 'Dr. J. Kumara', staffCount: 25, usageRate: 41 },
        { id: 5, name: 'Statistics', head: 'Dr. A. Ranasinghe', staffCount: 20, usageRate: 35 }
    ]);

    const facultyStats = {
        totalFleetUsage: '840 km',
        activeTrips: 12,
        pendingApprovals: 5,
        monthlyExpenditure: 'LKR 145,000'
    };

    const showNotification = (message, type = 'info') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'info' }), 4000);
    };

    const fetchNotifications = async () => {
        try {
            if (!user?.id) return;
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

    const fetchReservations = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/reservations');
            if (response.ok) {
                const data = await response.json();
                setReservations(data);
            }
        } catch (error) {
            console.error('Error fetching reservations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
        fetchNotifications();

        const interval = setInterval(() => {
            fetchReservations();
            fetchNotifications();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    // Filtered lists for the Dean
    const pendingRequests = reservations.filter(r =>
        r.status === 'pending_dean' || (r.status === 'pending' && r.distance_km > 100)
    ).map(r => ({
        id: r.reservation_id,
        department: r.department || 'Faculty',
        lecturer: `${r.first_name || ''} ${r.last_name || ''}`,
        destination: r.destination,
        purpose: r.purpose,
        distance: r.distance_km,
        date: new Date(r.start_datetime).toLocaleDateString(),
        time: new Date(r.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        remarks: r.remarks,
        emergency_contact: r.emergency_contact,
        attachment_url: r.attachment_url,
        hodComments: 'Forwarded by HOD',
        vehicleType: r.vehicle_id ? 'Assigned' : 'Needs Assignment'
    }));

    // Personal Bookings for the Dean
    const myPendingBookings = reservations.filter(r =>
        r.requester_id === user.id &&
        (r.status === 'pending' || r.status.startsWith('pending_'))
    );

    const myPastBookings = reservations.filter(r =>
        r.requester_id === user.id &&
        (r.status === 'completed' || r.status === 'rejected' || r.status === 'cancelled')
    );

    const myActiveBookings = reservations.filter(r =>
        r.requester_id === user.id &&
        r.status === 'approved'
    );

    const recentDecisions = reservations
        .filter(r => r.dean_approval_status !== 'pending')
        .slice(0, 5)
        .map(r => ({
            id: r.reservation_id,
            lecturer: `${r.first_name || ''} ${r.last_name || 'Staff'}`,
            department: r.department,
            destination: r.destination,
            decision: r.dean_approval_status,
            date: new Date(r.start_datetime).toLocaleDateString(),
            decidedAt: 'Recently'
        }));

    const departmentStats = [
        { department: 'Computer Science', pending: pendingRequests.length, thisMonth: reservations.length },
        { department: 'Physics', pending: 0, thisMonth: 0 },
        { department: 'Chemistry', pending: 0, thisMonth: 0 }
    ];

    // --- Modal State ---
    const [showModal, setShowModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [deanComment, setDeanComment] = useState('');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelRequestId, setCancelRequestId] = useState(null);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('userName');
        if (storedUser) {
            setUser(prev => ({ ...prev, name: storedUser }));
        }
        const now = new Date();
        setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, []);

    const logout = () => {
        sessionStorage.clear();
        localStorage.clear();
        navigate('/login');
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const handleSectionChange = (section) => {
        setActiveSection(section);
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    };

    // --- Logic for Approvals ---
    const openReviewModal = (request) => {
        setSelectedRequest(request);
        setDeanComment('');
        setShowModal(true);
    };

    const processApproval = async (decision) => {
        if (!selectedRequest) return;

        try {
            const response = await fetch(`http://localhost:5000/api/reservations/${selectedRequest.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: decision,
                    level: 'dean',
                    comments: deanComment
                })
            });

            if (response.ok) {
                let message = `Request ${selectedRequest.id} ${decision === 'approved' ? 'Approved' : 'Rejected'}.`;
                if (decision === 'approved' && selectedRequest.distance > 100) {
                    message += ' Forwarded to SAR/Registrar (Distance > 100km).';
                }
                showNotification(message, 'success');
                fetchReservations();
            } else {
                showNotification('Failed to update status', 'error');
            }
        } catch (error) {
            console.error('Approval Error:', error);
            showNotification('Error processing approval', 'error');
        }

        setShowModal(false);
        setSelectedRequest(null);
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
                fetchReservations();
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

    // --- Analytics Data ---
    const monthlyUsageData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Total KM Traveled',
            data: [650, 590, 800, 810, 560, 840],
            fill: true,
            backgroundColor: 'rgba(102, 0, 0, 0.1)',
            borderColor: '#660000',
            tension: 0.4,
        }]
    };

    const deptDistributionData = {
        labels: departments.map(d => d.name),
        datasets: [{
            data: [45, 25, 35, 15, 10],
            backgroundColor: [
                '#660000',
                '#800000',
                '#F6DD26',
                '#2D3748',
                '#4A5568'
            ],
            borderWidth: 0,
        }]
    };

    const tripStatusData = {
        labels: ['Approved', 'Pending', 'Rejected'],
        datasets: [{
            label: 'Trip Status',
            data: [150, 25, 15],
            backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
            hoverOffset: 4
        }]
    };

    // --- Render Helpers ---
    const renderPendingRequestCard = (request) => {
        const priorityLabel = request.distance > 150 ? 'High Priority' : 'Standard';

        return (
            <div key={request.id} className="bg-white border border-slate-200 rounded-lg p-4 mb-4 shadow-sm hover:translate-y-[-2px] transition-transform duration-200">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-slate-800 text-lg">{request.lecturer}</h4>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${request.distance > 150 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                {priorityLabel}
                            </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-1"><strong>Dept:</strong> {request.department}</p>
                        <p className="text-sm text-slate-600 mb-1"><strong>Dest:</strong> {request.destination}</p>
                        <p className="text-sm text-slate-600 mb-2"><strong>Purpose:</strong> {request.purpose}</p>
                        <div className="bg-green-500/10 border border-green-500/20 rounded p-2 mb-3">
                            <p className="text-xs text-emerald-700 font-semibold mb-1">HOD: Approved</p>
                            <p className="text-xs text-emerald-600 italic">"{request.hodComments}"</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 mt-2">
                    <button onClick={() => openReviewModal(request)} className="btn btn-primary text-sm w-full">
                        <i className="fas fa-eye"></i> Review
                    </button>
                </div>
            </div>
        );
    };

    // --- Main JSX ---
    return (
        <div className="dean-dashboard-container min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <div className={`sidebar ${sidebarOpen ? 'open' : ''} bg-[#1a0505] border-r border-[#F6DD26]/20 w-80 fixed h-full z-40 transition-transform duration-300 flex flex-col lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-white/10 shrink-0">
                    <div className="flex flex-col items-center mb-4">
                        <img src="/assets/banner.png" alt="University of Kelaniya" className="w-44 h-auto object-contain mb-4" />
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-white mb-1">Dean Portal</h1>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Faculty management panel</p>
                        </div>
                    </div>
                </div>

                <nav className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="menu-section">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-4">Executive Functions</p>
                        {[
                            { id: 'dashboard', label: 'Overview Metrics', icon: 'fa-tachometer-alt' },
                            { id: 'pending-approvals', label: 'Pending Approvals', icon: 'fa-file-signature', badge: pendingRequests.length },
                            { id: 'approved-reservations', label: 'Approved Archive', icon: 'fa-check-double' },
                            { id: 'faculty-overview', label: 'Faculty Overview', icon: 'fa-university' },
                            { id: 'departments', label: 'Department Management', icon: 'fa-building' },
                            { id: 'analytics', label: 'System Analytics', icon: 'fa-chart-line' },
                            { id: 'settings', label: 'Personal Settings', icon: 'fa-cog' },
                        ].map(item => (
                            <div
                                key={item.id}
                                className={`menu-item p-4 cursor-pointer rounded-xl border-l-4 transition-all duration-200 flex items-center space-x-3 ${activeSection === item.id ? 'active bg-white/10 border-yellow-400 text-yellow-400 font-bold shadow-lg' : 'border-transparent hover:bg-white/5 text-gray-300'}`}
                                onClick={() => handleSectionChange(item.id)}
                            >
                                <i className={`fas ${item.icon} text-lg w-6 text-center ${activeSection === item.id ? 'text-yellow-400' : 'text-gray-400'}`}></i>
                                <span className="flex-1 text-sm font-medium">{item.label}</span>
                                {item.badge > 0 && (
                                    <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">{item.badge}</span>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="pt-6 border-t border-white/10 mt-2 space-y-1">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-4">Your Reservations Portal</p>
                        {[
                            { id: 'new-booking', label: 'New Booking', icon: 'fa-calendar-plus', action: () => navigate('/reservation') },
                            { id: 'my-reservations', label: 'My Reservations', icon: 'fa-calendar-check' },
                            { id: 'user-pending-approvals', label: 'Pending My Bookings', icon: 'fa-clock' },
                            { id: 'past-bookings', label: 'Activity/History', icon: 'fa-history' }
                        ].map(item => (
                            <div key={item.id}
                                className={`menu-item p-3 px-4 cursor-pointer rounded-xl border-l-4 transition-all duration-200 flex items-center space-x-3 ${activeSection === item.id ? 'active bg-white/10 border-yellow-400 text-yellow-400 font-bold shadow-lg' : 'border-transparent hover:bg-white/5 text-gray-300'}`}
                                onClick={() => item.action ? item.action() : handleSectionChange(item.id)}>
                                <i className={`fas ${item.icon} text-lg w-6 text-center ${activeSection === item.id ? 'text-yellow-400' : 'text-gray-400'}`}></i>
                                <span className="flex-1 text-sm font-medium">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </nav>

                <div className="p-4 bg-[#400f0f] border-t border-[#F6DD26]/20 shrink-0">
                    <button onClick={logout} className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 flex items-center justify-center text-gray-200 font-medium">
                        <i className="fas fa-sign-out-alt mr-2"></i> Logout
                    </button>
                </div>
            </div>

            {/* Profile Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in relative block text-left">
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
                                    <button type="submit" className="px-5 py-2.5 rounded-lg bg-[#660000] border border-[#F6DD26] text-white font-medium hover:bg-[#800000] transition-colors shadow-md">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 lg:ml-80 flex flex-col min-h-screen relative">
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
                            <p className="font-bold text-sm uppercase">System Status</p>
                            <p className="text-sm font-medium">{notification.message}</p>
                        </div>
                        <button onClick={() => setNotification({ ...notification, show: false })} className="text-slate-400 hover:text-slate-600 transition">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                )}
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-8 py-5 sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 capitalize">
                                {activeSection === 'pending-approvals' ? 'Approvals Management' : activeSection.replace('-', ' ')}
                            </h1>
                            <p className="text-slate-500 text-sm">Faculty Management Panel</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button onClick={() => { setSettingsSubTab('notifications'); setActiveSection('settings'); }} className="p-2 text-slate-400 hover:text-slate-600 relative transition-colors cursor-pointer">
                                <i className="fas fa-bell text-xl"></i>
                                {notifications.filter(n => !n.is_read).length > 0 && (
                                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-[#1e293b]">{notifications.filter(n => !n.is_read).length}</span>
                                )}
                            </button>
                            <button onClick={toggleSidebar} className="lg:hidden p-2 text-gray-300 hover:text-white">
                                <i className="fas fa-bars text-xl"></i>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="p-8 flex-1 overflow-y-auto bg-slate-50">
                    {/* DASHBOARD VIEW */}
                    {activeSection === 'dashboard' && (
                        <div className="animation-fade-in space-y-8">
                            <div className="bg-gradient-to-r from-[#660000] to-[#800000] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <h1 className="text-3xl font-bold mb-2">Welcome Back, {user.name}!</h1>
                                    <p className="text-yellow-100 text-lg opacity-90">{user.faculty} | Dean</p>
                                </div>
                                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 skew-x-[-20deg]"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[
                                    { label: 'Pending Approvals', value: pendingRequests.length, icon: 'fa-clock', color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
                                    { label: 'Faculty Approvals', value: '28', icon: 'fa-check-circle', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
                                    { label: 'Departments', value: departmentStats.length, icon: 'fa-building', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
                                    { label: 'This Month', value: '32', icon: 'fa-calendar-alt', color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' }
                                ].map((stat, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:translate-y-[-2px] transition-transform duration-200">
                                        <div className="flex items-center">
                                            <div className={`p-4 rounded-full ${stat.bg} ${stat.border} border mr-4`}>
                                                <i className={`fas ${stat.icon} ${stat.color} text-xl`}></i>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                                                <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-bold text-slate-800">Pending Approvals</h3>
                                            <button onClick={() => handleSectionChange('pending-approvals')} className="text-[#660000] hover:text-[#800000] text-sm font-medium hover:underline">View All</button>
                                        </div>
                                        {pendingRequests.length === 0 ? (
                                            <div className="text-center py-10 text-gray-500">
                                                <p>No pending requests.</p>
                                            </div>
                                        ) : (
                                            <div>{pendingRequests.slice(0, 3).map(req => renderPendingRequestCard(req))}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                        <h3 className="text-xl font-bold text-slate-800 mb-4">Department Summary</h3>
                                        <div className="space-y-4">
                                            {departmentStats.map((dept, idx) => (
                                                <div key={idx} className="flex justify-between items-center pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                                                    <div>
                                                        <p className="font-medium text-slate-800">{dept.department}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">{dept.thisMonth} requests</p>
                                                    </div>
                                                    {dept.pending > 0 ? (
                                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full border border-yellow-200">{dept.pending} Pending</span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs"><i className="fas fa-check mr-1"></i>Clear</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* APPROVALS MODULE VIEW */}
                    {activeSection === 'pending-approvals' && (
                        <div className="animation-fade-in space-y-6">
                            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-6 text-white mb-6 shadow-lg flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">Approval Queue</h2>
                                    <p className="text-yellow-100 opacity-90">Review requests from Heads of Departments</p>
                                </div>
                                <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                                    <span className="font-bold text-2xl">{pendingRequests.length}</span> <span className="text-sm opacity-80">Pending</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800 text-lg">Detailed List</h3>
                                    <div className="flex gap-2">
                                        <button className="btn btn-secondary text-xs">History</button>
                                        <button className="btn btn-primary text-xs">Refresh</button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-gray-200 text-gray-500 text-sm uppercase">
                                                <th className="px-6 py-4 font-semibold">Requester</th>
                                                <th className="px-6 py-4 font-semibold">Trip Details</th>
                                                <th className="px-6 py-4 font-semibold">Verification</th>
                                                <th className="px-6 py-4 font-semibold text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm divide-y divide-gray-100">
                                            {pendingRequests.map(req => (
                                                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                                                {req.lecturer.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-800">{req.lecturer}</p>
                                                                <p className="text-xs text-gray-500">{req.department}</p>
                                                                <p className="text-[10px] text-gray-400">{req.id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-medium text-slate-800">{req.destination}</p>
                                                        <p className="text-xs text-gray-500 mt-1"><i className="fas fa-calendar-alt mr-1"></i> {req.date}</p>
                                                        <div className="mt-1 flex gap-2">
                                                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">{req.distance} km</span>
                                                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">{req.passengers} Pax</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {req.distance > 100 ? (
                                                                <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
                                                                    <i className="fas fa-exclamation-triangle mr-1"></i> High Distance
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                                                                    <i className="fas fa-check-circle mr-1"></i> Standard
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-green-600"><i className="fas fa-check mr-1"></i> HOD Approved</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={() => openReviewModal(req)} className="btn btn-primary px-4 py-2 text-xs">
                                                            Review
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {pendingRequests.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-8 text-gray-400">No pending approvals found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Approved Reservations Module */}
                    {activeSection === 'approved-reservations' && (
                        <div className="animation-fade-in card-gradient p-6 rounded-xl">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <i className="fas fa-check-double text-green-600"></i> Approved Reservations
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 text-slate-500">Department</th>
                                            <th className="px-4 py-3 text-slate-500">Destination</th>
                                            <th className="px-4 py-3 text-slate-500">Date</th>
                                            <th className="px-4 py-3 text-slate-500 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 italic text-slate-600">
                                        {reservations.filter(r => r.status === 'approved').map(req => (
                                            <tr key={req.reservation_id} className="hover:bg-slate-50 transition">
                                                <td className="px-4 py-3 text-slate-700 font-medium">{req.department || 'N/A'}</td>
                                                <td className="px-4 py-3">{req.destination}</td>
                                                <td className="px-4 py-3">{new Date(req.start_datetime).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">APPROVED</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {reservations.filter(r => r.status === 'approved').length === 0 && (
                                            <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-400">No approved reservations yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeSection === 'my-reservations' && (
                        <div className="animation-fade-in card-gradient p-6 rounded-xl">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <i className="fas fa-calendar-check text-blue-600"></i> My Reservations
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3">Destination</th>
                                            <th className="px-4 py-3">Date & Time</th>
                                            <th className="px-4 py-3 text-center">Status</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {reservations.filter(r => String(r.requester_id) === String(user.id)).map(req => (
                                            <tr key={req.reservation_id} className="hover:bg-slate-50 transition">
                                                <td className="px-4 py-3 font-medium text-slate-700">{req.destination}</td>
                                                <td className="px-4 py-3 text-slate-600">{new Date(req.start_datetime).toLocaleDateString()} at {new Date(req.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${req.status === 'approved' ? 'bg-green-100 text-green-700' : req.status === 'cancelled' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {req.status === 'approved' ? 'Confirmed' : req.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {(req.status === 'pending' || req.status.startsWith('pending_')) && (
                                                        <button
                                                            onClick={() => handleCancelRequest(req.reservation_id)}
                                                            className="text-red-500 hover:text-red-700 transition-colors p-2"
                                                            title="Cancel Request"
                                                        >
                                                            <i className="fas fa-trash-alt"></i>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeSection === 'user-pending-approvals' && (
                        <div className="animation-fade-in card-gradient p-6 rounded-xl">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <i className="fas fa-clock text-orange-600"></i> Pending My Bookings
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {reservations.filter(r => String(r.requester_id) === String(user.id) && (r.status === 'pending' || r.status.startsWith('pending_'))).map(req => (
                                    <div key={req.reservation_id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-slate-800">{req.destination}</h3>
                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-[10px] font-black uppercase whitespace-nowrap">
                                                {req.status === 'pending' ? 'Pending HOD' : req.status.replace('pending_', 'Pending ').toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end mt-2">
                                            <p className="text-xs text-slate-500">{new Date(req.start_datetime).toLocaleDateString()} at {new Date(req.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            <button
                                                onClick={() => handleCancelRequest(req.reservation_id)}
                                                className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1"
                                            >
                                                <i className="fas fa-times"></i> Cancel
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {reservations.filter(r => String(r.requester_id) === String(user.id) && (r.status === 'pending' || r.status.startsWith('pending_'))).length === 0 && (
                                    <p className="col-span-2 text-center text-slate-400 py-8 italic">No pending requests found.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeSection === 'past-bookings' && (
                        <div className="animation-fade-in card-gradient p-6 rounded-xl">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <i className="fas fa-history text-slate-600"></i> Past Bookings
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3">Destination</th>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {reservations.filter(r => String(r.requester_id) === String(user.id) && (r.status === 'completed' || r.status === 'rejected')).map(req => (
                                            <tr key={req.reservation_id} className="hover:bg-slate-50 transition">
                                                <td className="px-4 py-3 font-medium text-slate-700">{req.destination}</td>
                                                <td className="px-4 py-3 text-slate-600">{new Date(req.start_datetime).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${req.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                        {req.status.toUpperCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* FACULTY OVERVIEW SECTION */}
                    {activeSection === 'faculty-overview' && (
                        <div className="animation-fade-in space-y-8">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-slate-800">Faculty Overview</h2>
                                <button className="btn btn-secondary flex items-center gap-2">
                                    <i className="fas fa-download"></i> Export Faculty Report
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: 'Total KM Traveled', value: facultyStats.totalFleetUsage, icon: 'fa-route', color: 'text-blue-600' },
                                    { label: 'Active Trips', value: facultyStats.activeTrips, icon: 'fa-car-side', color: 'text-green-600' },
                                    { label: 'Pending HOD', value: '14', icon: 'fa-hourglass-start', color: 'text-orange-500' },
                                    { label: 'Monthly Spend', value: facultyStats.monthlyExpenditure, icon: 'fa-money-bill-wave', color: 'text-emerald-600' }
                                ].map((stat, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex items-center space-x-4">
                                            <div className="p-3 bg-slate-50 rounded-lg">
                                                <i className={`fas ${stat.icon} ${stat.color} text-xl`}></i>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                                                <p className="text-xl font-bold text-slate-800">{stat.value}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <i className="fas fa-chart-pie text-[#660000]"></i> Departmental Trip Distribution
                                </h3>
                                <div className="h-80">
                                    <Bar
                                        data={deptDistributionData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: false } },
                                            scales: { y: { beginAtZero: true } }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DEPARTMENTS SECTION */}
                    {activeSection === 'departments' && (
                        <div className="animation-fade-in space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-slate-800">Department Management</h2>
                                <button className="btn btn-primary flex items-center gap-2">
                                    <i className="fas fa-plus"></i> Add Unit
                                </button>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-gray-200">
                                        <tr className="text-slate-500 uppercase">
                                            <th className="px-6 py-4 font-bold">Department Name</th>
                                            <th className="px-6 py-4 font-bold">Head of Dept</th>
                                            <th className="px-6 py-4 font-bold">Staff Count</th>
                                            <th className="px-6 py-4 font-bold">Usage Rate</th>
                                            <th className="px-6 py-4 font-bold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {departments.map((dept) => (
                                            <tr key={dept.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-semibold text-slate-800">{dept.name}</td>
                                                <td className="px-6 py-4 text-slate-600">{dept.head}</td>
                                                <td className="px-6 py-4 text-slate-600">{dept.staffCount}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                            <div
                                                                className="bg-[#660000] h-full"
                                                                style={{ width: `${dept.usageRate}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="font-bold text-slate-700">{dept.usageRate}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-blue-600 hover:text-blue-800 font-medium mr-3">Edit</button>
                                                    <button className="text-slate-400 hover:text-red-600"><i className="fas fa-trash"></i></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ANALYTICS SECTION */}
                    {activeSection === 'analytics' && (
                        <div className="animation-fade-in space-y-8">
                            <h2 className="text-2xl font-bold text-slate-800">Faculty Analytics</h2>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800 mb-6">Trip Frequency Trend</h3>
                                    <div className="h-64">
                                        <Line data={monthlyUsageData} options={{ responsive: true, maintainAspectRatio: false }} />
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800 mb-6">Trip Outcome Distribution</h3>
                                    <div className="h-64 flex justify-center">
                                        <Doughnut data={tripStatusData} options={{ responsive: true, maintainAspectRatio: false }} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Key Performance Indicators</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-emerald-600">92%</p>
                                        <p className="text-sm text-slate-500 font-medium mt-1">Approval Efficiency</p>
                                    </div>
                                    <div className="text-center border-x border-slate-100">
                                        <p className="text-3xl font-bold text-blue-600">4.8h</p>
                                        <p className="text-sm text-slate-500 font-medium mt-1">Avg Response Time</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-[#660000]">215</p>
                                        <p className="text-sm text-slate-500 font-medium mt-1">Total Trips Managed</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Settings Rendering */}
                    {activeSection === 'settings' && (
                        <SettingsTab
                            currentUser={user}
                            setShowProfileModal={setShowProfileModal}
                            showNotification={showNotification}
                            defaultSubTab={settingsSubTab}
                            notifications={notifications}
                            markNotificationAsRead={markNotificationAsRead}
                            markAllNotificationsAsRead={markAllNotificationsAsRead}
                        />
                    )}

                    {/* Approved Reservations Section */}
                    {activeSection === 'approved-reservations' && (
                        <div className="animation-fade-in space-y-6">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                                    <i className="fas fa-check-double text-xl"></i>
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Approved Today</h2>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-[#800000] text-white uppercase font-semibold">
                                        <tr>
                                            <th className="px-6 py-4 font-bold border-r border-white/10">Destination</th>
                                            <th className="px-6 py-4 font-bold border-r border-white/10">Date</th>
                                            <th className="px-6 py-4 font-bold text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 italic text-slate-600">
                                        {reservations.filter(r => r.status === 'approved').map(req => (
                                            <tr key={req.reservation_id} className="hover:bg-slate-50 transition border-b border-gray-100">
                                                <td className="px-6 py-4 font-semibold text-slate-700">{req.destination}</td>
                                                <td className="px-6 py-4 text-slate-600">{new Date(req.start_datetime).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-[10px] font-black uppercase">Approved</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {reservations.filter(r => r.status === 'approved').length === 0 && (
                                            <tr><td colSpan="3" className="px-6 py-10 text-center text-slate-400">No approved reservations found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* My Reservations Section */}
                    {activeSection === 'my-reservations' && (
                        <div className="animation-fade-in space-y-6">
                            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">My Reservations</h2>
                                    <p className="text-sm text-slate-500">Upcoming approved trips for your personal duties.</p>
                                </div>
                                <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                                    <i className="fas fa-calendar-check text-xl"></i>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myActiveBookings.map(req => (
                                    <div key={req.reservation_id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Ref: REQ-{req.reservation_id}</span>
                                                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">APPROVED</span>
                                            </div>
                                            <h3 className="font-bold text-lg leading-tight mb-1">{req.destination}</h3>
                                            <div className="text-xs text-white/80 flex items-center gap-2">
                                                <i className="fas fa-clock"></i> {new Date(req.start_datetime).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="p-5 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <i className="fas fa-car-side text-slate-400"></i>
                                                <span className="text-sm font-bold text-slate-700">{req.model || 'Processing Assignment...'}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <i className="fas fa-user-tie text-slate-400"></i>
                                                <span className="text-sm font-bold text-slate-700">{req.driver_name || 'TBA'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {myActiveBookings.length === 0 && (
                                    <div className="col-span-full py-20 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 italic">
                                        No upcoming approved personal reservations found.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Pending My Bookings Section */}
                    {activeSection === 'user-pending-approvals' && (
                        <div className="animation-fade-in space-y-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden transform hover:shadow-lg transition-all duration-300">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                                        <i className="fas fa-clock text-xl"></i>
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800 font-inter">Pending My Bookings</h2>
                                </div>
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase font-inter tracking-widest">Reference</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase font-inter tracking-widest">Destination</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase font-inter tracking-widest">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 italic">
                                        {myPendingBookings.map(req => (
                                            <tr key={req.reservation_id}>
                                                <td className="px-6 py-4 font-bold text-slate-800">REQ-{req.reservation_id}</td>
                                                <td className="px-6 py-4 text-slate-600 font-medium">{req.destination}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-tighter border border-amber-100 italic font-inter">PENDING AUTH</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {myPendingBookings.length === 0 && (
                                            <tr><td colSpan="3" className="px-6 py-12 text-center text-slate-400 italic shadow-inner">No pending personal bookings.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Past Bookings Section */}
                    {activeSection === 'past-bookings' && (
                        <div className="animation-fade-in space-y-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <h2 className="text-2xl font-bold text-slate-800 mb-6 font-display flex items-center gap-3 font-inter">
                                    <i className="fas fa-history text-slate-400 font-inter"></i> My Trip History Archive
                                </h2>
                                <table className="w-full text-left font-inter">
                                    <thead className="bg-[#1f2937] text-white rounded-lg">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest font-inter">Date</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest font-inter">Destination</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right font-inter">Fulfillment</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-inter">
                                        {myPastBookings.map(req => (
                                            <tr key={req.reservation_id} className="hover:bg-slate-50 transition border-b border-gray-100 font-inter">
                                                <td className="px-6 py-4 text-slate-600 font-black font-inter">{new Date(req.start_datetime).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 font-bold text-slate-800 font-inter">{req.destination}</td>
                                                <td className="px-6 py-4 text-right font-inter">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${req.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                        {req.status === 'completed' ? 'TRAVELLED' : 'REJECTED'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {myPastBookings.length === 0 && (
                                            <tr><td colSpan="3" className="px-6 py-12 text-center text-slate-400 italic font-inter shadow-inner">No historical data available.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Fallback for Settings or others */}
                    {!['dashboard', 'pending-approvals', 'faculty-overview', 'departments', 'analytics', 'settings', 'my-reservations', 'user-pending-approvals', 'past-bookings'].includes(activeSection) && (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
                            <i className="fas fa-tools text-6xl text-slate-200 mb-6"></i>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2 capitalize">{activeSection.replace('-', ' ')}</h2>
                            <p className="text-slate-500 max-w-md text-center">Implementation pending.</p>
                            <button onClick={() => setActiveSection('dashboard')} className="mt-6 text-[#660000] hover:underline font-medium">
                                Back to Dashboard
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {showModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animation-fade-in">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-[#660000] p-4 flex justify-between items-center shrink-0">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <i className="fas fa-file-signature"></i> Review Request {selectedRequest.id}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white transition">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            {/* Warning Banner for Long Distance */}
                            {selectedRequest.distance > 100 && (
                                <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded text-sm text-orange-800 flex items-start gap-3">
                                    <i className="fas fa-exclamation-triangle mt-0.5"></i>
                                    <div>
                                        <p className="font-bold">Forwarding Required</p>
                                        <p className="opacity-90">Distance &gt; 100km. Your approval will forward this to the Registrar.</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-slate-500 text-xs uppercase font-bold">Lecturer</p>
                                    <p className="text-slate-800 font-medium text-base">{selectedRequest.lecturer}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase font-bold">Department</p>
                                    <p className="text-slate-800 font-medium">{selectedRequest.department}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded border border-slate-200 grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                <div>
                                    <p className="text-gray-400 text-xs">Destination</p>
                                    <p className="font-semibold text-slate-700">{selectedRequest.destination}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs">Distance</p>
                                    <p className="font-semibold text-slate-700">{selectedRequest.distance} km</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-gray-400 text-xs">Date & Time</p>
                                    <p className="font-semibold text-slate-700">{selectedRequest.date} at {selectedRequest.time}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-gray-400 text-xs">Purpose</p>
                                    <p className="italic text-slate-600">"{selectedRequest.purpose}"</p>
                                </div>
                                {selectedRequest.remarks && (
                                    <div className="col-span-2">
                                        <p className="text-gray-400 text-xs">Remarks</p>
                                        <p className="text-slate-700 bg-gray-50 p-2 rounded border-l-2 border-gray-300">{selectedRequest.remarks}</p>
                                    </div>
                                )}
                                {selectedRequest.emergency_contact && (
                                    <div className="col-span-2">
                                        <p className="text-gray-400 text-xs">Emergency Contact</p>
                                        <p className="text-slate-700 bg-gray-50 p-2 rounded border-l-2 border-gray-300">{selectedRequest.emergency_contact}</p>
                                    </div>
                                )}
                                {selectedRequest.attachment_url && (
                                    <div className="col-span-2 mt-2">
                                        <p className="text-gray-400 text-xs">Attachment</p>
                                        <a href={`http://localhost:5000${selectedRequest.attachment_url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline flex items-center gap-2">
                                            <i className="fas fa-paperclip"></i> View Attached Document
                                        </a>
                                    </div>
                                )}
                                <div className="col-span-2 bg-green-50 p-2 rounded border border-green-100">
                                    <p className="text-xs text-green-700 font-bold">HOD Comments:</p>
                                    <p className="text-xs text-green-800">"{selectedRequest.hodComments}"</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-700 text-sm font-medium mb-2">Dean Comments (Optional)</label>
                                <textarea
                                    className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-800 focus:outline-none focus:border-[#660000] focus:ring-1 focus:ring-[#660000] transition-colors"
                                    rows="2"
                                    placeholder="Add notes for Registrar or Rejection reason..."
                                    value={deanComment}
                                    onChange={(e) => setDeanComment(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => processApproval('approved')} className="flex-1 btn btn-success">
                                    <i className={`${selectedRequest.distance > 100 ? 'fas fa-share' : 'fas fa-check'} mr-1`}></i>
                                    {selectedRequest.distance > 100 ? 'Approve & Forward' : 'Approve'}
                                </button>
                                <button onClick={() => processApproval('rejected')} className="flex-1 btn btn-danger">
                                    <i className="fas fa-times mr-1"></i> Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Cancel Confirmation Modal - Modern UI */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animation-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all border border-slate-200">
                        <div className="p-8 text-center">
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
    );
};

export default DeanDashboard;
