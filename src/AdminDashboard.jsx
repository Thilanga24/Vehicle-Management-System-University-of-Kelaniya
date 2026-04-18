import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './Dashboard.css';
import SettingsTab from './SettingsTab';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('dashboard');
    const [settingsSubTab, setSettingsSubTab] = useState('security');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : { name: "System Admin", role: "admin" };
    });

    const [showProfileModal, setShowProfileModal] = useState(false);
    const [editProfileForm, setEditProfileForm] = useState({
        name: user?.name || '',
        department: user?.department || user?.faculty || '',
        profilePic: user?.profilePic || ''
    });

    const [vehicles, setVehicles] = useState([]);
    const [stats, setStats] = useState({
        totalVehicles: 0,
        availableVehicles: 0,
        totalDrivers: 0,
        pendingMaintenance: 0
    });
    const [activities, setActivities] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [allReservations, setAllReservations] = useState([]);
    const [systemHealth, setSystemHealth] = useState({
        cpuUsage: '0%', memoryUsage: '0%', uptime: '...', storage: '...', dbStatus: '...', apiHealth: '...'
    });
    const [systemLogs, setSystemLogs] = useState([]);
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

    const showToast = (message, type = 'info') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
    };

    useEffect(() => {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        const fetchDashboardData = async () => {
            try {
                // ... (previous fetch logic remains, but I'll update the whole effect to include notifications)
                const vRes = await fetch('http://localhost:5000/api/vehicles');
                const vData = await vRes.json();
                if (vRes.ok) {
                    setVehicles(vData);
                    setStats(prev => ({
                        ...prev,
                        totalVehicles: vData.length,
                        availableVehicles: vData.filter(v => v.status === 'available').length,
                        pendingMaintenance: vData.filter(v => v.status === 'maintenance').length
                    }));
                }

                const dRes = await fetch('http://localhost:5000/api/drivers');
                const dData = await dRes.json();
                if (dRes.ok) {
                    setStats(prev => ({ ...prev, totalDrivers: dData.length }));
                }

                // Fetch Recent Activities (Reservations)
                const aRes = await fetch('http://localhost:5000/api/reservations');
                const aData = await aRes.json();
                if (aRes.ok) {
                    setAllReservations(aData);
                    const recent = aData.slice(0, 5).map(res => ({
                        action: `New reservation for ${res.destination}`,
                        time: new Date(res.created_at).toLocaleDateString(),
                        type: 'approval'
                    }));
                    setActivities(recent);
                }

                // Fetch System Stats & Logs
                const sStatsRes = await fetch('http://localhost:5000/api/system/stats');
                const sStatsData = await sStatsRes.json();
                if (sStatsRes.ok) setSystemHealth(sStatsData);

                const sLogsRes = await fetch('http://localhost:5000/api/system/logs');
                const sLogsData = await sLogsRes.json();
                if (sLogsRes.ok) setSystemLogs(sLogsData);

                // Fetch Notifications
                if (user?.id) {
                    const nRes = await fetch(`http://localhost:5000/api/notifications/${user.id}`);
                    const nData = await nRes.json();
                    if (nRes.ok) {
                        setNotifications(nData);
                    }
                }
            } catch (error) {
                console.error("Dashboard Fetch Error:", error);
            }
        };

        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000); // Auto refresh every 30s
        return () => clearInterval(interval);
    }, [navigate, user.id]);

    const handleSystemAction = async (action) => {
        try {
            const endpoint = action === 'backup' ? 'backup' : 'optimize';
            const res = await fetch(`http://localhost:5000/api/system/${endpoint}`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                showToast(data.message, 'success');
            } else {
                showToast(data.message || 'Action failed', 'error');
            }
        } catch (error) {
            showToast('Connection to server failed', 'error');
        }
    };

    const handleExportCSV = () => {
        if (allReservations.length === 0) return showToast('No reservations to export', 'error');

        const headers = ['Request ID', 'Vehicle Model', 'Vehicle Type', 'Destination', 'Date', 'Status', 'User ID'];
        const rows = allReservations.map(res => [
            res.reservation_id,
            res.vehicle_model || 'Any',
            res.vehicle_type || 'Any',
            res.destination,
            new Date(res.created_at).toLocaleDateString(),
            res.status,
            res.user_id
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reservations_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        showToast('CSV Exported Successfully', 'success');
    };

    const handleExportPDF = async (res) => {
        const doc = new jsPDF();
        
        // Header with University Branding
        doc.setFillColor(102, 0, 0);
        doc.rect(0, 0, 210, 45, 'F');

        // Add Logo (Above the rectangle)
        const logoImg = new Image();
        logoImg.src = '/assets/uok_logo.png';
        await new Promise((resolve) => {
            logoImg.onload = resolve;
            logoImg.onerror = resolve;
        });
        doc.addImage(logoImg, 'PNG', 10, 10, 15, 15);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('UNIVERSITY OF KELANIYA', 105, 20, { align: 'center' });
        doc.setFontSize(14);
        doc.text('TRANSPORT DIVISION - RESERVATION SLIP', 105, 32, { align: 'center' });

        // Body Content
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(10);
        
        const details = [
            ['Reference ID', `#RES-${res.reservation_id}`],
            ['Requester', `${res.first_name || 'Admin'} ${res.last_name || ''}`],
            ['Department/Faculty', `${res.department || 'N/A'} / ${res.faculty || 'N/A'}`],
            ['Destination', res.destination],
            ['Trip Distance', `${res.distance_km || 0} KM`],
            ['Departure Date/Time', new Date(res.start_datetime).toLocaleString()],
            ['Return Date/Time', res.end_datetime ? new Date(res.end_datetime).toLocaleString() : 'One-way'],
            ['Status', res.status.toUpperCase()],
            ['', ''], // Spacer
            ['VEHICLE DETAILS', ''],
            ['Model', res.model || 'Pending Assignment'],
            ['Registration No', res.registration_number || 'Pending Assignment'],
            ['', ''], // Spacer
            ['DRIVER DETAILS', ''],
            ['Name', res.driver_first_name ? `${res.driver_first_name} ${res.driver_last_name}` : 'Not Assigned'],
            ['Contact', res.driver_phone || 'N/A'],
            ['License No', res.license_number || 'N/A']
        ];

        autoTable(doc, {
            startY: 55,
            body: details,
            theme: 'striped',
            styles: { fontSize: 10, cellPadding: 4 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 50 },
                1: { cellWidth: 'auto' }
            }
        });

        // Signatures Area
        const finalY = doc.lastAutoTable.finalY + 30;
        doc.setDrawColor(200, 200, 200);
        doc.line(20, finalY, 80, finalY);
        doc.line(130, finalY, 190, finalY);
        doc.setFontSize(8);
        doc.text('Authorized Signature', 50, finalY + 5, { align: 'center' });
        doc.text('Driver Acknowledgment', 160, finalY + 5, { align: 'center' });

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(`System Generated on: ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });

        doc.save(`UOK_Res_Slip_${res.reservation_id}.pdf`);
        showToast('Reservation Slip Generated', 'success');
    };

    const handleExportAllPDF = async () => {
        const doc = new jsPDF();
        
        // Professional Header
        doc.setFillColor(102, 0, 0);
        doc.rect(0, 0, 210, 40, 'F');

        // Add Logo (Above the rectangle)
        const logoImg = new Image();
        logoImg.src = '/assets/uok_logo.png';
        await new Promise((resolve) => {
            logoImg.onload = resolve;
            logoImg.onerror = resolve;
        });
        doc.addImage(logoImg, 'PNG', 10, 8, 15, 15);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text('Fleet Reservation Master Report', 30, 20);
        
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(10);
        doc.text(`University of Kelaniya | Generated: ${new Date().toLocaleString()}`, 14, 38);

        const tableColumn = ["ID", "Requester", "Destination", "Start Date", "Vehicle", "Status"];
        const tableRows = allReservations.map(res => [
            `#${res.reservation_id}`,
            `${res.first_name || 'Admin'} ${res.last_name || ''}`,
            res.destination.length > 25 ? res.destination.substring(0, 25) + '...' : res.destination,
            new Date(res.start_datetime).toLocaleDateString(),
            res.registration_number || 'TBA',
            res.status.toUpperCase()
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [102, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 3 },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        doc.save(`UOK_Master_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        showToast('Master Report Generated Successfully', 'success');
    };

    const handleProfileUpdate = (e) => {
        e.preventDefault();
        const updatedUser = { ...user, ...editProfileForm };
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setShowProfileModal(false);
    };

    const handleProfilePicChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setEditProfileForm({ ...editProfileForm, profilePic: reader.result });
            reader.readAsDataURL(file);
        }
    };

    const logout = () => {
        sessionStorage.clear();
        localStorage.clear();
        navigate('/login');
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const chartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Reservations',
            data: [12, 19, 15, 25, 22, 18],
            borderColor: '#660000',
            backgroundColor: 'rgba(102, 0, 0, 0.1)',
            tension: 0.4
        }]
    };

    const chartOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
    };

    return (
        <div className="dashboard-container">
            {/* Notification Toast */}
            {toast.show && (
                <div className={`fixed top-5 right-5 z-[200] px-6 py-4 rounded-xl shadow-2xl text-white transform transition-all animate-fade-in flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-rose-600' : 'bg-blue-600'}`}>
                    <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} text-xl`}></i>
                    <p className="font-bold text-sm">{toast.message}</p>
                </div>
            )}

            {/* Sidebar */}
            <div className={`sidebar bg-[#1a0505] w-80 fixed h-full z-40 transition-transform duration-300 flex flex-col border-r border-[#F6DD26]/20 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-6 border-b border-white/10 shrink-0 text-center">
                    <img src="/assets/banner.png" alt="University Logo" className="w-32 h-auto mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-white">Admin Portal</h1>
                </div>

                <div className="menu-section">
                    <div className={`menu-item ${activeSection === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveSection('dashboard')}>
                        <i className="fas fa-tachometer-alt"></i>
                        <span>Dashboard</span>
                    </div>
                    <div className="menu-item" onClick={() => navigate('/vehicles')}>
                        <i className="fas fa-car"></i>
                        <span>Vehicles</span>
                    </div>
                    <div className="menu-item" onClick={() => navigate('/drivers')}>
                        <i className="fas fa-users"></i>
                        <span>Drivers</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'reservations' ? 'active' : ''}`} onClick={() => setActiveSection('reservations')}>
                        <i className="fas fa-calendar-check"></i>
                        <span>All Bookings</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'system-maintenance' ? 'active' : ''}`} onClick={() => setActiveSection('system-maintenance')}>
                        <i className="fas fa-server"></i>
                        <span>System Maintenance</span>
                    </div>
                    <div className="menu-item" onClick={() => navigate('/reports')}>
                        <i className="fas fa-chart-bar"></i>
                        <span>Reports & Analytics</span>
                    </div>
                </div>

                <div className="menu-section mt-auto">
                    <div className="menu-item" onClick={logout}>
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </div>
                </div>
            </div>

            <div className="main-content lg:ml-80">
                <div className="top-nav px-8">
                    <div className="welcome">
                        <h1>System Administration</h1>
                        <p>Manage fleet operations and resources.</p>
                    </div>
                    <div className="top-nav-right">
                        <div className="notification-icon cursor-pointer mr-6 relative" onClick={() => setActiveSection('settings')}>
                            <i className="fas fa-bell text-slate-400"></i>
                            {notifications.filter(n => !n.is_read).length > 0 && (
                                <div className="notification-badge">{notifications.filter(n => !n.is_read).length}</div>
                            )}
                        </div>
                        <div className="user-profile cursor-pointer" onClick={() => setShowProfileModal(true)}>
                            <div className="user-avatar overflow-hidden">
                                {user?.profilePic ? <img src={user.profilePic} className="w-full h-full object-cover" /> : (user?.name?.charAt(0) || 'A')}
                            </div>
                            <div className="user-info">
                                <h4>{user?.name}</h4>
                                <p>{user?.role?.toUpperCase()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="content-area p-8">
                    {activeSection === 'dashboard' && (
                        <div className="space-y-8 animation-fade-in">
                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Total Fleet</span>
                                        <i className="fas fa-car text-blue-500"></i>
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-800">{stats.totalVehicles}</h3>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Available</span>
                                        <i className="fas fa-check-circle text-green-500"></i>
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-800">{stats.availableVehicles}</h3>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Drivers</span>
                                        <i className="fas fa-id-card text-maroon"></i>
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-800">{stats.totalDrivers}</h3>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Maintenace</span>
                                        <i className="fas fa-tools text-yellow-500"></i>
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-800">{stats.pendingMaintenance}</h3>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Chart */}
                                    <div className="section p-6 bg-white rounded-2xl border border-slate-200">
                                        <h2 className="text-lg font-bold mb-6">Reservation Trends</h2>
                                        <div className="h-64"><Line data={chartData} options={chartOptions} /></div>
                                    </div>

                                    {/* Vehicle Table */}
                                    <div className="section p-6 bg-white rounded-2xl border border-slate-200">
                                        <h2 className="text-lg font-bold mb-6">Recent Vehicle Status</h2>
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-slate-400 text-xs font-bold uppercase tracking-widest border-b">
                                                    <th className="pb-4">Vehicle</th>
                                                    <th className="pb-4">Status</th>
                                                    <th className="pb-4">Driver</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {vehicles.slice(0, 5).map(v => (
                                                    <tr key={v.vehicle_id}>
                                                        <td className="py-4">
                                                            <div className="font-bold">{v.registration_number}</div>
                                                            <div className="text-xs text-slate-400">{v.make} {v.model}</div>
                                                        </td>
                                                        <td className="py-4">
                                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${v.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                {v.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-sm">{v.driver_name || 'Unassigned'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="section p-6 bg-white rounded-2xl border border-slate-200">
                                        <h2 className="text-lg font-bold mb-6">Recent Activity</h2>
                                        <div className="space-y-4">
                                            {activities.map((a, i) => (
                                                <div key={i} className="flex gap-3 border-b border-slate-50 pb-3">
                                                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><i className="fas fa-info-circle text-xs"></i></div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700">{a.action}</p>
                                                        <p className="text-[10px] text-slate-400">{a.time}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'reservations' && (
                        <div className="section p-8 bg-white rounded-3xl shadow-sm border border-slate-100 animation-fade-in">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800">All Reservations</h2>
                                    <p className="text-slate-500 font-medium">History of all fleet requests.</p>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={handleExportCSV} className="bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors">
                                        <i className="fas fa-file-csv"></i> Export CSV
                                    </button>
                                    <button onClick={handleExportAllPDF} className="bg-maroon text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#800000] transition-colors shadow-lg">
                                        <i className="fas fa-file-pdf"></i> Master PDF
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-50">
                                            <th className="pb-6 px-4">Request ID</th>
                                            <th className="pb-6 px-4">Vehicle</th>
                                            <th className="pb-6 px-4">Destination</th>
                                            <th className="pb-6 px-4">Date</th>
                                            <th className="pb-6 px-4">Status</th>
                                            <th className="pb-6 px-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {allReservations.map(res => (
                                            <tr key={res.reservation_id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-6 px-4 font-mono text-xs text-slate-400">#RES-{res.reservation_id}</td>
                                                <td className="py-6 px-4">
                                                    <p className="font-bold text-slate-700">{res.vehicle_model || 'Any'}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase trackings-widest">{res.vehicle_type || 'Unspecified'}</p>
                                                </td>
                                                <td className="py-6 px-4 font-semibold text-slate-600">{res.destination}</td>
                                                <td className="py-6 px-4 text-sm text-slate-500">{new Date(res.created_at).toLocaleDateString()}</td>
                                                <td className="py-6 px-4">
                                                    <span className={`px-3 py-1 transparent rounded-full text-[10px] font-black uppercase ${res.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                        res.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-rose-100 text-rose-700'
                                                        }`}>
                                                        {res.status}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-4">
                                                    <button
                                                        onClick={() => handleExportPDF(res)}
                                                        className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-maroon hover:bg-maroon hover:text-white transition-all shadow-sm"
                                                        title="Download Details PDF"
                                                    >
                                                        <i className="fas fa-file-pdf"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeSection === 'system-maintenance' && (
                        <div className="space-y-8 animation-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                                        <i className="fas fa-database text-xl"></i>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Database Status</p>
                                        <h3 className="text-lg font-bold text-slate-800">{systemHealth.dbStatus}</h3>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                        <i className="fas fa-bolt text-xl"></i>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">API Health</p>
                                        <h3 className="text-lg font-bold text-slate-800">{systemHealth.apiHealth}</h3>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                                        <i className="fas fa-hdd text-xl"></i>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Storage</p>
                                        <h3 className="text-lg font-bold text-slate-800">{systemHealth.storage}</h3>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Server Performance */}
                                <div className="section p-6 bg-white rounded-2xl border border-slate-200">
                                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                        <i className="fas fa-microchip text-slate-400"></i> Server Performance
                                    </h2>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm font-semibold text-slate-600">CPU Usage</span>
                                                <span className="text-sm font-bold text-slate-800">{systemHealth.cpuUsage}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2">
                                                <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: systemHealth.cpuUsage }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm font-semibold text-slate-600">Memory Usage</span>
                                                <span className="text-sm font-bold text-slate-800">{systemHealth.memoryUsage}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2">
                                                <div className="bg-purple-500 h-2 rounded-full transition-all duration-500" style={{ width: systemHealth.memoryUsage }}></div>
                                            </div>
                                        </div>
                                        <div className="pt-4 grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-slate-50 rounded-xl">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Uptime</p>
                                                <p className="text-sm font-bold text-slate-700">{systemHealth.uptime}</p>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-xl">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Health Check</p>
                                                <p className="text-sm font-bold text-emerald-600">Passed</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="section p-6 bg-white rounded-2xl border border-slate-200">
                                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                        <i className="fas fa-history text-slate-400"></i> System Logs
                                    </h2>
                                    <div className="space-y-4">
                                        {systemLogs.map((log, i) => (
                                            <div key={i} className="flex gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                                <div className={`w-2 h-2 mt-2 rounded-full ${log.type === 'success' ? 'bg-green-500' : log.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700">{log.event}</p>
                                                    <p className="text-xs text-slate-400">{log.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="mt-6 text-sm font-bold text-maroon hover:underline">View All Logs</button>
                                </div>

                                <div className="section p-6 bg-white rounded-2xl border border-slate-200">
                                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                        <i className="fas fa-tools text-slate-400"></i> Quick Maintenance Actions
                                    </h2>
                                    <div className="space-y-4">
                                        <button onClick={() => handleSystemAction('backup')} className="w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-between group transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-maroon group-hover:scale-110 transition-transform">
                                                    <i className="fas fa-cloud-download-alt"></i>
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-slate-800">Download Backup</p>
                                                    <p className="text-xs text-slate-500">Generate a full sql dump</p>
                                                </div>
                                            </div>
                                            <i className="fas fa-chevron-right text-slate-300"></i>
                                        </button>
                                        <button className="w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-between group transition-all opacity-50 cursor-not-allowed">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-blue-600">
                                                    <i className="fas fa-broom"></i>
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-slate-800">Clear Logs</p>
                                                    <p className="text-xs text-slate-500">Delete logs older than 30 days</p>
                                                </div>
                                            </div>
                                            <i className="fas fa-lock text-slate-300"></i>
                                        </button>
                                        <button onClick={() => handleSystemAction('optimize')} className="w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-between group transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                                                    <i className="fas fa-compress-alt"></i>
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-slate-800">Optimize DB</p>
                                                    <p className="text-xs text-slate-500">Reindex and optimize tables</p>
                                                </div>
                                            </div>
                                            <i className="fas fa-chevron-right text-slate-300"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) || (
                            ['vehicles', 'drivers', 'reservations', 'settings'].includes(activeSection) && !['dashboard', 'system-maintenance'].includes(activeSection) && (
                                <div className="section text-center py-20 animation-fade-in">
                                    <i className={`fas fa-info-circle text-slate-300 text-6xl mb-6`}></i>
                                    <h3 className="text-xl text-slate-800 font-bold mb-2 capitalise">{activeSection.replace('-', ' ')}</h3>
                                    <p className="text-slate-500">Detailed management for {activeSection} is currently in development.</p>
                                </div>
                            )
                        )}
                </div>
            </div>

            {/* Profile Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-8">
                        <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div className="flex flex-col items-center mb-6">
                                <div className="w-24 h-24 rounded-full bg-slate-100 overflow-hidden mb-3 relative group border-4 border-white shadow-lg">
                                    {editProfileForm.profilePic ? <img src={editProfileForm.profilePic} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-300">{(editProfileForm.name?.charAt(0) || 'A')}</div>}
                                    <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                        <i className="fas fa-camera"></i>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleProfilePicChange} />
                                    </label>
                                </div>
                            </div>
                            <input className="w-full p-3 border rounded-xl" value={editProfileForm.name} onChange={e => setEditProfileForm({ ...editProfileForm, name: e.target.value })} placeholder="Full Name" required />
                            <div className="flex justify-end gap-3 mt-8">
                                <button type="button" onClick={() => setShowProfileModal(false)} className="px-5 py-2 border rounded-xl">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-[#660000] text-white rounded-xl">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
