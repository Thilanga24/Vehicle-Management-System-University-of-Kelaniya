import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SARDashboard.css';

const ManagementAssistantDashboard = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('currentUser') || '{"name": "Assistant", "role": "management_assistant"}'));

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

    const approvedReservations = reservations.filter(r => r.status === 'approved');

    const stats = [
        { label: 'Total Fleet', value: 24, change: 'Fleet Overview', sub: 'University vehicles', icon: 'fa-car', color: 'blue' },
        { label: 'Active Trips', value: approvedReservations.length, change: 'Approved', sub: 'Confirmed trips', icon: 'fa-users', color: 'green' },
        { label: 'Pending Requests', value: reservations.filter(r => r.status === 'pending_hod' || r.status === 'pending_dean' || r.status === 'pending_sar' || r.status === 'pending_registrar').length, change: 'System Wide', sub: 'Needs Review', icon: 'fa-clock', color: 'yellow' },
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
            {/* Left Sidebar */}
            <div className={`sidebar bg-gradient-to-b from-[#1a0505] to-[#2d0a0a] border-none w-80 fixed h-full z-40 transition-transform duration-300 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-6 border-b border-white/10 shrink-0">
                    <h1 className="text-2xl font-bold text-white mb-2">Management Assistant</h1>
                    <p className="text-sm text-gray-400">System Dashboard Panel</p>
                </div>

                <nav className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                    {[
                        { id: 'dashboard', label: 'Dashboard', sub: 'Overview & metrics', icon: 'fa-tachometer-alt' },
                        { id: 'approved-reservations', label: 'Approved Reservations', sub: 'Status Overview', icon: 'fa-check-double' },
                        { id: 'reports', label: 'Reports', sub: 'Generate Reports', icon: 'fa-file-alt' },
                        { id: 'settings', label: 'Settings', sub: 'System Config', icon: 'fa-cog' },
                    ].map(item => (
                        <div
                            key={item.id}
                            className={`nav-item p-4 cursor-pointer flex items-center space-x-3 text-gray-300 hover:bg-white/5 rounded-xl transition ${activeTab === item.id ? 'active bg-white/10 text-yellow-400 border-l-4 border-yellow-400 font-bold shadow-lg shadow-black/20' : ''}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            <i className={`fas ${item.icon} text-lg w-6 text-center`}></i>
                            <div className="flex-1">
                                <div className="font-medium text-sm">{item.label}</div>
                                <div className="text-[10px] opacity-60 uppercase tracking-tighter">{item.sub}</div>
                            </div>
                        </div>
                    ))}

                    <div className="pt-6 border-t border-white/5 mt-4 space-y-1">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-4">Reservation Portal</p>
                        {[
                            { id: 'new-booking', label: 'New Booking', icon: 'fa-calendar-plus', action: () => navigate('/reservation') },
                            { id: 'my-reservations', label: 'My Reservations', icon: 'fa-calendar-check' },
                            { id: 'user-pending-approvals', label: 'Pending My Bookings', icon: 'fa-clock' },
                            { id: 'past-bookings', label: 'Past Bookings', icon: 'fa-history' }
                        ].map(item => (
                            <div key={item.id}
                                className={`nav-item p-3 px-4 cursor-pointer flex items-center space-x-3 text-gray-300 hover:bg-white/5 rounded-xl transition ${activeTab === item.id ? 'active bg-white/10 text-yellow-400 border-l-4 border-yellow-400 font-bold' : ''}`}
                                onClick={() => item.action ? item.action() : setActiveTab(item.id)}>
                                <i className={`fas ${item.icon} text-base w-6 text-center`}></i>
                                <div className="flex-1 text-sm font-medium">{item.label}</div>
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

                </nav>

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
                            {activeTab === 'dashboard' ? `Good Morning, ${user.name} 👋` :
                                activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}
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
                        <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-700 transition">
                            <span className="text-sm font-medium text-white">{user.name.charAt(0)}</span>
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
            </div>
        </div>
    );
};

export default ManagementAssistantDashboard;
