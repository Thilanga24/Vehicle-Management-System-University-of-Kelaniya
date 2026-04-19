import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './SARDashboard.css';
import SettingsTab from './SettingsTab';

ChartJS.register(...registerables);

const ManagementAssistantDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [settingsSubTab, setSettingsSubTab] = useState('security');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('currentUser') || '{"name": "Assistant", "role": "management_assistant"}'));

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


    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });

    // Reports Specific State
    const [reportCategory, setReportCategory] = useState('fuel');
    const [vehicles, setVehicles] = useState([]);
    const [reportFilters, setReportFilters] = useState({
        vehicleId: 'all',
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [reportStats, setReportStats] = useState({ total_cost: 0, total_units: 0, total_records: 0 });

    // Settings Specific State
    const [profile, setProfile] = useState({
        name: user.name,
        email: user.email || 'assistant@uok.lk',
        phone: user.phone || '+94 11 234 5678',
        dept: 'Main Administration'
    });
    const [settings, setSettings] = useState({
        emailNotifications: true,
        smsNotifications: false,
        autoApproval: true
    });

    const showNotification = (message, type = 'info') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'info' }), 4000);
    };

    const handleSaveProfile = () => {
        showNotification('Profile updated successfully!', 'success');
    };

    const handleSaveSettings = () => {
        showNotification('Preferences saved successfully!', 'success');
    };

    const fetchReservations = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/reservations');
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
        const interval = setInterval(fetchReservations, 30000);
        return () => clearInterval(interval);
    }, []);

    // Filtered lists for personal portal
    const myPendingBookings = Array.isArray(reservations) ? reservations.filter(r => 
        String(r.requester_id) === String(user.id) && 
        (r.status === 'pending' || r.status.startsWith('pending_'))
    ) : [];

    const myPastBookings = Array.isArray(reservations) ? reservations.filter(r => 
        String(r.requester_id) === String(user.id) && 
        (r.status === 'completed' || r.status === 'rejected' || r.status === 'cancelled')
    ) : [];

    const myActiveBookings = Array.isArray(reservations) ? reservations.filter(r => 
        String(r.requester_id) === String(user.id) && 
        r.status === 'approved'
    ) : [];

    const fetchVehicles = async () => {
        try {
            const response = await fetch('/api/vehicles');
            if (response.ok) setVehicles(await response.json());
        } catch (error) { console.error('Error fetching vehicles:', error); }
    };

    const fetchReportData = async () => {
        try {
            const { vehicleId, startDate, endDate } = reportFilters;
            const endpoint = reportCategory === 'fuel' ? 'fuel/report' : 'maintenance/report';
            const response = await fetch(`/api/${endpoint}?vehicle_id=${vehicleId}&startDate=${startDate}&endDate=${endDate}`);
            if (response.ok) {
                const data = await response.json();
                setReportStats({
                    total_cost: data.total_cost || 0,
                    total_units: data.total_liters || 0,
                    total_records: data.total_records || 0
                });
            }
        } catch (error) { console.error('Error fetching reports:', error); }
    };

    useEffect(() => {
        if (activeTab === 'reports') {
            fetchVehicles();
            fetchReportData();
        }
    }, [activeTab, reportCategory, reportFilters]);

    const handleDownloadPDF = async () => {
        try {
            const { vehicleId, startDate, endDate } = reportFilters;
            const endpoint = reportCategory === 'fuel' ? 'api/fuel' : 'api/maintenance';
            const response = await fetch(`/${endpoint}`);
            if (!response.ok) throw new Error('Failed to fetch records');

            let allRecords = await response.json();
            const filteredRecords = allRecords.filter(rec => {
                const date = new Date(rec.date || rec.service_date);
                return date >= new Date(startDate) && date <= new Date(endDate) && (vehicleId === 'all' || rec.vehicle_id == vehicleId);
            });

            const doc = new jsPDF();
            doc.setFontSize(22); doc.setTextColor(128, 0, 0);
            doc.text("UNIVERSITY OF KELANIYA", 105, 15, { align: "center" });
            doc.setFontSize(16); doc.setTextColor(51, 65, 85);
            doc.text(`${reportCategory.charAt(0).toUpperCase() + reportCategory.slice(1)} Analytics Report`, 105, 25, { align: "center" });
            doc.setDrawColor(128, 0, 0); doc.line(20, 30, 190, 30);

            doc.setFontSize(10); doc.setTextColor(100);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 40);
            doc.text(`Period: ${startDate} to ${endDate}`, 20, 47);

            const tableData = reportCategory === 'fuel'
                ? filteredRecords.map(r => [new Date(r.date).toLocaleDateString(), r.registration_number, `${r.liters}L`, `Rs.${parseFloat(r.cost).toLocaleString()}`])
                : filteredRecords.map(r => [new Date(r.service_date).toLocaleDateString(), r.registration_number, r.service_type, `Rs.${parseFloat(r.cost).toLocaleString()}`]);

            autoTable(doc, {
                startY: 55,
                head: [reportCategory === 'fuel' ? ['Date', 'Vehicle', 'Liters', 'Cost'] : ['Date', 'Vehicle', 'Type', 'Cost']],
                body: tableData,
                headStyles: { fillColor: [128, 0, 0] }
            });

            doc.save(`${reportCategory}_report_${startDate}.pdf`);
            showNotification('PDF Report Generated Successfully', 'success');
        } catch (error) { showNotification('Failed to generate PDF', 'error'); }
    };

    const approvedReservations = Array.isArray(reservations) ? reservations.filter(r => r.status === 'approved') : [];
    const pendingRequestsCount = Array.isArray(reservations) ? reservations.filter(r => r.status === 'pending_hod' || r.status === 'pending_dean' || r.status === 'pending_sar' || r.status === 'pending_registrar').length : 0;

    const stats = [
        { label: 'Total Fleet', value: 24, change: 'Fleet Overview', sub: 'University vehicles', icon: 'fa-car', color: 'blue' },
        { label: 'Active Trips', value: approvedReservations.length, change: 'Approved', sub: 'Confirmed trips', icon: 'fa-users', color: 'green' },
        { label: 'Pending Requests', value: pendingRequestsCount, change: 'System Wide', sub: 'Needs Review', icon: 'fa-clock', color: 'yellow' },
    ];

    useEffect(() => {
        const storedUser = sessionStorage.getItem('userName');
        if (storedUser) {
            setUser(prev => ({ ...prev, name: storedUser }));
        }
    }, []);

    const logout = () => {
        sessionStorage.clear();
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="sar-dashboard-container">
            {/* Sidebar Navigation */}
            <div className={`sidebar bg-[#1a0505] w-80 fixed h-full z-40 transition-transform duration-300 flex flex-col border-r border-[#F6DD26]/20 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-6 border-b border-white/10 shrink-0">
                    <div className="flex flex-col items-center mb-4">
                        <img src="/assets/banner.png" alt="University of Kelaniya" className="w-44 h-auto object-contain mb-4" />
                        <div className="text-center">
                            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Assistant Portal</h1>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Operational Support Portal</p>
                        </div>
                    </div>
                </div>

                <nav className="p-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="menu-section">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-4">Daily Operations</p>
                        {[
                            { id: 'dashboard', label: 'Home Dashboard', icon: 'fa-tachometer-alt' },
                            { id: 'approved-reservations', label: 'Confirmed Today', icon: 'fa-check-double' },
                            { label: 'Fleet Registry', icon: 'fa-car', action: () => navigate('/vehicles') },
                            { label: 'Driver Schedule', icon: 'fa-users', action: () => navigate('/drivers') },
                            { label: 'Maintenance Dept', icon: 'fa-tools', action: () => navigate('/maintenance') },
                            { id: 'reports', label: 'Operational Reports', icon: 'fa-chart-bar' },
                        ].map(item => (
                            <div key={item.id}
                                className={`menu-item p-4 cursor-pointer flex items-center space-x-3 rounded-xl transition-all duration-200 border-l-4 ${activeTab === item.id ? 'active bg-white/10 border-yellow-400 text-yellow-400 font-bold shadow-lg' : 'border-transparent text-gray-300 hover:bg-white/5 hover:text-white'}`}
                                onClick={() => item.action ? item.action() : setActiveTab(item.id)}>
                                <i className={`fas ${item.icon} text-lg w-6 text-center ${activeTab === item.id ? 'text-yellow-400' : 'text-gray-400'}`}></i>
                                <span className="flex-1 text-sm font-medium">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-6 border-t border-white/10 mt-2 space-y-1">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-4">Your Reservations Portal</p>
                        {[
                            { id: 'new-booking', label: 'New Booking', icon: 'fa-calendar-plus', action: () => navigate('/reservation') },
                            { id: 'my-reservations', label: 'My Reservations', icon: 'fa-calendar-check' },
                            { id: 'user-pending-approvals', label: 'Pending My Bookings', icon: 'fa-clock' },
                            { id: 'past-bookings', label: 'Personal History', icon: 'fa-history' }
                        ].map(item => (
                            <div key={item.id}
                                className={`menu-item p-3 px-4 cursor-pointer flex items-center space-x-3 rounded-xl transition-all duration-200 border-l-4 ${activeTab === item.id ? 'active bg-white/10 border-yellow-400 text-yellow-400 font-bold shadow-lg' : 'border-transparent text-gray-300 hover:bg-white/5 hover:text-white'}`}
                                onClick={() => item.action ? item.action() : setActiveTab(item.id)}>
                                <i className={`fas ${item.icon} text-lg w-6 text-center ${activeTab === item.id ? 'text-yellow-400' : 'text-gray-400'}`}></i>
                                <span className="flex-1 text-sm font-medium">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className={`menu-item p-4 cursor-pointer flex items-center space-x-3 rounded-xl transition-all duration-200 border-l-4 mt-2 ${activeTab === 'settings' ? 'active bg-white/10 border-yellow-400 text-yellow-400 font-bold shadow-lg' : 'border-transparent text-gray-300 hover:bg-white/5 hover:text-white'}`} onClick={() => setActiveTab('settings')}>
                        <i className={`fas fa-cog text-lg w-6 text-center ${activeTab === 'settings' ? 'text-yellow-400' : 'text-gray-400'}`}></i>
                        <span className="flex-1 text-sm font-medium">System Settings</span>
                    </div>
                </nav>

                <div className="p-4 bg-black/10 border-t border-white/5 shrink-0">
                    <button onClick={logout} className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-lg transition duration-200 text-white flex items-center justify-center border border-white/10 font-bold">
                        <i className="fas fa-sign-out-alt mr-2"></i>Logout
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
                                                onClick={() => setEditProfileForm({...editProfileForm, profilePic: ''})} 
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
                                        onChange={(e) => setEditProfileForm({...editProfileForm, name: e.target.value})} 
                                        required
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
            <div className="flex-1 lg:ml-80 flex flex-col min-h-screen bg-slate-50 text-slate-800 p-8 relative">

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
                        <button onClick={() => setNotification({ ...notification, show: false })} className="text-gray-400 hover:text-gray-600 transition">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                )}
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            {activeTab === 'dashboard' ? `Good Morning, ${user?.name || 'User'} 👋` :
                                activeTab ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ') : 'Dashboard'}
                        </h1>
                        <p className="text-gray-400">
                            {activeTab === 'dashboard' ? 'Welcome to your management dashboard view' : 'Manage system information'}
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <input type="text" placeholder="Search..."
                                className="bg-white border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:border-red-800 text-slate-700 w-64 shadow-sm" />
                            <i className="fas fa-search absolute right-3 top-3 text-gray-400"></i>
                        </div>
                        <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-200 p-1 pr-4 rounded-full transition-colors" onClick={() => {
                            setEditProfileForm({
                                name: user?.name || '',
                                department: user?.department || user?.faculty || '',
                                profilePic: user?.profilePic || ''
                            });
                            setShowProfileModal(true);
                        }}>
                            <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm overflow-hidden shrink-0">
                                {user?.profilePic ? (
                                    <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-sm font-medium">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                                )}
                            </div>
                            <span className="text-sm font-bold text-slate-700 hidden md:block">{user?.name}</span>
                        </div>
                    </div>
                </div>

                {/* Dashboard View */}
                {activeTab === 'dashboard' && (
                    <div className="animation-fade-in space-y-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {stats.map((stat, idx) => (
                                <div key={idx} className="sar-stat-card">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`sar-icon-bg ${stat.color}`}>
                                            <i className={`fas ${stat.icon} text-xl`}></i>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold">{stat.value}</p>
                                            <p className="text-xs text-gray-400">{stat.change}</p>
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-400 mb-1">{stat.label}</h3>
                                    <p className={`text-sm status-${stat.color === 'yellow' ? 'pending' : stat.color === 'blue' ? 'info' : stat.color === 'green' ? 'approved' : 'rejected'}`}>
                                        {stat.color === 'yellow' ? '⚠️' : stat.color === 'blue' ? '🚙' : stat.color === 'green' ? '👨‍💼' : '⚠️'} {stat.sub}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Recent Approvals & Fleet */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="sar-card-gradient p-6 rounded-xl">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <i className="fas fa-check-circle text-green-500"></i> Recently Approved View
                                    </h2>
                                    <button className="sar-btn sar-btn-primary" onClick={() => setActiveTab('approved-reservations')}>View All</button>
                                </div>
                                <div className="space-y-4">
                                    {approvedReservations.slice(0, 3).map((req) => (
                                        <div key={req.reservation_id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-medium text-slate-800">{req.first_name || 'Staff'}</h3>
                                                    <p className="text-sm text-gray-400">{req.destination} • {req.distance_km}km</p>
                                                    <p className="text-xs text-gray-500 mt-1">Start: {new Date(req.start_datetime).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {approvedReservations.length === 0 && (
                                        <p className="text-center text-gray-400 py-4">No approved reservations.</p>
                                    )}
                                </div>
                            </div>

                            {/* Fleet Overview */}
                            <div className="sar-card-gradient p-6 rounded-xl">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <i className="fas fa-car text-blue-500"></i> Fleet Management Overview
                                </h2>
                                <div className="mb-6 space-y-3">
                                    <h3 className="font-medium mb-3 text-gray-300">Vehicle Status Overview</h3>
                                    {[
                                        { label: 'Available', count: 18, color: 'bg-green-500', text: 'text-green-400' },
                                        { label: 'In Use', count: 4, color: 'bg-red-500', text: 'text-red-400' },
                                        { label: 'Maintenance', count: 2, color: 'bg-yellow-500', text: 'text-yellow-400' }
                                    ].map((s, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="flex items-center">
                                                <div className={`w-3 h-3 ${s.color} rounded-full mr-3`}></div>
                                                <span className="text-sm">{s.label}</span>
                                            </div>
                                            <span className={`text-lg font-bold ${s.text}`}>{s.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Approved Reservations Module */}
                {activeTab === 'approved-reservations' && (
                    <div className="animation-fade-in space-y-6">
                        <div className="sar-card-gradient p-6 rounded-xl">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <i className="fas fa-check-double text-green-500"></i> Approved Reservations Overview
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-gray-500 text-sm uppercase">
                                            <th className="px-4 py-3 font-semibold">Request Details</th>
                                            <th className="px-4 py-3 font-semibold">Route & Vehicle</th>
                                            <th className="px-4 py-3 font-semibold">Driver Details</th>
                                            <th className="px-4 py-3 font-semibold">Date & Time</th>
                                            <th className="px-4 py-3 font-semibold text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-gray-100">
                                        {approvedReservations.map(req => (
                                            <tr key={req.reservation_id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                                                            {(req.first_name || 'S').charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800">{req.first_name} {req.last_name}</p>
                                                            <p className="text-xs text-gray-500">{req.department || 'N/A'} • {req.reservation_id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-slate-800 font-medium"><i className="fas fa-map-marker-alt text-slate-400 mr-1"></i> {req.destination}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{req.model || 'Vehicle Pending'} {req.registration_number ? `(${req.registration_number})` : ''}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {req.driver_first_name ? (
                                                        <>
                                                            <p className="font-medium text-slate-800">{req.driver_first_name} {req.driver_last_name}</p>
                                                            <p className="text-xs text-slate-500 mt-1"><i className="fas fa-phone mr-1"></i> {req.driver_phone}</p>
                                                        </>
                                                    ) : (
                                                        <p className="text-sm text-yellow-600"><i className="fas fa-clock mr-1"></i> Pending Assignment</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-slate-800">{new Date(req.start_datetime).toLocaleDateString()}</p>
                                                    <p className="text-xs text-gray-500">{new Date(req.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                        <i className="fas fa-check-circle"></i> Approved
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {approvedReservations.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="text-center py-10 text-gray-400">No approved reservations found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reports Module */}
                {activeTab === 'reports' && (
                    <div className="animation-fade-in space-y-6">
                        {/* Report Controls */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Category</label>
                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                        <button
                                            onClick={() => setReportCategory('fuel')}
                                            className={`flex-1 py-2 text-xs font-bold rounded-md transition ${reportCategory === 'fuel' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                            <i className="fas fa-gas-pump mr-2"></i> Fuel
                                        </button>
                                        <button
                                            onClick={() => setReportCategory('maintenance')}
                                            className={`flex-1 py-2 text-xs font-bold rounded-md transition ${reportCategory === 'maintenance' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                            <i className="fas fa-tools mr-2"></i> Maintenance
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Scope</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-red-800/20"
                                        value={reportFilters.vehicleId}
                                        onChange={(e) => setReportFilters({ ...reportFilters, vehicleId: e.target.value })}>
                                        <option value="all">Entire Fleet</option>
                                        {vehicles.map(v => <option key={v.vehicle_id} value={v.vehicle_id}>{v.registration_number}</option>)}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">From</label>
                                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" value={reportFilters.startDate} onChange={(e) => setReportFilters({ ...reportFilters, startDate: e.target.value })} />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">To</label>
                                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" value={reportFilters.endDate} onChange={(e) => setReportFilters({ ...reportFilters, endDate: e.target.value })} />
                                </div>
                                <button
                                    onClick={handleDownloadPDF}
                                    className="bg-[#800000] text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-[#660000] transition shadow-lg flex items-center gap-2">
                                    <i className="fas fa-file-pdf"></i> Export PDF
                                </button>
                            </div>
                        </div>

                        {/* Summary Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className={`p-6 rounded-2xl border-l-4 shadow-sm ${reportCategory === 'fuel' ? 'bg-emerald-50 border-emerald-500' : 'bg-red-50 border-red-500'}`}>
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Expenditure</p>
                                <h4 className="text-3xl font-black text-slate-800">Rs. {parseFloat(reportStats.total_cost).toLocaleString()}</h4>
                                <p className="text-xs opacity-60 mt-1 italic">Aggregated financial value</p>
                            </div>
                            {reportCategory === 'fuel' ? (
                                <div className="p-6 bg-blue-50 rounded-2xl border-l-4 border-blue-500 shadow-sm">
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Consumption</p>
                                    <h4 className="text-3xl font-black text-slate-800">{reportStats.total_units} Liters</h4>
                                    <p className="text-xs opacity-60 mt-1 italic">Total fuel volume refill</p>
                                </div>
                            ) : (
                                <div className="p-6 bg-amber-50 rounded-2xl border-l-4 border-amber-500 shadow-sm">
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Tasks Executed</p>
                                    <h4 className="text-3xl font-black text-slate-800">{reportStats.total_records} Records</h4>
                                    <p className="text-xs opacity-60 mt-1 italic">Maintenance actions logged</p>
                                </div>
                            )}
                            <div className="p-6 bg-slate-100 rounded-2xl border-l-4 border-slate-800 shadow-sm">
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Efficiency Index</p>
                                <h4 className="text-3xl font-black text-slate-800">92%</h4>
                                <p className="text-xs opacity-60 mt-1 italic">Fleet health threshold</p>
                            </div>
                        </div>

                        {/* Chart Area */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2 uppercase tracking-tight">
                                <i className={`fas ${reportCategory === 'fuel' ? 'fa-chart-area text-emerald-500' : 'fa-chart-bar text-red-500'}`}></i>
                                {reportCategory} Distribution & Analytics
                            </h3>
                            <div className="h-80">
                                <Line
                                    data={{
                                        labels: ['Day 1', 'Day 5', 'Day 10', 'Day 15', 'Day 20', 'Day 25', 'Day 30'],
                                        datasets: [{
                                            label: 'Cost Trends (LKR)',
                                            data: [12000, 19000, 15000, 22000, 18000, 25000, reportStats.total_cost / 10], // Mock trend line
                                            borderColor: reportCategory === 'fuel' ? '#10b981' : '#ef4444',
                                            backgroundColor: reportCategory === 'fuel' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            fill: true,
                                            tension: 0.4
                                        }]
                                    }}
                                    options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* My Reservations Section */}
                {activeTab === 'my-reservations' && (
                    <div className="animation-fade-in space-y-6">
                        <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">My Personal Trips</h2>
                                <p className="text-sm text-slate-500">Your upcoming approved university travel schedules.</p>
                            </div>
                            <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 italic">
                                <i className="fas fa-calendar-check text-xl"></i>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myActiveBookings.map(req => (
                                <div key={req.reservation_id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Reference: REQ-{req.reservation_id}</span>
                                            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">CONFIRMED</span>
                                        </div>
                                        <h3 className="font-bold text-lg leading-tight mb-1">{req.destination}</h3>
                                        <div className="text-xs text-white/80 flex items-center gap-2">
                                            <i className="fas fa-clock"></i> {new Date(req.start_datetime).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <div className="flex items-center gap-3 font-inter">
                                            <i className="fas fa-car-side text-slate-400"></i>
                                            <span className="text-sm font-bold text-slate-700">{req.model || 'Dispatch Pending...'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 italic">
                                            <i className="fas fa-user-tie text-slate-400"></i>
                                            <span className="text-sm font-bold text-slate-700">{req.driver_name || 'TBA'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {myActiveBookings.length === 0 && (
                                <div className="col-span-full py-20 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 italic shadow-inner">
                                    You have no confirmed personal reservations scheduled.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Pending My Bookings Section */}
                {activeTab === 'user-pending-approvals' && (
                    <div className="animation-fade-in space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden transform transition-all duration-300">
                             <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100 shadow-sm">
                                    <i className="fas fa-clock text-xl"></i>
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800 font-inter tracking-tighter">Personal Submission Queue</h2>
                             </div>
                             <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase font-inter tracking-widest border-b border-slate-100">Reference ID</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase font-inter tracking-widest border-b border-slate-100">Destination</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase font-inter tracking-widest border-b border-slate-100">Processing Stage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 italic">
                                    {myPendingBookings.map(req => (
                                        <tr key={req.reservation_id}>
                                            <td className="px-6 py-4 font-bold text-slate-800">REQ-{req.reservation_id}</td>
                                            <td className="px-6 py-4 text-slate-600 font-medium font-inter">{req.destination}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-tighter border border-amber-100 shadow-sm italic font-inter tracking-widest">UNDER REVIEW</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {myPendingBookings.length === 0 && (
                                        <tr><td colSpan="3" className="px-6 py-12 text-center text-slate-400 italic shadow-inner">No pending submissions found in your account.</td></tr>
                                    )}
                                </tbody>
                             </table>
                        </div>
                    </div>
                )}

                {/* Past Bookings Section */}
                {activeTab === 'past-bookings' && (
                    <div className="animation-fade-in space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6 font-display flex items-center gap-3 font-inter">
                                <i className="fas fa-history text-slate-400"></i> My Personal Travel Archive
                            </h2>
                            <table className="w-full text-left font-inter">
                                <thead className="bg-[#1f2937] text-white rounded-lg">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest font-inter">Date</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest font-inter">Destination Route</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right font-inter">Fulfillment Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-inter">
                                    {myPastBookings.map(req => (
                                        <tr key={req.reservation_id} className="hover:bg-slate-50 transition border-b border-gray-100 font-inter">
                                            <td className="px-6 py-4 text-slate-600 font-black font-inter tracking-tighter">{new Date(req.start_datetime).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 font-bold text-slate-800 font-inter">{req.destination}</td>
                                            <td className="px-6 py-4 text-right font-inter">
                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${req.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                    {req.status === 'completed' ? 'SUCCESSFUL' : 'REJECTED'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {myPastBookings.length === 0 && (
                                        <tr><td colSpan="3" className="px-6 py-12 text-center text-slate-400 italic">No historical trip data available for this account.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Settings Module */}
                {activeTab === 'settings' && <SettingsTab currentUser={user} setShowProfileModal={setShowProfileModal} showNotification={showNotification} />}

                {/* Fallback for others */}
                {!['dashboard', 'approved-reservations', 'reports', 'settings', 'my-reservations', 'user-pending-approvals', 'past-bookings'].includes(activeTab) && (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-400 italic text-center">
                        <i className="fas fa-tools text-5xl mb-4"></i>
                        <h2 className="text-xl font-bold mb-1 capitalize tracking-widest">{activeTab.replace('-', ' ')}</h2>
                        <p>This module is currently within the active development cycle.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManagementAssistantDashboard;
