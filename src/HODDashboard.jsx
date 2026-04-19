import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
import './HODDashboard.css';

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

const HODDashboard = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [settingsSubTab, setSettingsSubTab] = useState('security');

    // HOD Specific State
    const [currentRequest, setCurrentRequest] = useState(null);
    const [approvalComments, setApprovalComments] = useState('');
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('currentUser') || '{"name": "HOD", "department": "Department"}'));

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

    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(null); // 'approval', 'report', 'calendar', 'history'
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelRequestId, setCancelRequestId] = useState(null);

    const [reservations, setReservations] = useState([]);
    const [users, setUsers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });

    const showNotification = (message, type = 'info') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'info' }), 4000);
    };

    // --- Analytics Data Processing ---
    const getMonthlyTrend = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const counts = new Array(12).fill(0);

        departmentReservations.forEach(r => {
            const month = new Date(r.start_datetime).getMonth();
            counts[month]++;
        });

        return {
            labels: months,
            datasets: [{
                label: 'Trip Count',
                data: counts,
                fill: true,
                backgroundColor: 'rgba(102, 0, 0, 0.1)',
                borderColor: '#660000',
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#660000'
            }]
        };
    };

    const getStatusDistribution = () => {
        const statusMap = {
            approved: departmentReservations.filter(r => r.status === 'approved').length,
            pending: departmentReservations.filter(r => r.status === 'pending' || r.status.startsWith('pending_')).length,
            rejected: departmentReservations.filter(r => r.status === 'rejected').length,
            cancelled: departmentReservations.filter(r => r.status === 'cancelled').length
        };

        return {
            labels: ['Approved', 'Pending', 'Rejected', 'Cancelled'],
            datasets: [{
                data: [statusMap.approved, statusMap.pending, statusMap.rejected, statusMap.cancelled],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#64748b'],
                borderWidth: 0,
                hoverOffset: 15
            }]
        };
    };

    const getKPIs = () => {
        const total = departmentReservations.length;
        const approved = departmentReservations.filter(r => r.status === 'approved').length;
        const efficiency = total > 0 ? Math.round((approved / total) * 100) : 0;
        const distance = departmentReservations.reduce((acc, curr) => acc + (curr.distance_km || 0), 0);
        const uniqueStaff = new Set(departmentReservations.map(r => r.requester_id)).size;

        return { efficiency, distance, uniqueStaff };
    };

    const fetchNotifications = async () => {
        try {
            if (!user?.id) return;
            const response = await fetch(`/api/notifications/${user.id}`);
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
            const response = await fetch(`/api/notifications/${id}/read`, {
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
                await fetch(`/api/notifications/${n.notification_id}/read`, {
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
            const token = sessionStorage.getItem('authToken');
            const response = await fetch('/api/reservations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
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

    const fetchUsers = async () => {
        try {
            const token = sessionStorage.getItem('authToken');
            const response = await fetch('/api/auth/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchVehicles = async () => {
        try {
            const token = sessionStorage.getItem('authToken');
            const response = await fetch('/api/vehicles', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setVehicles(data);
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        }
    };

    useEffect(() => {
        fetchReservations();
        fetchUsers();
        fetchVehicles();
        fetchNotifications();

        // Polling for updates
        const interval = setInterval(() => {
            fetchReservations();
            fetchUsers();
            fetchVehicles();
            fetchNotifications();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    // Helper to format date/time from MySQL datetime
    const formatDateTime = (dt) => {
        if (!dt) return { date: 'N/A', time: 'N/A' };
        const d = new Date(dt);
        return {
            date: d.toLocaleDateString(),
            time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            relative: 'Just now' // Simplified for now
        };
    };

    // Filtered lists for the HOD
    const departmentReservations = reservations.filter(r => r.department === user.department);
    const departmentUsers = users.filter(u => u.department === user.department);
    const pendingRequests = departmentReservations
        .filter(r => r.status === 'pending')
        .map(r => {
            const dt = formatDateTime(r.start_datetime);
            return {
                id: r.reservation_id,
                lecturer: `${r.first_name || ''} ${r.last_name || 'Staff'}`,
                destination: r.destination,
                date: dt.date,
                time: dt.time,
                passengers: r.passengers_count,
                distance: r.distance_km,
                purpose: r.description,
                remarks: r.remarks,
                attachment_url: r.attachment_url,
                emergency_contact: r.emergency_contact,
                submittedAt: new Date(r.created_at).toLocaleDateString()
            };
        });

    const recentDecisions = departmentReservations
        .filter(r => r.hod_approval_status !== 'pending')
        .slice(0, 5)
        .map(r => ({
            id: r.reservation_id,
            lecturer: `${r.first_name || ''} ${r.last_name || 'Staff'}`,
            destination: r.destination,
            decision: r.hod_approval_status,
            date: new Date(r.start_datetime).toLocaleDateString(),
            decidedAt: 'Recently'
        }));

    // Personal Bookings for the HOD
    const myPendingBookings = departmentReservations.filter(r =>
        r.requester_id === user.id &&
        (r.status === 'pending' || r.status.startsWith('pending_'))
    );

    const myPastBookings = departmentReservations.filter(r =>
        r.requester_id === user.id &&
        (r.status === 'completed' || r.status === 'rejected' || r.status === 'cancelled')
    );

    const myActiveBookings = departmentReservations.filter(r =>
        r.requester_id === user.id &&
        r.status === 'approved'
    );

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

    const handleDownloadPDF = () => {
        try {
            const doc = new jsPDF();

            // Add Logo
            // Note: Using relative path from public folder
            const logoPath = '/assets/uok_logo.png';
            doc.addImage(logoPath, 'PNG', 14, 10, 25, 25);

            // Add University Header
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(102, 0, 0); // UoK Red
            doc.text('UNIVERSITY OF KELANIYA', 45, 18);

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            doc.text('TRANSPORT DIVISION', 45, 25);

            // Add Divider
            doc.setDrawColor(102, 0, 0);
            doc.setLineWidth(0.5);
            doc.line(14, 38, 196, 38);

            // Report Title info
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text('Monthly Travel Report', 14, 52);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100);
            doc.text(`Department: ${user.department}`, 14, 60);
            doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, 65);

            // Create Table
            const tableColumn = ["ID", "Lecturer", "Destination", "Date", "Status"];
            const tableRows = departmentReservations.map(req => [
                req.reservation_id,
                `${req.first_name} ${req.last_name}`,
                req.destination,
                new Date(req.start_datetime).toLocaleDateString(),
                req.status.toUpperCase()
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 75,
                theme: 'striped',
                headStyles: { fillColor: [102, 0, 0], fontSize: 10, cellPadding: 4 },
                bodyStyles: { fontSize: 9 },
                alternateRowStyles: { fillColor: [248, 250, 252] }
            });

            doc.save(`Travel_Report_${user.department.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
            showNotification('PDF Report generated successfully!', 'success');
        } catch (error) {
            console.error('PDF Generation Error:', error);
            showNotification('Failed to generate PDF report.', 'error');
        }
    };

    const handleDownloadCSV = () => {
        try {
            const headers = ["ID", "Lecturer", "Email", "Destination", "Date", "Passengers", "Distance(km)", "Status"];
            const rows = departmentReservations.map(req => [
                req.reservation_id,
                `"${req.first_name} ${req.last_name}"`,
                req.email,
                `"${req.destination}"`,
                new Date(req.start_datetime).toLocaleDateString(),
                req.passengers_count,
                req.distance_km,
                req.status
            ]);

            const csvContent = [
                headers.join(","),
                ...rows.map(row => row.join(","))
            ].join("\n");

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `Staff_Activity_${user.department.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showNotification('CSV Audit log exported successfully!', 'success');
        } catch (error) {
            console.error('CSV Export Error:', error);
            showNotification('Failed to export CSV.', 'error');
        }
    };

    const processApproval = async (decision, comments = '') => {
        if (!currentRequest) return;

        try {
            const response = await fetch(`/api/reservations/${currentRequest.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: decision,
                    level: 'hod',
                    comments: comments
                })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification(data.message || `Request ${decision} successfully!`, 'success');
                fetchReservations(); // Refresh data
            } else {
                showNotification(data.message || 'Failed to update status', 'error');
            }
        } catch (error) {
            console.error('Approval Error:', error);
            showNotification('Error processing approval', 'error');
        }

        setShowModal(false);
        setCurrentRequest(null);
        setApprovalComments('');
    };

    const quickApprove = (requestId) => {
        setPendingAction({ id: requestId, type: 'approve' });
        setShowConfirm(true);
    };

    const quickReject = (requestId) => {
        setPendingAction({ id: requestId, type: 'reject' });
        setRejectionReason('');
        setShowConfirm(true);
    };

    const handleConfirmAction = async () => {
        if (!pendingAction) return;

        const isApprove = pendingAction.type === 'approve';

        if (!isApprove && !rejectionReason.trim()) {
            showNotification('Please provide a reason for rejection', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/reservations/${pendingAction.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: isApprove ? 'approved' : 'rejected',
                    level: 'hod',
                    comments: isApprove ? '' : rejectionReason
                })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification(data.message || `Request ${isApprove ? 'approved' : 'rejected'} successfully!`, 'success');
                fetchReservations();
            } else {
                showNotification(data.message || `Failed to ${pendingAction.type} request`, 'error');
            }
        } catch (error) {
            console.error(`Quick ${pendingAction.type} error:`, error);
            showNotification('Connection error', 'error');
        } finally {
            setShowConfirm(false);
            setPendingAction(null);
            setRejectionReason('');
        }
    };

    const handleCancelRequest = (id) => {
        setCancelRequestId(id);
        setShowCancelModal(true);
    };

    const confirmCancelRequest = async () => {
        if (!cancelRequestId) return;

        try {
            const token = sessionStorage.getItem('authToken');
            const response = await fetch(`/api/reservations/${cancelRequestId}`, {
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

    return (
        <div className="hod-dashboard-container flex h-screen bg-[#f8fafc]">
            {/* Sidebar Navigation */}
            {/* Sidebar Navigation */}
            <div className={`sidebar bg-[#1a0505] w-80 fixed h-full z-40 transition-transform duration-300 flex flex-col border-r border-[#F6DD26]/20 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-6 border-b border-white/10 shrink-0">
                    <div className="flex flex-col items-center mb-4">
                        <img src="/assets/banner.png" alt="University of Kelaniya" className="w-44 h-auto object-contain mb-4" />
                        <div className="text-center">
                            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">HOD Portal</h1>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Personnel Management Portal</p>
                        </div>
                    </div>
                </div>

                <nav className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="menu-section">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-4">Main Navigation</p>
                        {[
                            { id: 'dashboard', label: 'Dashboard Overview', icon: 'fa-tachometer-alt' },
                            { id: 'pending-approvals', label: 'Pending Approvals', icon: 'fa-file-signature', badge: pendingRequests.length },
                            { id: 'approved-reservations', label: 'Approved Today', icon: 'fa-check-double' },
                            { id: 'reservations', label: 'Department Fleet', icon: 'fa-calendar-alt' },
                            { id: 'department-staff', label: 'Staff Management', icon: 'fa-users' },
                            { id: 'reports', label: 'Audit Reports', icon: 'fa-file-alt' },
                            { id: 'analytics', label: 'Performance Analytics', icon: 'fa-chart-line' },
                            { id: 'settings', label: 'System Settings', icon: 'fa-cog' }
                        ].map(item => (
                            <div key={item.id}
                                className={`menu-item p-4 cursor-pointer flex items-center space-x-3 rounded-xl transition-all duration-200 border-l-4 ${activeSection === item.id ? 'active bg-white/10 border-[#F6DD26] text-[#F6DD26] font-bold shadow-lg' : 'border-transparent text-gray-300 hover:bg-white/5 hover:text-white'}`}
                                onClick={() => handleSectionChange(item.id)}>
                                <i className={`fas ${item.icon} text-lg w-6 text-center ${activeSection === item.id ? 'text-[#F6DD26]' : 'text-gray-400'}`}></i>
                                <span className="flex-1 text-sm font-medium">{item.label}</span>
                                {item.badge > 0 && (
                                    <span className="bg-[#F6DD26] text-[#660000] text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">{item.badge}</span>
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
                            { id: 'past-bookings', label: 'Archive/History', icon: 'fa-history' }
                        ].map(item => (
                            <div key={item.id}
                                className={`menu-item p-3 px-4 cursor-pointer flex items-center space-x-3 rounded-xl transition-all duration-200 border-l-4 ${activeSection === item.id ? 'active bg-white/10 border-[#F6DD26] text-[#F6DD26] font-bold shadow-lg' : 'border-transparent text-gray-300 hover:bg-white/5 hover:text-white'}`}
                                onClick={() => item.action ? item.action() : handleSectionChange(item.id)}>
                                <i className={`fas ${item.icon} text-lg w-6 text-center ${activeSection === item.id ? 'text-[#F6DD26]' : 'text-gray-400'}`}></i>
                                <span className="flex-1 text-sm font-medium">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </nav>

                <div className="p-4 bg-black/10 border-t border-white/5 shrink-0">
                    <button onClick={handleLogout} className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-lg transition duration-200 text-white flex items-center justify-center border border-white/10 font-bold">
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
                    <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 p-4 rounded-xl shadow-2xl border-l-4 transition-all duration-300 animate-slide-in-right ${notification.type === 'success' ? 'bg-[#f0fdf4] border-emerald-500 text-emerald-800' :
                        notification.type === 'error' ? 'bg-[#fef2f2] border-red-500 text-red-800' :
                            'bg-[#660000] border-[#F6DD26] text-white shadow-[#660000]/20'
                        }`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${notification.type === 'success' ? 'bg-emerald-500 text-white' :
                            notification.type === 'error' ? 'bg-red-500 text-white' :
                                'bg-[#F6DD26] text-[#660000]'
                            }`}>
                            <i className={`fas ${notification.type === 'success' ? 'fa-check' :
                                notification.type === 'error' ? 'fa-exclamation-triangle' :
                                    'fa-info'
                                } text-lg`}></i>
                        </div>
                        <div className="flex-1 pr-4">
                            <p className="font-bold text-xs uppercase tracking-wider opacity-60">System Notification</p>
                            <p className="text-sm font-bold mt-0.5">{notification.message}</p>
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
                            <h1 className="text-2xl font-bold text-slate-800 capitalize flex items-center gap-2">
                                {activeSection.replace('-', ' ')}
                            </h1>
                            <p className="text-slate-500 text-sm">Computer Science Department</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button onClick={() => { setSettingsSubTab('notifications'); setActiveSection('settings'); }} className="p-2 text-slate-400 hover:text-slate-600 relative transition-colors cursor-pointer">
                                <i className="fas fa-bell text-xl"></i>
                                {notifications.filter(n => !n.is_read).length > 0 && (
                                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">{notifications.filter(n => !n.is_read).length}</span>
                                )}
                            </button>
                            <div className="flex items-center gap-3 pl-4 border-l border-gray-200 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors" onClick={() => {
                                setEditProfileForm({
                                    name: user?.name || '',
                                    department: user?.department || user?.faculty || '',
                                    profilePic: user?.profilePic || ''
                                });
                                setShowProfileModal(true);
                            }}>
                                <div className="text-right hidden md:block">
                                    <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                                    <p className="text-xs text-slate-500">{user?.department || user?.faculty}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#660000] to-[#800000] flex items-center justify-center text-[#F6DD26] font-bold border-2 border-[#F6DD26] shadow-sm overflow-hidden shrink-0">
                                    {user?.profilePic ? (
                                        <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                                    )}
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
                                    <h1 className="text-3xl font-bold mb-2">Welcome Back, {user.name}!</h1>
                                    <p className="text-yellow-100 text-lg opacity-90">{user.department} Department</p>
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

                    {activeSection === 'approved-reservations' && (
                        <div className="space-y-6 animation-fade-in">
                            <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-6 text-white mb-6 shadow-lg flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">Approved Reservations</h2>
                                    <p className="text-green-100 opacity-90">Overview of confirmed department requests</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {reservations.filter(r => r.hod_approval_status === 'approved').length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                                        <i className="fas fa-calendar-check text-6xl text-gray-300 mb-4"></i>
                                        <h3 className="text-xl font-bold text-gray-400">No Approved Reservations</h3>
                                        <p className="text-gray-500">There are no approved requests at this time.</p>
                                    </div>
                                ) : (
                                    reservations.filter(r => r.hod_approval_status === 'approved').map(req => (
                                        <div key={req.reservation_id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg">
                                                        {(req.first_name || 'S').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-slate-800">{req.first_name} {req.last_name}</h3>
                                                        <p className="text-sm text-slate-500">Destination: {req.destination}</p>
                                                    </div>
                                                </div>
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                    <i className="fas fa-check-circle mr-1"></i> Approved
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 mb-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                <div>
                                                    <p className="text-xs text-slate-400 uppercase font-bold">Destination</p>
                                                    <p className="font-semibold text-slate-700">{req.destination}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 uppercase font-bold">Date</p>
                                                    <p className="font-semibold text-slate-700">{new Date(req.start_datetime).toLocaleDateString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 uppercase font-bold">Passengers</p>
                                                    <p className="font-semibold text-slate-700">{req.passengers_count} Pax</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeSection === 'my-reservations' && (
                        <div className="space-y-6 animation-fade-in">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white mb-6 shadow-lg">
                                <h2 className="text-2xl font-bold mb-1">My Reservations</h2>
                                <p className="text-blue-100 opacity-90">Manage your own vehicle bookings</p>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">Destination</th>
                                            <th className="px-6 py-4 font-semibold">Date & Time</th>
                                            <th className="px-6 py-4 font-semibold text-center">Status</th>
                                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-gray-100">
                                        {reservations.filter(r => String(r.requester_id) === String(user.id)).map(req => (
                                            <tr key={req.reservation_id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-medium">{req.destination}</td>
                                                <td className="px-6 py-4">{new Date(req.start_datetime).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${req.status === 'approved' ? 'bg-green-100 text-green-700' : req.status === 'cancelled' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {req.status === 'approved' ? 'Confirmed' : req.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
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

                    {/* Reservations Section */}
                    {activeSection === 'reservations' && (
                        <div className="animation-fade-in space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Department Overview</h2>
                                    <p className="text-sm text-slate-500">Reservations & Fleet Status</p>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => navigate('/reservation')} className="btn btn-primary flex items-center gap-2">
                                        <i className="fas fa-plus"></i> New Booking
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                                            <h3 className="font-bold text-slate-800">All Requests</h3>
                                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                                <button className="px-3 py-1 text-xs font-bold bg-white text-slate-800 rounded-md shadow-sm">All</button>
                                                <button className="px-3 py-1 text-xs font-bold text-slate-500">Pending</button>
                                                <button className="px-3 py-1 text-xs font-bold text-slate-500">History</button>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-[#f8fafc] text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                                                    <tr>
                                                        <th className="px-6 py-4">Lecturer</th>
                                                        <th className="px-6 py-4">Destination</th>
                                                        <th className="px-6 py-4">Date</th>
                                                        <th className="px-6 py-4">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {departmentReservations.map(req => (
                                                        <tr key={req.reservation_id} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                                                            <td className="px-6 py-4 font-bold text-slate-800">{req.first_name} {req.last_name}</td>
                                                            <td className="px-6 py-4 text-slate-600">{req.destination}</td>
                                                            <td className="px-6 py-4 text-slate-600 font-medium">{new Date(req.start_datetime).toLocaleDateString()}</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                                    req.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                                                    }`}>
                                                                    {req.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {departmentReservations.length === 0 && (
                                                        <tr><td colSpan="4" className="px-6 py-20 text-center text-slate-400 italic">No department reservations yet.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                        <h3 className="font-bold text-slate-800 mb-6 flex items-center justify-between">
                                            <span>Fleet Status</span>
                                            <span className="text-[10px] bg-[#660000] text-white px-2 py-0.5 rounded">LIVE</span>
                                        </h3>
                                        <div className="space-y-4">
                                            {vehicles.slice(0, 4).map(v => (
                                                <div key={v.vehicle_id} className="flex items-center gap-4 group">
                                                    <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border border-slate-100">
                                                        {v.image_url ? <img src={`${v.image_url}`} alt="" className="object-cover w-full h-full" /> : <i className="fas fa-car text-slate-300"></i>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-slate-800 truncate text-sm">{v.make} {v.model}</p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase">{v.registration_number}</p>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${v.status === 'available' ? 'bg-emerald-500' : v.status === 'on-trip' ? 'bg-blue-500' : 'bg-amber-500'}`}></span>
                                                            <p className="text-[10px] text-slate-400 capitalize">{v.status}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={() => setSettingsSubTab('fleet')} className="w-full py-2 text-xs font-bold text-[#660000] hover:bg-red-50 rounded-lg transition-colors mt-2">
                                                View Complete Fleet
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-[#660000] to-[#400000] rounded-xl p-6 text-white shadow-xl">
                                        <i className="fas fa-info-circle text-2xl text-yellow-400 mb-4"></i>
                                        <h4 className="font-bold mb-2">Fleet Management</h4>
                                        <p className="text-xs text-white/70 leading-relaxed mb-4">You are viewing the university's vehicle fleet. Specific department vehicle pooling can be requested through the Registrar.</p>
                                        <button className="text-xs font-bold bg-white/10 hover:bg-white/20 py-2 px-4 rounded-lg transition-all w-full border border-white/20">Read Fleet Policy</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Staff Management Section */}
                    {activeSection === 'department-staff' && (
                        <div className="animation-fade-in space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-slate-800">Staff Management</h2>
                                <div className="text-sm font-medium text-slate-500">
                                    Total Staff: {departmentUsers.length}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {departmentUsers.map(staff => (
                                    <div key={staff.user_id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-red-800 font-black border-2 border-[#F6DD26] text-xl">
                                                {staff.first_name ? staff.first_name.charAt(0) : 'U'}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{staff.first_name} {staff.last_name}</h4>
                                                <p className="text-xs text-slate-500 uppercase font-black tracking-widest">{staff.role}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 border-t border-slate-50 pt-4">
                                            <div className="flex items-center text-sm text-slate-600">
                                                <i className="fas fa-envelope w-6 text-slate-400"></i>
                                                <span className="truncate">{staff.email}</span>
                                            </div>
                                            <div className="flex items-center text-sm text-slate-600">
                                                <i className="fas fa-phone w-6 text-slate-400"></i>
                                                <span>{staff.phone_number || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between">
                                            <button className="text-xs font-bold text-blue-600 uppercase hover:underline">View Activity</button>
                                            <button className="text-xs font-bold text-slate-400 uppercase hover:text-red-600">Permissions</button>
                                        </div>
                                    </div>
                                ))}
                                {departmentUsers.length === 0 && (
                                    <div className="col-span-full py-20 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 font-medium italic">
                                        No staff members found in this department.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Reports Section */}
                    {activeSection === 'reports' && (
                        <div className="animation-fade-in space-y-8">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-slate-800">Usage Reports</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="report-card">
                                    <div className="report-icon-wrapper">
                                        <i className="fas fa-file-pdf text-2xl"></i>
                                    </div>
                                    <h3 className="report-title">Monthly Travel Report</h3>
                                    <p className="report-description">Summary of all vehicle usage, distances, and purposes for the current month.</p>
                                    <button
                                        onClick={handleDownloadPDF}
                                        className="report-button"
                                    >
                                        <i className="fas fa-print"></i> Generate PDF
                                    </button>
                                </div>

                                <div className="report-card">
                                    <div className="report-icon-wrapper">
                                        <i className="fas fa-file-excel text-2xl"></i>
                                    </div>
                                    <h3 className="report-title">Staff Activity Audit</h3>
                                    <p className="report-description">Detailed log of reservation requests and approval history across your department.</p>
                                    <button
                                        onClick={handleDownloadCSV}
                                        className="report-button"
                                    >
                                        <i className="fas fa-file-export"></i> Export CSV
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Analytics Section */}
                    {activeSection === 'analytics' && (
                        <div className="animation-fade-in space-y-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Operational Analytics</h2>
                                    <p className="text-sm text-slate-500">Department Performance Metrics</p>
                                </div>
                            </div>

                            {/* KPI Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Approval Efficiency</p>
                                    <div className="flex items-end gap-2">
                                        <h3 className="text-3xl font-black text-emerald-600">{getKPIs().efficiency}%</h3>
                                        <span className="text-xs text-emerald-500 font-bold mb-1"><i className="fas fa-arrow-up"></i> 8%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4">
                                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${getKPIs().efficiency}%` }}></div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Fleet Utilisation</p>
                                    <div className="flex items-end gap-2">
                                        <h3 className="text-3xl font-black text-blue-600">{getKPIs().distance}</h3>
                                        <span className="text-xs text-blue-500 font-bold mb-1">Total KM</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-4 font-medium"><i className="fas fa-info-circle mr-1"></i> Based on completed trips</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Active Users</p>
                                    <div className="flex items-end gap-2">
                                        <h3 className="text-3xl font-black text-[#660000]">{getKPIs().uniqueStaff}</h3>
                                        <span className="text-xs text-slate-500 font-bold mb-1">of {departmentUsers.length} Staff</span>
                                    </div>
                                    <div className="flex -space-x-2 mt-4">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"></div>
                                        ))}
                                        <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">+12</div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        <i className="fas fa-chart-line text-[#660000]"></i> Trip Volume Trend
                                    </h3>
                                    <div className="h-64">
                                        <Line
                                            data={getMonthlyTrend()}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: { legend: { display: false } },
                                                scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        <i className="fas fa-chart-pie text-[#660000]"></i> Request Distribution
                                    </h3>
                                    <div className="h-64 flex justify-center">
                                        <Doughnut
                                            data={getStatusDistribution()}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } },
                                                cutout: '70%'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* My Reservations Section (Personal Approved/Upcoming) */}
                    {activeSection === 'my-reservations' && (
                        <div className="animation-fade-in space-y-6">
                            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">My Reservations</h2>
                                    <p className="text-sm text-slate-500">Upcoming trips you've booked that are approved and scheduled.</p>
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
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Reference: REQ-{req.reservation_id}</span>
                                                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">APPROVED</span>
                                            </div>
                                            <h3 className="font-bold text-lg leading-tight mb-1">{req.destination}</h3>
                                            <div className="text-xs text-white/80 flex items-center gap-2">
                                                <i className="fas fa-clock"></i> {new Date(req.start_datetime).toLocaleDateString()} at {new Date(req.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>

                                        <div className="p-5 space-y-4 flex-1">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-sm">
                                                        <i className="fas fa-car-side"></i>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase leading-none mb-1">Vehicle Assignment</p>
                                                        <p className="text-sm font-bold text-slate-700">{req.model || 'TBA'} ({req.registration_number || 'Processing'})</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-sm">
                                                        <i className="fas fa-user-tie"></i>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase leading-none mb-1">Driver Details</p>
                                                        <p className="text-sm font-bold text-slate-700">{req.driver_name || 'Driver Not Yet Assigned'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                                <div className="text-xs text-slate-500">
                                                    <i className="fas fa-users mr-1"></i> {req.passengers_count} Passengers
                                                </div>
                                                <button className="text-xs font-black text-emerald-600 uppercase hover:underline">
                                                    Print Pass <i className="fas fa-print ml-1"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {myActiveBookings.length === 0 && (
                                    <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                                        <i className="fas fa-calendar-times text-5xl mb-4 opacity-20"></i>
                                        <p className="font-bold">No upcoming approved reservations found.</p>
                                        <p className="text-sm font-medium">Any trips you book will appear here once authorized.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Pending My Bookings Section */}
                    {activeSection === 'user-pending-approvals' && (
                        <div className="animation-fade-in space-y-6">
                            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Pending My Bookings</h2>
                                    <p className="text-sm text-slate-500">Reservations you've made that are currently awaiting higher authorization.</p>
                                </div>
                                <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
                                    <i className="fas fa-clock text-xl"></i>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Reference</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Trip Details</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Submitted</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {myPendingBookings.map(req => (
                                            <tr key={req.reservation_id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-slate-800">REQ-{req.reservation_id}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-800">{req.destination}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                                        <i className="fas fa-calendar-day"></i> {new Date(req.start_datetime).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold border border-amber-100 inline-flex items-center gap-1">
                                                        <i className="fas fa-hourglass-half"></i> {req.status === 'pending' ? 'Pending HOD' : req.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {new Date(req.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleCancelRequest(req.reservation_id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Cancel Request"
                                                    >
                                                        <i className="fas fa-times-circle text-lg"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {myPendingBookings.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium italic">
                                                    You have no pending personal bookings at the moment.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Past Bookings Section */}
                    {activeSection === 'past-bookings' && (
                        <div className="animation-fade-in space-y-6">
                            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Past Bookings</h2>
                                    <p className="text-sm text-slate-500">Archive of your completed, rejected, and cancelled reservations.</p>
                                </div>
                                <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 border border-slate-100">
                                    <i className="fas fa-history text-xl"></i>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Date</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Destination</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Vehicle</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Distance</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {myPastBookings.map(req => (
                                            <tr key={req.reservation_id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 text-slate-600 font-medium">
                                                    {new Date(req.start_datetime).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800">{req.destination}</div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {req.model || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {req.distance_km} KM
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${req.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                        req.status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                            'bg-slate-50 text-slate-500 border border-slate-200'
                                                        }`}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {myPastBookings.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium italic">
                                                    No past booking history found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Placeholder for remaining sections */}
                    {!['dashboard', 'pending-approvals', 'approved-reservations', 'my-reservations', 'settings', 'reservations', 'department-staff', 'reports', 'analytics', 'user-pending-approvals', 'past-bookings'].includes(activeSection) && (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 animation-fade-in">
                            <i className="fas fa-tools text-6xl text-slate-200 mb-6"></i>
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
                    <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-gradient-to-r from-[#660000] to-[#800000] p-4 flex justify-between items-center shrink-0">
                            <h3 className="text-lg font-bold text-white">Review Request #{currentRequest.id}</h3>
                            <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white transition">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-slate-500">Lecturer</p>
                                    <p className="text-slate-800 font-medium text-base">{currentRequest.lecturer}</p>
                                </div>
                                <div className="col-span-2 bg-slate-50 p-3 rounded border border-slate-200 leading-relaxed">
                                    <p className="text-slate-500 text-xs uppercase font-bold mb-1">Destination</p>
                                    <p className="text-slate-800 font-bold">{currentRequest.destination}</p>
                                    <p className="text-slate-500 text-xs uppercase font-bold mt-2 mb-1">Date</p>
                                    <p className="text-slate-800">{currentRequest.date} at {currentRequest.time}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-700 text-sm font-medium mb-2">HOD Remarks (Optional)</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800 focus:outline-none focus:border-[#660000] transition-colors"
                                    rows="3"
                                    placeholder="Add notes..."
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

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animation-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all border border-slate-200">
                        <div className="p-8 text-center">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border ${pendingAction?.type === 'approve' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                                <i className={`fas ${pendingAction?.type === 'approve' ? 'fa-check-circle text-emerald-500' : 'fa-times-circle text-red-500'} text-4xl`}></i>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">
                                {pendingAction?.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                            </h3>
                            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                                {pendingAction?.type === 'approve'
                                    ? 'Are you sure you want to approve this vehicle request immediately?'
                                    : 'Please provide a reason for rejecting this request.'}
                            </p>

                            {pendingAction?.type === 'reject' && (
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-red-500 transition-colors mb-6 text-sm"
                                    rows="3"
                                    placeholder="Enter reason for rejection..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                ></textarea>
                            )}

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleConfirmAction}
                                    className={`w-full py-3 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] ${pendingAction?.type === 'approve'
                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/20'
                                        : 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/20'
                                        }`}
                                >
                                    {pendingAction?.type === 'approve' ? 'Yes, Approve Now' : 'Confirm Rejection'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowConfirm(false);
                                        setPendingAction(null);
                                        setRejectionReason('');
                                    }}
                                    className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                        <div className="bg-slate-50 py-3 px-8 text-[10px] text-slate-400 text-center border-t border-slate-100 uppercase tracking-widest font-bold">
                            University of Kelaniya • VMS System
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

export default HODDashboard;
