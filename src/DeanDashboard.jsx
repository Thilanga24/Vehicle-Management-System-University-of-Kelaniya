import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DeanDashboard.css';

const DeanDashboard = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState({ name: 'Prof. Rajapaksa', role: 'Dean - Faculty of Science' });
    const [currentTime, setCurrentTime] = useState('');

    // --- State for Data ---
    const [pendingRequests, setPendingRequests] = useState([
        {
            id: 1,
            lecturer: 'Dr. Silva',
            department: 'Computer Science',
            destination: 'University of Jaffna',
            date: '2025-10-15',
            time: '08:00',
            passengers: 5,
            distance: 180,
            purpose: 'Field visit for B.Sc. Computer Science students',
            submittedAt: '2 hours ago',
            hodApproval: 'approved',
            hodComments: 'Important educational visit'
        },
        {
            id: 2,
            lecturer: 'Prof. Fernando',
            department: 'Physics',
            destination: 'CERN Research Center',
            date: '2025-10-20',
            time: '06:00',
            passengers: 8,
            distance: 250,
            purpose: 'International physics conference and collaboration meeting',
            submittedAt: '5 hours ago',
            hodApproval: 'approved',
            hodComments: 'Critical for department research'
        },
        {
            id: 3,
            lecturer: 'Dr. Perera',
            department: 'Mathematics',
            destination: 'Kandy Conference Center',
            date: '2025-10-18',
            time: '07:30',
            passengers: 3,
            distance: 120,
            purpose: 'International Mathematics Conference',
            submittedAt: '1 day ago',
            hodApproval: 'approved',
            hodComments: 'Approved with conditions'
        },
        {
            id: 4,
            lecturer: 'Dr. Kumara',
            department: 'Chemistry',
            destination: 'Industrial Visit - Colombo',
            date: '2025-10-22',
            time: '08:30',
            passengers: 12,
            distance: 95,
            purpose: 'Industrial chemistry lab visit for undergraduate students',
            submittedAt: '1 day ago',
            hodApproval: 'approved',
            hodComments: 'Excellent learning opportunity'
        }
    ]);

    const [recentDecisions, setRecentDecisions] = useState([
        {
            id: 5,
            lecturer: 'Dr. Jayawardena',
            department: 'Physics',
            destination: 'Galle Tech Conference',
            decision: 'approved',
            date: '2025-10-12',
            decidedAt: '1 day ago'
        },
        {
            id: 6,
            lecturer: 'Dr. Ranasinghe',
            department: 'Chemistry',
            destination: 'Research Collaboration',
            decision: 'approved',
            date: '2025-10-10',
            decidedAt: '2 days ago'
        },
        {
            id: 7,
            lecturer: 'Dr. Bandara',
            department: 'Mathematics',
            destination: 'Workshop - Negombo',
            decision: 'rejected',
            date: '2025-10-08',
            decidedAt: '3 days ago',
            reason: 'Insufficient academic justification'
        }
    ]);

    const departmentStats = [
        { department: 'Industrial Management', pending: 1, thisMonth: 8 },
        { department: 'Physics', pending: 1, thisMonth: 5 },
        { department: 'Mathematics', pending: 1, thisMonth: 6 },
        { department: 'Chemistry', pending: 1, thisMonth: 7 },
        { department: 'Zoology', pending: 0, thisMonth: 4 },
        { department: 'Statistics', pending: 0, thisMonth: 2 }
    ];

    // --- Modal State ---
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [approvalComments, setApprovalComments] = useState('');

    useEffect(() => {
        // Set initial user info from session storage if available
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
        navigate('/login'); // Assuming route is /login
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleSectionChange = (section) => {
        setActiveSection(section);
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    };

    // --- Logic for Approvals ---
    const openReviewModal = (request) => {
        setModalData(request);
        setApprovalComments('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalData(null);
    };

    const processApproval = (id, decision, comments = '') => {
        const requestIndex = pendingRequests.findIndex(req => req.id === id);
        if (requestIndex === -1) return;

        const request = pendingRequests[requestIndex];
        const updatedPending = pendingRequests.filter(req => req.id !== id);
        setPendingRequests(updatedPending);

        const newDecision = {
            id: request.id,
            lecturer: request.lecturer,
            department: request.department,
            destination: request.destination,
            decision: decision,
            date: request.date,
            decidedAt: 'Just now',
            reason: decision === 'rejected' ? comments : undefined
        };

        setRecentDecisions([newDecision, ...recentDecisions]);
        closeModal();

        let message = `Request ${decision} successfully!`;
        if (decision === 'approved' && request.distance > 100) {
            message += ' Request forwarded to Registrar for final approval (distance > 100km).';
        }
        alert(message);
    };

    const quickApprove = (id) => {
        if (window.confirm('Are you sure you want to approve this request?')) {
            processApproval(id, 'approved');
        }
    };

    const quickReject = (id) => {
        const reason = window.prompt('Please provide a reason for rejection:');
        if (reason) {
            processApproval(id, 'rejected', reason);
        }
    };

    const handleApproveFromModal = () => {
        if (modalData) {
            processApproval(modalData.id, 'approved', approvalComments);
        }
    };

    const handleRejectFromModal = () => {
        if (modalData) {
            if (!approvalComments.trim()) {
                alert('Please provide a reason for rejection.');
                return;
            }
            processApproval(modalData.id, 'rejected', approvalComments);
        }
    };

    // --- Mock Generators ---
    const generateReport = (type) => {
        alert(`Generating ${type}...`);
    };

    // --- Render Helpers ---
    const renderPendingRequestCard = (request, isGrid = false) => {
        const priorityLabel = request.distance > 150 ? 'High Priority' : 'Standard';
        const priorityClass = request.distance > 150 ? 'priority-high border-l-4 border-l-red-500' : 'border-l-4 border-l-yellow-500';

        return (
            <div key={request.id} className={`approval-card ${priorityClass} bg-gradient-to-br from-[#400f0f] to-[#541515] border border-gray-600 rounded-lg p-4 mb-4 shadow-lg hover:translate-y-[-2px] transition-transform duration-200`}>
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-white text-lg">{request.lecturer}</h4>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${request.distance > 150 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                                {priorityLabel}
                            </span>
                        </div>
                        <p className="text-sm text-gray-300 mb-1"><strong>Dept:</strong> {request.department}</p>
                        <p className="text-sm text-gray-300 mb-1"><strong>Dest:</strong> {request.destination}</p>
                        <p className="text-sm text-gray-300 mb-1"><strong>Date:</strong> {request.date} at {request.time}</p>
                        <p className="text-sm text-gray-300 mb-2"><strong>Purpose:</strong> {request.purpose}</p>

                        <div className="bg-green-500/10 border border-green-500/20 rounded p-2 mb-3">
                            <p className="text-xs text-emerald-400 font-semibold mb-1">HOD Status: ✓ Approved</p>
                            <p className="text-xs text-emerald-300/80 italic">"{request.hodComments}"</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    <button onClick={() => openReviewModal(request)} className="bg-[#F6DD26] hover:bg-[#eac410] text-[#2d0a0a] font-bold px-3 py-1.5 rounded text-sm transition-colors duration-200">
                        Review
                    </button>
                    <button onClick={() => quickApprove(request.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-sm transition-colors duration-200">
                        Quick Approve
                    </button>
                    <button onClick={() => quickReject(request.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm transition-colors duration-200">
                        Reject
                    </button>
                </div>
            </div>
        );
    };

    // --- Main JSX ---
    return (
        <div className="flex min-h-screen bg-[#2d0a0a] text-[#f8fafc] font-sans">
            {/* Sidebar */}
            <div className={`sidebar ${sidebarOpen ? 'open' : ''} bg-[#400f0f] border-r border-[#F6DD26]/20 w-80 fixed h-full z-40 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-gray-700">
                    <h1 className="text-2xl font-bold text-white mb-1">Dean Dashboard</h1>
                    <p className="text-sm text-gray-400">Faculty Management Panel</p>
                </div>

                <nav className="p-4 space-y-2 pb-24 overflow-y-auto h-[calc(100vh-180px)]">
                    {[
                        { id: 'dashboard', label: 'Dashboard', sub: 'Overview & metrics', icon: 'fa-tachometer-alt' },
                        { id: 'pending-approvals', label: 'Pending Approvals', sub: 'Faculty requests', icon: 'fa-clock', badge: pendingRequests.length },
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
                                {/* Using simple text icons or could use FontAwesome component if imported. Using classes from HTML for now which require FontAwesome script or local setup. 
                                    Since user provided HTML with CDN, we'll try to stick to classes if the environment supports it, or placeholders. 
                                    Here I will use generic unicode or text to ensure visibility without external deps if FA not loaded. 
                                    Actually, user provided HTML had FA classes. I will keep classes.
                                */}
                                <i className={`fas ${item.icon} text-lg w-6 text-center`}></i>
                                <div className="flex-1">
                                    <div className={`font-medium ${activeSection === item.id ? 'text-white' : 'text-gray-200'}`}>{item.label}</div>
                                    <div className={`text-xs ${activeSection === item.id ? 'text-blue-100' : 'text-gray-400'}`}>{item.sub}</div>
                                </div>
                                {item.badge > 0 && (
                                    <span className="bg-yellow-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">{item.badge}</span>
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
            <div className="flex-1 lg:ml-80 flex flex-col min-h-screen">
                {/* Header */}
                <header className="bg-[#400f0f] border-b border-[#F6DD26]/20 px-8 py-5 sticky top-0 z-30 shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white capitalize">{activeSection.replace('-', ' ')}</h1>
                            <p className="text-gray-400 text-sm">Faculty Management Panel</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button className="p-2 text-gray-300 hover:text-white relative transition-colors">
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

                {/* Content Body */}
                <div className="p-8 flex-1 overflow-y-auto bg-[#2d0a0a]">

                    {/* DASHBOARD VIEW */}
                    {activeSection === 'dashboard' && (
                        <div className="animation-fade-in space-y-8">
                            {/* Welcome Banner */}
                            <div className="bg-gradient-to-r from-[#660000] to-[#800000] rounded-2xl p-8 text-white shadow-xl border border-[#F6DD26]/30 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h1 className="text-3xl font-bold mb-2">Welcome, {user.name}!</h1>
                                    <p className="text-blue-100 text-lg opacity-90">{user.role}</p>
                                    <div className="mt-6 flex items-center text-sm text-[#F6DD26] bg-[#2d0a0a]/40 w-fit px-4 py-2 rounded-lg backdrop-blur-sm border border-[#F6DD26]/20">
                                        <i className="far fa-clock mr-2"></i>
                                        Last login: Today at 7:30 AM
                                    </div>
                                </div>
                                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 skew-x-[-20deg] "></div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[
                                    { label: 'Pending Approvals', value: pendingRequests.length, icon: 'fa-clock', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
                                    { label: 'Faculty Approvals', value: '28', icon: 'fa-check-circle', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
                                    { label: 'Departments', value: departmentStats.length, icon: 'fa-building', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
                                    { label: 'This Month', value: '32', icon: 'fa-calendar-alt', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' }
                                ].map((stat, idx) => (
                                    <div key={idx} className="stat-card bg-[#400f0f] p-6 rounded-xl border border-gray-700 shadow-lg hover:shadow-xl transition-all">
                                        <div className="flex items-center">
                                            <div className={`p-4 rounded-full ${stat.bg} ${stat.border} border mr-4`}>
                                                <i className={`fas ${stat.icon} ${stat.color} text-xl`}></i>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
                                                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Pending Approvals List */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-[#400f0f] rounded-xl border border-gray-700 p-6 shadow-lg">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-bold text-white">Pending Approvals</h3>
                                            <button onClick={() => setActiveSection('pending-approvals')} className="text-[#F6DD26] hover:text-yellow-300 text-sm font-medium">View All</button>
                                        </div>
                                        {pendingRequests.length === 0 ? (
                                            <div className="text-center py-10 text-gray-500">
                                                <i className="fas fa-check-circle text-4xl mb-3 text-gray-600"></i>
                                                <p>All cleaned up! No pending requests.</p>
                                            </div>
                                        ) : (
                                            <div>{pendingRequests.slice(0, 3).map(req => renderPendingRequestCard(req))}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: Departments & Actions */}
                                <div className="space-y-6">
                                    <div className="bg-[#400f0f] rounded-xl border border-gray-700 p-6 shadow-lg">
                                        <h3 className="text-xl font-bold text-white mb-4">Department Summary</h3>
                                        <div className="space-y-4">
                                            {departmentStats.map((dept, idx) => (
                                                <div key={idx} className="flex justify-between items-center pb-3 border-b border-gray-700 last:border-0 last:pb-0">
                                                    <div>
                                                        <p className="font-medium text-white">{dept.department}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">Title: {dept.thisMonth} requests</p>
                                                    </div>
                                                    {dept.pending > 0 ? (
                                                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full border border-yellow-500/20">{dept.pending} Pending</span>
                                                    ) : (
                                                        <span className="text-gray-500 text-xs"><i className="fas fa-check mr-1"></i>Clear</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-[#400f0f] rounded-xl border border-gray-700 p-6 shadow-lg">
                                        <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
                                        <div className="space-y-3">
                                            {[
                                                { label: 'Review Pending', icon: 'fa-clipboard-check', action: () => setActiveSection('pending-approvals') },
                                                { label: 'Faculty Report', icon: 'fa-file-alt', action: () => setActiveSection('reports') },
                                                { label: 'Faculty Calendar', icon: 'fa-calendar-alt', action: () => alert('Calendar view coming soon') }
                                            ].map((action, idx) => (
                                                <button key={idx} onClick={action.action} className="w-full flex items-center p-3 rounded-lg bg-[#2d0a0a] hover:bg-[#541515] border border-gray-700 transition-colors text-left group">
                                                    <i className={`fas ${action.icon} text-[#F6DD26] mr-3 group-hover:scale-110 transition-transform`}></i>
                                                    <span className="text-gray-300 group-hover:text-white font-medium">{action.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PENDING APPROVALS VIEW */}
                    {activeSection === 'pending-approvals' && (
                        <div className="animation-fade-in space-y-6">
                            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-6 text-white mb-6 border border-yellow-500/30 shadow-lg flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">Pending Approvals Queue</h2>
                                    <p className="text-yellow-100 opacity-90">Review and approve requests from all departments</p>
                                </div>
                                <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                                    <span className="font-bold text-2xl">{pendingRequests.length}</span> <span className="text-sm opacity-80">Pending</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {pendingRequests.length === 0 ? (
                                    <div className="text-center py-20 bg-[#400f0f] rounded-xl border border-gray-700">
                                        <i className="fas fa-clipboard-check text-6xl text-gray-600 mb-4"></i>
                                        <h3 className="text-xl font-bold text-gray-400">All caught up!</h3>
                                        <p className="text-gray-500">No pending approvals remaining.</p>
                                    </div>
                                ) : (
                                    pendingRequests.map(req => renderPendingRequestCard(req))
                                )}
                            </div>
                        </div>
                    )}

                    {/* OTHER SECTIONS PLACEHOLDERS (Faculty Overview, Departments, etc.) */}
                    {['faculty-overview', 'departments', 'reports', 'analytics'].includes(activeSection) && (
                        <div className="animation-fade-in flex flex-col items-center justify-center py-20 bg-[#400f0f] rounded-xl border border-gray-700">
                            <i className={`fas ${activeSection === 'faculty-overview' ? 'fa-university' : activeSection === 'departments' ? 'fa-building' : activeSection === 'reports' ? 'fa-file-alt' : 'fa-chart-line'} text-6xl text-gray-600 mb-6`}></i>
                            <h2 className="text-2xl font-bold text-white mb-2 capitalize">{activeSection.replace('-', ' ')}</h2>
                            <p className="text-gray-400 max-w-md text-center">This module is currently being implemented. Full functionality will be available in the next release.</p>
                            <button onClick={() => setActiveSection('dashboard')} className="mt-6 text-[#F6DD26] hover:text-yellow-300 font-medium">
                                <i className="fas fa-arrow-left mr-2"></i> Back to Dashboard
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {/* Modal */}
            {showModal && modalData && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animation-fade-in">
                    <div className="bg-[#400f0f] rounded-xl border border-gray-600 shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-[#660000] to-[#800000] p-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">Review Request #{modalData.id}</h3>
                            <button onClick={closeModal} className="text-white/80 hover:text-white"><i className="fas fa-times"></i></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-400">Lecturer</p>
                                    <p className="text-white font-medium text-base">{modalData.lecturer}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Department</p>
                                    <p className="text-white font-medium">{modalData.department}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-gray-400">Destination</p>
                                    <p className="text-white font-medium">{modalData.destination}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Date</p>
                                    <p className="text-white font-medium">{modalData.date}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Distance</p>
                                    <p className="text-white font-medium">{modalData.distance} km</p>
                                </div>
                                <div className="col-span-2 bg-[#2d0a0a] p-3 rounded border border-gray-700">
                                    <p className="text-gray-400 text-xs uppercase font-bold mb-1">Purpose</p>
                                    <p className="text-gray-200">{modalData.purpose}</p>
                                </div>
                                <div className="col-span-2 bg-green-900/20 border border-green-500/20 p-3 rounded">
                                    <p className="text-green-400 text-xs font-bold uppercase mb-1">HOD Comments</p>
                                    <p className="text-green-100 italic">"{modalData.hodComments}"</p>
                                </div>
                            </div>

                            <hr className="border-gray-700 my-4" />

                            <div>
                                <label className="block text-gray-400 text-sm font-medium mb-2">Dean's Remarks (Optional)</label>
                                <textarea
                                    className="w-full bg-[#2d0a0a] border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-[#F6DD26] transition-colors"
                                    rows="3"
                                    placeholder="Add notes for approval or rejection..."
                                    value={approvalComments}
                                    onChange={(e) => setApprovalComments(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={handleApproveFromModal} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors">
                                    Approve
                                </button>
                                <button onClick={handleRejectFromModal} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition-colors">
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

export default DeanDashboard;
