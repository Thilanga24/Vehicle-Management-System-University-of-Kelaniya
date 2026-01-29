import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css'; // Shared theme file

const HODDashboard = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // HOD Specific State
    const [currentRequest, setCurrentRequest] = useState(null);
    const [approvalComments, setApprovalComments] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(null); // 'approval', 'report', 'calendar', 'history'

    // Mock Data (Preserved from previous version)
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

    useEffect(() => {
        // Session validation
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        const userRole = sessionStorage.getItem('userRole');

        if (!isLoggedIn) {
            // navigate('/'); 
        }
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.clear();
        localStorage.removeItem('currentUser');
        navigate('/');
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

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

    // Modal Components
    const ApprovalModal = () => (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full transform transition-all border border-gray-100">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 border-l-4 border-[#660000] pl-3">Review Request</h3>
                        <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition">
                            <i className="fas fa-times text-xl"></i>
                        </button>
                    </div>

                    {currentRequest && (
                        <div className="space-y-4 mb-6">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#660000] to-[#800000] flex items-center justify-center text-[#F6DD26] font-bold">
                                        {currentRequest.lecturer.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">{currentRequest.lecturer}</h4>
                                        <p className="text-xs text-gray-500">Senior Lecturer</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="text-gray-600"><i className="fas fa-map-marker-alt w-5 text-[#660000]"></i> {currentRequest.destination}</div>
                                    <div className="text-gray-600"><i className="fas fa-calendar w-5 text-[#660000]"></i> {currentRequest.date}</div>
                                    <div className="text-gray-600"><i className="fas fa-users w-5 text-[#660000]"></i> {currentRequest.passengers} Pax</div>
                                    <div className="text-gray-600"><i className="fas fa-road w-5 text-[#660000]"></i> {currentRequest.distance} km</div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-200">
                                    <p className="text-sm text-gray-600 italic">"{currentRequest.purpose}"</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">HOD Comments (Optional)</label>
                                <textarea
                                    rows="3"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#660000] focus:border-[#660000] outline-none transition text-sm"
                                    placeholder="Add notes for the Dean or Registrar..."
                                    value={approvalComments}
                                    onChange={(e) => setApprovalComments(e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button onClick={() => processApproval('approved', approvalComments)} className="flex-1 btn-primary justify-center">
                            <i className="fas fa-check"></i> Approve
                        </button>
                        <button onClick={() => processApproval('rejected', approvalComments)} className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2">
                            <i className="fas fa-times"></i> Reject
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="dashboard-container">
            {/* Mobile Hamburger */}
            <div className={`lg:hidden fixed top-5 left-5 z-50 p-2 bg-[#660000] text-white rounded cursor-pointer shadow-lg transition-opacity ${sidebarOpen ? 'opacity-0' : 'opacity-100'}`} onClick={toggleSidebar}>
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
                    <div className="menu-section-title">HOD Panel</div>
                    <div className={`menu-item ${activeSection === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveSection('dashboard')}>
                        <i className="fas fa-tachometer-alt"></i>
                        <span>Overview</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'pending-approvals' ? 'active' : ''}`} onClick={() => setActiveSection('pending-approvals')}>
                        <i className="fas fa-clock"></i>
                        <span>Pending Approvals</span>
                        {pendingRequests.length > 0 && <span className="absolute right-4 bg-[#F6DD26] text-[#660000] text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingRequests.length}</span>}
                    </div>
                    <div className={`menu-item ${activeSection === 'reservations' ? 'active' : ''}`} onClick={() => setActiveSection('reservations')}>
                        <i className="fas fa-calendar-alt"></i>
                        <span>Reservations</span>
                    </div>
                </div>

                <div className="menu-section">
                    <div className="menu-section-title">Department</div>
                    <div className={`menu-item ${activeSection === 'department-staff' ? 'active' : ''}`} onClick={() => setActiveSection('department-staff')}>
                        <i className="fas fa-users"></i>
                        <span>Staff Management</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'reports' ? 'active' : ''}`} onClick={() => setActiveSection('reports')}>
                        <i className="fas fa-file-alt"></i>
                        <span>Reports</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'analytics' ? 'active' : ''}`} onClick={() => setActiveSection('analytics')}>
                        <i className="fas fa-chart-line"></i>
                        <span>Analytics</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'settings' ? 'active' : ''}`} onClick={() => setActiveSection('settings')}>
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
                        <h1>Department Dashboard <i className="fas fa-user-shield text-[#F6DD26] ml-2"></i></h1>
                        <p>Manage fleet requests and approvals</p>
                    </div>
                    <div className="top-nav-right">
                        <div className="notification-icon">
                            <i className="fas fa-bell"></i>
                            <div className="notification-badge">3</div>
                        </div>
                        <div className="user-profile">
                            <div className="user-avatar">
                                H
                            </div>
                            <div className="user-info">
                                <h4>Head of Dept</h4>
                                <p>Computer Science</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="content-area">

                    {/* DASHBOARD OVERVIEW */}
                    {activeSection === 'dashboard' && (
                        <div className="tab-content active">
                            {/* Stats Grid */}
                            <div className="stats-grid">
                                <div className="stat-card" style={{ '--gradient-start': '#f59e0b', '--gradient-end': '#d97706', '--icon-bg': 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', '--icon-shadow': 'rgba(245, 158, 11, 0.2)' }}>
                                    <div className="stat-info">
                                        <h3>{pendingRequests.length}</h3>
                                        <p>Pending Approvals</p>
                                        <div className="stat-change text-orange-600">
                                            <i className="fas fa-exclamation-circle"></i>
                                            <span>Requires Attention</span>
                                        </div>
                                    </div>
                                    <div className="stat-icon text-orange-600">
                                        <i className="fas fa-clock"></i>
                                    </div>
                                </div>
                                <div className="stat-card" style={{ '--gradient-start': '#10b981', '--gradient-end': '#059669', '--icon-bg': 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', '--icon-shadow': 'rgba(16, 185, 129, 0.2)' }}>
                                    <div className="stat-info">
                                        <h3>15</h3>
                                        <p>Approved Reports</p>
                                        <div className="stat-change positive">
                                            <i className="fas fa-arrow-up"></i>
                                            <span>This Month</span>
                                        </div>
                                    </div>
                                    <div className="stat-icon text-emerald-600">
                                        <i className="fas fa-check-double"></i>
                                    </div>
                                </div>
                                <div className="stat-card" style={{ '--gradient-start': '#3b82f6', '--gradient-end': '#2563eb', '--icon-bg': 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', '--icon-shadow': 'rgba(59, 130, 246, 0.2)' }}>
                                    <div className="stat-info">
                                        <h3>24</h3>
                                        <p>Dept Staff</p>
                                        <div className="stat-change text-blue-600">
                                            <i className="fas fa-users"></i>
                                            <span>Active Members</span>
                                        </div>
                                    </div>
                                    <div className="stat-icon text-blue-600">
                                        <i className="fas fa-user-friends"></i>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Pending List */}
                                <div className="section lg:col-span-2">
                                    <div className="section-header">
                                        <h2><i className="fas fa-tasks"></i> Recent Requests</h2>
                                        <button onClick={() => setActiveSection('pending-approvals')} className="text-xs font-medium text-gray-500 hover:text-[#660000] transition flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 hover:border-gray-200">
                                            View All <i className="fas fa-chevron-right text-[10px]"></i>
                                        </button>
                                    </div>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Lecturer</th>
                                                <th>Destination</th>
                                                <th>Date</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingRequests.length === 0 ? (
                                                <tr><td colSpan="5" className="text-center py-6 text-gray-400">No pending requests</td></tr>
                                            ) : (
                                                pendingRequests.slice(0, 5).map(req => (
                                                    <tr key={req.id}>
                                                        <td className="font-semibold">{req.lecturer}</td>
                                                        <td>{req.destination}</td>
                                                        <td>{req.date}</td>
                                                        <td><span className="badge badge-warning">Pending</span></td>
                                                        <td>
                                                            <button onClick={() => reviewRequest(req.id)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Review</button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Quick Actions / Decisions */}
                                <div className="space-y-6">
                                    <div className="section">
                                        <div className="section-header">
                                            <h2><i className="fas fa-history"></i> Decisions</h2>
                                        </div>
                                        <div className="space-y-4">
                                            {recentDecisions.slice(0, 3).map(d => (
                                                <div key={d.id} className="flex justify-between items-start border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                                    <div>
                                                        <p className="font-semibold text-gray-800 text-sm">{d.lecturer}</p>
                                                        <p className="text-xs text-gray-500">{d.destination}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`badge ${d.decision === 'approved' ? 'badge-success' : 'badge-danger'}`}>
                                                            {d.decision}
                                                        </span>
                                                        <p className="text-[10px] text-gray-400 mt-1">{d.decidedAt}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            <button className="w-full text-center text-sm text-[#660000] font-medium hover:underline mt-2">View History</button>
                                        </div>
                                    </div>


                                </div>
                            </div>
                        </div>
                    )}

                    {/* PENDING APPROVALS FULL LIST */}
                    {activeSection === 'pending-approvals' && (
                        <div className="tab-content active">
                            <div className="section">
                                <div className="section-header">
                                    <h2><i className="fas fa-clock"></i> Pending Approvals</h2>
                                    <div className="filter-section" style={{ margin: 0 }}>
                                        <select className="border border-gray-300 rounded-lg p-2 text-sm">
                                            <option>All Requests</option>
                                            <option>High Priority</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {pendingRequests.map(request => (
                                        <div key={request.id} className={`vehicle-card ${request.distance > 100 ? 'border-l-4 border-l-red-500' : ''}`}>
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl text-gray-600 font-bold border-2 border-white shadow-sm">
                                                        {request.lecturer.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-800 m-0">{request.lecturer}</h3>
                                                        <p className="text-sm text-gray-500">Submitted: {request.submittedAt}</p>
                                                    </div>
                                                </div>
                                                <span className={`badge ${request.distance > 100 ? 'badge-danger' : 'badge-warning'} mt-2 md:mt-0`}>
                                                    {request.distance > 100 ? 'High Distance (>100km)' : 'Standard Request'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Destination</p>
                                                    <p className="font-semibold text-gray-800"><i className="fas fa-map-marker-alt text-[#660000] mr-2"></i>{request.destination}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Date & Time</p>
                                                    <p className="font-semibold text-gray-800"><i className="fas fa-calendar-day text-[#660000] mr-2"></i>{request.date} at {request.time}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Details</p>
                                                    <p className="text-sm text-gray-700">
                                                        <span className="mr-3"><i className="fas fa-users mr-1"></i> {request.passengers}</span>
                                                        <span><i className="fas fa-tachometer-alt mr-1"></i> {request.distance} km</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <p className="text-gray-600 text-sm mb-6 italic border-l-2 border-gray-300 pl-3">
                                                "{request.purpose}"
                                            </p>

                                            <div className="flex gap-3 justify-end border-t border-gray-100 pt-4">
                                                <button onClick={() => reviewRequest(request.id)} className="btn btn-outline btn-small">View Details</button>
                                                <button onClick={() => quickApprove(request.id)} className="btn btn-primary btn-small bg-[#10b981] hover:bg-[#059669] border-none shadow-none"><i className="fas fa-check"></i> Quick Approve</button>
                                                <button onClick={() => quickReject(request.id)} className="btn btn-outline btn-small border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"><i className="fas fa-times"></i> Reject</button>
                                            </div>
                                        </div>
                                    ))}
                                    {pendingRequests.length === 0 && (
                                        <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                                            <i className="fas fa-check-circle text-4xl mb-3 text-green-500 opacity-50"></i>
                                            <p>All caught up! No pending requests.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ANALYTICS DASHBOARD */}
                    {activeSection === 'analytics' && (
                        <div className="tab-content active animation-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-[#1e293b]">Analytics Dashboard</h2>
                                    <p className="text-gray-500 text-sm">Detailed insights and performance metrics</p>
                                </div>
                                <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                                    <i className="fas fa-clock mr-2 text-[#660000]"></i> Last login: Today at 8:45 AM
                                </div>
                            </div>

                            {/* Analytics Stats Grid */}
                            <div className="stats-grid">
                                <div className="stat-card" style={{ '--gradient-start': '#3b82f6', '--gradient-end': '#2563eb', '--icon-bg': 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', '--icon-shadow': 'rgba(59, 130, 246, 0.2)' }}>
                                    <div className="stat-info">
                                        <h3 className="text-3xl">89%</h3>
                                        <p>Approval Rate</p>
                                        <div className="stat-change positive">
                                            <i className="fas fa-arrow-up"></i>
                                            <span>5% from last month</span>
                                        </div>
                                    </div>
                                    <div className="stat-icon text-blue-600">
                                        <i className="fas fa-thumbs-up"></i>
                                    </div>
                                </div>
                                <div className="stat-card" style={{ '--gradient-start': '#8b5cf6', '--gradient-end': '#7c3aed', '--icon-bg': 'linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%)', '--icon-shadow': 'rgba(139, 92, 246, 0.2)' }}>
                                    <div className="stat-info">
                                        <h3 className="text-3xl">4.2h</h3>
                                        <p>Avg. Processing Time</p>
                                        <div className="stat-change positive">
                                            <i className="fas fa-arrow-down"></i>
                                            <span>0.8h from last month</span>
                                        </div>
                                    </div>
                                    <div className="stat-icon text-purple-600">
                                        <i className="fas fa-stopwatch"></i>
                                    </div>
                                </div>
                                <div className="stat-card" style={{ '--gradient-start': '#10b981', '--gradient-end': '#059669', '--icon-bg': 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', '--icon-shadow': 'rgba(16, 185, 129, 0.2)' }}>
                                    <div className="stat-info">
                                        <h3 className="text-xl">Dr. Silva</h3>
                                        <p>Most Active Lecturer</p>
                                        <div className="stat-change text-emerald-600">
                                            <i className="fas fa-car"></i>
                                            <span>15 trips this month</span>
                                        </div>
                                    </div>
                                    <div className="stat-icon text-emerald-600">
                                        <i className="fas fa-user-graduate"></i>
                                    </div>
                                </div>
                                <div className="stat-card" style={{ '--gradient-start': '#f59e0b', '--gradient-end': '#d97706', '--icon-bg': 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', '--icon-shadow': 'rgba(245, 158, 11, 0.2)' }}>
                                    <div className="stat-info">
                                        <h3 className="text-xl">Wednesday</h3>
                                        <p>Peak Usage Day</p>
                                        <div className="stat-change text-orange-600">
                                            <i className="fas fa-chart-line"></i>
                                            <span>35% of weekly trips</span>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Department Analytics Section */}
                            <div className="section">
                                <div className="section-header">
                                    <h2><i className="fas fa-chart-pie"></i> Department Analytics</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Trip Categories */}
                                    <div>
                                        <h3 className="font-bold text-gray-700 mb-4 text-lg">Trip Categories</h3>
                                        <div className="space-y-4">
                                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                <div className="flex justify-between mb-1">
                                                    <span className="font-semibold text-gray-700">Academic Conferences</span>
                                                    <span className="font-bold text-blue-600">45%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                <div className="flex justify-between mb-1">
                                                    <span className="font-semibold text-gray-700">Field Research</span>
                                                    <span className="font-bold text-emerald-600">30%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: '30%' }}></div>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                <div className="flex justify-between mb-1">
                                                    <span className="font-semibold text-gray-700">Official Meetings</span>
                                                    <span className="font-bold text-purple-600">25%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '25%' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Monthly Trends */}
                                    <div>
                                        <h3 className="font-bold text-gray-700 mb-4 text-lg">Monthly Trends</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                        <i className="fas fa-calendar-alt"></i>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-800">September 2025</h4>
                                                        <p className="text-xs text-gray-500">22 Trips Completed</p>
                                                    </div>
                                                </div>
                                                <span className="text-xl font-bold text-indigo-600">22</span>
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                                        <i className="fas fa-calendar-alt"></i>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-800">August 2025</h4>
                                                        <p className="text-xs text-gray-500">18 Trips Completed</p>
                                                    </div>
                                                </div>
                                                <span className="text-xl font-bold text-gray-600">18</span>
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                        <i className="fas fa-calendar-alt"></i>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-800">July 2025</h4>
                                                        <p className="text-xs text-gray-500">25 Trips Completed</p>
                                                    </div>
                                                </div>
                                                <span className="text-xl font-bold text-blue-600">25</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* RESERVATIONS DASHBOARD */}
                    {activeSection === 'reservations' && (
                        <div className="tab-content active animation-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-[#1e293b]">Department Reservations</h2>
                                    <p className="text-gray-500 text-sm">Manage and track all department vehicle reservations</p>
                                </div>
                                <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                                    <i className="fas fa-clock mr-2 text-[#660000]"></i> Last login: Today at 8:45 AM
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Reservations List */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg">
                                                    S
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-800 text-lg">Dr. Silva <span className="text-gray-400 font-normal text-sm mx-1">-</span> University of Jaffna</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="badge badge-success">Approved</span>
                                                        <span className="text-xs text-slate-500"><i className="fas fa-calendar-alt mr-1"></i> Oct 15, 2025</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="text-gray-400 hover:text-blue-600"><i className="fas fa-ellipsis-v"></i></button>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-4 pl-16">
                                            Field visit for B.Sc. students to observe data center operations.
                                        </p>
                                        <div className="pl-16 flex flex-wrap gap-4 text-sm font-medium text-slate-700">
                                            <span className="bg-slate-50 px-3 py-1 rounded border border-slate-200"><i className="fas fa-shuttle-van text-[#660000] mr-2"></i>VAN-001</span>
                                            <span className="bg-slate-50 px-3 py-1 rounded border border-slate-200"><i className="fas fa-users text-[#660000] mr-2"></i>5 passengers</span>
                                            <span className="bg-slate-50 px-3 py-1 rounded border border-slate-200"><i className="fas fa-road text-[#660000] mr-2"></i>180km</span>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-orange-400">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">
                                                    P
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-800 text-lg">Dr. Perera <span className="text-gray-400 font-normal text-sm mx-1">-</span> Kandy Conference</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="badge badge-warning">In Progress</span>
                                                        <span className="text-xs text-slate-500"><i className="fas fa-calendar-alt mr-1"></i> Oct 18, 2025</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="text-gray-400 hover:text-blue-600"><i className="fas fa-ellipsis-v"></i></button>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-4 pl-16">
                                            Attending International Conference on Computer Science.
                                        </p>
                                        <div className="pl-16 flex flex-wrap gap-4 text-sm font-medium text-slate-700">
                                            <span className="bg-slate-50 px-3 py-1 rounded border border-slate-200"><i className="fas fa-car text-[#660000] mr-2"></i>CAR-002</span>
                                            <span className="bg-slate-50 px-3 py-1 rounded border border-slate-200"><i className="fas fa-users text-[#660000] mr-2"></i>3 passengers</span>
                                            <span className="bg-slate-50 px-3 py-1 rounded border border-slate-200"><i className="fas fa-road text-[#660000] mr-2"></i>120km</span>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 opacity-75">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-lg">
                                                    F
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-800 text-lg">Prof. Fernando <span className="text-gray-400 font-normal text-sm mx-1">-</span> Colombo University</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="badge bg-gray-200 text-gray-700">Completed</span>
                                                        <span className="text-xs text-slate-500"><i className="fas fa-calendar-alt mr-1"></i> Oct 12, 2025</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="text-gray-400 hover:text-blue-600"><i className="fas fa-ellipsis-v"></i></button>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-4 pl-16">
                                            Research collaboration meeting.
                                        </p>
                                        <div className="pl-16 flex flex-wrap gap-4 text-sm font-medium text-slate-700">
                                            <span className="bg-slate-50 px-3 py-1 rounded border border-slate-200"><i className="fas fa-car text-[#660000] mr-2"></i>CAR-001</span>
                                            <span className="bg-slate-50 px-3 py-1 rounded border border-slate-200"><i className="fas fa-users text-[#660000] mr-2"></i>2 passengers</span>
                                            <span className="bg-slate-50 px-3 py-1 rounded border border-slate-200"><i className="fas fa-road text-[#660000] mr-2"></i>85km</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Reservation Stats Sidebar */}
                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Reservation Stats</h3>

                                        <div className="text-center mb-6">
                                            <div className="text-4xl font-bold text-[#660000] mb-1">18</div>
                                            <p className="text-sm text-gray-500 uppercase tracking-widest font-semibold">This Month</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                                    <span className="text-gray-600 text-sm">Completed</span>
                                                </div>
                                                <span className="font-bold text-gray-800">15</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                                                    <span className="text-gray-600 text-sm">In Progress</span>
                                                </div>
                                                <span className="font-bold text-gray-800">2</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                                    <span className="text-gray-600 text-sm">Cancelled</span>
                                                </div>
                                                <span className="font-bold text-gray-800">1</span>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-gray-100">
                                            <button className="w-full btn-primary btn-small justify-center">
                                                <i className="fas fa-plus mr-2"></i> New Request
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-linear-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-lg text-white">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <p className="text-slate-400 text-xs uppercase font-bold tracking-widest">Next Scheduled</p>
                                                <h3 className="text-xl font-bold mt-1">Oct 20, 2025</h3>
                                            </div>
                                            <div className="bg-white/10 p-2 rounded-lg"><i className="fas fa-calendar-check text-[#F6DD26]"></i></div>
                                        </div>
                                        <p className="text-sm text-slate-300 mb-2">Dr. Silva - Colombo Visit</p>
                                        <div className="flex gap-2">
                                            <span className="text-xs bg-black/20 px-2 py-1 rounded">08:00 AM</span>
                                            <span className="text-xs bg-black/20 px-2 py-1 rounded">Nissan Caravan</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STAFF MANAGEMENT DASHBOARD */}
                    {activeSection === 'department-staff' && (
                        <div className="tab-content active animation-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-[#1e293b]">Department Staff</h2>
                                    <p className="text-gray-500 text-sm">Monitor staff activity and vehicle usage patterns</p>
                                </div>
                                <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                                    <i className="fas fa-clock mr-2 text-[#660000]"></i> Last login: Today at 8:45 AM
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Staff List */}
                                <div className="lg:col-span-2 space-y-4">
                                    {/* Dr. Silva */}
                                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xl group-hover:bg-[#660000] group-hover:text-[#F6DD26] transition-colors relative">
                                                S
                                                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-lg">Dr. Silva</h3>
                                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Senior Lecturer | Computer Science</p>
                                                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                                                    <span><i className="fas fa-file-signature text-orange-500 mr-1"></i> <b>2</b> Active requests</span>
                                                    <span><i className="fas fa-route text-blue-500 mr-1"></i> <b>15</b> Total trips</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="badge badge-success mb-2 inline-block">Active</span>
                                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="text-gray-400 hover:text-blue-600 p-1"><i className="fas fa-edit"></i></button>
                                                <button className="text-gray-400 hover:text-red-500 p-1"><i className="fas fa-trash"></i></button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dr. Perera */}
                                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xl group-hover:bg-[#660000] group-hover:text-[#F6DD26] transition-colors relative">
                                                P
                                                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-lg">Dr. Perera</h3>
                                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Associate Professor | Software Engineering</p>
                                                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                                                    <span><i className="fas fa-file-signature text-orange-500 mr-1"></i> <b>1</b> Active requests</span>
                                                    <span><i className="fas fa-route text-blue-500 mr-1"></i> <b>12</b> Total trips</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="badge badge-success mb-2 inline-block">Active</span>
                                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="text-gray-400 hover:text-blue-600 p-1"><i className="fas fa-edit"></i></button>
                                                <button className="text-gray-400 hover:text-red-500 p-1"><i className="fas fa-trash"></i></button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Prof. Fernando */}
                                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xl group-hover:bg-[#660000] group-hover:text-[#F6DD26] transition-colors relative">
                                                F
                                                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full"></span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-lg">Prof. Fernando</h3>
                                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Professor | Data Science</p>
                                                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                                                    <span><i className="fas fa-file-signature text-gray-400 mr-1"></i> <b>0</b> Active requests</span>
                                                    <span><i className="fas fa-route text-blue-500 mr-1"></i> <b>8</b> Total trips</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="px-2 py-0.5 rounded textxs font-semibold bg-blue-100 text-blue-700 inline-block mb-2">Available</div>
                                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="text-gray-400 hover:text-blue-600 p-1"><i className="fas fa-edit"></i></button>
                                                <button className="text-gray-400 hover:text-red-500 p-1"><i className="fas fa-trash"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar Stats */}
                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="font-bold text-gray-800 mb-6 border-b border-gray-100 pb-2">Staff Summary</h3>

                                        <div className="space-y-5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                                        <i className="fas fa-users"></i>
                                                    </div>
                                                    <span className="font-medium text-gray-700">Total Staff</span>
                                                </div>
                                                <span className="font-bold text-xl text-gray-900">25</span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                        <i className="fas fa-user-check"></i>
                                                    </div>
                                                    <span className="font-medium text-gray-700">Active Users</span>
                                                </div>
                                                <span className="font-bold text-xl text-gray-900">18</span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                                                        <i className="fas fa-clock"></i>
                                                    </div>
                                                    <span className="font-medium text-gray-700">Pending Requests</span>
                                                </div>
                                                <span className="font-bold text-xl text-gray-900">3</span>
                                            </div>
                                        </div>

                                        <button className="w-full mt-8 py-2.5 border border-[#660000] text-[#660000] font-semibold rounded-lg hover:bg-[#660000] hover:text-white transition flex items-center justify-center gap-2">
                                            <i className="fas fa-user-plus"></i> Add New Staff
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Setting Tab */}
                    {activeSection === 'settings' && (
                        <div className="tab-content active animation-fade-in">
                            <div className="section border-l-4 border-l-[#660000]">
                                <div className="section-header">
                                    <h2 className="text-[#660000]"><i className="fas fa-cog"></i> System Settings</h2>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                                    {/* Security Settings */}
                                    <div>
                                        <h3 className="text-lg font-bold text-[#660000] mb-4 border-b border-[#F6DD26] pb-2">
                                            <i className="fas fa-shield-alt mr-2 text-[#660000]"></i>Security
                                        </h3>
                                        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Password updated successfully'); }}>
                                            <div className="filter-item">
                                                <label className="text-gray-700">Current Password</label>
                                                <input type="password" placeholder="••••••••" className="w-full border-gray-200 focus:border-[#660000] bg-gray-50 text-gray-900 placeholder:text-gray-400" />
                                            </div>
                                            <div className="filter-item">
                                                <label className="text-gray-700">New Password</label>
                                                <input type="password" placeholder="••••••••" className="w-full border-gray-200 focus:border-[#660000] bg-gray-50 text-gray-900 placeholder:text-gray-400" />
                                            </div>
                                            <div className="filter-item">
                                                <label className="text-gray-700">Confirm Password</label>
                                                <input type="password" placeholder="••••••••" className="w-full border-gray-200 focus:border-[#660000] bg-gray-50 text-gray-900 placeholder:text-gray-400" />
                                            </div>
                                            <button className="btn btn-primary w-full mt-4 bg-[#660000] hover:bg-[#800000] border-none text-white shadow-md">Update Password</button>
                                        </form>
                                    </div>

                                    {/* Help & Support */}
                                    <div>
                                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl shadow-lg">
                                            <h4 className="text-[#660000] font-bold mb-3 text-lg flex items-center">
                                                <i className="fas fa-info-circle mr-3 text-[#660000] text-xl"></i>
                                                Help & Support
                                            </h4>
                                            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                                                Need assistance? Contact the administration office for help with account issues or vehicle policies.
                                            </p>
                                            <button className="w-full py-3 px-4 bg-[#660000] hover:bg-[#800000] text-white rounded-lg font-medium transition flex items-center justify-center gap-2 shadow-sm">
                                                <i className="fas fa-file-download text-[#F6DD26]"></i>
                                                Download System Manual
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    )}

                    {/* REPORTS SECTION */}
                    {activeSection === 'reports' && (
                        <div className="tab-content active animation-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-[#1e293b]">Reports Center</h2>
                                    <p className="text-gray-500 text-sm">Generate and manage department vehicle reports</p>
                                </div>
                                <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                                    <i className="fas fa-clock mr-2 text-[#660000]"></i> Last login: Today at 8:45 AM
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Generate Reports */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Reports & Documentation</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="border border-gray-200 rounded-lg p-4 hover:border-[#660000] hover:shadow-md transition cursor-pointer group">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-3 group-hover:bg-[#660000] group-hover:text-[#F6DD26] transition-colors">
                                                    <i className="fas fa-file-alt"></i>
                                                </div>
                                                <h4 className="font-bold text-gray-800">Department Summary</h4>
                                                <p className="text-xs text-gray-500 mt-1">Complete overview of department activities</p>
                                                <button className="mt-3 text-xs font-bold text-blue-600 group-hover:text-[#660000]">Generate Report <i className="fas fa-arrow-right ml-1"></i></button>
                                            </div>

                                            <div className="border border-gray-200 rounded-lg p-4 hover:border-[#660000] hover:shadow-md transition cursor-pointer group">
                                                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3 group-hover:bg-[#660000] group-hover:text-[#F6DD26] transition-colors">
                                                    <i className="fas fa-check-circle"></i>
                                                </div>
                                                <h4 className="font-bold text-gray-800">Approval Statistics</h4>
                                                <p className="text-xs text-gray-500 mt-1">Detailed approval patterns and trends</p>
                                                <button className="mt-3 text-xs font-bold text-emerald-600 group-hover:text-[#660000]">Generate Report <i className="fas fa-arrow-right ml-1"></i></button>
                                            </div>

                                            <div className="border border-gray-200 rounded-lg p-4 hover:border-[#660000] hover:shadow-md transition cursor-pointer group">
                                                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 mb-3 group-hover:bg-[#660000] group-hover:text-[#F6DD26] transition-colors">
                                                    <i className="fas fa-chart-bar"></i>
                                                </div>
                                                <h4 className="font-bold text-gray-800">Usage Analytics</h4>
                                                <p className="text-xs text-gray-500 mt-1">Vehicle utilization and efficiency metrics</p>
                                                <button className="mt-3 text-xs font-bold text-orange-600 group-hover:text-[#660000]">Generate Report <i className="fas fa-arrow-right ml-1"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Files */}
                                <div>
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
                                        <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Recent Reports</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                                                        <i className="fas fa-file-pdf text-xl"></i>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-700 text-sm">Monthly Department Report - September 2025</p>
                                                        <p className="text-xs text-gray-500">Generated on Oct 1, 2025</p>
                                                    </div>
                                                </div>
                                                <i className="fas fa-download text-gray-400 hover:text-[#660000]"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Modals Layer */}
            {showModal && modalType === 'approval' && <ApprovalModal />}
        </div>
    );
};

export default HODDashboard;
