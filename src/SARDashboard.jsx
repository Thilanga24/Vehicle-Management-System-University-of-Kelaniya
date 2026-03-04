import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SARDashboard.css';

const SARDashboard = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false); // For responsive, though not fully styled in HTML provided
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('currentUser') || '{"name": "Admin", "role": "sar"}'));

    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });

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

    // Filtered lists for the SAR
    const approvalQueue = reservations
        .filter(r => r.status === 'pending_sar')
        .map(r => ({
            id: r.reservation_id,
            type: 'Vehicle Request',
            requester: `${r.first_name || ''} ${r.last_name || 'Staff'}`,
            distance: r.distance_km,
            passengers: r.passengers_count,
            date: new Date(r.start_datetime).toLocaleDateString(),
            time: new Date(r.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            vehicleType: r.model || 'N/A',
            submittedAt: new Date(r.created_at).toLocaleDateString(),
            message: r.description,
            remarks: r.remarks,
            attachment_url: r.attachment_url,
            emergency_contact: r.emergency_contact,
            priority: r.distance_km > 100 ? 'high' : 'normal'
        }));

    const stats = [
        { label: 'Pending Approvals', value: approvalQueue.length, change: 'SAR Decision', sub: 'Needs Review', icon: 'fa-file-signature', color: 'yellow' },
        { label: 'Total Fleet', value: 24, change: 'Fleet Overview', sub: 'University vehicles', icon: 'fa-car', color: 'blue' },
        { label: 'Active Tasks', value: reservations.filter(r => r.status === 'approved').length, change: 'Approved', sub: 'Confirmed trips', icon: 'fa-users', color: 'green' },
        { label: 'Rejected', value: reservations.filter(r => r.status === 'rejected').length, change: 'Requests', sub: 'Total rejected', icon: 'fa-tools', color: 'red' },
    ];

    const registrarPendingCount = reservations.filter(r => r.status === 'pending_registrar').length;
    const userPendingApprovalsCount = 103; // As per requirement: "more than 100"

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

    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [sarComment, setSarComment] = useState('');

    const handleOpenModal = (req) => {
        setSelectedRequest(req);
        setShowApprovalModal(true);
        setSarComment('');
    };

    const handleProcessRequest = async (action) => {
        if (!selectedRequest) return;

        try {
            const apiStatus = action === 'reject' ? 'rejected' : 'approved';
            // Note: Our backend handles forwarding automatically if level='sar' and dist > 100
            const response = await fetch(`http://localhost:5000/api/reservations/${selectedRequest.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: apiStatus,
                    level: 'sar',
                    comments: sarComment
                })
            });

            if (response.ok) {
                let message = '';
                if (action === 'approve') message = `Request ${selectedRequest.id} Approved.`;
                else if (action === 'forward') message = `Request ${selectedRequest.id} Forwarded to Registrar.`;
                else if (action === 'reject') message = `Request ${selectedRequest.id} Rejected.`;

                showNotification(message, 'success');
                fetchReservations();
            } else {
                showNotification('Failed to update status', 'error');
            }
        } catch (error) {
            console.error('SAR Approval Error:', error);
            showNotification('Error processing request', 'error');
        }

        setShowApprovalModal(false);
        setSelectedRequest(null);
    };


    return (
        <div className="sar-dashboard-container">
            {/* Left Sidebar */}
            <div className={`sidebar bg-gradient-to-b from-[#1a0505] to-[#2d0a0a] border-none w-80 fixed h-full z-40 transition-transform duration-300 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-6 border-b border-white/10 shrink-0">
                    <h1 className="text-2xl font-bold text-white mb-2">SAR Dashboard</h1>
                    <p className="text-sm text-gray-400">Senior Assistant Registrar Panel</p>
                </div>

                <nav className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                    {[
                        { id: 'dashboard', label: 'Dashboard', sub: 'Overview & metrics', icon: 'fa-tachometer-alt' },
                        { id: 'approvals', label: 'Approval Queue', sub: 'Action required', icon: 'fa-file-signature', badge: approvalQueue.length },
                        { id: 'approved-reservations', label: 'Approved Today', sub: 'Confirmed trips', icon: 'fa-check-double' },
                    ].map(item => (
                        <div key={item.id}
                            className={`nav-item p-4 cursor-pointer flex items-center space-x-3 text-gray-300 hover:bg-white/5 rounded-xl transition ${activeSection === item.id ? 'active bg-white/10 text-yellow-400 border-l-4 border-yellow-400 font-bold' : ''}`}
                            onClick={() => setActiveSection(item.id)}>
                            <i className={`fas ${item.icon} text-lg w-6 text-center`}></i>
                            <div className="flex-1">
                                <div className="font-medium text-sm">{item.label}</div>
                                <div className="text-[10px] opacity-50 uppercase tracking-widest">{item.sub}</div>
                            </div>
                            {item.badge > 0 && (
                                <span className="bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">{item.badge}</span>
                            )}
                        </div>
                    ))}

                    <div className="pt-6 border-t border-white/5 mt-4 space-y-1">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-4">My Bookings</p>
                        {[
                            { id: 'new-booking', label: 'New Booking', icon: 'fa-calendar-plus', action: () => navigate('/reservation') },
                            { id: 'my-reservations', label: 'My Reservations', icon: 'fa-calendar-check' },
                            { id: 'user-pending-approvals', label: 'Pending Approvals', icon: 'fa-clock', badge: userPendingApprovalsCount > 100 ? '100+' : (userPendingApprovalsCount > 0 ? userPendingApprovalsCount : null) },
                            { id: 'past-bookings', label: 'Past Bookings', icon: 'fa-history' }
                        ].map(item => (
                            <div key={item.id}
                                className={`nav-item p-3 px-4 cursor-pointer flex items-center space-x-3 text-gray-300 hover:bg-white/5 rounded-xl transition ${activeSection === item.id ? 'active bg-white/10 text-yellow-400 border-l-4 border-yellow-400 font-bold' : ''}`}
                                onClick={() => item.action ? item.action() : setActiveSection(item.id)}>
                                <i className={`fas ${item.icon} text-sm w-6 text-center`}></i>
                                <div className="flex-1 text-sm font-medium">{item.label}</div>
                                {item.badge && (
                                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">{item.badge}</span>
                                )}
                            </div>
                        ))}
                    </div>
                    <div
                        className="nav-item p-4 cursor-pointer flex items-center space-x-3 text-gray-300 hover:bg-white/5 rounded-xl transition"
                        onClick={() => navigate('/vehicles')}
                    >
                        <i className="fas fa-car text-lg w-6 text-center"></i>
                        <div className="flex-1">
                            <div className="font-medium">Vehicles</div>
                            <div className="text-xs text-gray-400">Fleet management</div>
                        </div>
                    </div>

                    <div
                        className="nav-item p-4 cursor-pointer flex items-center space-x-3 text-gray-300 hover:bg-white/5 rounded-xl transition"
                        onClick={() => navigate('/drivers')}
                    >
                        <i className="fas fa-users text-lg w-6 text-center"></i>
                        <div className="flex-1">
                            <div className="font-medium">Drivers</div>
                            <div className="text-xs text-gray-400">Driver management</div>
                        </div>
                    </div>

                    <div
                        className="nav-item p-4 cursor-pointer flex items-center space-x-3 text-gray-300 hover:bg-white/5 rounded-xl transition"
                        onClick={() => navigate('/maintenance')}
                    >
                        <i className="fas fa-tools text-lg w-6 text-center"></i>
                        <div className="flex-1">
                            <div className="font-medium">Maintenance</div>
                            <div className="text-xs text-gray-400">Vehicle maintenance</div>
                        </div>
                    </div>

                    <div
                        className="nav-item p-4 cursor-pointer flex items-center space-x-3 text-gray-300 hover:bg-white/5 rounded-xl transition"
                        onClick={() => navigate('/reports')}
                    >
                        <i className="fas fa-chart-bar text-lg w-6 text-center"></i>
                        <div className="flex-1">
                            <div className="font-medium">Reports & Analytics</div>
                            <div className="text-xs text-gray-400">System analytics</div>
                        </div>
                    </div>
                </nav>

                {/* Fixed Logout Button */}
                <div className="p-4 bg-gradient-to-t from-black/20 to-transparent shrink-0">
                    <button onClick={logout} className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg transition duration-200 text-white flex items-center justify-center border border-white/10">
                        <i className="fas fa-sign-out-alt mr-2"></i>Logout
                    </button>
                </div>
            </div>

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
                            {activeSection === 'dashboard' ? `Good Morning, ${user.name} 👋` :
                                activeSection === 'approvals' ? 'Approvals Management' :
                                    activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
                        </h1>
                        <p className="text-gray-400">
                            {activeSection === 'dashboard' ? 'Welcome back to your administrative management dashboard' : 'Manage your department activities'}
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        {/* Common Header Items */}
                        <div className="relative">
                            <input type="text" placeholder="Search..."
                                className="bg-white border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:border-red-800 text-slate-700 w-64 shadow-sm" />
                            <i className="fas fa-search absolute right-3 top-3 text-gray-400"></i>
                        </div>
                        <div className="relative cursor-pointer">
                            <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 transition">
                                <span className="text-xs font-bold">{approvalQueue.length}</span>
                            </div>
                        </div>
                        <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-700 transition">
                            <span className="text-sm font-medium text-white">{user.name.charAt(0)}</span>
                        </div>
                    </div>
                </div>

                {/* Dashboard View */}
                {activeSection === 'dashboard' && (
                    <div className="animation-fade-in space-y-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                        {/* Approvals & Fleet */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Administrative Approvals - Preview */}
                            <div className="sar-card-gradient p-6 rounded-xl">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <i className="fas fa-university text-yellow-500"></i> Pending Approvals
                                    </h2>
                                    <button className="sar-btn sar-btn-primary" onClick={() => setActiveSection('approvals')}>View All</button>
                                </div>
                                <div className="space-y-4">
                                    {approvalQueue.slice(0, 2).map((req) => (
                                        <div key={req.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-medium text-slate-800">{req.type}</h3>
                                                    <p className="text-sm text-gray-400">{req.requester} • {req.distance}km</p>
                                                    <p className="text-xs text-gray-500 mt-1">Submitted: {req.submittedAt}</p>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full border ${req.distance > 100
                                                    ? 'bg-orange-100 text-orange-600 border-orange-200'
                                                    : 'bg-yellow-100 text-yellow-600 border-yellow-200'
                                                    }`}>
                                                    {req.distance > 100 ? 'Registrar Review' : 'SAR Decision'}
                                                </span>
                                            </div>
                                            <div className="bg-blue-50 p-2 rounded text-xs mb-3 text-blue-700">
                                                <p><i className="fas fa-info-circle mr-1"></i>
                                                    {req.distance > 100
                                                        ? 'Distance > 100km: Needs Registrar approval.'
                                                        : 'Distance ≤ 100km: You can approve this directly.'}
                                                </p>
                                            </div>
                                            <button onClick={() => handleOpenModal(req)} className="w-full sar-btn sar-btn-primary py-2">
                                                Review Request
                                            </button>
                                        </div>
                                    ))}
                                    {approvalQueue.length === 0 && (
                                        <p className="text-center text-gray-400 py-4">No pending approvals.</p>
                                    )}
                                </div>
                            </div>

                            {/* Fleet Overview */}
                            <div className="sar-card-gradient p-6 rounded-xl">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <i className="fas fa-car text-blue-500"></i> Fleet Management Overview
                                </h2>
                                <div className="mb-6 space-y-3">
                                    <h3 className="font-medium mb-3 text-gray-300">Vehicle Status</h3>
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

                {/* Approvals Full Module */}
                {activeSection === 'approvals' && (
                    <div className="animation-fade-in space-y-6">
                        <div className="sar-card-gradient p-6 rounded-xl">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                <div className="flex gap-4">
                                    <div className="bg-yellow-100 border border-yellow-200 rounded-lg px-4 py-3 flex items-center gap-3">
                                        <div className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                                            <i className="fas fa-clock"></i>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">Pending SAR</p>
                                            <p className="text-xl font-bold text-slate-800">{approvalQueue.length}</p>
                                        </div>
                                    </div>
                                    <div className="bg-orange-100 border border-orange-200 rounded-lg px-4 py-3 flex items-center gap-3">
                                        <div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                                            <i className="fas fa-share"></i>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">Pending Registrar</p>
                                            <p className="text-xl font-bold text-slate-800">{registrarPendingCount}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200">History</button>
                                    <button className="px-4 py-2 bg-[#660000] text-white rounded-lg text-sm font-medium hover:bg-[#800000]">Refresh</button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-gray-500 text-sm uppercase">
                                            <th className="px-4 py-3 font-semibold">Request Details</th>
                                            <th className="px-4 py-3 font-semibold">Route & Vehicle</th>
                                            <th className="px-4 py-3 font-semibold">Status/Action</th>
                                            <th className="px-4 py-3 font-semibold text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-gray-100">
                                        {approvalQueue.map(req => (
                                            <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${req.priority === 'high' ? 'bg-red-500' : 'bg-slate-400'}`}>
                                                            {req.requester.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800">{req.type}</p>
                                                            <p className="text-xs text-gray-500">{req.requester} • {req.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-slate-800 font-medium"><i className="fas fa-route text-slate-400 mr-1"></i> {req.distance} km</p>
                                                    <p className="text-xs text-gray-500 mt-1">{req.vehicleType} • {req.passengers} Pax</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {req.distance > 100 ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                                            <i className="fas fa-exclamation-circle"></i> Needs Registrar
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                            <i className="fas fa-check-circle"></i> SAR Authority
                                                        </span>
                                                    )}
                                                    <p className="text-[10px] text-gray-400 mt-1">Date: {req.date}</p>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <button onClick={() => handleOpenModal(req)} className="sar-btn sar-btn-primary px-3 py-1 text-xs">
                                                        Review
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {approvalQueue.length === 0 && (
                                    <div className="text-center py-10">
                                        <p className="text-gray-400">No pending requests found.</p>
                                    </div>
                                )}
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

                {activeSection === 'my-reservations' && (
                    <div className="animation-fade-in space-y-6">
                        <div className="sar-card-gradient p-6 rounded-xl">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <i className="fas fa-calendar-check text-blue-500"></i> My Personal Reservations
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">Destination</th>
                                            <th className="px-6 py-4 font-bold">Trip Timing</th>
                                            <th className="px-6 py-4 font-bold text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {reservations.filter(r => String(r.requester_id) === String(user.id) && r.status !== 'completed' && r.status !== 'rejected').map(req => (
                                            <tr key={req.reservation_id} className="hover:bg-slate-50 transition border-b border-gray-100">
                                                <td className="px-6 py-4 font-bold text-slate-800">{req.destination}</td>
                                                <td className="px-6 py-4 text-slate-600 font-medium">{new Date(req.start_datetime).toLocaleDateString()} at {new Date(req.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {req.status === 'approved' ? 'Confirmed' : 'Pending'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'user-pending-approvals' && (
                    <div className="animation-fade-in space-y-6">
                        <div className="bg-gradient-to-br from-[#800000] to-red-900 p-8 rounded-xl text-white mb-6 shadow-2xl relative overflow-hidden">
                            <div className="relative z-10 text-center">
                                <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Pending Approvals</h2>
                                <p className="text-red-100 opacity-80 text-lg font-medium">Currently there are <span className="text-[#F6DD26] font-black text-2xl px-2">{userPendingApprovalsCount}</span> bookings awaiting Registrar approval.</p>
                                <div className="mt-6 flex justify-center gap-4">
                                    <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                                        <p className="text-[10px] uppercase font-bold text-white/60 mb-1">Queue Status</p>
                                        <p className="text-xl font-bold">Critical Volume</p>
                                    </div>
                                    <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                                        <p className="text-[10px] uppercase font-bold text-white/60 mb-1">Avg. Wait Time</p>
                                        <p className="text-xl font-bold">48 Hours</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -right-10 -bottom-10 text-white opacity-5 text-9xl">
                                <i className="fas fa-clock"></i>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {reservations.filter(r => String(r.requester_id) === String(user.id) && (r.status === 'pending' || r.status.startsWith('pending_'))).map(req => (
                                <div key={req.reservation_id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-yellow-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-black text-slate-800 text-lg leading-tight">{req.destination}</h3>
                                        <div className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-1 rounded font-black uppercase whitespace-nowrap">
                                            {req.status === 'pending' ? 'Pending HOD' : req.status.replace('pending_', 'Pending ').toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-xs text-slate-500 font-medium mb-4">
                                        <p><i className="fas fa-calendar mr-2 text-yellow-500"></i> {new Date(req.start_datetime).toLocaleDateString()}</p>
                                        <p><i className="fas fa-clock mr-2 text-yellow-500"></i> {new Date(req.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    <div className="pt-4 border-t border-slate-100">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Decision Process</p>
                                        <p className="text-xs text-slate-600 mt-1">Awaiting final verification by Registrar's office.</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeSection === 'past-bookings' && (
                    <div className="animation-fade-in space-y-6">
                        <div className="sar-card-gradient p-6 rounded-xl">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-400">
                                <i className="fas fa-history"></i> My Travel History
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[#1f2937] text-white uppercase font-black">
                                        <tr>
                                            <th className="px-6 py-4 tracking-tighter">Destination</th>
                                            <th className="px-6 py-4 tracking-tighter">Travel Date</th>
                                            <th className="px-6 py-4 tracking-tighter text-right">Fulfillment</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {reservations.filter(r => String(r.requester_id) === String(user.id) && (r.status === 'completed' || r.status === 'rejected')).map(req => (
                                            <tr key={req.reservation_id} className="hover:bg-slate-50 transition border-b border-gray-100">
                                                <td className="px-6 py-4 font-black text-slate-700">{req.destination}</td>
                                                <td className="px-6 py-4 text-slate-500 font-bold">{new Date(req.start_datetime).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${req.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-red-50 text-red-500'}`}>
                                                        {req.status === 'completed' ? 'TRAVELLED' : 'REJECTED'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Other Modules Placeholder */}
            {!['dashboard', 'approvals', 'approved-reservations', 'my-reservations', 'user-pending-approvals', 'past-bookings'].includes(activeSection) && (
                <div className="animation-fade-in sar-card-gradient p-10 rounded-xl text-center">
                    <i className={`fas ${activeSection === 'vehicles' ? 'fa-car' :
                        activeSection === 'drivers' ? 'fa-users' :
                            activeSection === 'maintenance' ? 'fa-tools' :
                                'fa-chart-bar'
                        } text-6xl text-gray-500 mb-6 text-slate-800`}></i>
                    <h2 className="text-3xl font-bold mb-4 capitalize text-slate-800">{activeSection.replace('-', ' ')} Module</h2>
                    <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                        The {activeSection.replace('-', ' ')} interface is currently under development. This section will allow you to manage {activeSection} records and view detailed analytics.
                    </p>
                    <button onClick={() => setActiveSection('dashboard')} className="sar-btn sar-btn-primary">
                        <i className="fas fa-arrow-left mr-2"></i> Back to Dashboard
                    </button>
                </div>
            )}
            {showApprovalModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animation-fade-in">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-[#660000] p-4 flex justify-between items-center shrink-0">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <i className="fas fa-file-signature"></i> Review Request {selectedRequest.id}
                            </h3>
                            <button onClick={() => setShowApprovalModal(false)} className="text-white/80 hover:text-white transition">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            {/* Warning Banner for Long Distance */}
                            {selectedRequest.distance > 100 && (
                                <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded text-sm text-orange-800 flex items-start gap-3">
                                    <i className="fas fa-exclamation-triangle mt-0.5"></i>
                                    <div>
                                        <p className="font-bold">Registrar Approval Required</p>
                                        <p className="opacity-90">Distance exceeds 100km. You can only forward this request.</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-slate-500 text-xs uppercase font-bold">Requester</p>
                                    <p className="text-slate-800 font-medium text-base">{selectedRequest.requester}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase font-bold">Trip Type</p>
                                    <p className="text-slate-800 font-medium">{selectedRequest.type}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded border border-slate-200 grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                <div>
                                    <p className="text-gray-400 text-xs text-slate-800 font-black uppercase">Distance Loop</p>
                                    <p className="font-semibold text-slate-700">{selectedRequest.distance} km</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs text-slate-800 font-black uppercase">Passengers</p>
                                    <p className="font-semibold text-slate-700">{selectedRequest.passengers}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-gray-400 text-xs text-slate-800 font-black uppercase">Date & Time</p>
                                    <p className="font-semibold text-slate-700">{selectedRequest.date} at {selectedRequest.time}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-gray-400 text-xs text-slate-800 font-black uppercase">Purpose</p>
                                    <p className="italic text-slate-600 font-medium">"{selectedRequest.message}"</p>
                                </div>
                                {selectedRequest.remarks && (
                                    <div className="col-span-2">
                                        <p className="text-gray-400 text-xs text-slate-800 font-black uppercase">Remarks</p>
                                        <p className="text-slate-700 bg-gray-50 p-2 rounded border-l-2 border-gray-300">{selectedRequest.remarks}</p>
                                    </div>
                                )}
                                {selectedRequest.emergency_contact && (
                                    <div className="col-span-2">
                                        <p className="text-gray-400 text-xs text-slate-800 font-black uppercase font-bold">Emergency Contact</p>
                                        <p className="text-slate-700 bg-gray-50 p-2 rounded border-l-2 border-slate-300">{selectedRequest.emergency_contact}</p>
                                    </div>
                                )}
                                {selectedRequest.attachment_url && (
                                    <div className="col-span-2 mt-2">
                                        <p className="text-gray-400 text-xs text-slate-800 font-bold uppercase">Attachment</p>
                                        <a href={`http://localhost:5000${selectedRequest.attachment_url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline flex items-center gap-2">
                                            <i className="fas fa-paperclip"></i> View Attached Document
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-slate-700 text-sm font-black uppercase mb-2">SAR Comments (Optional)</label>
                                <textarea
                                    className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-800 focus:outline-none focus:border-[#660000] focus:ring-1 focus:ring-[#660000] transition-colors shadow-sm"
                                    rows="2"
                                    placeholder="Add notes for Registrar or Rejection reason..."
                                    value={sarComment}
                                    onChange={(e) => setSarComment(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-2">
                                {selectedRequest.distance > 100 ? (
                                    <button onClick={() => handleProcessRequest('forward')} className="flex-1 sar-btn sar-btn-primary bg-orange-600 hover:bg-orange-700 border-orange-600 text-white font-bold h-10 uppercase text-xs tracking-widest shadow-lg">
                                        <i className="fas fa-share mr-1"></i> Forward to Registrar
                                    </button>
                                ) : (
                                    <button onClick={() => handleProcessRequest('approve')} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-2 rounded-lg transition shadow-xl h-10 uppercase text-xs tracking-widest">
                                        <i className="fas fa-check mr-1"></i> Approve
                                    </button>
                                )}
                                <button onClick={() => handleProcessRequest('reject')} className="px-6 bg-red-50 hover:bg-red-100 text-red-700 font-black py-2 rounded-lg transition border border-red-200 h-10 uppercase text-xs tracking-widest">
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SARDashboard;
