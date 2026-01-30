import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HODDashboard.css';

const HODDashboard = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // HOD Specific State
    const [currentRequest, setCurrentRequest] = useState(null);
    const [approvalComments, setApprovalComments] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(null); // 'approval', 'report', 'calendar', 'history'

    // Mock Data
    const [pendingRequests, setPendingRequests] = useState([
        {
            id: 1,
            lecturer: 'Dr. Silva',
            destination: 'University of Jaffna',
            date: '2025-10-15',
            time: '08:00',
            passengers: 5,
            distance: 180,
            purpose: 'Field visit for B.Sc. Computer Science students to observe data center operations',
            submittedAt: '2 hours ago'
        },
        {
            id: 2,
            lecturer: 'Dr. Perera',
            destination: 'Kandy Conference Center',
            date: '2025-10-18',
            time: '07:30',
            passengers: 3,
            distance: 120,
            purpose: 'Attending International Conference on Computer Science and Technology',
            submittedAt: '4 hours ago'
        }
    ]);

    const [recentDecisions, setRecentDecisions] = useState([
        {
            id: 4,
            lecturer: 'Dr. Jayawardena',
            destination: 'Galle Tech Conference',
            decision: 'approved',
            date: '2025-10-12',
            decidedAt: '1 day ago'
        },
        {
            id: 5,
            lecturer: 'Dr. Kumara',
            destination: 'Matara Field Study',
            decision: 'approved',
            date: '2025-10-10',
            decidedAt: '2 days ago'
        }
    ]);

    const handleLogout = () => {
        sessionStorage.clear();
        localStorage.removeItem('currentUser');
        navigate('/');
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const handleSectionChange = (section) => {
        setActiveSection(section);
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    };

    const reviewRequest = (requestId) => {
        const request = pendingRequests.find(req => req.id === requestId);
        if (request) {
            setCurrentRequest(request);
            setModalType('approval');
            setShowModal(true);
        }
    };

    const processApproval = (decision, comments = '') => {
        if (!currentRequest) return;

        const updatedPending = pendingRequests.filter(req => req.id !== currentRequest.id);
        setPendingRequests(updatedPending);

        const newDecision = {
            id: currentRequest.id,
            lecturer: currentRequest.lecturer,
            destination: currentRequest.destination,
            decision: decision,
            date: currentRequest.date,
            decidedAt: 'Just now',
            reason: decision === 'rejected' ? comments : undefined
        };
        setRecentDecisions([newDecision, ...recentDecisions]);

        setShowModal(false);
        setCurrentRequest(null);
        setApprovalComments('');
        alert(`Request ${decision} successfully!`);
    };

    const quickApprove = (requestId) => {
        if (window.confirm('Do you want to Quick Approve this request?')) {
            const request = pendingRequests.find(req => req.id === requestId);
            if (request) {
                setPendingRequests(pendingRequests.filter(r => r.id !== request.id));
                setRecentDecisions([{ ...request, decision: 'approved', decidedAt: 'Just now' }, ...recentDecisions]);
            }
        }
    };

    const quickReject = (requestId) => {
        const reason = prompt("Reason for rejection:");
        if (reason) {
            const request = pendingRequests.find(req => req.id === requestId);
            if (request) {
                setPendingRequests(pendingRequests.filter(r => r.id !== request.id));
                setRecentDecisions([{ ...request, decision: 'rejected', decidedAt: 'Just now' }, ...recentDecisions]);
            }
        }
    };

    return (
        <div className="hod-dashboard-container flex h-screen bg-[#f8fafc]">
            {/* Sidebar - Matching DeanDashboard Style */}
            <div className={`sidebar ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed inset-y-0 left-0 z-40 w-80 bg-[#400f0f] border-r border-[#F6DD26]/20 transition-transform duration-300 ease-in-out`}>
                <div className="p-6 border-b border-gray-700/50">
                    <h1 className="text-2xl font-bold text-white mb-1">HOD Panel</h1>
                    <p className="text-sm text-gray-400">Department Management</p>
                </div>

                <nav className="p-4 space-y-2 pb-24 overflow-y-auto h-[calc(100vh-180px)]">
                    {[
                        { id: 'dashboard', label: 'Overview', sub: 'Metrics & Stats', icon: 'fa-tachometer-alt' },
                        { id: 'pending-approvals', label: 'Pending Approvals', sub: 'Request Review', icon: 'fa-clock', badge: pendingRequests.length },
                        { id: 'reservations', label: 'Reservations', sub: 'Dept. Vehicles', icon: 'fa-calendar-alt' },
                        { id: 'department-staff', label: 'Staff Management', sub: 'Users & Activity', icon: 'fa-users' },
                        { id: 'reports', label: 'Reports', sub: 'Usage Reports', icon: 'fa-file-alt' },
                        { id: 'analytics', label: 'Analytics', sub: 'Performance', icon: 'fa-chart-line' },
                        { id: 'settings', label: 'Settings', sub: 'Configuration', icon: 'fa-cog' }
                    ].map(item => (
                        <div
                            key={item.id}
                            className={`nav-item p-4 cursor-pointer rounded-xl border border-transparent transition-all duration-200 ${activeSection === item.id ? 'active bg-gradient-to-br from-[#660000] to-[#800000] border-[#F6DD26] shadow-red-900/50 shadow-lg' : 'hover:bg-[#541515] border-gray-700/30'}`}
                            onClick={() => handleSectionChange(item.id)}
                        >
                            <div className="flex items-center space-x-3">
                                <i className={`fas ${item.icon} text-lg w-6 text-center ${activeSection === item.id ? 'text-[#F6DD26]' : 'text-gray-400'}`}></i>
                                <div className="flex-1">
                                    <div className={`font-medium ${activeSection === item.id ? 'text-white' : 'text-gray-200'}`}>{item.label}</div>
                                    <div className={`text-xs ${activeSection === item.id ? 'text-yellow-100' : 'text-gray-400'}`}>{item.sub}</div>
                                </div>
                                {item.badge > 0 && (
                                    <span className="bg-[#F6DD26] text-[#660000] text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">{item.badge}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="fixed bottom-0 left-0 w-80 p-4 bg-[#400f0f] border-t border-[#F6DD26]/20">
                    <button onClick={handleLogout} className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 flex items-center justify-center text-gray-200 font-medium">
                        <i className="fas fa-sign-out-alt mr-2"></i> Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 lg:ml-80 flex flex-col min-h-screen">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-8 py-5 sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 capitalize flex items-center gap-2">
                                {activeSection.replace('-', ' ')}
                            </h1>
                            <p className="text-slate-500 text-sm">Computer Science Department</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button className="p-2 text-slate-400 hover:text-slate-600 relative transition-colors">
                                <i className="fas fa-bell text-xl"></i>
                                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">3</span>
                            </button>
                            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                                <div className="text-right hidden md:block">
                                    <p className="text-sm font-bold text-slate-800">Department Head</p>
                                    <p className="text-xs text-slate-500">Computer Science</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#660000] to-[#800000] flex items-center justify-center text-[#F6DD26] font-bold border-2 border-[#F6DD26] shadow-sm">
                                    H
                                </div>
                            </div>
                            <button onClick={toggleSidebar} className="lg:hidden p-2 text-gray-500 hover:text-gray-800">
                                <i className="fas fa-bars text-xl"></i>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="p-8 flex-1 overflow-y-auto bg-slate-50">
                    {activeSection === 'dashboard' && (
                        <div className="space-y-8 animation-fade-in">
                            {/* Welcome Banner */}
                            <div className="bg-gradient-to-r from-[#660000] to-[#800000] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <h1 className="text-3xl font-bold mb-2">Welcome Back, Head of Department!</h1>
                                    <p className="text-yellow-100 text-lg opacity-90">Manage your department's fleet requests efficiently.</p>
                                    <div className="mt-6 flex items-center text-sm text-[#F6DD26] bg-black/20 w-fit px-4 py-2 rounded-lg backdrop-blur-sm border border-[#F6DD26]/20">
                                        <i className="far fa-clock mr-2"></i>
                                        Last login: Today at 8:45 AM
                                    </div>
                                </div>
                                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 skew-x-[-20deg]"></div>
                            </div>

                            {/* Stats Grid - Tailwind Style */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[
                                    { label: 'Pending Approvals', value: pendingRequests.length, icon: 'fa-clock', color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
                                    { label: 'Approved Today', value: '5', icon: 'fa-check-circle', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
                                    { label: 'Active Reservations', value: '12', icon: 'fa-car', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
                                    { label: 'Dept. Staff', value: '24', icon: 'fa-users', color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' }
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
                                {/* Recent Requests List */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-bold text-slate-800"><i className="fas fa-tasks mr-2 text-slate-400"></i>Pending Requests</h3>
                                            <button onClick={() => setActiveSection('pending-approvals')} className="text-[#660000] hover:text-[#800000] text-sm font-medium hover:underline">View All</button>
                                        </div>

                                        {pendingRequests.length === 0 ? (
                                            <div className="text-center py-10 text-gray-400">
                                                <i className="fas fa-check-circle text-4xl mb-3 text-gray-300"></i>
                                                <p>No pending requests.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {pendingRequests.slice(0, 3).map(req => (
                                                    <div key={req.id} className="p-4 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className="font-bold text-slate-800">{req.lecturer}</h4>
                                                                <p className="text-sm text-slate-500 mt-1"><i className="fas fa-map-marker-alt text-[#660000] mr-1"></i> {req.destination}</p>
                                                                <p className="text-xs text-slate-400 mt-1"><i className="fas fa-clock mr-1"></i> {req.date} at {req.time}</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => reviewRequest(req.id)} className="btn btn-secondary btn-small">
                                                                    Review
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Recent Decisions */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                        <h3 className="text-xl font-bold text-slate-800 mb-4"><i className="fas fa-history mr-2 text-slate-400"></i>History</h3>
                                        <div className="space-y-4">
                                            {recentDecisions.map((d, idx) => (
                                                <div key={idx} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                                                    <div>
                                                        <p className="font-semibold text-slate-800 text-sm">{d.lecturer}</p>
                                                        <p className="text-xs text-slate-500">{d.destination}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold ${d.decision === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {d.decision.toUpperCase()}
                                                        </span>
                                                        <p className="text-[10px] text-gray-400 mt-1">{d.decidedAt}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button className="w-full mt-4 text-center text-sm text-[#660000] font-medium hover:underline">View Full History</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'pending-approvals' && (
                        <div className="space-y-6 animation-fade-in">
                            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-6 text-white mb-6 shadow-lg flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">Approval Queue</h2>
                                    <p className="text-yellow-100 opacity-90">Review and action pending fleet requests</p>
                                </div>
                                <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                                    <span className="font-bold text-2xl">{pendingRequests.length}</span> <span className="text-sm opacity-80">Pending</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {pendingRequests.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                                        <i className="fas fa-clipboard-check text-6xl text-gray-300 mb-4"></i>
                                        <h3 className="text-xl font-bold text-gray-400">All Clear!</h3>
                                        <p className="text-gray-500">You have no pending approvals.</p>
                                    </div>
                                ) : (
                                    pendingRequests.map(req => (
                                        <div key={req.id} className={`bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow ${req.distance > 150 ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-yellow-400'}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg">
                                                        {req.lecturer.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-slate-800">{req.lecturer}</h3>
                                                        <p className="text-sm text-slate-500">Submitted: {req.submittedAt}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${req.distance > 150 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {req.distance > 150 ? 'High Priority' : 'Standard'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 mb-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                <div>
                                                    <p className="text-xs text-slate-400 uppercase font-bold">Destination</p>
                                                    <p className="font-semibold text-slate-700">{req.destination}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 uppercase font-bold">Date</p>
                                                    <p className="font-semibold text-slate-700">{req.date} <span className="text-xs font-normal text-slate-500">at {req.time}</span></p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 uppercase font-bold">Usage</p>
                                                    <p className="font-semibold text-slate-700">{req.distance} km / {req.passengers} pax</p>
                                                </div>
                                            </div>

                                            <p className="text-slate-600 italic mb-6 pl-4 border-l-2 border-slate-300">"{req.purpose}"</p>

                                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                                <button onClick={() => reviewRequest(req.id)} className="btn btn-secondary">
                                                    <i className="fas fa-eye"></i> Details
                                                </button>
                                                <button onClick={() => quickApprove(req.id)} className="btn btn-success">
                                                    <i className="fas fa-check"></i> Approve
                                                </button>
                                                <button onClick={() => quickReject(req.id)} className="btn btn-danger">
                                                    <i className="fas fa-times"></i> Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Placeholder for other sections */}
                    {!['dashboard', 'pending-approvals'].includes(activeSection) && (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 animation-fade-in">
                            <i className={`fas ${activeSection === 'reservations' ? 'fa-calendar-alt' : activeSection === 'analytics' ? 'fa-chart-line' : 'fa-tools'} text-6xl text-slate-200 mb-6`}></i>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2 capitalize">{activeSection.replace('-', ' ')}</h2>
                            <p className="text-slate-500 max-w-md text-center mb-6">This module is under construction.</p>
                            <button onClick={() => setActiveSection('dashboard')} className="btn btn-primary">
                                Back to Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Approvals Modal */}
            {showModal && currentRequest && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animation-fade-in">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-[#660000] to-[#800000] p-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">Review Request #{currentRequest.id}</h3>
                            <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white transition">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-slate-500">Lecturer</p>
                                    <p className="text-slate-800 font-medium text-base">{currentRequest.lecturer}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500">Submitted</p>
                                    <p className="text-slate-800 font-medium">{currentRequest.submittedAt}</p>
                                </div>
                                <div className="col-span-2 bg-slate-50 p-3 rounded border border-slate-200">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-slate-500 text-xs uppercase font-bold">Destination</p>
                                            <p className="text-slate-800 font-bold">{currentRequest.destination}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-xs uppercase font-bold">Distance</p>
                                            <p className="text-slate-800 font-bold">{currentRequest.distance} km</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-xs uppercase font-bold">Date</p>
                                            <p className="text-slate-800">{currentRequest.date}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-xs uppercase font-bold">Passengers</p>
                                            <p className="text-slate-800">{currentRequest.passengers} Pax</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-slate-500 text-sm font-medium mb-1">Purpose</p>
                                    <p className="text-slate-700 italic bg-gray-50 p-2 rounded border-l-2 border-gray-300">"{currentRequest.purpose}"</p>
                                </div>
                            </div>

                            <hr className="border-slate-100 my-2" />

                            <div>
                                <label className="block text-slate-700 text-sm font-medium mb-2">HOD Remarks (Optional)</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800 focus:outline-none focus:border-[#660000] transition-colors"
                                    rows="3"
                                    placeholder="Add notes for Dean/Registrar..."
                                    value={approvalComments}
                                    onChange={(e) => setApprovalComments(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => processApproval('approved', approvalComments)} className="flex-1 btn btn-success">
                                    <i className="fas fa-check"></i> Approve
                                </button>
                                <button onClick={() => processApproval('rejected', approvalComments)} className="flex-1 btn btn-danger">
                                    <i className="fas fa-times"></i> Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HODDashboard;
