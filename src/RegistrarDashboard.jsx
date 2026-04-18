import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './SARDashboard.css';
import SettingsTab from './SettingsTab';

ChartJS.register(...registerables);

const RegistrarDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [settingsSubTab, setSettingsSubTab] = useState('security');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('currentUser') || '{"name": "Registrar", "role": "registrar"}'));

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
    const [searchQuery, setSearchQuery] = useState('');

    const showNotification = (message, type = 'info') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'info' }), 4000);
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
        const interval = setInterval(fetchReservations, 30000);
        return () => clearInterval(interval);
    }, []);

    // Filtered lists for the Registrar
    const pendingRequests = reservations
        .filter(r => r.status === 'pending_registrar')
        .map(r => ({
            id: r.reservation_id,
            department: r.department || 'N/A',
            purpose: r.description,
            date: new Date(r.start_datetime).toLocaleDateString(),
            time: new Date(r.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            passengers: r.passengers_count,
            distance: `${r.distance_km} km`,
            priority: r.distance_km > 200 ? 'Executive' : 'High',
            remarks: r.remarks,
            attachment_url: r.attachment_url,
            emergency_contact: r.emergency_contact,
            submittedBy: `${r.first_name || ''} ${r.last_name || 'Staff'}`
        }));

    // Personal Bookings for the Registrar
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

    // Modal State
    const [modal, setModal] = useState({ show: false, type: '', data: null });
    const [approvalComment, setApprovalComment] = useState('');

    const openReviewModal = (request) => {
        setModal({ show: true, type: 'review', data: request });
        setApprovalComment('');
    };

    const handleModalClose = () => {
        setModal({ show: false, type: '', data: null });
    };

    const handleAction = async (action) => {
        try {
            const status = action === 'approve' ? 'approved' : 'rejected';
            const response = await fetch(`http://localhost:5000/api/reservations/registrar/${modal.data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: status,
                    comments: approvalComment,
                    processed_by: user.id
                })
            });

            if (response.ok) {
                showNotification(`Request REQ-${modal.data.id} ${status} successfully`, 'success');
                fetchReservations();
                handleModalClose();
            } else {
                throw new Error('Action failed');
            }
        } catch (error) {
            showNotification('Error processing request', 'error');
        }
    };

    const logout = () => {
        sessionStorage.clear();
        localStorage.clear();
        navigate('/login');
    };

    const renderOverview = () => {
        const approvedReservations = reservations.filter(r => r.status === 'approved');
        const fleetUsageData = {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Fleet Utilization',
                data: [65, 59, 80, 81, 56, 40, 30],
                backgroundColor: 'rgba(128, 0, 0, 0.7)',
                borderRadius: 5,
            }]
        };

        const statusDistributionData = {
            labels: ['Approved', 'Pending', 'In Maintenance', 'Rejected'],
            datasets: [{
                data: [
                    reservations.filter(r => r.status === 'approved').length,
                    reservations.filter(r => r.status.startsWith('pending')).length,
                    4,
                    reservations.filter(r => r.status === 'rejected').length
                ],
                backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'],
                borderWidth: 0,
            }]
        };

        return (
            <div className="animation-fade-in space-y-8">
                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                <i className="fas fa-car-side text-lg"></i>
                            </div>
                            <span className="text-xs font-black text-emerald-500 uppercase">+12%</span>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Total Fleet Size</p>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">24 Units</h3>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                                <i className="fas fa-clock text-lg"></i>
                            </div>
                            <span className="text-xs font-black text-amber-500 uppercase">Awaited</span>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Pending Approvals</p>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{pendingRequests.length} Requests</h3>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                                <i className="fas fa-check-double text-lg"></i>
                            </div>
                            <span className="text-xs font-black text-emerald-500 uppercase">Daily</span>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Approved Trips</p>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{approvedReservations.length} Active</h3>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-[#800000]/5 rounded-lg flex items-center justify-center text-[#800000]">
                                <i className="fas fa-gas-pump text-lg"></i>
                            </div>
                            <span className="text-xs font-black text-red-500 uppercase">-4%</span>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Fuel Consumption</p>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Rs. 248K</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <i className="fas fa-chart-bar text-blue-500"></i> Weekly Fleet Utilization
                            </h3>
                        </div>
                        <div className="h-64">
                            <Bar data={fleetUsageData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Status Overview</h3>
                        <div className="h-64 flex justify-center">
                            <Doughnut data={statusDistributionData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                        </div>
                    </div>
                </div>

                {/* Quick Actions / Recent Log */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <i className="fas fa-history text-slate-400"></i> Recent Global Activity
                    </h3>
                    <div className="space-y-4">
                        {reservations.slice(0, 5).map(req => (
                            <div key={req.reservation_id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-10 rounded-full ${req.status === 'approved' ? 'bg-emerald-500' : req.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                    <div>
                                        <p className="font-bold text-slate-800">REQ-{req.reservation_id}: {req.destination}</p>
                                        <p className="text-xs text-slate-500">{req.first_name} {req.last_name} • {new Date(req.start_datetime).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : req.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                    {req.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderFleet = () => (
        <div className="animation-fade-in space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Vehicle Fleet Register</h2>
                <div className="flex gap-4">
                    <button onClick={() => setModal({ show: true, type: 'addVehicle' })} className="btn-primary px-4 py-2 flex items-center gap-2 shadow-lg shadow-red-800/20">
                        <i className="fas fa-plus"></i> Add Vehicle
                    </button>
                    <button className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-slate-600 font-bold hover:bg-slate-50 flex items-center gap-2 transition shadow-sm">
                        <i className="fas fa-file-excel"></i> Export CSV
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { count: 18, label: 'Available Now', color: 'emerald', icon: 'fa-check' },
                    { count: 4, label: 'Currently Dispatched', color: 'blue', icon: 'fa-map-marker-alt' },
                    { count: 2, label: 'Under Maintenance', color: 'amber', icon: 'fa-tools' }
                ].map((s, i) => (
                    <div key={i} className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-${s.color}-500`}>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-2xl font-black text-slate-800">{s.count}</span>
                            <i className={`fas ${s.icon} text-${s.color}-500 opacity-20 text-2xl`}></i>
                        </div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-tight">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#800000] text-white uppercase font-semibold text-xs">
                        <tr>
                            <th className="px-6 py-4">Ref#</th>
                            <th className="px-6 py-4">Registration</th>
                            <th className="px-6 py-4">Make & Model</th>
                            <th className="px-6 py-4">Fleet Assignment</th>
                            <th className="px-6 py-4 text-right">Operational Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {[
                            { id: 'VH-01', reg: 'CP KH-4521', model: 'Toyota Hiace (High Roof)', type: 'Transport Div' },
                            { id: 'VH-02', reg: 'WP CAV-8952', model: 'Nissan Leaf (Electric)', type: 'Faculty of Science' },
                            { id: 'VH-03', reg: 'CP PD-4421', model: 'Isuzu NPR Truck', type: 'General Admin' },
                            { id: 'VH-04', reg: 'NW KI-1123', model: 'Toyota Land Cruiser', type: 'Executive Vice Chancellor' },
                        ].map((v, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition border-b border-gray-50">
                                <td className="px-6 py-4 font-black text-slate-400">{v.id}</td>
                                <td className="px-6 py-4 font-bold text-slate-800">{v.reg}</td>
                                <td className="px-6 py-4 font-medium text-slate-600">{v.model}</td>
                                <td className="px-6 py-4 text-slate-500 font-bold">{v.type}</td>
                                <td className="px-6 py-4 text-right">
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase">Service Active</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderApprovals = () => (
        <div className="animation-fade-in card-gradient p-6 rounded-xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Long Distance Trip Approvals</h2>
                <div className="flex gap-2">
                    <button className="px-3 py-1 bg-slate-100 text-slate-600 rounded text-sm hover:bg-slate-200">Filter: All</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Request ID</th>
                            <th className="px-4 py-3">Department</th>
                            <th className="px-4 py-3">Purpose</th>
                            <th className="px-4 py-3">Distance</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {pendingRequests.map(req => (
                            <tr key={req.id} className="hover:bg-slate-50 transition">
                                <td className="px-4 py-3 font-medium text-slate-700">{req.id}</td>
                                <td className="px-4 py-3 text-slate-600">{req.department}</td>
                                <td className="px-4 py-3 text-slate-600">{req.purpose}</td>
                                <td className="px-4 py-3 text-slate-600">{req.distance}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => openReviewModal(req)} className="btn-primary px-3 py-1 text-xs">Review</button>
                                </td>
                            </tr>
                        ))}
                        {pendingRequests.length === 0 && (
                            <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-400">No pending approvals found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // --- Main JSX ---
    return (
        <div className="registrar-dashboard-container">
            {/* Sidebar */}
            {/* Sidebar */}
            <div className={`sidebar bg-[#1a0505] w-80 fixed h-full z-40 transition-transform duration-300 flex flex-col border-r border-[#F6DD26]/20 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-6 border-b border-white/10 shrink-0">
                    <div className="flex flex-col items-center mb-4">
                        <img src="/assets/banner.png" alt="University of Kelaniya" className="w-44 h-auto object-contain mb-4" />
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-white mb-1">Registrar Portal</h1>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Executive Administration</p>
                        </div>
                    </div>
                </div>

                <nav className="p-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="menu-section">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-4">Executive Dashboard</p>
                        {[
                            { id: 'overview', label: 'Overview Metrics', icon: 'fa-tachometer-alt' },
                            { id: 'longdistance', label: 'Approval Queue', icon: 'fa-file-signature' },
                            { id: 'approved-reservations', label: 'Approved Archive', icon: 'fa-check-double' },
                            { label: 'Fleet Registry', icon: 'fa-car', action: () => navigate('/vehicles') },
                            { label: 'Personnel Records', icon: 'fa-users-cog', action: () => navigate('/drivers') },
                            { label: 'Maintenance Logs', icon: 'fa-tools', action: () => navigate('/maintenance') },
                            { label: 'Analytics & BI', icon: 'fa-chart-line', action: () => navigate('/reports') },
                        ].map((item, idx) => (
                            <div key={item.id || idx}
                                className={`menu-item p-4 cursor-pointer flex items-center space-x-3 rounded-xl transition-all duration-200 border-l-4 ${activeTab === item.id ? 'active bg-white/10 border-yellow-400 text-yellow-400 font-bold shadow-lg' : 'border-transparent text-gray-300 hover:bg-white/5 hover:text-white'}`}
                                onClick={() => item.action ? item.action() : setActiveTab(item.id)}>
                                <i className={`fas ${item.icon} text-lg w-6 text-center ${activeTab === item.id ? 'text-yellow-400' : 'text-gray-400'}`}></i>
                                <span className="flex-1 text-sm font-medium">{item.label}</span>
                                {item.id === 'longdistance' && pendingRequests.length > 0 && (
                                    <span className="bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">{pendingRequests.length}</span>
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
                            { id: 'past-bookings', label: 'Activity Archive', icon: 'fa-history' }
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
            <div className="flex-1 lg:ml-80 flex flex-col min-h-screen bg-slate-50 text-slate-800 relative">
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
                <div className="p-8 flex-1 overflow-y-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2 text-slate-800">
                                {activeTab === 'overview' ? `Good Morning, ${user.name} 👋` :
                                    activeTab === 'longdistance' ? 'Approval Management' :
                                        activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                            </h1>
                            <p className="text-slate-500">Executive Management Dashboard</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <input type="text" placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:border-red-800 text-slate-700 w-64 shadow-sm" />
                                <i className="fas fa-search absolute right-3 top-3 text-slate-400 text-xs"></i>
                            </div>

                            <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-200 p-1 pr-4 rounded-full transition-colors" onClick={() => {
                                setEditProfileForm({
                                    name: user?.name || '',
                                    department: '',
                                    profilePic: user?.profilePic || ''
                                });
                                setShowProfileModal(true);
                            }}>
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition overflow-hidden shrink-0">
                                    {user?.profilePic ? (
                                        <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-sm font-bold text-white">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                                    )}
                                </div>
                                <span className="text-sm font-bold text-slate-700 hidden md:block">{user?.name}</span>
                            </div>
                        </div>
                    </div>

                    {/* Content Rendering */}
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'longdistance' && renderApprovals()}
                    {activeTab === 'approved-reservations' && (
                        <div className="animation-fade-in card-gradient p-6 rounded-xl">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <i className="fas fa-check-double text-green-600"></i> Approved Daily Fleet Missions
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[#800000] text-white uppercase font-semibold">
                                        <tr>
                                            <th className="px-6 py-4 font-bold border-r border-white/10">Destination</th>
                                            <th className="px-6 py-4 font-bold border-r border-white/10">Travel Date</th>
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
                    {activeTab === 'my-reservations' && (
                        <div className="animation-fade-in space-y-6">
                            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">My Reservations</h2>
                                    <p className="text-sm text-slate-500">Upcoming approved trips for your personal faculty duties.</p>
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
                    {activeTab === 'user-pending-approvals' && (
                        <div className="animation-fade-in space-y-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <h2 className="text-2xl font-bold text-slate-800 mb-6 font-inter">Pending My Bookings</h2>
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest font-inter">Reference</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase font-inter tracking-widest font-inter">Destination</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase font-inter tracking-widest font-inter">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 italic">
                                        {myPendingBookings.map(req => (
                                            <tr key={req.reservation_id}>
                                                <td className="px-6 py-4 font-bold text-slate-800">REQ-{req.reservation_id}</td>
                                                <td className="px-6 py-4 text-slate-600 font-medium font-inter">{req.destination}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-tighter border border-amber-100 italic font-inter tracking-widest">PENDING AUTH</span>
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
                    {activeTab === 'past-bookings' && (
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
                                                <td className="px-6 py-4 text-slate-600 font-black font-inter tracking-tighter">{new Date(req.start_datetime).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 font-bold text-slate-800 font-inter">{req.destination}</td>
                                                <td className="px-6 py-4 text-right font-inter">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${req.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                        {req.status === 'completed' ? 'TRAVELLED' : 'REJECTED'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {myPastBookings.length === 0 && (
                                            <tr><td colSpan="3" className="px-6 py-12 text-center text-slate-400 italic">No historical data available.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'fleet' && renderFleet()}

                    {/* Settings Rendering */}
                    {activeTab === 'settings' && (
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

                    {/* Placeholder for remaining sections */}
                    {!['overview', 'longdistance', 'fleet', 'approved-reservations', 'my-reservations', 'user-pending-approvals', 'past-bookings', 'settings'].includes(activeTab) && (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 animation-fade-in shadow-sm italic text-slate-400">
                            <i className="fas fa-tools text-5xl mb-4"></i>
                            <h2 className="text-xl font-bold mb-1 capitalize tracking-widest">{activeTab.replace('-', ' ')} Module</h2>
                            <p>This feature is presently within the development cycle.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Layer */}
            {modal.show && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm animation-fade-in p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
                        {modal.type === 'review' && modal.data && (
                            <>
                                <div className="bg-[#800000] p-4 flex justify-between items-center text-white shrink-0">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <i className="fas fa-file-signature"></i> Review Request {modal.data.id}
                                    </h3>
                                    <button onClick={handleModalClose} className="hover:text-yellow-400 transition"><i className="fas fa-times"></i></button>
                                </div>
                                <div className="p-6 space-y-4 overflow-y-auto">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div><p className="text-xs font-bold text-slate-400 uppercase">Department</p><p className="font-semibold text-slate-800">{modal.data.department}</p></div>
                                        <div><p className="text-xs font-bold text-slate-400 uppercase">Priority</p><p className="font-semibold text-slate-800">{modal.data.priority}</p></div>
                                        <div className="col-span-2"><p className="text-xs font-bold text-slate-400 uppercase">Purpose</p><p className="text-slate-700 italic">"{modal.data.purpose}"</p></div>
                                        {modal.data.remarks && (
                                            <div className="col-span-2"><p className="text-xs font-bold text-slate-400 uppercase">Remarks</p><p className="text-slate-700 bg-gray-50 p-2 rounded border-l-2 border-gray-300">{modal.data.remarks}</p></div>
                                        )}
                                        {modal.data.emergency_contact && (
                                            <div className="col-span-2"><p className="text-xs font-bold text-slate-400 uppercase">Emergency Contact</p><p className="text-slate-700 bg-gray-50 p-2 rounded border-l-2 border-gray-300">{modal.data.emergency_contact}</p></div>
                                        )}
                                        {modal.data.attachment_url && (
                                            <div className="col-span-2 mt-2">
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Attachment</p>
                                                <a href={`http://localhost:5000${modal.data.attachment_url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline flex items-center gap-2 text-sm">
                                                    <i className="fas fa-paperclip"></i> View Attached Document
                                                </a>
                                            </div>
                                        )}
                                        <div><p className="text-xs font-bold text-slate-400 uppercase">Distance</p><p className="font-semibold text-slate-800">{modal.data.distance}</p></div>
                                        <div><p className="text-xs font-bold text-slate-400 uppercase">Date</p><p className="font-semibold text-slate-800">{modal.data.date}</p></div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Registrar Comments</label>
                                        <textarea
                                            className="w-full mt-1 p-3 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-red-800"
                                            rows="3"
                                            placeholder="Enter approval notes or rejection reason..."
                                            value={approvalComment}
                                            onChange={(e) => setApprovalComment(e.target.value)}
                                        ></textarea>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => handleAction('approve')} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold transition shadow-md">
                                            <i className="fas fa-check-circle mr-2"></i> Approve
                                        </button>
                                        <button onClick={() => handleAction('reject')} className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg font-bold transition border border-red-200">
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {modal.type === 'addVehicle' && (
                            <>
                                <div className="bg-[#800000] p-4 flex justify-between items-center text-white">
                                    <h3 className="text-lg font-bold">Add New Vehicle</h3>
                                    <button onClick={handleModalClose}><i className="fas fa-times"></i></button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <input type="text" placeholder="Vehicle Number" className="w-full p-3 border border-slate-300 rounded-lg text-slate-800 outline-none focus:border-red-800" />
                                    <input type="text" placeholder="Make & Model" className="w-full p-3 border border-slate-300 rounded-lg text-slate-800 outline-none focus:border-red-800" />
                                    <div className="flex gap-3 mt-4">
                                        <button onClick={() => { alert('Vehicle Added'); handleModalClose(); }} className="flex-1 btn-primary py-2">Add Vehicle</button>
                                        <button onClick={handleModalClose} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded-lg">Cancel</button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegistrarDashboard;
