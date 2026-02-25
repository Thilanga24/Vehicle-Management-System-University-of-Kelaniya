import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DeanDashboard.css';

const DeanDashboard = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('currentUser') || '{"name": "Dean", "faculty": "Faculty"}'));
    const [currentTime, setCurrentTime] = useState('');

    // --- State for Data ---
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

    // Filtered lists for the Dean
    const pendingRequests = reservations
        .filter(r => r.status === 'pending_dean')
        .map(r => ({
            id: r.reservation_id,
            lecturer: `${r.first_name || ''} ${r.last_name || 'Staff'}`,
            department: r.department || 'N/A',
            destination: r.destination,
            date: new Date(r.start_datetime).toLocaleDateString(),
            time: new Date(r.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            passengers: r.passengers_count,
            distance: r.distance_km,
            purpose: r.description,
            submittedAt: new Date(r.created_at).toLocaleDateString(),
            hodApproval: r.hod_approval_status,
            hodComments: 'Forwarded by HOD',
            vehicleType: r.vehicle_id ? 'Assigned' : 'Needs Assignment'
        }));

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
        <div className="dean-dashboard-container">
            {/* Sidebar */}
            <div className={`sidebar ${sidebarOpen ? 'open' : ''} bg-[#400f0f] border-r border-[#F6DD26]/20 w-80 fixed h-full z-40 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-gray-700">
                    <h1 className="text-2xl font-bold text-white mb-1">Dean Dashboard</h1>
                    <p className="text-sm text-gray-400">Faculty Management Panel</p>
                </div>

                <nav className="p-4 space-y-2 pb-24 overflow-y-auto h-[calc(100vh-180px)]">
                    {[
                        { id: 'dashboard', label: 'Dashboard', sub: 'Overview & metrics', icon: 'fa-tachometer-alt' },
                        { id: 'pending-approvals', label: 'Approvals', sub: 'Request Review', icon: 'fa-file-signature', badge: pendingRequests.length },
                        { id: 'approved-reservations', label: 'Approved Reservations', sub: 'Status Overview', icon: 'fa-check-double' },
                        { id: 'faculty-overview', label: 'Faculty Overview', sub: 'Faculty statistics', icon: 'fa-university' },
                        { id: 'departments', label: 'Departments', sub: 'Department management', icon: 'fa-building' },
                        { id: 'reports', label: 'Reports', sub: 'Faculty reports', icon: 'fa-chart-bar' },
                        { id: 'analytics', label: 'Analytics', sub: 'Performance metrics', icon: 'fa-chart-line' }
                    ].map(item => (
                        <div
                            key={item.id}
                            className={`nav-item p-4 cursor-pointer rounded-xl border border-transparent transition-all duration-200 ${activeSection === item.id ? 'active bg-gradient-to-br from-[#660000] to-[#800000] border-[#F6DD26] shadow-red-900/50 shadow-lg' : 'hover:bg-[#541515] border-gray-700/30'}`}
                            onClick={() => handleSectionChange(item.id)}
                        >
                            <div className="flex items-center space-x-3">
                                <i className={`fas ${item.icon} text-lg w-6 text-center`}></i>
                                <div className="flex-1">
                                    <div className={`font-medium ${activeSection === item.id ? 'text-white' : 'text-gray-200'}`}>{item.label}</div>
                                    <div className={`text-xs ${activeSection === item.id ? 'text-blue-100' : 'text-gray-400'}`}>{item.sub}</div>
                                </div>
                                {item.badge > 0 && (
                                    <span className="bg-[#F6DD26] text-[#660000] text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">{item.badge}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="fixed bottom-0 left-0 w-80 p-4 bg-[#400f0f] border-t border-[#F6DD26]/20">
                    <button onClick={logout} className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 flex items-center justify-center text-gray-200 font-medium">
                        <i className="fas fa-sign-out-alt mr-2"></i> Logout
                    </button>
                </div>
            </div>

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
                            <button className="p-2 text-slate-400 hover:text-slate-600 relative transition-colors">
                                <i className="fas fa-bell text-xl"></i>
                                {pendingRequests.length > 0 && (
                                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-[#1e293b]">{pendingRequests.length}</span>
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
                                            <button onClick={() => setActiveSection('pending-approvals')} className="text-[#660000] hover:text-[#800000] text-sm font-medium hover:underline">View All</button>
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
                        <div className="animation-fade-in space-y-6">
                            <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-6 text-white mb-6 shadow-lg flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">Approved Reservations</h2>
                                    <p className="text-green-100 opacity-90">Overview of confirmed vehicle requests</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-gray-200 text-gray-500 text-sm uppercase">
                                                <th className="px-6 py-4 font-semibold">Requester</th>
                                                <th className="px-6 py-4 font-semibold">Trip Details</th>
                                                <th className="px-6 py-4 font-semibold">Date</th>
                                                <th className="px-6 py-4 font-semibold text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm divide-y divide-gray-100">
                                            {reservations.filter(r => r.status === 'approved').map(req => (
                                                <tr key={req.reservation_id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                                                {(req.first_name || 'S').charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-800">{req.first_name} {req.last_name}</p>
                                                                <p className="text-xs text-gray-500">{req.department || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-medium text-slate-800">{req.destination}</p>
                                                        <p className="text-xs text-gray-500 mt-1">{req.distance_km} km • {req.passengers_count} Pax</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {new Date(req.start_datetime).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                                                            <i className="fas fa-check-circle mr-1"></i> Approved
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {reservations.filter(r => r.status === 'approved').length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-8 text-gray-400">No approved reservations found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {['faculty-overview', 'departments', 'reports', 'analytics'].includes(activeSection) && (
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

            {/* Approval Modal - Updated to match SAR Style */}
            {showModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animation-fade-in">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-[#660000] p-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <i className="fas fa-file-signature"></i> Review Request {selectedRequest.id}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white transition">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
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
        </div>
    );
};

export default DeanDashboard;
